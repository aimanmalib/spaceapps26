// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Terrain horizon for own coordinates (ADR 0106), main-thread side: decides whether a point needs the coarse LOLA grids
// (config/terrain-own.json lat_max), starts the Web Worker only then, and keeps one profile per point.
import { inTerrainArea } from './terrain-own.js';

// → {inArea(site), ready(), profile(site) → Promise<profile | null>}. baseHref resolves data/terrain/* (relative build).
export function makeTerrainOwn(terrainCfg, horizonCfg, makeWorker, baseHref) {
  const cache = new Map();
  const waiting = new Map();
  const urls = terrainCfg.grids.map((g) => new URL(`data/${g.file}`, baseHref).href);
  let worker = null;
  let next = 0;
  let loaded = false;
  function start() {
    worker = makeWorker();
    worker.onmessage = ({ data }) => {
      const w = waiting.get(data.id);
      waiting.delete(data.id);
      if (data.error) w?.reject(new Error(data.error));
      else {
        loaded = true;
        w?.resolve(data.profile);
      }
    };
    worker.onerror = () => {
      for (const w of waiting.values()) w.reject(new Error('worker'));
      waiting.clear();
      worker = null;
    };
  }
  const inArea = (site) => inTerrainArea(site.lat, terrainCfg);
  return {
    inArea,
    ready: () => loaded,
    profile(site) {
      if (!inArea(site)) return Promise.resolve(null);
      const key = `${site.lat},${site.lon_east}`;
      if (!cache.has(key)) {
        if (!worker) start();
        const id = ++next;
        const p = new Promise((resolve, reject) => waiting.set(id, { resolve, reject }));
        p.catch(() => cache.delete(key));
        worker.postMessage({ id, site: { lat: site.lat, lon_east: site.lon_east }, urls, terrain: terrainCfg, horizon: horizonCfg });
        cache.set(key, p);
        if (cache.size > terrainCfg.cache_profiles) cache.delete(cache.keys().next().value);
      }
      return cache.get(key);
    },
  };
}
