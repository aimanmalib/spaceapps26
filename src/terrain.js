// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Terrain horizon (item j): skyline elevation per azimuth from data/horizon/<site>.json (LRO LOLA, scripts/horizon.py).
// Elevations share the ideal-sphere reference of the Horizons tables, so "above the skyline" = el − skyline(az) > threshold.

export const BODIES = ['sun', 'earth'];

// Skyline elevation (deg) at azimuth az (deg from north toward east), linear between profile samples, wrapping at 360°.
export function horizonAt(profile, az) {
  const n = profile.elev.length;
  const pos = ((((az % 360) + 360) % 360) / profile.azimuth_step_deg) % n;
  const i = Math.floor(pos);
  const f = pos - i;
  return profile.elev[i] + (profile.elev[(i + 1) % n] - profile.elev[i]) * f;
}

// Elevation above the horizon for every table row; without a profile the ideal sphere (0°) is the horizon.
export function relativeTable(table, profile) {
  if (!profile) return table;
  const out = { ...table };
  for (const b of BODIES) {
    const { az, el } = table[b];
    out[b] = { az, el: el.map((v, k) => v - horizonAt(profile, az[k])) };
  }
  return out;
}

// Elevation of one sample above the horizon in the body's direction.
export function aboveHorizon(pos, profile) {
  return profile ? pos.el - horizonAt(profile, pos.az) : pos.el;
}

// Share of table rows with any part of the disc (angular radius radiusDeg) above the horizon — the PGDA definition (H9b).
export function visibleShare(table, profile, body, radiusDeg) {
  return discShare(relativeTable(table, profile), body, radiusDeg);
}

// Same share from a table that is already relative to the horizon used (the timeline's one-year caption, item d).
export function discShare(relTable, body, radiusDeg) {
  const el = relTable[body].el;
  return el.length ? el.filter((v) => v + radiusDeg > 0).length / el.length : 0;
}
