// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Side-by-side table (item c): one column per scenario, one row per key number, same text as the cards.
import { fill, escapeHtml as e } from './i18n.js';
import { formatUtc } from './ephem.js';

// rows = [{site, ms, facts?, msg?}] in card order.
export function glanceHtml(t, rows) {
  const head = rows.map((_, i) => `<th scope="col">${e(fill(t('scenario.label'), { n: i + 1 }))}</th>`).join('');
  const line = (label, fn, cls = '') =>
    `<tr class="${cls}"><th scope="row">${e(t(label))}</th>` +
    rows.map((r) => `<td>${r.facts ? fn(r.facts) : e(t('glance.no_data'))}</td>`).join('') +
    `</tr>`;
  const yes = (up) => `<span class="${up ? 'yn is-up' : 'yn is-down'}">${e(t(up ? 'glance.yes' : 'glance.no'))}</span>`;
  const body = [
    `<tr><th scope="row">${e(t('scenario.site'))}</th>${rows.map((r) => `<td>${e(r.site.name)}</td>`).join('')}</tr>`,
    `<tr><th scope="row">${e(t('scenario.time'))}</th>${rows.map((r) => `<td>${Number.isFinite(r.ms) ? e(formatUtc(r.ms).replace('T', ' ')) : ''}</td>`).join('')}</tr>`,
    `<tr><th scope="row">${e(t('glance.horizon'))}</th>${rows.map((r) => `<td>${r.facts ? e(t(r.profile ? 'glance.terrain' : 'glance.sphere')) : ''}</td>`).join('')}</tr>`,
    line('glance.power', (f) => yes(f.sun.up), 'g-sun'),
    line('glance.sun_margin', (f) => `<span class="g-num">${e(f.sun.marginText)}</span>`, 'g-sun'),
    line('glance.sun_when', (f) => e(f.sun.timing), 'g-sun'),
    line('glance.sun_window', (f) => e(f.sun.windowShort ?? ''), 'g-sun'),
    line('glance.comm', (f) => yes(f.earth.up), 'g-earth'),
    line('glance.earth_margin', (f) => `<span class="g-num">${e(f.earth.marginText)}</span>`, 'g-earth'),
    line('glance.earth_when', (f) => e(f.earth.timing), 'g-earth'),
    line('glance.earth_window', (f) => e(f.earth.windowShort ?? ''), 'g-earth'),
  ].join('');
  return (
    `<div class="table-scroll glance-scroll" tabindex="0" role="region" aria-label="${e(t('glance.heading'))}">` +
    `<table class="glance-table"><thead><tr><td></td>${head}</tr></thead><tbody>${body}</tbody></table></div>`
  );
}
