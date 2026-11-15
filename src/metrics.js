// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Mission check (ADR 0101): over a mission period that starts at the card time, how long the longest night and the longest
// gap without Earth are, the share of hours with the Sun, Earth and both above the horizon used, a geometry-only power
// estimate, and one GO / RISKY / NO-GO decision from config/metrics.json. Pure functions; the card block is
// src/metrics-ui.js. Inputs = the hourly table (true elevations) and the same table relative to the horizon used.
import { tableRange, isAbove } from './ephem.js';

const MINUTE = 60_000;
const DAY = 86_400_000;

// Rows whose time lies in [fromMs, fromMs + days): {k0, k1} (k1 exclusive); truncated = the period runs past the table end.
export function periodRows(table, fromMs, days) {
  const { startMs, endMs } = tableRange(table);
  const step = table.step_minutes * MINUTE;
  const stop = fromMs + days * DAY;
  const n = table.sun.el.length;
  const k0 = Math.max(0, Math.ceil((fromMs - startMs) / step));
  const k1 = Math.min(n, Math.ceil((stop - startMs) / step));
  return { k0, k1: Math.max(k0, k1), truncated: stop > endMs + step, endMs: startMs + (Math.max(k0, k1) - 1) * step };
}

// Longest unbroken run of true flags: {rows, i0, i1, startOpen, endOpen}; rows = 0 when there is none.
// open = the run touches the first/last flag, so it may be longer than the period shows.
export function longestRun(flags) {
  let best = { rows: 0, i0: -1, i1: -1, startOpen: false, endOpen: false };
  let i0 = -1;
  for (let k = 0; k <= flags.length; k++) {
    if (k < flags.length && flags[k]) {
      if (i0 < 0) i0 = k;
    } else if (i0 >= 0) {
      if (k - i0 > best.rows) best = { rows: k - i0, i0, i1: k - 1, startOpen: i0 === 0, endOpen: k === flags.length };
      i0 = -1;
    }
  }
  return best;
}

// Share (0..1) of a disc of angular radius r whose centre is `margin` degrees above a straight horizon.
export function discFraction(margin, r) {
  if (!(r > 0)) return margin > 0 ? 1 : 0;
  const x = Math.max(-1, Math.min(1, margin / r));
  return 1 - (Math.acos(x) - x * Math.sqrt(1 - x * x)) / Math.PI;
}

// Mean irradiance (W/m², geometry only) on a vertical panel that turns to face the Sun and on a flat panel, for one row:
// solar constant x geometry x share of the disc above the horizon used. el = true elevation, margin = above the horizon used.
export function rowPower(el, margin, solar, radius) {
  const f = discFraction(margin, radius);
  const rad = (el * Math.PI) / 180;
  return { tracking: solar * Math.max(0, Math.cos(rad)) * f, flat: solar * Math.max(0, Math.sin(rad)) * f };
}

// table = true elevations, rel = the same rows above the horizon used (terrain.relativeTable); o = {threshold, solar, sunRadius}.
export function missionMetrics(table, rel, fromMs, days, o) {
  const { k0, k1, truncated, endMs } = periodRows(table, fromMs, days);
  const stepH = table.step_minutes / 60;
  const sun = [];
  const earth = [];
  let tracking = 0;
  let flat = 0;
  for (let k = k0; k < k1; k++) {
    sun.push(isAbove(rel.sun.el[k], o.threshold));
    earth.push(isAbove(rel.earth.el[k], o.threshold));
    const p = rowPower(table.sun.el[k], rel.sun.el[k], o.solar, o.sunRadius);
    tracking += p.tracking;
    flat += p.flat;
  }
  const n = sun.length;
  const pct = (flags) => (n ? (flags.filter(Boolean).length / n) * 100 : 0);
  const run = (flags) => {
    const r = longestRun(flags.map((f) => !f));
    return { hours: r.rows * stepH, open: r.startOpen || r.endOpen, all: r.rows === n && n > 0 };
  };
  return {
    rows: n,
    hours: n * stepH,
    days,
    truncated,
    endMs,
    sunPct: pct(sun),
    earthPct: pct(earth),
    bothPct: pct(sun.map((s, i) => s && earth[i])),
    night: run(sun),
    gap: run(earth),
    power: { tracking: n ? tracking / n : 0, flat: n ? flat / n : 0 },
  };
}

// GO = every check passes, RISKY = one fails, NO-GO = two or more. fails = failing checks in a fixed order.
export function decide(m, rules) {
  const fails = [];
  if (m.sunPct < rules.sun_min_pct) fails.push('sun');
  if (m.earthPct < rules.earth_min_pct) fails.push('earth');
  if (m.night.hours > rules.night_max_hours) fails.push('night');
  return { decision: fails.length === 0 ? 'go' : fails.length === 1 ? 'risky' : 'nogo', fails };
}
