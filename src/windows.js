// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Above-horizon windows from a precomputed table: when the Sun/Earth rises and sets around a given time.
// Rise/set = where the linearly interpolated elevation crosses the threshold (sampleAt joins directions, ADR 0113; near the
// horizon the two agree far below the 0.01° rounding of the tables).
import { tableRange, isAbove } from './ephem.js';

const MINUTE = 60_000;

function segIndex(table, ms) {
  const { startMs } = tableRange(table);
  const pos = (ms - startMs) / (table.step_minutes * MINUTE);
  return Math.max(0, Math.min(Math.floor(pos), table.sun.el.length - 2));
}

// Time inside segment k (rows k, k+1) where elevation equals the threshold.
function crossing(table, el, k, th) {
  const { startMs } = tableRange(table);
  const step = table.step_minutes * MINUTE;
  const f = (th - el[k]) / (el[k + 1] - el[k]);
  return startMs + (k + Math.min(1, Math.max(0, f))) * step;
}

// First time after fromMs when the body stops being in `state` (true = above); null if not within the table.
export function nextChange(table, body, fromMs, state, th = 0) {
  const el = table[body].el;
  for (let k = segIndex(table, fromMs); k < el.length - 1; k++) {
    if (isAbove(el[k + 1], th) !== state) return Math.max(fromMs, crossing(table, el, k, th));
  }
  return null;
}

// Last time at or before fromMs when the body entered `state`; null if it was already so at the table start.
export function prevChange(table, body, fromMs, state, th = 0) {
  const el = table[body].el;
  for (let k = segIndex(table, fromMs); k >= 0; k--) {
    if (isAbove(el[k], th) !== state) return Math.min(fromMs, crossing(table, el, k, th));
  }
  return null;
}

// The window the body is in at ms (up = true), or the next one (up = false).
// {up, start, end, startOpen, endOpen, none}: open = the window runs past the table edge, so start/end is that edge.
// none = no rise left within the table (body down until the end of the data).
export function windowAt(table, ms, body, up, th = 0) {
  const { startMs, endMs } = tableRange(table);
  if (up) {
    const s = prevChange(table, body, ms, true, th);
    const e = nextChange(table, body, ms, true, th);
    return { up, start: s ?? startMs, end: e ?? endMs, startOpen: s === null, endOpen: e === null, none: false };
  }
  const rise = nextChange(table, body, ms, false, th);
  if (rise === null) return { up, start: null, end: null, startOpen: false, endOpen: false, none: true, dataEnd: endMs };
  const set = nextChange(table, body, rise, true, th);
  return { up, start: rise, end: set ?? endMs, startOpen: false, endOpen: set === null, none: false };
}

// Duration in ms → [{n, unit}] with the two largest non-zero units out of d/h/min (minutes rounded).
export function durationParts(ms) {
  let m = Math.max(0, Math.round(ms / MINUTE));
  const d = Math.floor(m / 1440);
  m -= d * 1440;
  const h = Math.floor(m / 60);
  m -= h * 60;
  const parts = [
    { n: d, unit: 'd' },
    { n: h, unit: 'h' },
    { n: m, unit: 'min' },
  ];
  const first = parts.findIndex((p) => p.n > 0);
  if (first === -1) return [{ n: 0, unit: 'min' }];
  return parts.slice(first, first + 2).filter((p) => p.n > 0);
}
