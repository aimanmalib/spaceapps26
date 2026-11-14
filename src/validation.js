// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Validation page (H9a, own-coordinates engine, H9b): numbers come straight from data/validation.json; nothing is recomputed here.
import { fill, escapeHtml as e } from './i18n.js';

const QUANTITIES = ['sun_az', 'sun_el', 'earth_az', 'earth_el'];

const deg = (v, d) => `${Number(v).toFixed(d)}°`;

function largestDiff(pair) {
  return Math.max(...['sun', 'earth'].flatMap((b) => ['az', 'el'].map((k) => Math.abs(pair.diff[b][k]))));
}

function tile(label, value, unit = '') {
  return `<div class="stat"><dt>${e(label)}</dt><dd>${e(value)}${unit ? `<span class="stat-unit">${e(unit)}</span>` : ''}</dd></div>`;
}

function summaryHtml(t, h, d) {
  const same = h.same_answer;
  const tiles =
    tile(t('val.max'), deg(h.max_abs_deg, d)) +
    tile(t('val.mean'), deg(h.mean_abs_deg, d)) +
    tile(t('val.same_power'), fill(t('val.of'), { n: same.power, of: same.of })) +
    tile(t('val.same_comm'), fill(t('val.of'), { n: same.comm, of: same.of }));
  const qrows = QUANTITIES.map((q) =>
    `<tr><th scope="row">${e(t(`val.q.${q}`))}</th><td>${deg(h.by_quantity[q].max_abs_deg, d)}</td><td>${deg(h.by_quantity[q].mean_abs_deg, d)}</td></tr>`,
  ).join('');
  return (
    `<dl class="stats">${tiles}</dl>` +
    `<h2>${e(t('val.by_quantity'))}</h2>` +
    `<div class="table-scroll"><table class="data-table"><thead><tr><th scope="col">${e(t('val.col.quantity'))}</th>` +
    `<th scope="col">${e(t('val.col.max'))}</th><th scope="col">${e(t('val.col.mean'))}</th></tr></thead><tbody>${qrows}</tbody></table></div>`
  );
}

// nameOf(pair) → row label.
function pairsHtml(t, pairs, nameOf, d) {
  const prow = (p) =>
    `<tr><th scope="row">${e(nameOf(p))}</th><td>${e(p.time_utc.replace('T', ' '))}</td>` +
    `<td>${deg(p.shown.sun.el, d)}</td><td>${deg(p.horizons.sun.el, d)}</td>` +
    `<td>${deg(p.shown.earth.el, d)}</td><td>${deg(p.horizons.earth.el, d)}</td><td>${deg(largestDiff(p), d)}</td></tr>`;
  const label = fill(t('val.pairs'), { n: pairs.length });
  return (
    `<h2>${e(label)}</h2>` +
    `<div class="table-scroll pairs-scroll" tabindex="0" role="region" aria-label="${e(label)}">` +
    `<table class="data-table"><thead><tr><th scope="col">${e(t('val.col.site'))}</th><th scope="col">${e(t('val.col.time'))}</th>` +
    `<th scope="col">${e(t('val.col.sun_shown'))}</th><th scope="col">${e(t('val.col.sun_ref'))}</th>` +
    `<th scope="col">${e(t('val.col.earth_shown'))}</th><th scope="col">${e(t('val.col.earth_ref'))}</th>` +
    `<th scope="col">${e(t('val.col.largest'))}</th></tr></thead><tbody>${pairs.map(prow).join('')}</tbody></table></div>`
  );
}

// data = data/validation.json, siteName = id → display name, d = decimals shown.
export function validationHtml(t, data, siteName, d) {
  const h = data.horizons;
  return (
    summaryHtml(t, h, d) +
    pairsHtml(t, h.pairs, (p) => siteName(p.site), d) +
    `<p class="data-label">${e(fill(t('val.generated'), { at: data.generated_at, seed: data.seed }))}</p>`
  );
}

// Item b: the in-browser engine against Horizons (data.engine); unnamed check points are labelled by coordinates.
export function engineHtml(t, engine, siteName, d) {
  const nameOf = (p) => siteName(p.site) ?? fill(t('val.pgda.point'), { lat: p.lat, lon: p.lon_east });
  return (
    `<h2>${e(t('val.engine.heading'))}</h2>` +
    `<p>${e(fill(t('val.engine.intro'), { n: engine.points }))}</p>` +
    summaryHtml(t, engine, d) +
    pairsHtml(t, engine.pairs, nameOf, d) +
    `<p class="data-label">${e(fill(t('val.engine.generated'), { at: engine.generated_at, seed: engine.seed }))}</p>`
  );
}

const pct = (v) => `${(v * 100).toFixed(1)} %`;

// H9(b): terrain horizon vs NASA PGDA average visibility maps (data.pgda); page = PGDA product page URL.
export function pgdaHtml(t, pgda, siteName, page) {
  const pp = (label, v) => tile(t(label), (v * 100).toFixed(1), t('val.pgda.pp_unit'));
  const tiles =
    pp('val.pgda.max_sun', pgda.sun.max_abs) +
    pp('val.pgda.mean_sun', pgda.sun.mean_abs) +
    pp('val.pgda.max_earth', pgda.earth.max_abs) +
    pp('val.pgda.mean_earth', pgda.earth.mean_abs);
  const name = (s) => siteName(s.site) ?? fill(t('val.pgda.point'), { lat: s.lat, lon: s.lon_east });
  const range = (r) => `${pct(r.window_min)} – ${pct(r.window_max)}`;
  const row = (s) =>
    `<tr><th scope="row">${e(name(s))}</th>` +
    `<td>${pct(s.tool.sun)}</td><td>${pct(s.pgda.sun.value)}</td><td>${range(s.pgda.sun)}</td>` +
    `<td>${pct(s.tool.earth)}</td><td>${pct(s.pgda.earth.value)}</td><td>${range(s.pgda.earth)}</td></tr>`;
  const p = pgda.tool_period;
  const label = t('val.pgda.heading');
  return (
    `<h2>${e(label)}</h2>` +
    `<p>${e(fill(t('val.pgda.intro'), { m: pgda.map_scale_m, start: p.start.replace('T', ' ').replace('Z', ''), stop: p.stop.replace('T', ' ').replace('Z', '') }))}</p>` +
    `<dl class="stats">${tiles}</dl>` +
    `<div class="table-scroll" tabindex="0" role="region" aria-label="${e(label)}">` +
    `<table class="data-table"><thead><tr><th scope="col">${e(t('val.col.site'))}</th>` +
    `<th scope="col">${e(t('val.pgda.col.sun_tool'))}</th><th scope="col">${e(t('val.pgda.col.sun_ref'))}</th><th scope="col">${e(t('val.pgda.col.range'))}</th>` +
    `<th scope="col">${e(t('val.pgda.col.earth_tool'))}</th><th scope="col">${e(t('val.pgda.col.earth_ref'))}</th><th scope="col">${e(t('val.pgda.col.range'))}</th>` +
    `</tr></thead><tbody>${pgda.sites.map(row).join('')}</tbody></table></div>` +
    `<p class="data-label">${e(fill(t('val.pgda.window'), { n: pgda.window_px }))} ` +
    `<a href="${e(page)}" rel="noopener noreferrer">${e(t('val.pgda.source'))}</a></p>` +
    `<p class="data-label">${e(fill(t('val.pgda.generated'), { at: pgda.generated_at }))}</p>`
  );
}
