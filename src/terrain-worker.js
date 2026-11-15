// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Terrain horizon for own coordinates (ADR 0106) off the main thread: loads the coarse LOLA grids once (browser HTTP
// cache across visits), then casts the rays of scripts/horizon.py (src/terrain-own.js) for each requested point.
import { makeGrid, terrainProfile, siteGridM } from './terrain-own.js';

let grids = null;

function load(msg) {
  if (!grids) {
    grids = Promise.all(
      msg.terrain.grids.map(async (g, i) => {
        const res = await fetch(msg.urls[i]);
        if (!res.ok) throw new Error(`${g.name}: HTTP ${res.status}`);
        return makeGrid(g, msg.horizon.moon_radius_m, new Int16Array(await res.arrayBuffer()));
      }),
    );
    grids.catch(() => (grids = null)); // a failed download is tried again on the next point
  }
  return grids;
}

self.onmessage = async ({ data }) => {
  try {
    const g = await load(data);
    const p = terrainProfile(data.horizon, g, data.site.lat, data.site.lon_east);
    const profile = p && { ...p, ownTerrain: true, grid_m: siteGridM(data.terrain.grids, g, data.site.lat, data.site.lon_east) };
    self.postMessage({ id: data.id, profile });
  } catch (err) {
    self.postMessage({ id: data.id, error: String(err) });
  }
};
