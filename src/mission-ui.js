// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Per-card "Next windows" block: windows where solar power and the direct-to-Earth line are both possible without a
// break for at least the chosen length; "Use this start time" sets the card time (bubbling 'change', like the steps).
import { fill, escapeHtml as e } from './i18n.js';
import { cardBlock } from './cardblock.js';
import { duration } from './facts.js';
import { formatUtc, tableRange } from './ephem.js';
import { findWindows, bothShare } from './mission.js';

const HOUR = 3_600_000;
const utc = (ms) => formatUtc(ms).replace('T', ' ');

export function mountWindows(box, { t, view, open, time, uid }) {
  const cfg = view.windows;
  box.className = 'mission';
  const opts = cfg.min_hours_options
    .map((h) => `<option value="${h}"${h === cfg.default_min_hours ? ' selected' : ''}>${e(duration(t, h * HOUR))}</option>`)
    .join('');
  box.innerHTML =
    `<details class="tech win-box"${open ? ' open' : ''}><summary>${e(t('win.heading'))}</summary>` +
    `<p>${e(t('win.intro'))}</p>` +
    `<p class="win-pick"><label for="${uid}">${e(t('win.min_label'))}</label> <select id="${uid}" class="win-min">${opts}</select></p>` +
    `<div class="win-body" aria-live="polite"></div></details>`;
  const details = box.querySelector('details');
  const body = box.querySelector('.win-body');
  const pick = box.querySelector('.win-min');
  // The duration select must not reach the card's own 'change' listener (that would rebuild the card).
  pick.addEventListener('change', (ev) => {
    ev.stopPropagation();
    render();
  });

  const item = (w) => {
    const flag = w.current ? ` <span class="seq-flag">${e(t('win.current'))}</span>` : '';
    const endFlag = w.endOpen ? ` <span class="seq-flag">${e(t('win.data_end'))}</span>` : '';
    const len = `${w.endOpen || w.startOpen ? '≥ ' : ''}${duration(t, w.ms)}`;
    return `<li class="win-item"><dl class="win-dl">` +
      `<div><dt>${e(t('win.col.start'))}</dt><dd>${e(utc(w.start))}${flag}</dd></div>` +
      `<div><dt>${e(t('win.col.end'))}</dt><dd>${e(utc(w.end))}${endFlag}</dd></div>` +
      `<div><dt>${e(t('win.col.len'))}</dt><dd class="win-len">${e(len)}</dd></div></dl>` +
      `<button type="button" class="btn-step win-use" data-ms="${w.start}" aria-label="${e(fill(t('win.use_label'), { start: utc(w.start) }))}">` +
      `${e(t('win.use'))}</button></li>`;
  };

  function render() {
    const sc = block.sc;
    if (!sc || !details.open) return;
    const th = view.horizon_threshold_deg;
    const list = findWindows(sc.rel, sc.ms, Number(pick.value), th, cfg.max_listed);
    const { startMs, endMs } = tableRange(sc.rel);
    const pct = (bothShare(sc.rel, th) * 100).toFixed(view.decimals);
    const share = `<p class="shift-sum win-sum">${e(fill(t('win.share'), { pct, start: utc(startMs), end: utc(endMs) }))}</p>`;
    body.innerHTML = share + (list.length
      ? `<ol class="win-list">${list.map(item).join('')}</ol>`
      : `<p class="note win-none">${e(fill(t('win.none'), { end: utc(endMs) }))}</p>`);
  }

  body.addEventListener('click', (ev) => {
    const b = ev.target.closest('.win-use');
    if (!b) return;
    time.value = formatUtc(Number(b.dataset.ms));
    time.dispatchEvent(new Event('change', { bubbles: true }));
  });

  const block = cardBlock(box, details, render);
  return block;
}
