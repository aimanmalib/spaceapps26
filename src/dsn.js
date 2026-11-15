// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Ground stations (ADR 0109): the Moon's elevation seen from each Deep Space Network complex (config/dsn.json), from the
// geocentric Moon position of Astronomy Engine (the engine of src/moonsky.js), on the WGS 84 ellipsoid, no refraction.
// Loaded only when a card's technical details open (src/dsn-ui.js), so the engine stays out of the first page load.
import { Body, Observer, Equator, Horizon, MakeTime } from 'astronomy-engine';

const MINUTE = 60_000;

// Elevation (deg) of the Moon's centre from one station at epoch ms.
export function moonElevation(st, ms) {
  const time = MakeTime(new Date(ms));
  const lon = st.lon_east > 180 ? st.lon_east - 360 : st.lon_east;
  const obs = new Observer(st.lat, lon, st.height_m);
  const eq = Equator(Body.Moon, time, obs, true, true);
  return Horizon(time, obs, eq.ra, eq.dec).altitude;
}

// Every station at ms: [{id, el, up}] (up = above min_elevation_deg) and the first time (ms) any station is up, searching
// ahead when none is now; next = null when none within cfg.next_hours.
export function dsnAt(cfg, ms) {
  const rows = cfg.stations.map((s) => {
    const el = moonElevation(s, ms);
    return { id: s.id, antenna: s.antenna, el, up: el > cfg.min_elevation_deg };
  });
  let next = null;
  if (!rows.some((r) => r.up)) {
    for (let k = 1; k * cfg.next_step_minutes <= cfg.next_hours * 60; k++) {
      const at = ms + k * cfg.next_step_minutes * MINUTE;
      const s = cfg.stations.find((st) => moonElevation(st, at) > cfg.min_elevation_deg);
      if (s) {
        next = { id: s.id, ms: at };
        break;
      }
    }
  }
  return { rows, next };
}
