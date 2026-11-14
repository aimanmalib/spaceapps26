// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Validation page (H9a): numbers come straight from data/validation.json; nothing is recomputed here.
import { fill, escapeHtml as e } from './i18n.js';

const QUANTITIES = ['sun_az', 'sun_el', 'earth_az', 'earth_el'];

const deg = (v, d) => `${Number(v).toFixed(d)}°`;

function largestDiff(pair) {
  return Math.max(...['sun', 'earth'].flatMap((b) => ['az', 'el'].map((k) => Math.abs(pair.diff[b][k]))));
}

function tile(label, value) {
  return `<div class="stat"><dt>${e(label)}</dt><dd>${e(value)}</dd></div>`;
}

// data = data/validation.json, siteName = id → display name, d = decimals shown.
export function validationHtml(t, data, siteName, d) {
  const h = data.horizons;
  const same = h.same_answer;
  const tiles =
    tile(t('val.max'), deg(h.max_abs_deg, d)) +
    tile(t('val.mean'), deg(h.mean_abs_deg, d)) +
    tile(t('val.same_power'), fill(t('val.of'), { n: same.power, of: same.of })) +
    tile(t('val.same_comm'), fill(t('val.of'), { n: same.comm, of: same.of }));
  const qrows = QUANTITIES.map((q) =>
    `<tr><th scope="row">${e(t(`val.q.${q}`))}</th><td>${deg(h.by_quantity[q].max_abs_deg, d)}</td><td>${deg(h.by_quantity[q].mean_abs_deg, d)}</td></tr>`,
  ).join('');
  const prow = (p) =>
    `<tr><th scope="row">${e(siteName(p.site))}</th><td>${e(p.time_utc.replace('T', ' '))}</td>` +
    `<td>${deg(p.shown.sun.el, d)}</td><td>${deg(p.horizons.sun.el, d)}</td>` +
    `<td>${deg(p.shown.earth.el, d)}</td><td>${deg(p.horizons.earth.el, d)}</td><td>${deg(largestDiff(p), d)}</td></tr>`;
  return (
    `<dl class="stats">${tiles}</dl>` +
    `<h2>${e(t('val.by_quantity'))}</h2>` +
    `<div class="table-scroll"><table class="data-table"><thead><tr><th scope="col">${e(t('val.col.quantity'))}</th>` +
    `<th scope="col">${e(t('val.col.max'))}</th><th scope="col">${e(t('val.col.mean'))}</th></tr></thead><tbody>${qrows}</tbody></table></div>` +
    `<h2>${e(fill(t('val.pairs'), { n: h.pairs.length }))}</h2>` +
    `<div class="table-scroll" tabindex="0" role="region" aria-label="${e(fill(t('val.pairs'), { n: h.pairs.length }))}">` +
    `<table class="data-table"><thead><tr><th scope="col">${e(t('val.col.site'))}</th><th scope="col">${e(t('val.col.time'))}</th>` +
    `<th scope="col">${e(t('val.col.sun_shown'))}</th><th scope="col">${e(t('val.col.sun_ref'))}</th>` +
    `<th scope="col">${e(t('val.col.earth_shown'))}</th><th scope="col">${e(t('val.col.earth_ref'))}</th>` +
    `<th scope="col">${e(t('val.col.largest'))}</th></tr></thead><tbody>${h.pairs.map(prow).join('')}</tbody></table></div>` +
    `<p class="data-label">${e(fill(t('val.generated'), { at: data.generated_at, seed: data.seed }))}</p>`
  );
}
