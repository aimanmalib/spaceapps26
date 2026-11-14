// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// About page: what is built, item by item (a–l from the challenge list, switched in config/features.json), and the
// limitations. All text comes from i18n/en.json: item text = 'about.item.<feature key>', limitations = every key that
// starts with 'about.lim.' in file order. {placeholders} are filled from config values.
import { fill, escapeHtml as e } from './i18n.js';

export const LIM_PREFIX = 'about.lim.';

export function limitationKeys(dict) {
  return Object.keys(dict).filter((k) => k.startsWith(LIM_PREFIX));
}

export function itemsHtml(t, items, values) {
  const rows = Object.entries(items).map(([key, on]) => {
    const letter = key.split('_')[0];
    const state = on ? '' : ` <span class="about-off">${e(t('about.item.off'))}</span>`;
    return `<li class="about-item${on ? '' : ' is-off'}"><span class="about-letter" aria-hidden="true">${e(letter)}</span>` +
      `<span><span class="sr-only">${e(fill(t('about.item.letter'), { letter }))} </span>${e(fill(t(`about.item.${key}`), values))}${state}</span></li>`;
  });
  return `<ol class="about-items">${rows.join('')}</ol>`;
}

export function limitationsHtml(t, dict, values) {
  return `<ul class="about-lims">${limitationKeys(dict).map((k) => `<li>${e(fill(t(k), values))}</li>`).join('')}</ul>`;
}
