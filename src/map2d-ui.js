// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Per-card block "Map around the site" (item h): heights from data/map/<site>.json drawn on a canvas, with an SVG
// overlay for the site, terrain skyline points (item j) and the Sun and Earth directions at the chosen time.
// Loaded and drawn only while the block is open.
import { fill, escapeHtml as e } from './i18n.js';
import { cardBlock } from './cardblock.js';
import { relief, pixels, parseColor, edgePoint, skylinePoints } from './map2d.js';

// maps = {siteId: () => Promise<data/map file>}; cfg = config/map2d.json.
export function mountMap(box, { t, cfg, maps }) {
  box.className = 'map2d';
  box.innerHTML =
    `<details class="tech map-box"><summary>${e(t('map.heading'))}</summary><div class="map-body" aria-live="polite"></div></details>`;
  const details = box.querySelector('details');
  const body = box.querySelector('.map-body');
  const cache = new Map(); // siteId → {map, image}
  let ticket = 0;

  const fmt = (v) => `${(+v.toFixed(2))}`;
  const metres = (v) => String(v).replace('-', '−'); // typographic minus, as elsewhere on the page

  function image(map) {
    const css = getComputedStyle(box);
    const rgba = pixels(
      relief(map, { azimuth_deg: cfg.shade_light_azimuth_deg, elevation_deg: cfg.shade_light_elevation_deg }),
      parseColor(css.getPropertyValue('--map-low')),
      parseColor(css.getPropertyValue('--map-high')),
      cfg.shade_strength,
    );
    return new ImageData(rgba, map.cells, map.cells);
  }

  function overlay(map, sc) {
    const h = map.half_width_km;
    const pt = (p) => `${fmt(p.x)},${fmt(-p.y)}`;
    const ray = (b) => {
      const end = edgePoint(sc.sample[b].az, h);
      return `<line class="map-ray map-ray-${b}${sc.up[b] ? '' : ' is-down'}" x1="0" y1="0" x2="${fmt(end.x)}" y2="${fmt(-end.y)}"/>`;
    };
    const sky = sc.profile ? skylinePoints(sc.profile, cfg.skyline_every_deg, h) : [];
    const bar = cfg.scale_bar_km;
    const by = h * 0.88;
    return (
      `<svg class="map-svg" viewBox="${-h} ${-h} ${2 * h} ${2 * h}" aria-hidden="true">` +
      sky.map((p) => `<circle class="map-sky" cx="${fmt(p.x)}" cy="${fmt(-p.y)}" r="${fmt(h / 120)}"/>`).join('') +
      ray('sun') + ray('earth') +
      `<circle class="map-site" cx="0" cy="0" r="${fmt(h / 40)}"/>` +
      `<line class="map-bar" x1="${fmt(-h * 0.92)}" y1="${fmt(by)}" x2="${fmt(-h * 0.92 + bar)}" y2="${fmt(by)}"/>` +
      `</svg>` +
      `<span class="map-north">${e(t('map.north'))}</span>` +
      `<span class="map-bar-label" style="width:${fmt((bar / (2 * h)) * 100)}%">${e(fill(t('map.scale'), { km: bar }))}</span>`
    );
  }

  function html(map, sc) {
    const w = 2 * map.half_width_km;
    const azText = (b) => fill(t(`map.dir_${b}`), { az: sc.sample[b].az.toFixed(0) });
    return (
      `<p>${e(fill(t('map.intro'), { w }))}</p>` +
      `<div class="map-frame" role="img" aria-label="${e(fill(t('map.aria'), { w, sun: azText('sun'), earth: azText('earth') }))}">` +
      `<canvas class="map-canvas" width="${map.cells}" height="${map.cells}"></canvas>${overlay(map, sc)}</div>` +
      `<ul class="map-legend"><li class="key key-site">${e(t('map.site'))}</li>` +
      `<li class="key key-skyline">${e(t('map.skyline'))}</li>` +
      `<li class="key key-sun">${e(azText('sun'))}</li><li class="key key-earth">${e(azText('earth'))}</li></ul>` +
      `<p class="map-note">${e(t('map.dashed'))}</p>` +
      `<p class="map-note">${e(fill(t('map.heights'), { min: metres(map.min_m), max: metres(map.max_m), site: metres(map.height_m[(map.cells * map.cells - 1) / 2]) }))}</p>` +
      `<p class="map-note">${e(t('map.shading'))}</p>`
    );
  }

  async function render() {
    const sc = block.sc;
    if (!sc || !details.open) return;
    const mine = ++ticket;
    const load = sc.site.custom ? null : maps[sc.site.id];
    if (!load) {
      body.innerHTML = `<p>${e(t(sc.site.custom ? 'map.none_custom' : 'map.none'))}</p>`;
      return;
    }
    if (!cache.has(sc.site.id)) body.innerHTML = `<p class="note">${e(t('state.loading'))}</p>`;
    try {
      if (!cache.has(sc.site.id)) {
        const map = await load();
        cache.set(sc.site.id, { map, img: image(map) });
      }
      if (mine !== ticket) return;
      const { map, img } = cache.get(sc.site.id);
      body.innerHTML = html(map, sc);
      body.querySelector('canvas').getContext('2d').putImageData(img, 0, 0);
    } catch {
      if (mine === ticket) body.innerHTML = `<p class="note note-warn">${e(t('state.load_error'))}</p>`;
    }
  }

  const block = cardBlock(box, details, render, () => ticket++);
  return block;
}
