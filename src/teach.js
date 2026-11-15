// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Page for teachers (teach.html): one class activity from config/teach.json. Each step = question + link to the game or
// to scenarios of the Compare tool (P4n link format). No answers are written here; the tool computes them when opened.
import { fill, escapeHtml as e } from './i18n.js';
import { encodeScenarios } from './share.js';
import { horizonKm } from './moonearth.js';

export const totalMinutes = (steps) => steps.reduce((sum, s) => sum + s.minutes, 0);

// Relative link of a step: the game page, or the tool with the step's scenarios.
export function stepHref(step, shareCfg) {
  return step.page ? `./${step.page}` : `./${encodeScenarios(step.scenarios, shareCfg)}`;
}

function scenarioLabel(step, siteName) {
  if (!step.scenarios) return '';
  const names = step.scenarios.map((sc) => siteName(sc.site));
  const times = [...new Set(step.scenarios.map((sc) => sc.time_utc.replace('T', ' ')))];
  return `${names.join(' · ')} — ${times.join(' · ')} UTC`;
}

// ctx = {t, cfg (teach.json), share (view.json share), siteName(id), base (absolute page URL, for the printed address),
// values (placeholders of the step texts, e.g. {shifts, km})}
export function stepsHtml({ t, cfg, share, siteName, base, values = {} }) {
  const tx = (k) => fill(t(k), values);
  return cfg.steps
    .map((s, i) => {
      const href = stepHref(s, share);
      const label = scenarioLabel(s, siteName);
      return (
        `<li class="teach-step">` +
        `<h2>${e(fill(t('teach.step'), { n: i + 1, minutes: s.minutes }))} ${e(tx(`teach.${s.key}.title`))}</h2>` +
        `<p>${e(tx(`teach.${s.key}.do`))}</p>` +
        (label ? `<p class="data-label">${e(label)}</p>` : '') +
        `<p class="teach-ask"><strong>${e(t('teach.ask'))}</strong> ${e(tx(`teach.${s.key}.ask`))}</p>` +
        `<p class="teach-link"><a class="btn" href="${e(href)}">${e(tx(`teach.${s.key}.link`))}</a>` +
        `<span class="print-url">${e(new URL(href, base).href)}</span></p>` +
        `</li>`
      );
    })
    .join('');
}

// Moon and Earth rows (item k) quoted from config/moon-earth.json; distance to the horizon computed from the radius.
export function factsHtml({ t, keys, me }) {
  const n = (v) => v.toFixed(me.decimals);
  const h = me.observer_height_m;
  const rows = {
    day: [t('me.row.day'), fill(t('me.days'), { v: me.moon.synodic_period_days }), fill(t('me.hours'), { v: me.earth.length_of_day_hours })],
    air: [t('me.row.air'), me.moon.surface_pressure_text, me.earth.surface_pressure_text],
    horizon: [fill(t('me.row.horizon'), { h }), fill(t('me.km'), { v: n(horizonKm(me.moon.radius_km, h)) }), fill(t('me.km'), { v: n(horizonKm(me.earth.radius_km, h)) })],
  };
  const link = (s) => `<a href="${e(s.url)}" rel="noopener">${e(s.title)}</a>`;
  return (
    `<table class="tech-table me-table"><thead><tr><th scope="col"></th>` +
    `<th scope="col">${e(t('me.col.moon'))}</th><th scope="col">${e(t('me.col.earth'))}</th></tr></thead><tbody>` +
    keys.map((k) => `<tr><th scope="row">${e(rows[k][0])}</th><td>${e(rows[k][1])}</td><td>${e(rows[k][2])}</td></tr>`).join('') +
    `</tbody></table>` +
    `<p class="me-src">${e(t('me.sources'))} ${link(me.sources.moon)} · ${link(me.sources.earth)}.</p>`
  );
}
