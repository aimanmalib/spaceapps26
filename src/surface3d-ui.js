// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Per-card block "Surface around the site (3D)" (item i): the heights of data/map/<site>.json drawn on a canvas as a
// tilted surface that the reader turns with a slider, plus the site and the Sun and Earth directions at the chosen time.
// Loaded and drawn only while the block is open. Colours and shading are the 2D map's (src/map2d.js).
import { fill, escapeHtml as e } from './i18n.js';
import { cardBlock } from './cardblock.js';
import { relief, pixels, parseColor } from './map2d.js';
import { camera, project, frame, quads, rayEnd } from './surface3d.js';

// maps = {siteId: () => Promise<data/map file>}; cfg = config/surface3d.json; light = config/map2d.json (same shading).
export function mountSurface(box, { t, cfg, light, maps, uid }) {
  box.className = 'surface3d';
  box.innerHTML =
    `<details class="tech surf-box"><summary>${e(t('surface.heading'))}</summary><div class="surf-body"></div></details>`;
  const details = box.querySelector('details');
  const body = box.querySelector('.surf-body');
  const cache = new Map(); // siteId → {map, colours}
  let look = cfg.look_default_deg;
  let ticket = 0;

  const css = (name) => getComputedStyle(box).getPropertyValue(name).trim();
  const dirName = (deg) => t(`surface.dir.${(Math.round(deg / 45) * 45) % 360}`);
  const lineText = (sc, b) => fill(t(`surface.dir_${b}`), { az: sc.sample[b].az.toFixed(0), el: sc.sample[b].el.toFixed(1).replace('-', '−') });

  function colours(map) {
    const rgba = pixels(
      relief(map, { azimuth_deg: light.shade_light_azimuth_deg, elevation_deg: light.shade_light_elevation_deg }),
      parseColor(css('--map-low')),
      parseColor(css('--map-high')),
      light.shade_strength,
    );
    const out = new Array(map.cells * map.cells);
    for (let i = 0; i < out.length; i++) out[i] = `rgb(${rgba[i * 4]},${rgba[i * 4 + 1]},${rgba[i * 4 + 2]})`;
    return out;
  }

  // Draw the surface, the site and the two direction lines; returns nothing (canvas only).
  function paint(canvas, map, col, sc) {
    const ex = cfg.exaggeration;
    const cam = camera(look, cfg.tilt_deg);
    const h = map.half_width_km;
    const f = frame(h, (map.min_m / 1000) * ex, (map.max_m / 1000) * ex, cam);
    const w = cfg.canvas_width_px;
    const k = w / (f.right - f.left);
    canvas.width = w;
    canvas.height = Math.ceil((f.top - f.bottom) * k);
    const px = (p) => [(p.sx - f.left) * k, (f.top - p.sy) * k];
    const g = canvas.getContext('2d');
    g.lineJoin = 'round';
    g.lineWidth = 1;
    for (const q of quads(map, cfg.every_cells, ex, cam)) {
      g.beginPath();
      q.pts.forEach((p, j) => g[j ? 'lineTo' : 'moveTo'](...px(p)));
      g.closePath();
      g.fillStyle = g.strokeStyle = col[q.i];
      g.fill();
      g.stroke(); // closes hairline gaps between neighbouring quads
    }
    const z0 = (map.height_m[(map.cells * map.cells - 1) / 2] / 1000) * ex;
    const site = px(project(0, 0, z0, cam));
    g.lineCap = 'round';
    g.lineWidth = 3;
    for (const b of ['sun', 'earth']) {
      const end = rayEnd(0, 0, z0, sc.sample[b].az, sc.sample[b].el, cfg.ray_km, ex);
      g.setLineDash(sc.up[b] ? [] : [8, 7]);
      g.strokeStyle = css(b === 'sun' ? '--sun' : '--earth');
      g.beginPath();
      g.moveTo(...site);
      g.lineTo(...px(project(end.x, end.y, end.z, cam)));
      g.stroke();
    }
    g.setLineDash([]);
    g.beginPath();
    g.arc(...site, 6, 0, 2 * Math.PI);
    g.fillStyle = css('--text');
    g.strokeStyle = css('--bg');
    g.lineWidth = 2;
    g.fill();
    g.stroke();
  }

  function html(map, sc) {
    const w = 2 * map.half_width_km;
    return (
      `<p>${e(fill(t('surface.intro'), { w, x: cfg.exaggeration }))}</p>` +
      `<label class="surf-turn" for="${uid}">${e(t('surface.turn'))} <output class="surf-value"></output></label>` +
      `<input id="${uid}" class="surf-range" type="range" min="0" max="${360 - cfg.look_step_deg}" step="${cfg.look_step_deg}" value="${look}">` +
      `<div class="surf-frame"><canvas class="surf-canvas" role="img"></canvas></div>` +
      `<ul class="map-legend"><li class="key key-site">${e(t('surface.site'))}</li>` +
      `<li class="key key-sun">${e(lineText(sc, 'sun'))}</li><li class="key key-earth">${e(lineText(sc, 'earth'))}</li></ul>` +
      `<p class="map-note">${e(t('surface.stretch'))}</p>` +
      `<p class="map-note">${e(t('surface.shading'))}</p>`
    );
  }

  function redraw(map, col, sc) {
    const canvas = body.querySelector('canvas');
    paint(canvas, map, col, sc);
    body.querySelector('.surf-value').textContent = fill(t('surface.turn_value'), { deg: look, dir: dirName(look) });
    canvas.setAttribute('aria-label', fill(t('surface.aria'), {
      w: 2 * map.half_width_km, deg: look, sun: lineText(sc, 'sun'), earth: lineText(sc, 'earth'),
    }));
  }

  async function render() {
    const sc = block.sc;
    if (!sc || !details.open) return;
    const mine = ++ticket;
    const load = sc.site.custom ? null : maps[sc.site.id];
    if (!load) {
      body.innerHTML = `<p>${e(t(sc.site.custom ? 'surface.none_custom' : 'surface.none'))}</p>`;
      return;
    }
    if (!cache.has(sc.site.id)) body.innerHTML = `<p class="note">${e(t('state.loading'))}</p>`;
    try {
      if (!cache.has(sc.site.id)) {
        const map = await load();
        cache.set(sc.site.id, { map, col: colours(map) });
      }
      if (mine !== ticket) return;
      const { map, col } = cache.get(sc.site.id);
      body.innerHTML = html(map, sc);
      body.querySelector('.surf-range').addEventListener('input', (ev) => {
        look = +ev.target.value;
        redraw(map, col, sc);
      });
      redraw(map, col, sc);
    } catch {
      if (mine === ticket) body.innerHTML = `<p class="note note-warn">${e(t('state.load_error'))}</p>`;
    }
  }

  const block = cardBlock(box, details, render, () => ticket++);
  return block;
}
