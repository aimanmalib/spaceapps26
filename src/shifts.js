// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Item l (small shifts in location or date): the same two answers (Sun above the horizon = power, Earth above the
// horizon = direct-to-Earth link) for the chosen scenario moved a few hours/days, or a short distance on the ground.
// Pure functions; the card block is src/shifts-ui.js.
import { sampleAt, isAbove } from './ephem.js';
import { aboveHorizon } from './terrain.js';

const HOUR = 3_600_000;

// Elevation above the horizon used (terrain skyline when a profile is given, else the ideal sphere) and the answer.
export function judge(sample, profile, thresholdDeg) {
  if (!sample) return null;
  const one = (b) => {
    const margin = aboveHorizon(sample[b], profile);
    return { margin, up: isAbove(margin, thresholdDeg) };
  };
  return { sun: one('sun'), earth: one('earth') };
}

// Same place, time moved by each offset (hours). Rows outside the table have answers = null.
export function timeRows(table, profile, ms, offsetsHours, thresholdDeg) {
  return offsetsHours.map((h) => ({ kind: 'time', hours: h, answers: judge(sampleAt(table, ms + h * HOUR), profile, thresholdDeg) }));
}

// Same time, nearby points: points[i] = {dir, elev}, tables[i] = that point's Sun/Earth table.
export function placeRows(points, tables, azimuthStepDeg, ms, thresholdDeg) {
  return points.map((p, i) => ({
    kind: 'place',
    dir: p.dir,
    answers: judge(sampleAt(tables[i], ms), { elev: p.elev, azimuth_step_deg: azimuthStepDeg }, thresholdDeg),
  }));
}

// Number of shifted rows whose power or link answer differs from the chosen scenario.
export function changedCount(base, rows) {
  return rows.filter((r) => r.answers && (r.answers.sun.up !== base.sun.up || r.answers.earth.up !== base.earth.up)).length;
}

// Tilt of the local horizon plane after walking km on the ideal sphere (degrees).
export function sphereTiltDeg(km, radiusKm) {
  return (km / radiusKm) * (180 / Math.PI);
}

// Over the whole year (P4u): rows for one site of data/shift-year/shift-year.json (centre-of-disc shares) and the
// nearby point whose Earth share (then Sun share) differs most from the site, for the one generated sentence.
export function yearRows(entry) {
  const rows = [{ dir: null, sun: entry.centre.sun, earth: entry.centre.earth }, ...entry.points.map((p) => ({ dir: p.dir, sun: p.centre.sun, earth: p.centre.earth }))];
  const gap = (p) => [Math.abs(p.earth - entry.centre.earth), Math.abs(p.sun - entry.centre.sun)];
  const far = rows.slice(1).reduce((a, p) => {
    const [ae, as] = gap(a);
    const [pe, ps] = gap(p);
    return pe > ae || (pe === ae && ps > as) ? p : a;
  });
  return { rows, far };
}
