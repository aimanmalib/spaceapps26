// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Sequential comparison (challenge text: "side-by-side or sequential comparison of multiple sites"): step a card to
// the previous/next listed site or date, and list the same answers when the date moves. Pure functions; the card
// parts are src/sequence-ui.js.
import { judge, timeRows } from './shifts.js';

// Offsets (hours) of the rows after the chosen time: stepHours, 2 × stepHours, … steps × stepHours.
export function stepOffsets(steps, stepHours) {
  return Array.from({ length: steps }, (_, i) => (i + 1) * stepHours);
}

// Chosen row + the following rows (answers = null outside the table); each row says whether an answer differs.
export function dateRows(table, profile, sample, ms, steps, stepHours, thresholdDeg) {
  const base = { hours: 0, answers: judge(sample, profile, thresholdDeg) };
  const rows = [base, ...timeRows(table, profile, ms, stepOffsets(steps, stepHours), thresholdDeg)];
  return rows.map((r) => ({ ...r, changed: differs(base.answers, r.answers) }));
}

export function differs(base, a) {
  return !!(base && a && (a.sun.up !== base.sun.up || a.earth.up !== base.earth.up));
}

// Counts over the rows inside the table: n dates, sun = Sun above the horizon used, earth = Earth above it.
export function summary(rows) {
  const ok = rows.filter((r) => r.answers);
  return { n: ok.length, sun: ok.filter((r) => r.answers.sun.up).length, earth: ok.filter((r) => r.answers.earth.up).length };
}

// Next/previous id in the list order (wraps round); an id not in the list (own coordinates) goes to the first/last.
export function stepId(ids, current, dir) {
  const i = ids.indexOf(current);
  if (i < 0) return dir > 0 ? ids[0] : ids[ids.length - 1];
  return ids[(i + dir + ids.length) % ids.length];
}
