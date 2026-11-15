// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// First-load motion (ADR 0112): when Compare first draws, the first card's 360° strip plays one lunar day in a few seconds
// from the card's own table and skyline (the Sun along the horizon, Earth's small wobble), then stops on the chosen time
// with the markup the card was drawn with. Once per load; never with prefers-reduced-motion or under automation
// (navigator.webdriver), so screenshots and the smoke test see that final state at once. Only the left/top of the two
// markers and their labels change: no layout change, no filter, no transform (WebKit traps, ADR 0107).
import { sampleAt, tableRange, lerpAngle } from './ephem.js';
import { panoMarks, panoScale } from './pano.js';
import { judge } from './shifts.js';

const DAY = 86_400_000;

// The lunar day to play: the one that ends at the chosen time when the table holds it, else the one that starts there
// (one synodic month later the Sun is back at about the same azimuth; the last part of the playback lands on the chosen time).
export function dayWindow(table, ms, cfg) {
  const span = cfg.lunar_day_days * DAY;
  const { startMs, endMs } = tableRange(table);
  if (ms - span >= startMs && ms <= endMs) return { from: ms - span, to: ms };
  if (ms >= startMs && ms + span <= endMs) return { from: ms, to: ms + span };
  return null;
}

const ease = (f) => (f < 0.5 ? 4 * f * f * f : 1 - (-2 * f + 2) ** 3 / 2);

// Sun and Earth at playback fraction f (0..1): table time along the window, eased; over the last land_fraction the
// positions slide onto the chosen time's own sample, so f = 1 gives exactly that sample.
export function frameSample(table, win, ms, f, cfg) {
  const end = sampleAt(table, ms);
  const at = sampleAt(table, win.from + ease(f) * (win.to - win.from));
  const w = Math.max(0, (f - (1 - cfg.land_fraction)) / cfg.land_fraction);
  if (!at || w >= 1) return end;
  const body = (b) => ({ az: lerpAngle(at[b].az, end[b].az, w), el: at[b].el + (end[b].el - at[b].el) * w });
  return { sun: body('sun'), earth: body('earth') };
}

export function shouldPlay(env) {
  return !env.reducedMotion && !env.webdriver && env.visible;
}

// plot = the first card's .pano-plot; r = that card's row (table, profile, sample, ms); view = config/view.json.
export function playFirstDay(plot, r, view, win = globalThis.window) {
  const cfg = view.first_load_motion;
  if (!cfg || !plot || !r?.table || !win?.requestAnimationFrame) return false;
  const env = {
    reducedMotion: win.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    webdriver: win.navigator?.webdriver === true,
    visible: win.document?.visibilityState !== 'hidden',
  };
  const span = shouldPlay(env) ? dayWindow(r.table, r.ms, cfg) : null;
  if (!span) return false;
  const scale = panoScale(r.sample, view.pano_scale_steps_deg ?? view.elevation_scale_steps_deg);
  const parts = ['sun', 'earth'].map((b) => ({ b, dot: plot.querySelector(`.pano-dot.pano-${b}`), tag: plot.querySelector(`.pano-tag-${b}`) }));
  if (parts.some((p) => !p.dot || !p.tag)) return false;
  // The strip as drawn, put back exactly at the end. While playing, the corner labels step aside (is-playing), because a
  // body beyond the strip's scale rides along the top edge where they sit.
  const saved = [plot, ...parts.flatMap((p) => [p.dot, p.tag])].map((el) => [el, el.getAttribute('style'), el.className]);
  const restore = () => saved.forEach(([el, style, cls]) => { if (style === null) el.removeAttribute('style'); else el.setAttribute('style', style); el.className = cls; });
  plot.classList.add('is-playing');
  let start = null;
  const step = (now) => {
    if (!plot.isConnected) return; // the card was drawn again (the reader changed it): nothing to put back
    start ??= now;
    const f = Math.min(1, (now - start) / cfg.duration_ms);
    if (f >= 1) return restore();
    const s = frameSample(r.table, span, r.ms, f, cfg);
    const j = judge(s, r.profile, view.horizon_threshold_deg);
    for (const m of panoMarks(s, { sun: j.sun.up, earth: j.earth.up }, scale)) {
      const p = parts.find((x) => x.b === m.body);
      const pos = `left:${m.x.toFixed(2)}%;top:${m.y.toFixed(2)}%`;
      p.dot.setAttribute('style', pos);
      p.dot.classList.toggle('is-up', m.up);
      p.dot.classList.toggle('is-down', !m.up);
      p.tag.setAttribute('style', pos);
      p.tag.classList.toggle('is-left', m.left);
    }
    win.requestAnimationFrame(step);
  };
  win.requestAnimationFrame(step);
  return true;
}
