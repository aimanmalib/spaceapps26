// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Validation page: the PGDA check over the same 18.6 years as the NASA maps, and the sensitivity test at the ridge
// check point (data/validation.json "pgda_period", scripts/pgda_period.py). Numbers come straight from the file.
import { fill, escapeHtml as e } from './i18n.js';

const pct = (v) => `${(v * 100).toFixed(1)} %`;
const num = (v) => (v * 100).toFixed(1);
const when = (iso) => iso.replace('T', ' ').replace('Z', '');

// The numbers of the ridge sentences, shared by the page and its test.
export function ridgeFacts(pp) {
  const row = pp.sites.find((s) => s.site === pp.ridge.site);
  const [low, high] = [...pp.ridge.observer].sort((a, b) => a.height_m - b.height_m);
  return { row, low, high, between: low.sun < pp.ridge.pgda.sun.value && pp.ridge.pgda.sun.value < high.sun };
}

// pp = data.pgda_period; siteName = id → display name (undefined for unnamed check points); page = PGDA product page.
export function periodHtml(t, pp, siteName, page) {
  const name = (s) => siteName(s.site) ?? fill(t('val.pgda.point'), { lat: s.lat, lon: s.lon_east });
  const years = pp.period.years;
  const span = (r) => `${pct(r.min)} – ${pct(r.max)}`;
  const row = (s) =>
    `<tr><th scope="row">${e(name(s))}</th><td>${pct(s.tool.sun)}</td><td>${pct(s.pgda.sun)}</td>` +
    `<td>${pct(s.tool.earth)}</td><td>${pct(s.pgda.earth)}</td><td>${span(s.one_year.sun)}</td><td>${span(s.one_year.earth)}</td></tr>`;
  const { row: ridge, low, high, between } = ridgeFacts(pp);
  const b = pp.ridge.block;
  const heading = fill(t('val.period.heading'), { years });
  const cause = fill(t('val.period.cause'), {
    s0: num(low.sun), h0: low.height_m, s1: num(high.sun), h: high.height_m, off: b.offset_m, bmin: num(b.sun.min), bmax: num(b.sun.max),
    km: pp.ridge.near_km, near: high.near, n: pp.ridge.azimuths,
  });
  return (
    `<h2 id="same-period">${e(heading)}</h2>` +
    `<p>${e(fill(t('val.period.intro'), { years, start: when(pp.period.start), stop: when(pp.period.stop), hours: pp.period.hours }))}</p>` +
    `<div class="table-scroll" tabindex="0" role="region" aria-label="${e(heading)}">` +
    `<table class="data-table"><thead><tr><th scope="col">${e(t('val.col.site'))}</th>` +
    `<th scope="col">${e(fill(t('val.period.col.sun_tool'), { years }))}</th><th scope="col">${e(t('val.pgda.col.sun_ref'))}</th>` +
    `<th scope="col">${e(fill(t('val.period.col.earth_tool'), { years }))}</th><th scope="col">${e(t('val.pgda.col.earth_ref'))}</th>` +
    `<th scope="col">${e(t('val.period.col.sun_year'))}</th><th scope="col">${e(t('val.period.col.earth_year'))}</th>` +
    `</tr></thead><tbody>${pp.sites.map(row).join('')}</tbody></table></div>` +
    `<p>${e(fill(t('val.period.sites'), { pp: num(pp.landing_sites.max_abs) }))} ` +
    (pp.other_sites
      ? `${e(fill(t('val.period.others'), { n: pp.other_sites.ids.length, lo: num(pp.other_sites.sun.min_abs), hi: num(pp.other_sites.sun.max_abs), elo: num(pp.other_sites.earth.min_abs), ehi: num(pp.other_sites.earth.max_abs) }))} `
      : '') +
    `${e(fill(t('val.period.ridge'), { pp: num(Math.abs(ridge.diff.sun)), ppe: num(Math.abs(ridge.diff.earth)), min: num(ridge.one_year.sun.min), max: num(ridge.one_year.sun.max), n: ridge.calendar_years }))}</p>` +
    `<p>${e(cause)}${between ? ` ${e(fill(t('val.period.between'), { ref: num(pp.ridge.pgda.sun.value) }))}` : ''}</p>` +
    `<p class="data-label">${e(fill(t('val.period.generated'), { at: pp.generated_at }))} ` +
    `<a href="${e(page)}" rel="noopener noreferrer">${e(t('val.pgda.source'))}</a></p>`
  );
}
