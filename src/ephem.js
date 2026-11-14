// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Pure functions over a precomputed Horizons table: {start: "YYYY-MM-DDTHH:MMZ", step_minutes, sun: {az[], el[]}, earth: {az[], el[]}}.

const MINUTE = 60_000;

// "2026-11-14T00:00" (datetime-local value, read as UTC), "…Z" or "2026-11-14 00:00" (config) → epoch ms; NaN when malformed.
export function parseUtc(text) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})Z?$/.exec(String(text).trim());
  if (!m) return NaN;
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
}

// epoch ms → "YYYY-MM-DDTHH:MM" (UTC, the datetime-local input format).
export function formatUtc(ms) {
  return new Date(ms).toISOString().slice(0, 16);
}

export function tableRange(table) {
  const startMs = parseUtc(table.start);
  const n = table.sun.el.length;
  return { startMs, endMs: startMs + (n - 1) * table.step_minutes * MINUTE };
}

// Interpolate between two azimuths along the short way round (359° → 1° passes 0°, not 180°).
export function lerpAngle(a, b, f) {
  const d = ((((b - a) % 360) + 540) % 360) - 180;
  return (((a + d * f) % 360) + 360) % 360;
}

function lerp(a, b, f) {
  return a + (b - a) * f;
}

// Sun and Earth azimuth/elevation at ms (linear between table rows); null outside the table.
export function sampleAt(table, ms) {
  const { startMs, endMs } = tableRange(table);
  if (!Number.isFinite(ms) || ms < startMs || ms > endMs) return null;
  const pos = (ms - startMs) / (table.step_minutes * MINUTE);
  const i = Math.min(Math.floor(pos), table.sun.el.length - 2);
  const f = pos - i;
  const body = (b) => ({ az: lerpAngle(b.az[i], b.az[i + 1], f), el: lerp(b.el[i], b.el[i + 1], f) });
  return { sun: body(table.sun), earth: body(table.earth) };
}

// Above the horizon = elevation strictly greater than the threshold (ideal sphere horizon: 0°).
export function isAbove(el, thresholdDeg = 0) {
  return el > thresholdDeg;
}

// Smallest configured step that fits every |elevation|; the largest step when none fits.
export function sharedScale(elevations, steps) {
  const need = Math.max(0, ...elevations.filter(Number.isFinite).map(Math.abs));
  const sorted = [...steps].sort((a, b) => a - b);
  return sorted.find((s) => s >= need) ?? sorted[sorted.length - 1];
}
