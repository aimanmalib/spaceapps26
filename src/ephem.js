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

const RAD = Math.PI / 180;
const unit = (az, el) => [Math.cos(el * RAD) * Math.sin(az * RAD), Math.cos(el * RAD) * Math.cos(az * RAD), Math.sin(el * RAD)];

// Direction between two rows (ADR 0113): the unit vectors (east, north, up) of both rows joined by a straight line,
// normalised and turned back into azimuth and elevation. Near the zenith or nadir the azimuth turns through many degrees in an
// hour, so straight lines in azimuth and elevation put the body off its path (measured: 5.48° in azimuth, 0.056° on the sky,
// with the Sun 0.56° from the zenith); joining the directions keeps it on the sky's arc. Rows themselves stay exact.
export function lerpDirection(az0, el0, az1, el1, f) {
  if (f <= 0) return { az: az0, el: el0 };
  if (f >= 1) return { az: az1, el: el1 };
  const a = unit(az0, el0);
  const b = unit(az1, el1);
  const [x, y, z] = a.map((v, k) => v + (b[k] - v) * f);
  const h = Math.hypot(x, y);
  if (!(Math.hypot(h, z) > 1e-12)) return { az: lerpAngle(az0, az1, f), el: lerp(el0, el1, f) };
  const az = h > 1e-12 ? ((Math.atan2(x, y) / RAD) % 360 + 360) % 360 : lerpAngle(az0, az1, f);
  return { az, el: Math.atan2(z, h) / RAD };
}

// Sun and Earth azimuth/elevation at ms (direction joined between table rows); null outside the table.
export function sampleAt(table, ms) {
  const { startMs, endMs } = tableRange(table);
  if (!Number.isFinite(ms) || ms < startMs || ms > endMs) return null;
  const pos = (ms - startMs) / (table.step_minutes * MINUTE);
  const i = Math.min(Math.floor(pos), table.sun.el.length - 2);
  const f = pos - i;
  const body = (b) => lerpDirection(b.az[i], b.el[i], b.az[i + 1], b.el[i + 1], f);
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
