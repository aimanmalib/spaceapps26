// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Per-card timeline block (item g): chart + scrubber + Play. The controls are built once and stay in the DOM
// (keyboard focus survives redraws); only the chart, axis labels and summary are redrawn.
// Play moves the card's time forward step by step; it is hidden when the user asks for reduced motion.
import { fill, escapeHtml as e } from './i18n.js';
import { formatUtc, sharedScale, tableRange } from './ephem.js';
import { timelineSpan, rowsIn, shareAbove, timelineSvg } from './timeline.js';

const MINUTE = 60_000;
const utc = (ms) => formatUtc(ms).replace('T', ' ');
const pct = (x) => Math.round(x * 100);

// box = empty element in the card; onTime(ms) sets the card's time and redraws the card.
export function mountTimeline(box, { t, view, onTime, uid }) {
  const cfg = view.timeline;
  box.className = 'tl';
  box.innerHTML =
    `<h4 class="tl-title">${e(t('tl.heading'))}</h4>` +
    `<p class="tl-intro">${e(t('tl.intro'))}</p>` +
    `<div class="tl-plot" role="img"></div>` +
    `<div class="tl-axis" aria-hidden="true"><span class="tl-from"></span><span class="tl-to"></span></div>` +
    `<p class="tl-legend"><span class="key key-sun">${e(t('tl.sun'))}</span><span class="key key-earth">${e(t('tl.earth'))}</span>` +
    `<span class="tl-lanes">${e(t('tl.lanes'))}</span></p>` +
    `<div class="tl-controls"><button type="button" class="btn tl-play" aria-pressed="false">${e(t('tl.play'))}</button>` +
    `<label class="tl-scrub" for="${uid}-tl"><span>${e(t('tl.scrub'))}</span><input id="${uid}-tl" type="range" min="0" value="0"></label></div>`;
  const plot = box.querySelector('.tl-plot');
  const range = box.querySelector('input[type=range]');
  const play = box.querySelector('.tl-play');
  const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let span = null;
  let ms = NaN;
  let step;
  let timer = null;

  function stop() {
    clearInterval(timer);
    timer = null;
    play.setAttribute('aria-pressed', 'false');
    play.textContent = t('tl.play');
  }
  function syncMotion() {
    play.hidden = !!motion?.matches;
    if (play.hidden) stop();
  }
  syncMotion();
  motion?.addEventListener?.('change', syncMotion);

  range.addEventListener('input', () => {
    stop();
    if (span) onTime(span.from + +range.value * MINUTE);
  });
  range.addEventListener('change', (ev) => ev.stopPropagation());
  play.addEventListener('click', () => {
    if (timer) return stop();
    if (!span) return;
    play.setAttribute('aria-pressed', 'true');
    play.textContent = t('tl.pause');
    if (ms >= span.to) onTime(span.from);
    timer = setInterval(() => {
      const next = ms + cfg.play_step_minutes * MINUTE;
      if (!span || next > span.to) return stop();
      onTime(next);
    }, cfg.play_interval_ms);
  });

  return {
    // relTable = horizon-relative table (terrain or ideal sphere); at = selected time.
    // The span stays put while the time moves inside it (scrubbing, Play, typing a nearby time).
    draw(relTable, at) {
      ms = at;
      step = relTable.step_minutes * MINUTE;
      // Whole table steps, so the scrubber's last position is the end of the span.
      const spanMs = Math.round((cfg.span_days * 1440 * MINUTE) / step) * step;
      span = timelineSpan(at, span, spanMs, tableRange(relTable));
      const rows = rowsIn(relTable, span.from, span.to);
      const th = view.horizon_threshold_deg;
      const scale = sharedScale(rows.flatMap((r) => [r.sun, r.earth]), view.elevation_scale_steps_deg);
      plot.innerHTML = timelineSvg(rows, span, at, scale, th);
      plot.setAttribute('aria-label', fill(t('tl.aria'), { from: utc(span.from), to: utc(span.to), sun: pct(shareAbove(rows, 'sun', th)), earth: pct(shareAbove(rows, 'earth', th)), scale }));
      box.querySelector('.tl-from').textContent = utc(span.from);
      box.querySelector('.tl-to').textContent = utc(span.to);
      range.max = String((span.to - span.from) / MINUTE);
      range.step = String(step / MINUTE);
      range.value = String(Math.round((at - span.from) / MINUTE));
      range.setAttribute('aria-valuetext', utc(at));
      box.hidden = false;
    },
    hide() {
      stop();
      box.hidden = true;
    },
    destroy() {
      stop();
      motion?.removeEventListener?.('change', syncMotion);
    },
  };
}
