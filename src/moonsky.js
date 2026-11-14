// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Item b (own coordinates): Sun and Earth azimuth/elevation from any point on the Moon, computed in the browser with
// Astronomy Engine (MIT, pinned in package.json). Output has the same table shape as the frozen Horizons tables
// (src/ephem.js), so everything downstream is unchanged. Checked against JPL Horizons by scripts/validate.py (H9a, "engine").
import { Body, MakeTime, RotationAxis, GeoMoon, GeoVector } from 'astronomy-engine';

const DEG = Math.PI / 180;
const MINUTE = 60_000;
const KM_PER_AU = 149_597_870.7;

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const add = (...vs) => vs.reduce((s, v) => [s[0] + v[0], s[1] + v[1], s[2] + v[2]]);
const scale = (v, k) => [v[0] * k, v[1] * k, v[2] * k];
const vec = (v) => [v.x, v.y, v.z];

// Local frame (J2000 equatorial unit vectors: up, east, north) at selenographic lat/lon (deg, east positive),
// from the IAU rotation model of the Moon (pole + prime meridian angle W).
export function localFrame(axis, latDeg, lonEastDeg) {
  const n = vec(axis.north);
  const ra = axis.ra * 15 * DEG;
  const node = [-Math.sin(ra), Math.cos(ra), 0];
  const w = axis.spin * DEG;
  const x = add(scale(node, Math.cos(w)), scale(cross(n, node), Math.sin(w)));
  const y = cross(n, x);
  const la = latDeg * DEG;
  const lo = lonEastDeg * DEG;
  const meridian = add(scale(x, Math.cos(lo)), scale(y, Math.sin(lo)));
  return {
    up: add(scale(meridian, Math.cos(la)), scale(n, Math.sin(la))),
    east: add(scale(x, -Math.sin(lo)), scale(y, Math.cos(lo))),
    north: add(scale(meridian, -Math.sin(la)), scale(n, Math.cos(la))),
  };
}

// Azimuth (deg from north toward east, 0–360) and elevation (deg above the ideal sphere) of direction v.
export function azEl(frame, v) {
  const r = Math.hypot(...v);
  const el = Math.asin(Math.max(-1, Math.min(1, dot(v, frame.up) / r))) / DEG;
  const az = (Math.atan2(dot(v, frame.east), dot(v, frame.north)) / DEG + 360) % 360;
  return { az, el };
}

// Sun and Earth seen from (lat, lon_east, radiusKm) at epoch ms. The Sun direction is the apparent geocentric one
// (light time + aberration for the Earth's motion) moved to the site; the Earth direction includes the site's offset
// from the Moon's centre (up to ~0.26°). Measured difference from JPL Horizons: data/validation.json "engine".
export function skyAt(site, ms, radiusKm) {
  const time = MakeTime(new Date(ms));
  const frame = localFrame(RotationAxis(Body.Moon, time), site.lat, site.lon_east);
  const obs = scale(frame.up, radiusKm / KM_PER_AU);
  const moon = vec(GeoMoon(time));
  const sun = add(vec(GeoVector(Body.Sun, time, true)), scale(moon, -1), scale(obs, -1));
  const earth = add(scale(moon, -1), scale(obs, -1));
  return { sun: azEl(frame, sun), earth: azEl(frame, earth) };
}

// Table in the frozen-table shape ({start, step_minutes, sun:{az[],el[]}, earth:{az[],el[]}}) for startMs..endMs.
export function computeTable(site, { startMs, endMs, stepMinutes, radiusKm, decimals }) {
  const k = 10 ** decimals;
  const r = (v) => Math.round(v * k) / k;
  const out = { site: 'custom', lat: site.lat, lon_east: site.lon_east, start: new Date(startMs).toISOString().slice(0, 16) + 'Z',
    step_minutes: stepMinutes, sun: { az: [], el: [] }, earth: { az: [], el: [] }, computed: 'browser' };
  for (let ms = startMs; ms <= endMs; ms += stepMinutes * MINUTE) {
    const s = skyAt(site, ms, radiusKm);
    for (const b of ['sun', 'earth']) {
      out[b].az.push(r(s[b].az));
      out[b].el.push(r(s[b].el));
    }
  }
  return out;
}
