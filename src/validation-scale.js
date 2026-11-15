// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Validation page, check at scale (ADR 0108): every listed site, frozen-table dates and engine dates, against JPL Horizons.
// Numbers come straight from data/validation.json "scale" (summary) and data/validation-scale.json (pairs); nothing is
// recomputed here except picking the pair with the largest Sun azimuth difference to say how high the Sun was.
import { fill, escapeHtml as e } from './i18n.js';
import { summaryHtml, pairsHtml } from './validation.js';

const deg = (v, d) => `${Number(v).toFixed(d)}°`;

function sourceRows(t, s, d) {
  return ['table', 'engine'].map((k) => {
    const b = s.by_source[k];
    return `<tr><th scope="row">${e(fill(t(`val.scale.src.${k}`), { first: b.first.slice(0, 10), last: b.last.slice(0, 10) }))}</th>` +
      `<td>${b.same_answer.of}</td><td>${deg(b.max_abs_deg, d)}</td><td>${deg(b.mean_abs_deg, d)}</td>` +
      `<td>${e(fill(t('val.of'), { n: b.same_answer.power, of: b.same_answer.of }))}, ${e(fill(t('val.of'), { n: b.same_answer.comm, of: b.same_answer.of }))}</td></tr>`;
  }).join('');
}

function differentHtml(t, s, siteName, d) {
  const diff = s.different_answers;
  if (!diff.length) return `<p>${e(t('val.scale.different_none'))}</p>`;
  const row = (x) => `<tr><th scope="row">${e(siteName(x.site) ?? x.site)}</th><td>${e(x.time_utc.replace('T', ' '))}</td>` +
    `<td>${e(t(x.answer === 'power' ? 'val.same_power' : 'val.same_comm'))}</td><td>${deg(x.shown_el, d)}</td><td>${deg(x.horizons_el, d)}</td></tr>`;
  return `<p>${e(fill(t('val.scale.different'), { n: diff.length }))}</p>` +
    `<div class="table-scroll"><table class="data-table"><thead><tr><th scope="col">${e(t('val.col.site'))}</th>` +
    `<th scope="col">${e(t('val.col.time'))}</th><th scope="col">${e(t('val.scale.col.answer'))}</th>` +
    `<th scope="col">${e(t('val.scale.col.shown_el'))}</th><th scope="col">${e(t('val.scale.col.ref_el'))}</th></tr></thead>` +
    `<tbody>${diff.map(row).join('')}</tbody></table></div>`;
}

// s = data/validation.json "scale"; pairs = data/validation-scale.json "pairs"; siteName = id → name; d = decimals shown.
export function scaleHtml(t, s, pairs, siteName, d) {
  const a = s.all_checks;
  const top = pairs.reduce((m, p) => (Math.abs(p.diff.sun.az) > Math.abs(m.diff.sun.az) ? p : m), pairs[0]);
  const by = s.by_source;
  const heading = fill(t('val.scale.heading'), { sites: s.sites, from: s.from.slice(0, 4), to: Number(s.to.slice(0, 4)) - 1 });
  const label = t('val.scale.by_source');
  const lastDay = new Date(Date.parse(`${s.to.replace(' ', 'T')}:00Z`) - 86_400_000).toISOString().slice(0, 10);
  return (
    `<h2 id="at-scale">${e(heading)}</h2>` +
    `<p class="lede">${e(fill(t('val.scale.all'), {
      pairs: a.pairs, angles: a.angles, max: deg(a.max_abs_deg, d), power: a.same_answer.power, comm: a.same_answer.comm, of: a.same_answer.of,
    }))}</p>` +
    `<p>${e(fill(t('val.scale.intro'), {
      n: s.same_answer.of, per: s.pairs_per_site, sites: s.sites, seed: s.seed, from: s.from.slice(0, 10), to: lastDay,
      table: by.table.same_answer.of, engine: by.engine.same_answer.of, requests: s.horizons_requests,
    }))}</p>` +
    summaryHtml(t, s, d) +
    `<p>${e(fill(t('val.scale.sky'), {
      sun: deg(s.sky_separation.sun.max_deg, d), earth: deg(s.sky_separation.earth.max_deg, d),
      az: deg(Math.abs(top.diff.sun.az), d), el: deg(top.horizons.sun.el, 1),
    }))}</p>` +
    `<h2>${e(label)}</h2>` +
    `<div class="table-scroll" tabindex="0" role="region" aria-label="${e(label)}"><table class="data-table"><thead><tr>` +
    `<th scope="col">${e(t('val.scale.col.source'))}</th><th scope="col">${e(t('val.scale.col.pairs'))}</th>` +
    `<th scope="col">${e(t('val.col.max'))}</th><th scope="col">${e(t('val.col.mean'))}</th><th scope="col">${e(t('val.scale.col.same'))}</th>` +
    `</tr></thead><tbody>${sourceRows(t, s, d)}</tbody></table></div>` +
    differentHtml(t, s, siteName, d) +
    `<details class="scale-pairs"><summary>${e(fill(t('val.scale.show_pairs'), { n: pairs.length }))}</summary>` +
    pairsHtml(t, pairs, (p) => siteName(p.site) ?? p.site, d) +
    `</details>` +
    `<p class="data-label">${e(fill(t('val.scale.generated'), { at: s.generated_at, seed: s.seed }))}</p>` +
    `<h2 id="first-check">${e(t('val.first.heading'))}</h2>`
  );
}
