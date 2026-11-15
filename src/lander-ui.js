// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// "From the lander" (ADR 0103) inside the 3D surface block: a canvas looking out from the site at eye height, toward Earth
// (or the Sun), with both discs to scale at the chosen time and the LOLA 80 m skyline used for the answers drawn over the
// ground. Drag or arrow keys turn the view. Pure geometry in src/lander.js.
import { fill, escapeHtml as e } from './i18n.js';
import { horizonAt } from './terrain.js';
import { discState } from './disc.js';
import { localGrid, view, dirScreen, discPx, groundPolys, groundSkyline, skylineGap, clamp, wrap360 } from './lander.js';

const BODIES = ['sun', 'earth'];
const prep = new WeakMap(); // map → {grid, gap} (one eye per site: the skyline's observer)

const num = (v, d) => v.toFixed(d).replace('-', '−');

// body = the block's <div>; map + col (relief colours) from the surface block; sc = {site, profile, sample}; radii = disc radii.
export function showLander(body, { t, cfg, map, col, sc, radii, uid, css, dirName, face: start, onFace, onExit }) {
  const L = cfg.lander;
  const profile = sc.profile;
  if (!profile) {
    body.innerHTML = `<p>${e(t('lander.none'))}</p>`;
    return;
  }
  const eyeM = profile.site_height_m + profile.observer_height_m;
  if (!prep.has(map)) {
    const ground = groundSkyline(map, eyeM, L.moon_radius_km, L.gap_az_step_deg, L.gap_km_step);
    prep.set(map, { grid: localGrid(map, eyeM, L.moon_radius_km, L.every_cells), gap: skylineGap(ground, L.gap_az_step_deg, profile) });
  }
  const { grid, gap } = prep.get(map);
  let face = start ?? L.start;
  let yaw = 0;
  let pitch = 0;
  let queued = false;
  let zoom = 1;

  const margin = (b) => sc.sample[b].el - horizonAt(profile, sc.sample[b].az);
  const state = (b) => discState(margin(b), radii[b]);
  const bodyLine = (b) => fill(t('lander.body_line'), {
    body: t(`lander.name.${b}`), az: sc.sample[b].az.toFixed(0), el: num(sc.sample[b].el, 1),
    state: t(`lander.state.${state(b)}`), m: num(margin(b), 1),
  });

  const w = cfg.canvas_width_px;
  const h = Math.round(w * L.aspect);
  const cellM = Math.round(((2 * map.half_width_km) / (map.cells - 1)) * L.every_cells * 1000);
  const gapKey = gap.above > L.gap_note_deg ? 'lander.gap_big' : 'lander.gap_small';
  const btn = (b) => `<button type="button" class="ev-btn" data-face="${b}" aria-pressed="false">${e(t(`lander.face_${b}`))}</button>`;
  body.innerHTML =
    `<div class="ev-btns lander-bar"><button type="button" class="ev-btn lander-exit">${e(t('lander.orbit'))}</button>` +
    `<span class="lander-faces" role="group" aria-label="${e(t('lander.face_label'))}">${btn('earth')}${btn('sun')}</span></div>` +
    `<div class="surf-frame lander-frame"><canvas class="surf-canvas lander-canvas" width="${w}" height="${h}" tabindex="0" role="img" aria-describedby="${uid}-l"></canvas></div>` +
    `<p class="lander-hint">${e(t('lander.drag'))}</p>` +
    `<ul class="map-legend" id="${uid}-l"><li class="key key-sun"></li><li class="key key-earth"></li></ul>` +
    `<p class="map-note">${e(fill(t('lander.intro'), { h: profile.observer_height_m, w: 2 * map.half_width_km, cell: cellM, fov: L.hfov_deg }))}</p>` +
    `<p class="map-note">${e(fill(t('lander.line'), { km: profile.max_distance_km }))}</p>` +
    `<p class="map-note">${e(fill(t(gapKey), { d: Math.max(gap.above, 0).toFixed(1), az: gap.az.toFixed(0), lim: L.gap_note_deg }))}</p>`;
  const canvas = body.querySelector('canvas');
  const g = canvas.getContext('2d');

  function aim(b) {
    face = b;
    onFace?.(b);
    yaw = sc.sample[b].az;
    pitch = clamp(sc.sample[b].el + L.aim_above_deg, L.pitch_min_deg, L.pitch_max_deg);
    for (const x of body.querySelectorAll('[data-face]')) x.setAttribute('aria-pressed', String(x.dataset.face === b));
    later();
  }

  function paint() {
    queued = false;
    const v = view(yaw, pitch, L.hfov_deg, w, h);
    zoom = Math.max(1, w / (canvas.clientWidth || w)); // canvas px per CSS px: text and lines keep their size on phones
    g.fillStyle = css('--sky');
    g.fillRect(0, 0, w, h);
    // Discs first, so the skyline and the ground cover what they hide.
    const at = {};
    for (const b of BODIES) {
      at[b] = dirScreen(sc.sample[b].az, sc.sample[b].el, v);
      if (!at[b]) continue;
      g.beginPath();
      g.arc(...at[b], Math.max(discPx(radii[b], v), 0.75), 0, 2 * Math.PI);
      g.fillStyle = css(b === 'sun' ? '--sun' : '--earth');
      g.fill();
    }
    // Farther terrain: the LOLA profile (out to max_distance_km) as a band down to the bottom edge.
    const line = [];
    const step = profile.azimuth_step_deg;
    for (let a = Math.floor((yaw - 90) / step) * step; a <= yaw + 90; a += step) {
      const p = dirScreen(a, horizonAt(profile, a), v);
      if (p) line.push(p);
    }
    if (line.length > 1) {
      g.beginPath();
      line.forEach((p, k) => g[k ? 'lineTo' : 'moveTo'](...p));
      g.lineTo(line[line.length - 1][0], h + 10);
      g.lineTo(line[0][0], h + 10);
      g.closePath();
      g.fillStyle = css('--ground');
      g.fill();
    }
    // Near ground: the 3D surface's heights, coloured like the 2D map.
    g.lineJoin = 'round';
    g.lineWidth = 1;
    for (const q of groundPolys(grid, v, L.near_km)) {
      g.beginPath();
      q.pts.forEach((p, k) => g[k ? 'lineTo' : 'moveTo'](...p));
      g.closePath();
      g.fillStyle = g.strokeStyle = col[q.i];
      g.fill();
      g.stroke();
    }
    if (line.length > 1) {
      g.beginPath();
      line.forEach((p, k) => g[k ? 'lineTo' : 'moveTo'](...p));
      g.strokeStyle = css('--text');
      g.lineWidth = 1.5 * zoom;
      g.stroke();
    }
    ticks(v);
    for (const b of BODIES) mark(b, at[b], v);
    body.querySelector('.key-sun').textContent = bodyLine('sun');
    body.querySelector('.key-earth').textContent = bodyLine('earth');
    canvas.setAttribute('aria-label', fill(t('lander.aria'), { az: wrap360(yaw).toFixed(0), dir: dirName(wrap360(yaw)), el: num(pitch, 0) }));
  }

  // Compass along the top edge: a label every tick_step_deg (names at the eight main directions).
  function ticks(v) {
    g.font = `600 ${Math.round(12 * zoom)}px system-ui, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'top';
    g.fillStyle = css('--muted');
    g.strokeStyle = css('--muted');
    g.lineWidth = 1;
    const s = L.tick_step_deg;
    for (let a = Math.ceil((yaw - L.hfov_deg) / s) * s; a <= yaw + L.hfov_deg; a += s) {
      const p = dirScreen(a, pitch, v);
      if (!p || p[0] < 18 * zoom || p[0] > w - 18 * zoom) continue;
      const d = wrap360(a);
      g.beginPath();
      g.moveTo(p[0], 0);
      g.lineTo(p[0], 5 * zoom);
      g.stroke();
      g.fillText(d % 45 === 0 ? dirName(d) : `${d}°`, p[0], 7 * zoom);
    }
  }

  // Ring and label at each disc; a dashed ring when part or all of it is below the skyline; an edge label when off screen.
  function mark(b, p, v) {
    const colour = css(b === 'sun' ? '--sun' : '--earth');
    const st = state(b);
    const label = st === 'full' ? t(`lander.name.${b}`) : `${t(`lander.name.${b}`)} · ${t(`lander.tag.${st}`)}`;
    g.font = `600 ${Math.round(13 * zoom)}px system-ui, sans-serif`;
    g.textBaseline = 'middle';
    g.fillStyle = colour;
    if (!p || p[0] < 0 || p[0] > w || p[1] < 0 || p[1] > h) {
      const left = !p ? true : p[0] < w / 2;
      const y = p ? clamp(p[1], 30 * zoom, h - 14 * zoom) : h / 2;
      g.textAlign = left ? 'left' : 'right';
      g.lineWidth = 3 * zoom;
      g.strokeStyle = css('--bg');
      const tx = left ? 6 * zoom : w - 6 * zoom;
      const txt = left ? `‹ ${label}` : `${label} ›`;
      g.strokeText(txt, tx, y);
      g.fillText(txt, tx, y);
      return;
    }
    const r = Math.max(discPx(radii[b], v), 0.75) + 5 * zoom;
    g.setLineDash(st === 'full' ? [] : [3 * zoom, 3 * zoom]);
    g.strokeStyle = colour;
    g.lineWidth = 1.5 * zoom;
    g.beginPath();
    g.arc(...p, r, 0, 2 * Math.PI);
    g.stroke();
    g.setLineDash([]);
    const right = p[0] < w * 0.6;
    g.textAlign = right ? 'left' : 'right';
    const y = clamp(p[1] - r - 8 * zoom, 30 * zoom, h - 12 * zoom);
    g.lineWidth = 3 * zoom;
    g.strokeStyle = css('--bg');
    g.strokeText(label, p[0] + (right ? r : -r), y);
    g.fillText(label, p[0] + (right ? r : -r), y);
  }

  function later() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(paint);
  }

  // Drag: the ground follows the pointer (field of view per CSS px). Touch keeps vertical page scrolling (touch-action pan-y).
  let drag = null;
  canvas.addEventListener('pointerdown', (ev) => {
    drag = { x: ev.clientX, y: ev.clientY, yaw, pitch };
    canvas.setPointerCapture(ev.pointerId);
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (!drag) return;
    const k = (L.hfov_deg / canvas.clientWidth) * L.drag_deg_per_px;
    yaw = wrap360(drag.yaw - (ev.clientX - drag.x) * k);
    pitch = clamp(drag.pitch + (ev.clientY - drag.y) * k, L.pitch_min_deg, L.pitch_max_deg);
    later();
  });
  for (const type of ['pointerup', 'pointercancel']) canvas.addEventListener(type, () => (drag = null));
  canvas.addEventListener('keydown', (ev) => {
    const s = L.key_step_deg;
    const turn = { ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, s], ArrowDown: [0, -s] }[ev.key];
    if (!turn) return;
    ev.preventDefault();
    yaw = wrap360(yaw + turn[0]);
    pitch = clamp(pitch + turn[1], L.pitch_min_deg, L.pitch_max_deg);
    later();
  });
  for (const x of body.querySelectorAll('[data-face]')) x.addEventListener('click', () => aim(x.dataset.face));
  body.querySelector('.lander-exit').addEventListener('click', onExit);
  aim(face);
}
