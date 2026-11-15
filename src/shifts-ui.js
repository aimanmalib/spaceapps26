// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Per-card "small shifts" block (item l). Built once per card; the table is redrawn when the scenario changes
// and only while the block is open (nearby points need their Sun/Earth tables computed in the browser).
import { fill, escapeHtml as e } from './i18n.js';
import { cardBlock } from './cardblock.js';
import { duration, signedDeg } from './facts.js';
import { judge, timeRows, placeRows, changedCount, sphereTiltDeg, yearRows } from './shifts.js';

const HOUR = 3_600_000;

// shifts = {cfg: config/shifts.json, places: {siteId: () => Promise<data/shift file>}, engine: site → Promise<table>, radiusKm}.
export function mountShifts(box, { t, view, shifts }) {
  const { cfg } = shifts;
  box.className = 'shifts';
  box.innerHTML =
    `<details class="tech shifts-box"><summary>${e(t('shift.heading'))}</summary>` +
    `<p>${e(fill(t('shift.intro'), { km: cfg.location_offset_km }))}</p><div class="shifts-body" aria-live="polite"></div></details>`;
  const details = box.querySelector('details');
  const body = box.querySelector('.shifts-body');
  let ticket = 0;

  const label = (r) => {
    if (r.kind === 'place') return fill(t('shift.place'), { km: cfg.location_offset_km, dir: t(`shift.dir.${r.dir}`) });
    return fill(t(r.hours < 0 ? 'shift.earlier' : 'shift.later'), { dur: duration(t, Math.abs(r.hours) * HOUR) });
  };
  const cell = (a) =>
    `<td class="${a.up ? 'is-up' : 'is-down'}"><span class="shift-ans">${e(t(a.up ? 'shift.yes' : 'shift.no'))}</span> ` +
    `<span class="shift-num">${e(signedDeg(a.margin, view.decimals))}</span></td>`;
  const row = (name, a, cls = '') =>
    `<tr class="${cls}"><th scope="row">${e(name)}</th>` +
    (a ? cell(a.sun) + cell(a.earth) : `<td colspan="2">${e(t('shift.out'))}</td>`) + `</tr>`;

  function html(base, rows, placeNote) {
    const n = rows.filter((r) => r.answers).length;
    return (
      `<table class="tech-table shift-table"><thead><tr><th scope="col">${e(t('shift.col.shift'))}</th>` +
      `<th scope="col">${e(t('shift.col.sun'))}</th><th scope="col">${e(t('shift.col.earth'))}</th></tr></thead><tbody>` +
      row(t('shift.chosen'), base, 'shift-base') + rows.map((r) => row(label(r), r.answers)).join('') + `</tbody></table>` +
      `<p class="shift-sum">${e(fill(t('shift.changed'), { n: changedCount(base, rows), total: n }))}</p>` +
      `<p>${e(placeNote)}</p>`
    );
  }

  // Over the whole year (P4u): second small table + one generated sentence, from data/shift-year/ (terrain sites only).
  const pct = (v) => `${(v * 100).toFixed(1)}\u00a0%`;
  function yearHtml(entry, period) {
    const { rows, far } = yearRows(entry);
    const name = (r) => (r.dir ? fill(t('shift.place'), { km: cfg.location_offset_km, dir: t(`shift.dir.${r.dir}`) }) : t('shift.year_here'));
    const body = rows.map((r, i) => `<tr class="${i ? '' : 'shift-base'}"><th scope="row">${e(name(r))}</th><td>${pct(r.sun)}</td><td>${pct(r.earth)}</td></tr>`).join('');
    const sentence = fill(t('shift.year_sentence'), { earth: pct(entry.centre.earth), far: pct(far.earth), sun: pct(entry.centre.sun), farsun: pct(far.sun), km: cfg.location_offset_km, dir: t(`shift.dir.${far.dir}`) });
    return (
      `<h3 class="shift-year-h">${e(t('shift.year_heading'))}</h3>` +
      `<table class="tech-table shift-table shift-year"><thead><tr><th scope="col">${e(t('shift.col.point'))}</th>` +
      `<th scope="col">${e(t('shift.col.sun_year'))}</th><th scope="col">${e(t('shift.col.earth_year'))}</th></tr></thead><tbody>${body}</tbody></table>` +
      `<p class="shift-sum">${e(sentence)}</p><p>${e(fill(t('shift.year_note'), { hours: entry.hours, start: period.start.slice(0, 10), stop: period.stop.slice(0, 10), effect: (entry.site_angles_effect_max * 100).toFixed(1) }))}</p>`
    );
  }
  async function yearPart(site) {
    if (site.custom || !shifts.year) return '';
    try {
      const file = await shifts.year();
      const entry = file.sites.find((s) => s.site === site.id);
      return entry ? yearHtml(entry, file.period) : '';
    } catch {
      return '';
    }
  }

  async function render() {
    const sc = block.sc;
    if (!sc || !details.open) return;
    const mine = ++ticket;
    const th = view.horizon_threshold_deg;
    const base = judge(sc.sample, sc.profile, th);
    const times = timeRows(sc.table, sc.profile, sc.ms, cfg.time_offsets_hours, th);
    const load = sc.site.custom ? null : shifts.places[sc.site.id];
    if (!load || !sc.profile) {
      const deg = sphereTiltDeg(cfg.location_offset_km, shifts.radiusKm).toFixed(3);
      body.innerHTML = html(base, times, fill(t('shift.place_none'), { km: cfg.location_offset_km, deg }));
      return;
    }
    body.innerHTML = html(base, times, t('shift.place_computing'));
    try {
      const file = await load();
      const tables = await Promise.all(file.points.map((p) => shifts.engine({ lat: p.lat, lon_east: p.lon_east })));
      if (mine !== ticket) return;
      const places = placeRows(file.points, tables, file.azimuth_step_deg, sc.ms, th);
      const yr = await yearPart(sc.site);
      if (mine !== ticket) return;
      body.innerHTML = html(base, [...times, ...places], t('shift.place_source')) + yr;
    } catch {
      if (mine === ticket) body.innerHTML = html(base, times, t('shift.place_error'));
    }
  }

  const block = cardBlock(box, details, render, () => ticket++);
  return block;
}
