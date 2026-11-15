// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
import sitesConfig from '../config/sites.json';
import view from '../config/view.json';
import features from '../config/features.json';
import customCfg from '../config/custom.json';
import eph from '../config/ephemeris.json';
import shiftsCfg from '../config/shifts.json';
import meCfg from '../config/moon-earth.json';
import mapCfg from '../config/map2d.json';
import surfCfg from '../config/surface3d.json';
import { initPage } from './page.js';
import { mountCompare } from './compare.js';
import { makeCustomTables } from './custom.js';
import { decodeScenarios } from './share.js';
import { parseUtc } from './ephem.js';

const { t } = initPage();

const root = document.getElementById('compare');
// Terrain skylines (item j) exist only for sites inside the LOLA polar grids; each loads on first use.
const horizons = Object.fromEntries(
  Object.entries(import.meta.glob('../data/horizon/*.json', { import: 'default' })).map(([path, load]) => [path.split('/').pop().replace('.json', ''), load]),
);
// Sun/Earth tables for any point (own coordinates, item b; nearby points, item l): computed in a Web Worker with
// Astronomy Engine, loaded only when first used.
const items = features.items;
const engine = items.b_custom_coordinates || items.l_small_shifts
  ? makeCustomTables(customCfg, eph, () => new Worker(new URL('./moonsky-worker.js', import.meta.url), { type: 'module' }))
  : null;
const custom = items.b_custom_coordinates ? { cfg: customCfg, tables: engine } : null;
// Small shifts (item l): terrain horizons of points near each terrain site (data/shift/), loaded on first use.
const places = Object.fromEntries(
  Object.entries(import.meta.glob('../data/shift/*.json', { import: 'default' })).map(([path, load]) => [path.split('/').pop().replace('.json', ''), load]),
);
// Over the whole year (P4u): hour shares at each terrain site and its nearby points (data/shift-year/, scripts/shift_year.mjs).
const year = () => import('../data/shift-year/shift-year.json').then((m) => m.default);
const shifts = items.l_small_shifts ? { cfg: shiftsCfg, places, year, engine, radiusKm: customCfg.moon_radius_km } : null;
// 2D map (item h): heights around each terrain site (data/map/), loaded on first use.
const maps = Object.fromEntries(
  Object.entries(import.meta.glob('../data/map/*.json', { import: 'default' })).map(([path, load]) => [path.split('/').pop().replace('.json', ''), load]),
);
const map = items.h_map_2d ? { cfg: mapCfg, maps } : null;
// 3D surface (item i): the same heights, turned and tilted.
const surface = items.i_surface_3d ? { cfg: surfCfg, light: mapCfg, maps } : null;
// Shareable link: scenarios from the address (src/share.js); "Now" works inside the frozen tables' date range.
const shared = decodeScenarios(location.search, { cfg: view.share, siteIds: new Set(sitesConfig.sites.map((s) => s.id)), max: view.max_scenarios, custom: custom?.cfg });
const share = { cfg: view.share, range: { startMs: parseUtc(eph.start), endMs: parseUtc(eph.stop) }, ...shared };
if (root) mountCompare(root, { t, sites: sitesConfig.sites, view, horizons, features: items, custom, shifts, me: items.k_moon_vs_earth ? meCfg : null, map, surface, share });
