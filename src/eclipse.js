// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Lunar eclipses seen from the site (ADR 0109). When Earth passes in front of the Sun as seen from the Moon (a lunar
// eclipse for people on Earth), the site loses sunlight even with the Sun above its horizon. Pure functions over the
// hourly tables of src/ephem.js: the Sun–Earth angle comes from the two azimuth/elevation pairs of the same row (the
// JPL Horizons tables, or the in-browser engine after them), the disc radii from config/view.json
// timeline.year.disc_radius_deg (mean distances, solid Earth: config/eclipses.json says what that leaves out).
// Rule, same as the horizon: the Sun counts as giving sunlight while its CENTRE is not behind Earth; the covered share
// of its disc is given beside it and lowers the power estimate.
import { tableRange, sampleAt } from './ephem.js';

const DEG = Math.PI / 180;
const MINUTE = 60_000;

// Angle (deg) between two directions given as azimuth/elevation (haversine form, exact near 0°).
export function separation(a, b) {
  const h = Math.sin(((b.el - a.el) * DEG) / 2) ** 2 + Math.cos(a.el * DEG) * Math.cos(b.el * DEG) * Math.sin(((b.az - a.az) * DEG) / 2) ** 2;
  return (2 * Math.asin(Math.min(1, Math.sqrt(h)))) / DEG;
}

// Share (0..1) of the Sun's disc (radius rs) covered by Earth's disc (radius re) with centres sep apart (flat sky: the
// discs are about 1° across). Seen from the Moon Earth's disc is larger, so the whole Sun can be covered.
export function coveredShare(sep, rs, re) {
  if (sep >= rs + re) return 0;
  if (sep <= re - rs) return 1;
  if (sep <= rs - re) return (re * re) / (rs * rs);
  const a = rs * rs * Math.acos((sep * sep + rs * rs - re * re) / (2 * sep * rs));
  const b = re * re * Math.acos((sep * sep + re * re - rs * rs) / (2 * sep * re));
  const c = 0.5 * Math.sqrt(Math.max(0, (-sep + rs + re) * (sep + rs - re) * (sep - rs + re) * (sep + rs + re)));
  return Math.max(0, Math.min(1, (a + b - c) / (Math.PI * rs * rs)));
}

// One moment (a table sample {sun, earth}): {sep, share, centre (the Sun's centre is behind Earth), state}.
export function eclipseOf(sample, radii) {
  const sep = separation(sample.sun, sample.earth);
  const share = coveredShare(sep, radii.sun, radii.earth);
  return { sep, share, centre: sep < radii.earth, state: share >= 1 ? 'total' : share > 0 ? 'part' : 'none' };
}

const cache = new WeakMap();

// Every row of a table with TRUE elevations: {sep, share, centre} as typed arrays (cached per table object).
export function eclipseRows(table, radii) {
  const hit = cache.get(table);
  if (hit && hit.rs === radii.sun && hit.re === radii.earth) return hit.rows;
  const n = table.sun.el.length;
  const sep = new Float64Array(n);
  const share = new Float64Array(n);
  const centre = new Uint8Array(n);
  for (let k = 0; k < n; k++) {
    sep[k] = separation({ az: table.sun.az[k], el: table.sun.el[k] }, { az: table.earth.az[k], el: table.earth.el[k] });
    share[k] = coveredShare(sep[k], radii.sun, radii.earth);
    centre[k] = sep[k] < radii.earth ? 1 : 0;
  }
  const rows = { sep, share, centre };
  cache.set(table, { rs: radii.sun, re: radii.earth, rows });
  return rows;
}

// Stretches of rows with any part of the Sun covered: [{k0, k1 (inclusive), peak (row), share (largest), centre (rows
// with the centre behind Earth)}]. Rows are hourly, so an eclipse shorter than the step can fall between two rows; the
// card itself always uses its own minute (eclipseOf on the interpolated sample).
export function eclipseSpans(rows) {
  const out = [];
  let cur = null;
  for (let k = 0; k <= rows.share.length; k++) {
    const on = k < rows.share.length && rows.share[k] > 0;
    if (on && !cur) cur = { k0: k, k1: k, peak: k, share: 0, centre: 0 };
    if (on) {
      cur.k1 = k;
      if (rows.share[k] > cur.share) Object.assign(cur, { share: rows.share[k], peak: k });
      cur.centre += rows.centre[k];
    } else if (cur) {
      out.push(cur);
      cur = null;
    }
  }
  return out;
}

// Time (ms) when the separation crosses limit between rows k and k+1 (linear in the separation).
function crossing(startMs, step, sep, k, limit) {
  const a = sep[k];
  const b = sep[k + 1];
  const f = b === a ? 0 : Math.max(0, Math.min(1, (limit - a) / (b - a)));
  return startMs + (k + f) * step;
}

// The eclipse around time ms, or null when no part of the Sun is covered then: {now (eclipseOf at ms), startMs, endMs
// (any part covered), centreEndMs (centre uncovered again; null when the centre is not covered at ms), peakMs, peakShare}.
// Times past the table edge are null (open).
export function eclipseAround(table, ms, radii) {
  const s = sampleAt(table, ms);
  if (!s) return null;
  const now = eclipseOf(s, radii);
  if (!now.share) return null;
  const rows = eclipseRows(table, radii);
  const { startMs } = tableRange(table);
  const step = table.step_minutes * MINUTE;
  const n = rows.sep.length;
  const k = Math.min(n - 2, Math.floor((ms - startMs) / step));
  const outer = radii.sun + radii.earth;
  let a = k;
  while (a >= 0 && rows.sep[a] < outer) a--;
  let z = k + 1;
  while (z < n && rows.sep[z] < outer) z++;
  let peak = { ms, share: now.share };
  for (let i = Math.max(0, a + 1); i <= Math.min(n - 1, z - 1); i++) {
    if (rows.share[i] > peak.share) peak = { ms: startMs + i * step, share: rows.share[i] };
  }
  let centreEndMs = null;
  if (now.centre) {
    let c = k + 1;
    while (c < n && rows.sep[c] < radii.earth) c++;
    centreEndMs = c < n ? crossing(startMs, step, rows.sep, c - 1, radii.earth) : null;
    if (centreEndMs != null) centreEndMs = Math.max(ms, centreEndMs);
  }
  return {
    now,
    startMs: a >= 0 ? Math.min(ms, crossing(startMs, step, rows.sep, a, outer)) : null,
    endMs: z < n ? Math.max(ms, crossing(startMs, step, rows.sep, z - 1, outer)) : null,
    centreEndMs,
    peakMs: peak.ms,
    peakShare: peak.share,
  };
}

// A horizon-relative table (src/terrain.js relativeTable) with the eclipse rows of the true table attached, so the
// timeline, Mission check and "Next windows" can count a Sun behind Earth as no sunlight. A new object: the
// relative table of an ideal-sphere site is the true table itself.
export function withEclipses(rel, table, radii) {
  return { ...rel, eclipse: eclipseRows(table, radii) };
}

// Sun above the horizon used at row k and its centre not behind Earth (the answers' rule).
export function sunLit(rel, k, isUp) {
  return isUp && !(rel.eclipse && rel.eclipse.centre[k]);
}
