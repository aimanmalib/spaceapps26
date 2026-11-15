// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Horizon first (ADR 0040): every card opens with one short verdict and a 360° strip of the horizon — sky, ground
// (the LOLA skyline where there is one), the Sun and Earth. Same sample, answers and skyline as the rest of the card.
// The strip is stretched to the card's width, so the round markers and all text are HTML placed in per cent on top
// of the SVG shapes (no distorted circles, text readable at 320 px).
import { fill, escapeHtml as e } from './i18n.js';
import { sharedScale } from './ephem.js';

const W = 360; // viewBox: one unit per degree of azimuth
const H = 100;
const EDGE = 12; // ±scale sits this many per cent inside the top and bottom edges
const SIDE = 2.5; // markers keep this many per cent from the left and right edges (north is at both), so none is cut

// Elevation (deg) → per cent from the top of the strip; values beyond ±scale stay at the edge.
export function panoY(el, scale) {
  const c = Math.max(-scale, Math.min(scale, el));
  return H / 2 - (c / scale) * (H / 2 - EDGE);
}

// Which of the four verdicts: both / sun / earth / none.
export function verdictKey(up) {
  return up.sun ? (up.earth ? 'both' : 'sun') : up.earth ? 'earth' : 'none';
}

// Smallest scale step that holds this card's Sun and Earth (each card zooms as far as its own angles allow).
export function panoScale(sample, steps) {
  return sharedScale([sample.sun.el, sample.earth.el], steps);
}

// Marker and label positions (per cent). Labels flip to the left near the right edge, and the Earth label moves
// to the other side when the two markers are close, so the two words never sit on top of each other.
export function panoMarks(sample, up, scale) {
  const one = (b) => ({ body: b, x: Math.max(SIDE, Math.min(100 - SIDE, (((sample[b].az % 360) + 360) % 360) / 3.6)), y: panoY(sample[b].el, scale), up: up[b] });
  const sun = one('sun');
  const earth = one('earth');
  sun.left = sun.x > 78;
  earth.left = earth.x > 78;
  if (Math.abs(sun.x - earth.x) < 16 && Math.abs(sun.y - earth.y) < 30) earth.left = !sun.left;
  return [earth, sun];
}

function shapes(profile, scale) {
  const mid = panoY(0, scale).toFixed(2);
  const grid = [90, 180, 270].map((x) => `<line class="sky-grid" x1="${x}" y1="0" x2="${x}" y2="${H}"/>`).join('');
  if (!profile) {
    return (
      `<rect class="sky-ground" x="0" y="${mid}" width="${W}" height="${H - mid}"/>` + grid +
      `<line class="sky-horizon" x1="0" y1="${mid}" x2="${W}" y2="${mid}"/>`
    );
  }
  const step = profile.azimuth_step_deg;
  const pts = profile.elev.map((el, i) => `${(i * step).toFixed(1)},${panoY(el, scale).toFixed(2)}`);
  pts.push(`${W},${panoY(profile.elev[0], scale).toFixed(2)}`);
  const line = pts.join(' ');
  return (
    grid +
    `<polygon class="sky-ground" points="0,${H} ${line} ${W},${H}"/>` +
    `<polyline class="sky-terrain" points="${line}"/>` +
    `<line class="sky-sphere" x1="0" y1="${mid}" x2="${W}" y2="${mid}"/>`
  );
}

// r = {sample, up:{sun,earth}, profile, facts} as in src/result.js; view = config/view.json.
export function panoHtml(t, r, view) {
  const d = view.decimals;
  // Own steps (config/view.json); a view without them falls back to the card's shared panorama scale.
  const scale = panoScale(r.sample, view.pano_scale_steps_deg ?? view.elevation_scale_steps_deg ?? [r.scale ?? 90]);
  const marks = panoMarks(r.sample, r.up, scale);
  const dots = marks
    .map((m) =>
      `<span class="pano-dot pano-${m.body} ${m.up ? 'is-up' : 'is-down'}" style="left:${m.x.toFixed(2)}%;top:${m.y.toFixed(2)}%"></span>` +
      `<span class="pano-tag pano-tag-${m.body}${m.left ? ' is-left' : ''}" style="left:${m.x.toFixed(2)}%;top:${m.y.toFixed(2)}%">${e(t(`sky.${m.body}`))}</span>`)
    .join('');
  const az = ['0', '90', '180', '270', '360']
    .map((a) => `<span class="pano-az${a === '0' ? ' is-first' : a === '360' ? ' is-last' : ''}" style="left:${(+a / 360) * 100}%">${e(t(`sky.az.${a}`))}</span>`)
    .join('');
  const { sun, earth } = r.sample;
  const aria = fill(t('sky.aria'), { saz: sun.az.toFixed(0), sel: sun.el.toFixed(d), eaz: earth.az.toFixed(0), eel: earth.el.toFixed(d) });
  return (
    `<div class="pano">` +
    `<p class="pano-verdict">${e(t(`pano.verdict.${verdictKey(r.up)}`))}</p>` +
    `<div class="pano-plot" role="img" aria-label="${e(aria)}">` +
    `<svg class="pano-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${shapes(r.profile, scale)}</svg>` +
    `<span class="pano-corner pano-scale" aria-hidden="true">±${scale}°</span>` +
    `<span class="pano-corner pano-kind" aria-hidden="true">${e(t(r.profile ? 'pano.terrain' : 'pano.sphere'))}</span>` +
    `<span aria-hidden="true">${dots}${az}</span>` +
    `</div></div>`
  );
}
