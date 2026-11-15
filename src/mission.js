// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Mission window finder (SI suggestion chosen by the author, 15 Nov; supports the challenge sentence "assess power
// generation potential and direct-to-Earth communication windows"): stretches of the hourly table where the Sun AND
// Earth are both above the horizon used, without a break. Geometry only. Pure functions; the card block is
// src/mission-ui.js. Input = a table already relative to the horizon used (terrain.relativeTable).
import { tableRange, isAbove } from './ephem.js';

const MINUTE = 60_000;
const HOUR = 3_600_000;

// Row k: both bodies above the threshold (centre of the disc, same rule as the card answers).
// A Sun whose centre is behind Earth (lunar eclipse seen from the site, ADR 0109; rel.eclipse) gives no sunlight.
export function bothUp(rel, th = 0) {
  return rel.sun.el.map((v, k) => isAbove(v, th) && !rel.eclipse?.centre[k] && isAbove(rel.earth.el[k], th));
}

// Runs of consecutive "both up" rows: [{i0, i1}] (inclusive row indices).
export function runs(flags) {
  const out = [];
  let i0 = -1;
  flags.forEach((f, k) => {
    if (f && i0 < 0) i0 = k;
    if (!f && i0 >= 0) {
      out.push({ i0, i1: k - 1 });
      i0 = -1;
    }
  });
  if (i0 >= 0) out.push({ i0, i1: flags.length - 1 });
  return out;
}

// Windows lasting at least minHours (first to last "both up" row) that end after fromMs, at most max of them.
// startOpen/endOpen = the run touches the first/last table row, so it may be longer than the data shows.
// current = the window contains fromMs.
export function findWindows(rel, fromMs, minHours, th = 0, max = Infinity) {
  const { startMs } = tableRange(rel);
  const step = rel.step_minutes * MINUTE;
  const last = rel.sun.el.length - 1;
  const out = [];
  for (const r of runs(bothUp(rel, th))) {
    const start = startMs + r.i0 * step;
    const end = startMs + r.i1 * step;
    if (end - start < minHours * HOUR || end <= fromMs) continue;
    out.push({ start, end, ms: end - start, startOpen: r.i0 === 0, endOpen: r.i1 === last, current: start <= fromMs });
    if (out.length >= max) break;
  }
  return out;
}

// Share of table rows with both bodies above the threshold (0..1).
export function bothShare(rel, th = 0) {
  const f = bothUp(rel, th);
  return f.length ? f.filter(Boolean).length / f.length : 0;
}
