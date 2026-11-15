// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Earth view block (P4v), right under the two answers on cards with a LOLA terrain skyline: a to-scale sky window
// toward Earth (or the Sun) with buttons for the site and the nearby points of data/shift/ (item l).
import { fill, escapeHtml as e } from './i18n.js';
import { sampleAt, formatUtc } from './ephem.js';
import { discState, discRadii } from './disc.js';
import { earthViewSvg } from './earthview.js';

// ev = {cfg: config/earthview.json, dirs: config/shifts.json, places: {siteId: () => Promise<data/shift file>}, engine}.
export function mountEarthView(box, { t, view, ev, uid }) {
  const { cfg } = ev;
  const radii = discRadii(view);
  const points = ['site', ...ev.dirs.directions.map((d) => d.id)];
  const km = ev.dirs.location_offset_km;
  const name = (p) => (p === 'site' ? t('ev.at_site') : fill(t('shift.place'), { km, dir: t(`shift.dir.${p}`) }));
  const btn = (group, value, label, on) =>
    `<button type="button" class="ev-btn" data-${group}="${value}" aria-pressed="${on}">${e(label)}</button>`;
  const state = { body: cfg.bodies[0], point: 'site', sc: null };
  let ticket = 0;

  box.className = 'card-ev ev';
  box.innerHTML =
    `<h4 class="ev-title" id="${uid}-h"></h4>` +
    `<div class="ev-plot" role="img" aria-labelledby="${uid}-h ${uid}-s"></div>` +
    `<p class="ev-sentence" id="${uid}-s" aria-live="polite"></p>` +
    `<div class="ev-btns" role="group" aria-label="${e(t('ev.points_label'))}">${points.map((p, i) => btn('point', p, name(p), i === 0)).join('')}</div>` +
    (cfg.bodies.length > 1
      ? `<div class="ev-btns ev-bodies" role="group" aria-label="${e(t('ev.bodies_label'))}">${cfg.bodies.map((b, i) => btn('body', b, t(`ev.toward.${b}`), i === 0)).join('')}</div>`
      : '') +
    `<p class="ev-caption"></p>`;
  const plot = box.querySelector('.ev-plot');
  const title = box.querySelector('.ev-title');
  const sentence = box.querySelector('.ev-sentence');
  const caption = box.querySelector('.ev-caption');

  box.addEventListener('click', (ev2) => {
    const b = ev2.target.closest('.ev-btn');
    if (!b) return;
    if (b.dataset.point) state.point = b.dataset.point;
    if (b.dataset.body) state.body = b.dataset.body;
    for (const x of box.querySelectorAll('.ev-btn')) x.setAttribute('aria-pressed', String(x.dataset.point === state.point || x.dataset.body === state.body));
    render();
  });

  // Skyline + body position for the chosen point: the site (Horizons angles, data/horizon) or a nearby point
  // (data/shift skyline, angles from the in-browser engine, as in the small-shifts table).
  async function where(sc) {
    if (state.point === 'site') return { profile: sc.profile, pos: sc.sample[state.body] };
    const file = await ev.places[sc.site.id]();
    const p = file.points.find((q) => q.dir === state.point);
    const table = await ev.engine({ lat: p.lat, lon_east: p.lon_east }, sc.ms);
    const sample = sampleAt(table, sc.ms);
    return sample ? { profile: { elev: p.elev, azimuth_step_deg: file.azimuth_step_deg }, pos: sample[state.body] } : null;
  }

  async function render() {
    const sc = state.sc;
    if (!sc) return;
    const mine = ++ticket;
    const body = state.body;
    title.textContent = fill(t('ev.title'), { body: t(`sky.${body}`), place: name(state.point) });
    if (state.point !== 'site') sentence.textContent = t('shift.place_computing');
    let got;
    try {
      got = await where(sc);
    } catch {
      got = undefined;
    }
    if (mine !== ticket) return;
    if (!got) {
      plot.innerHTML = '';
      sentence.textContent = t(got === null ? 'shift.out' : 'shift.place_error');
      return;
    }
    const r = radii[body];
    const { svg, margin } = earthViewSvg({ body, pos: got.pos, profile: got.profile, radius: r, cfg });
    plot.innerHTML = svg;
    const d = view.decimals;
    sentence.textContent = fill(t('ev.sentence'), {
      place: name(state.point),
      body: t(`sky.${body}`),
      deg: Math.abs(margin).toFixed(d),
      dir: t(margin > 0 ? 'answer.above' : 'answer.below'),
      disc: fill(t(`disc.${body}.${discState(margin, r)}`), { line: t('disc.line_terrain') }),
    });
    caption.textContent = fill(t('ev.caption'), {
      body: t(`sky.${body}`),
      az: got.pos.az.toFixed(d),
      time: formatUtc(sc.ms).replace('T', ' '),
      w: cfg.width_deg,
      diam: (2 * r).toFixed(1),
      grid: (/_(\d+)m$/.exec(sc.profile.site_dem ?? '') ?? [])[1] ?? '—',
      step: got.profile.azimuth_step_deg,
    });
  }

  return {
    draw(sc) {
      state.sc = sc;
      // Nearby-point buttons only where data/shift/ has that site; otherwise the view stays at the site.
      const near = !!ev.places[sc.site.id];
      if (!near) state.point = 'site';
      for (const x of box.querySelectorAll('[data-point]')) {
        x.hidden = !near && x.dataset.point !== 'site';
        x.setAttribute('aria-pressed', String(x.dataset.point === state.point));
      }
      box.hidden = false;
      render();
    },
    hide() {
      state.sc = null;
      ticket++;
      box.hidden = true;
    },
  };
}
