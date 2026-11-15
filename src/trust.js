// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// One line under the verdicts (P4v first screen): the measured validation numbers, read from data/validation.json
// (every JPL Horizons check together, block scale.all_checks of ADR 0108, else the H9a Horizons block; PGDA over the
// same 18.6 years at the landing sites, block pgda_period) with a link to the
// Validation page, where the ridge check point is reported in full. Nothing is recomputed here.
import { fill, escapeHtml as e } from './i18n.js';

// v = data/validation.json; d = decimals for the angle (config/validation.json "decimals_report").
export function trustText(t, v, d) {
  const h = v.scale?.all_checks ?? v.horizons;
  return fill(t('tool.trust'), {
    of: h.same_answer.of,
    max: Number(h.max_abs_deg).toFixed(d),
    power: h.same_answer.power,
    comm: h.same_answer.comm,
    years: v.pgda_period.period.years,
    pp: (v.pgda_period.landing_sites.max_abs * 100).toFixed(1),
  });
}

export function trustHtml(t, v, d, href) {
  return `${e(trustText(t, v, d))} <a href="${e(href)}">${e(t('tool.trust_link'))}</a>`;
}
