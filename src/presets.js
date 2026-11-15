// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// "Try a comparison" (ADR 0100): a row of ready-made scenarios (config/presets.json). Each is a real link in the
// shareable-link format (src/share.js), so it opens in a new tab too; a plain click calls onPick instead of reloading.
import { escapeHtml as e } from './i18n.js';
import { encodeScenarios } from './share.js';
import { parseUtc } from './ephem.js';

// Current query string with the "s" values replaced by the preset's scenarios; other values (?lang=…) are kept.
export function presetSearch(search, scenarios, cfg) {
  const params = new URLSearchParams(search);
  params.delete(cfg.param);
  const rest = params.toString();
  return encodeScenarios(scenarios, cfg) + (rest ? `&${rest}` : '');
}

// Problems with the list (empty array = fine): unknown sites, times off the hourly grid or outside the data, too many cards.
export function presetProblems(presets, { siteIds, startMs, endMs, max }) {
  const out = [];
  const ids = new Set();
  for (const p of presets) {
    if (!p.id || ids.has(p.id)) out.push(`id ${p.id}`);
    ids.add(p.id);
    if (!p.scenarios?.length || p.scenarios.length > max) out.push(`${p.id}: ${p.scenarios?.length ?? 0} scenarios`);
    for (const sc of p.scenarios ?? []) {
      const ms = parseUtc(sc.time_utc);
      if (!siteIds.has(sc.site)) out.push(`${p.id}: site ${sc.site}`);
      if (!/T\d{2}:00$/.test(sc.time_utc) || !(ms >= startMs && ms <= endMs)) out.push(`${p.id}: time ${sc.time_utc}`);
    }
  }
  return out;
}

// box = empty <nav>; presets = config/presets.json "presets"; onPick(preset) after a plain click.
export function mountPresets(box, { t, presets, cfg, onPick, search = () => location.search }) {
  if (!box || !presets?.length) return;
  box.innerHTML =
    `<span class="presets-label" id="presets-label">${e(t('preset.heading'))}</span>` +
    `<ul class="presets-list" aria-labelledby="presets-label">` +
    presets.map((p) => `<li><a class="preset" data-preset="${e(p.id)}" href="${e(presetSearch(search(), p.scenarios, cfg))}">${e(t(`preset.${p.id}`))}</a></li>`).join('') +
    `</ul>`;
  box.hidden = false;
  const links = [...box.querySelectorAll('.preset')];
  for (const a of links) {
    a.addEventListener('click', (ev) => {
      if (ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return; // new tab / window: the link itself
      ev.preventDefault();
      for (const b of links) b.removeAttribute('aria-current');
      a.setAttribute('aria-current', 'true');
      onPick(presets.find((p) => p.id === a.dataset.preset));
    });
  }
}
