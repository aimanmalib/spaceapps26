// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Earth view (P4v): sky window toward one body as SVG markup, drawn to scale. viewBox units = degrees, so one degree
// is the same number of pixels across and up (preserveAspectRatio keeps it). Shapes only; text is HTML around it.
import { horizonAt } from './terrain.js';

const f2 = (v) => v.toFixed(3);

// Skyline samples inside the window [az0, az0 + width] (profile step + both edges), as [x, el] pairs.
export function skylineIn(profile, az0, width) {
  const step = profile.azimuth_step_deg;
  const xs = [0];
  for (let x = Math.ceil(az0 / step) * step - az0; x < width; x += step) if (x > 0) xs.push(x);
  xs.push(width);
  return xs.map((x) => [x, horizonAt(profile, az0 + x)]);
}

// Elevation range shown: body disc + skyline, padded, at least minHeight tall (centred on the content).
export function frame(pos, radius, line, cfg) {
  const els = line.map(([, el]) => el);
  let lo = Math.min(pos.el - radius, 0, ...els) - cfg.pad_deg;
  let hi = Math.max(pos.el + radius, 0, ...els) + cfg.pad_deg;
  if (hi - lo < cfg.min_height_deg) {
    const mid = (hi + lo) / 2;
    lo = mid - cfg.min_height_deg / 2;
    hi = mid + cfg.min_height_deg / 2;
  }
  return { lo, hi };
}

// pos = {az, el} of the body; profile = skyline (data/horizon or a data/shift point); radius = disc angular radius.
// Returns {svg, margin}: margin = centre of the disc above the skyline (deg), same rule as the card answers.
export function earthViewSvg({ body, pos, profile, radius, cfg }) {
  const w = cfg.width_deg;
  const az0 = pos.az - w / 2;
  const line = skylineIn(profile, az0, w);
  const { lo, hi } = frame(pos, radius, line, cfg);
  const h = hi - lo;
  const y = (el) => f2(hi - el);
  const pts = line.map(([x, el]) => `${f2(x)},${y(el)}`).join(' ');
  const grid = [];
  for (let el = Math.ceil(lo / cfg.grid_step_deg) * cfg.grid_step_deg; el < hi; el += cfg.grid_step_deg) {
    if (el !== 0) grid.push(`<line class="ev-grid" x1="0" y1="${y(el)}" x2="${w}" y2="${y(el)}"/>`);
  }
  const svg =
    `<svg class="ev-svg" viewBox="0 0 ${w} ${f2(h)}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">` +
    `<rect class="sky-above" x="0" y="0" width="${w}" height="${f2(h)}"/>` + grid.join('') +
    `<circle class="ev-body ev-${body}" cx="${f2(w / 2)}" cy="${y(pos.el)}" r="${f2(radius)}"/>` +
    `<polygon class="sky-ground" points="0,${f2(h)} ${pts} ${w},${f2(h)}"/>` +
    `<polyline class="ev-ridge" points="${pts}"/>` +
    `<line class="ev-sphere" x1="0" y1="${y(0)}" x2="${w}" y2="${y(0)}"/></svg>`;
  return { svg, margin: pos.el - horizonAt(profile, pos.az), lo, hi };
}
