// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Timeline of one lunar day or the whole one-year table (item d, g): Sun and Earth elevation above the horizon over a fixed span of a precomputed table.
// Pure helpers + SVG markup; colours come from CSS classes (tokens in styles.css). All text is HTML around the SVG.
import { yFor } from './sky.js';
import { tableRange, isAbove } from './ephem.js';

const MINUTE = 60_000;
export const TL = { w: 360, h: 120, pad: 8 };

// Span shown for a time ms: keep the current span while ms is inside it (so scrubbing or playing does not move the axis),
// otherwise centre a new span on ms. Clamped to the table range [startMs, endMs].
export function timelineSpan(ms, current, spanMs, { startMs, endMs }) {
  if (current && ms >= current.from && ms <= current.to && current.from >= startMs && current.to <= endMs) return current;
  const len = Math.min(spanMs, endMs - startMs);
  const from = Math.max(startMs, Math.min(endMs - len, ms - len / 2));
  return { from, to: from + len };
}

// Table rows inside [from, to]: [{ms, sun, earth}] with elevations from the (already horizon-relative) table.
export function rowsIn(table, from, to) {
  const { startMs } = tableRange(table);
  const step = table.step_minutes * MINUTE;
  const out = [];
  const first = Math.max(0, Math.ceil((from - startMs) / step));
  for (let k = first; k < table.sun.el.length; k++) {
    const ms = startMs + k * step;
    if (ms > to) break;
    // Lunar eclipse seen from the site (ADR 0109): share of the Sun behind Earth, and whether its centre is.
    const ecl = table.eclipse ? { cover: table.eclipse.share[k], hid: !!table.eclipse.centre[k] } : null;
    out.push({ ms, sun: table.sun.el[k], earth: table.earth.el[k], ...(ecl && ecl.cover > 0 ? ecl : {}) });
  }
  return out;
}

// Every n-th row plus the last one (a year of hourly rows drawn as a lighter line; bands still use every row).
export function thinRows(rows, n) {
  if (n <= 1 || rows.length < 2) return rows;
  const out = rows.filter((_, i) => i % n === 0);
  if (out[out.length - 1] !== rows[rows.length - 1]) out.push(rows[rows.length - 1]);
  return out;
}

// Above the threshold, and for the Sun not behind Earth (row.hid, ADR 0109).
const lit = (r, body, th) => isAbove(r[body], th) && !(body === 'sun' && r.hid);

// Share (0–1) of rows with the body above the threshold.
export function shareAbove(rows, body, th = 0) {
  return rows.length ? rows.filter((r) => lit(r, body, th)).length / rows.length : 0;
}

// Stretches of rows with part of the Sun behind Earth: [{from, to, cover}] (ms, largest share).
export function eclipseMarks(rows) {
  const out = [];
  for (const r of rows) {
    if (!(r.cover > 0)) continue;
    const last = out[out.length - 1];
    if (last && r.ms - last.to <= (rows[1]?.ms - rows[0]?.ms || 0) * 1.01) Object.assign(last, { to: r.ms, cover: Math.max(last.cover, r.cover) });
    else out.push({ from: r.ms, to: r.ms, cover: r.cover });
  }
  return out;
}

// Runs of consecutive rows with the body above the threshold → [[x0, x1]] in SVG units.
function bands(rows, body, th, x) {
  const out = [];
  let open = null;
  rows.forEach((r, i) => {
    const up = lit(r, body, th);
    if (up && open === null) open = i;
    if ((!up || i === rows.length - 1) && open !== null) {
      out.push([x(rows[open].ms), x(rows[up ? i : i - 1].ms)]);
      open = null;
    }
  });
  return out;
}

// rows = rowsIn(...); span = {from, to}; ms = selected time; scale = ±elevation shown;
// lineEvery = draw the lines through every n-th row (the bars always use every row).
export function timelineSvg(rows, span, ms, scale, th = 0, lineEvery = 1) {
  const x = (t) => ((t - span.from) / (span.to - span.from)) * TL.w;
  const lineRows = thinRows(rows, lineEvery);
  const line = (b) => lineRows.map((r) => `${x(r.ms).toFixed(1)},${yFor(r[b], scale).toFixed(1)}`).join(' ');
  const lane = (b, y) =>
    bands(rows, b, th, x)
      .map(([a, z]) => `<rect class="tl-band tl-band-${b}" x="${a.toFixed(1)}" y="${y}" width="${Math.max(1, z - a).toFixed(1)}" height="6"/>`)
      .join('');
  const mid = TL.h / 2;
  const at = Math.max(0, Math.min(TL.w, x(ms))).toFixed(1);
  // Lunar eclipse seen from the site (ADR 0109): a dark mark with a Sun-coloured edge on the Sun lane, at least 3 units wide.
  const marks = eclipseMarks(rows)
    .map((m) => {
      const a = x(m.from);
      const b = x(m.to);
      const w = Math.max(3, b - a);
      return `<rect class="tl-eclipse" x="${((a + b - w) / 2).toFixed(1)}" y="${TL.h + 1}" width="${w.toFixed(1)}" height="8" rx="1"/>`;
    })
    .join('');
  return (
    `<svg class="tl-svg" viewBox="0 0 ${TL.w} ${TL.h + 16}" preserveAspectRatio="none" aria-hidden="true" focusable="false">` +
    `<rect class="sky-above" x="0" y="0" width="${TL.w}" height="${mid}"/>` +
    `<rect class="sky-ground" x="0" y="${mid}" width="${TL.w}" height="${mid}"/>` +
    `<line class="sky-horizon" x1="0" y1="${mid}" x2="${TL.w}" y2="${mid}"/>` +
    `<polyline class="tl-line tl-earth" points="${line('earth')}"/>` +
    `<polyline class="tl-line tl-sun" points="${line('sun')}"/>` +
    lane('sun', TL.h + 2) +
    lane('earth', TL.h + 9) +
    marks +
    `<line class="tl-now" x1="${at}" y1="0" x2="${at}" y2="${TL.h + 16}"/>` +
    `</svg>`
  );
}
