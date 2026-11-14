// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Item k: how conditions on the Moon differ from Earth. Pure helpers: quoted values come from config/moon-earth.json,
// motion numbers are measured from the card's own Sun/Earth table (raw azimuth/elevation, ideal sphere).
import { tableRange } from './ephem.js';

const RAD = Math.PI / 180;
const MINUTE = 60_000;

// Angle between two sky directions given as {az, el} in degrees (haversine: stays exact for small angles).
export function separationDeg(a, b) {
  const s = (x) => Math.sin((x * RAD) / 2) ** 2;
  const h = s(b.el - a.el) + Math.cos(a.el * RAD) * Math.cos(b.el * RAD) * s(b.az - a.az);
  return (2 * Math.asin(Math.min(1, Math.sqrt(h)))) / RAD;
}

// Degrees per hour the body moves across the sky between the two table rows around ms; null outside the table.
export function rateAt(table, ms, body) {
  const { startMs, endMs } = tableRange(table);
  if (!Number.isFinite(ms) || ms < startMs || ms > endMs) return null;
  const step = table.step_minutes * MINUTE;
  const i = Math.min(Math.floor((ms - startMs) / step), table.sun.el.length - 2);
  const b = table[body];
  const at = (k) => ({ az: b.az[k], el: b.el[k] });
  return separationDeg(at(i), at(i + 1)) * (60 / table.step_minutes);
}

// Smallest arc of azimuth that holds every value (handles the 360°/0° wrap).
export function azimuthSpan(values) {
  const s = [...values].map((v) => ((v % 360) + 360) % 360).sort((a, b) => a - b);
  if (s.length < 2) return 0;
  let gap = 360 - s[s.length - 1] + s[0];
  for (let k = 1; k < s.length; k++) gap = Math.max(gap, s[k] - s[k - 1]);
  return 360 - gap;
}

// Where Earth stayed in this site's sky over the whole table: {az: span, elMin, elMax, from, to}.
export function earthSpread(table) {
  const { startMs, endMs } = tableRange(table);
  const el = table.earth.el;
  return { az: azimuthSpan(table.earth.az), elMin: Math.min(...el), elMax: Math.max(...el), from: startMs, to: endMs };
}

// Distance to the horizon of a smooth sphere (radius km) seen from height m above it, in km.
export function horizonKm(radiusKm, heightM) {
  const r = radiusKm * 1000;
  return Math.sqrt((r + heightM) ** 2 - r * r) / 1000;
}

// One full turn of the Sun across the sky in the given day length → degrees per hour.
export function meanSunRate(dayHours) {
  return 360 / dayHours;
}
