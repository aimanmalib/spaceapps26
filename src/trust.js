// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// One line under the verdicts (P4v first screen): the measured validation numbers, read from data/validation.json
// (H9a Horizons block, H9b PGDA block) with a link to the Validation page. Nothing is recomputed here.
import { fill, escapeHtml as e } from './i18n.js';

// v = data/validation.json; d = decimals for the angle (config/validation.json "decimals_report").
export function trustText(t, v, d) {
  const h = v.horizons;
  return fill(t('tool.trust'), {
    of: h.same_answer.of,
    max: Number(h.max_abs_deg).toFixed(d),
    power: h.same_answer.power,
    comm: h.same_answer.comm,
    pp: (v.pgda.sun.max_abs * 100).toFixed(1),
  });
}

export function trustHtml(t, v, d, href) {
  return `${e(trustText(t, v, d))} <a href="${e(href)}">${e(t('tool.trust_link'))}</a>`;
}
