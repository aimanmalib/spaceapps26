// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Terrain horizon for own coordinates (ADR 0106): the ray method of scripts/horizon.py, in JavaScript, on the coarse LOLA
// grids written by scripts/terrain_coarse.py (data/terrain/). Ray settings come from config/horizon.json, grids from
// config/terrain-own.json. Pure functions: the Web Worker (src/terrain-worker.js) and scripts/terrain_gate.mjs share them.

const RAD = Math.PI / 180;

// One polar stereographic grid: spec from config/terrain-own.json, heights = Int16Array (DN, little-endian on disk).
export function makeGrid(spec, radiusM, heights) {
  if (heights.length !== spec.size * spec.size) throw new Error(`${spec.name}: ${heights.length} samples, expected ${spec.size ** 2}`);
  return { name: spec.name, size: spec.size, offset: spec.offset_px, dn: spec.dn_scale_m, k: (2 * radiusM) / spec.scale_m, h: heights };
}

// Bilinear height (m) above the reference sphere at the unit vector (x, y, z), or null outside the grid.
export function gridHeight(g, x, y, z) {
  const f = g.k / (1 - z);
  const row = g.offset - x * f;
  const col = g.offset + y * f;
  const r0 = Math.floor(row);
  const c0 = Math.floor(col);
  const n = g.size;
  if (r0 < 0 || c0 < 0 || r0 >= n - 1 || c0 >= n - 1) return null;
  const fr = row - r0;
  const fc = col - c0;
  const i = r0 * n + c0;
  const h = g.h;
  const top = h[i] + (h[i + 1] - h[i]) * fc;
  const bot = h[i + n] + (h[i + n + 1] - h[i + n]) * fc;
  return (top + (bot - top) * fr) * g.dn;
}

// Height from the finest grid that covers the point (grids finest first), or null.
function sample(grids, x, y, z) {
  for (const g of grids) {
    const v = gridHeight(g, x, y, z);
    if (v !== null) return v;
  }
  return null;
}

// Ray distances (m): fixed first step, then growing with distance (same as horizon.py steps()).
export function steps(cfg) {
  const first = cfg.first_step_m;
  const end = cfg.max_distance_km * 1000;
  const out = [];
  for (let s = first; s <= end; s += Math.max(first, s * cfg.step_fraction)) out.push(s);
  return out;
}

// Inside the coarse grids' area (own points at or south of lat_max).
export function inTerrainArea(lat, terrainCfg) {
  return lat <= terrainCfg.lat_max;
}

// Skyline elevation (deg) per azimuth step from the site, like horizon.py profile(); null if the site is outside every grid.
export function terrainProfile(cfg, grids, lat, lon) {
  const radius = cfg.moon_radius_m;
  const la = lat * RAD;
  const lo = lon * RAD;
  const ux = Math.cos(la) * Math.cos(lo);
  const uy = Math.cos(la) * Math.sin(lo);
  const uz = Math.sin(la);
  const h0 = sample(grids, ux, uy, uz);
  if (h0 === null) return null;
  const rObs = radius + h0 + cfg.observer_height_m;
  const nx = -Math.sin(la) * Math.cos(lo);
  const ny = -Math.sin(la) * Math.sin(lo);
  const nz = Math.cos(la);
  const ex = -Math.sin(lo);
  const ey = Math.cos(lo);
  const dist = steps(cfg);
  const cosS = dist.map((s) => Math.cos(s / radius));
  const sinS = dist.map((s) => Math.sin(s / radius));
  const omc = dist.map((s) => 2 * Math.sin(s / radius / 2) ** 2);
  const nAz = Math.round(360 / cfg.azimuth_step_deg);
  const elev = new Array(nAz);
  for (let i = 0; i < nAz; i++) {
    const az = i * cfg.azimuth_step_deg * RAD;
    const ca = Math.cos(az);
    const sa = Math.sin(az);
    const tx = ca * nx + sa * ex;
    const ty = ca * ny + sa * ey;
    const tz = ca * nz;
    let best = -1;
    for (let k = 0; k < dist.length; k++) {
      const c = cosS[k];
      const sn = sinS[k];
      const h = sample(grids, c * ux + sn * tx, c * uy + sn * ty, c * uz + sn * tz);
      if (h === null) break;
      const a = radius + h;
      const up = a - rObs - a * omc[k];
      const sinEl = up / Math.sqrt((a - rObs) ** 2 + 2 * a * rObs * omc[k]);
      if (sinEl > best) best = sinEl;
    }
    elev[i] = best > -1 ? Math.asin(best) / RAD : -90;
  }
  return { elev, azimuth_step_deg: cfg.azimuth_step_deg, observer_height_m: cfg.observer_height_m, site_height_m: h0 };
}

// Grid used at the site (finest that covers it) → its cell size in m; null outside every grid.
export function siteGridM(specs, grids, lat, lon) {
  const la = lat * RAD;
  const lo = lon * RAD;
  const x = Math.cos(la) * Math.cos(lo);
  const y = Math.cos(la) * Math.sin(lo);
  const z = Math.sin(la);
  const i = grids.findIndex((g) => gridHeight(g, x, y, z) !== null);
  return i < 0 ? null : specs[i].scale_m;
}

// Text values from data/terrain/gate.json (scripts/terrain_gate.mjs) for the labels: gate, sites passing, lowest site.
export function gateValues(gate, terrainCfg, siteNames = {}) {
  const name = (id) => (siteNames[id] ?? id).split(' (')[0]; // short form: no bracket part
  const low = gate.sites.reduce((a, b) => (b.both_same_pct < a.both_same_pct ? b : a), gate.sites[0]);
  const mb = terrainCfg.grids.reduce((s, g) => s + g.size * g.size * 2, 0) / 1e6;
  return {
    gate: gate.gate_pct,
    pass: gate.sites.filter((s) => s.pass).length,
    total: gate.sites.length,
    lowSite: name(low.site),
    lowPct: low.both_same_pct,
    terrainLat: String(-terrainCfg.lat_max),
    mb: mb.toFixed(1),
    fine: terrainCfg.grids[0].scale_m,
    coarse: terrainCfg.grids[terrainCfg.grids.length - 1].scale_m,
    list: gate.sites.map((s) => `${name(s.site)} ${s.both_same_pct} %`).join('; '),
    fineLat: String(-terrainCfg.grids[0].max_lat),
  };
}
