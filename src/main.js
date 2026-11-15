// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
import sitesConfig from '../config/sites.json';
import view from '../config/view.json';
import features from '../config/features.json';
import customCfg from '../config/custom.json';
import eph from '../config/ephemeris.json';
import shiftsCfg from '../config/shifts.json';
import evCfg from '../config/earthview.json';
import meCfg from '../config/moon-earth.json';
import mapCfg from '../config/map2d.json';
import surfCfg from '../config/surface3d.json';
import vcfg from '../config/validation.json';
import metricsCfg from '../config/metrics.json';
import yearsCfg from '../config/years.json';
import yearsCheck from '../data/validation-years.json';
import { initPage } from './page.js';
import { mountCompare } from './compare.js';
import { makeCustomTables } from './custom.js';
import { decodeScenarios } from './share.js';
import { parseUtc } from './ephem.js';
import { trustHtml } from './trust.js';
import presetsCfg from '../config/presets.json';
import { loadTable } from './data.js';
import { makeYears, checkPassed } from './years.js';

const { t } = initPage();

const root = document.getElementById('compare');
// Terrain skylines (item j) exist only for sites inside the LOLA polar grids; each loads on first use.
const horizons = Object.fromEntries(
  Object.entries(import.meta.glob('../data/horizon/*.json', { import: 'default' })).map(([path, load]) => [path.split('/').pop().replace('.json', ''), load]),
);
// Sun/Earth tables for any point (own coordinates, item b; nearby points, item l): computed in a Web Worker with
// Astronomy Engine, loaded only when first used.
// Terrain range (ADR 0041): lowest and highest skyline around each terrain site (data/band/), loaded with the skyline.
const bands = Object.fromEntries(
  Object.entries(import.meta.glob('../data/band/*.json', { import: 'default' })).map(([path, load]) => [path.split('/').pop().replace('.json', ''), load]),
);
const items = features.items;
const engine = items.b_custom_coordinates || items.l_small_shifts
  ? makeCustomTables(customCfg, eph, () => new Worker(new URL('./moonsky-worker.js', import.meta.url), { type: 'module' }))
  : null;
// Later dates (ADR 0104): past the frozen Horizons tables the same engine computes every site's angles (src/years.js).
const years = engine ? { ...makeYears({ eph, cfg: yearsCfg, frozen: (id) => loadTable(view.data_path, id), engine }), checked: checkPassed(yearsCheck.summary, yearsCfg.check.max_diff_deg) } : null;
const nearby = years ? years.engineAt : engine;
const custom = items.b_custom_coordinates ? { cfg: customCfg, tables: engine } : null;
// Small shifts (item l): terrain horizons of points near each terrain site (data/shift/), loaded on first use.
const places = Object.fromEntries(
  Object.entries(import.meta.glob('../data/shift/*.json', { import: 'default' })).map(([path, load]) => [path.split('/').pop().replace('.json', ''), load]),
);
// Over the whole year (P4u): hour shares at each terrain site and its nearby points (data/shift-year/, scripts/shift_year.mjs).
const year = () => import('../data/shift-year/shift-year.json').then((m) => m.default);
const shifts = items.l_small_shifts ? { cfg: shiftsCfg, places, year, engine: nearby, radiusKm: customCfg.moon_radius_km } : null;
// 2D map (item h): heights around each terrain site (data/map/), loaded on first use.
const maps = Object.fromEntries(
  Object.entries(import.meta.glob('../data/map/*.json', { import: 'default' })).map(([path, load]) => [path.split('/').pop().replace('.json', ''), load]),
);
// Map layer "Average sunlight (NASA PGDA)" (P4k): NASA's values on the same cells (data/map-sunlight/), loaded with the map.
const sun = Object.fromEntries(
  Object.entries(import.meta.glob('../data/map-sunlight/*.json', { import: 'default' })).map(([path, load]) => [path.split('/').pop().replace('.json', ''), load]),
);
const map = items.h_map_2d ? { cfg: mapCfg, maps, sun } : null;
// 3D surface (item i): the same heights, turned and tilted.
const surface = items.i_surface_3d ? { cfg: surfCfg, light: mapCfg, maps, radii: view.timeline.year.disc_radius_deg } : null;
// Shareable link: scenarios from the address (src/share.js); "Now" works inside the frozen tables' date range.
const shared = decodeScenarios(location.search, { cfg: view.share, siteIds: new Set(sitesConfig.sites.map((s) => s.id)), max: view.max_scenarios, custom: custom?.cfg });
const share = { cfg: view.share, range: years?.range ?? { startMs: parseUtc(eph.start), endMs: parseUtc(eph.stop) }, ...shared };
// Earth view (P4v): to-scale window toward Earth/Sun on terrain cards; nearby points reuse item l's data and engine.
const earthview = items.j_terrain_horizon && engine ? { cfg: evCfg, dirs: shiftsCfg, places, engine: nearby } : null;
if (root) mountCompare(root, { t, sites: sitesConfig.sites, view, horizons, bands, features: items, custom, shifts, me: items.k_moon_vs_earth ? meCfg : null, map, surface, share, earthview, presets: { box: document.querySelector('.presets'), list: presetsCfg.presets }, metrics: metricsCfg, years });
// One line of measured validation numbers under the verdicts (P4v), loaded after the cards; left empty if it fails.
const trust = root?.querySelector('.trust');
if (trust) import('../data/validation.json').then(({ default: v }) => (trust.innerHTML = trustHtml(t, v, vcfg.decimals_report, './validation.html'))).catch(() => {});
