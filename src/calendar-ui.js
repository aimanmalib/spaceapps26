// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Site-day calendar on the Overview page (ADR 0102): month picker, sort (Power / Comms / Both), hover/tap readout, and
// cells that open Compare for that site and day. Numbers come from data/calendar.json; nothing is computed here.
import { fill, escapeHtml as e } from './i18n.js';
import { months, gridHtml, dayParts, compareHref, cellText } from './calendar.js';

const KINDS = ['both', 'sun', 'earth', 'none'];

export function mountCalendar(root, { t, data, cfg, share, name, lang }) {
  const list = months(data.first_day, data.days);
  const fmt = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const label = (m) => fmt.format(new Date(`${m.key}-01T00:00Z`));
  let month = cfg.default_month === 'first' ? 0 : Math.max(0, list.findIndex((m) => m.key === cfg.default_month));
  let sortBy = cfg.sort_options.includes(cfg.default_sort) ? cfg.default_sort : cfg.sort_options[0];
  let selected = null; // highlighted cell (hover, focus or tap)
  let armed = null; // touch: the day tapped once, which a second tap opens
  let touch = false;

  const opts = list.map((m, i) => `<option value="${i}">${e(label(m))}</option>`).join('');
  const sorts = cfg.sort_options
    .map((s) => `<label class="cal-seg"><input type="radio" name="cal-sort" value="${s}"${s === sortBy ? ' checked' : ''}><span>${e(t(`calendar.sort.${s}`))}</span></label>`)
    .join('');
  const legend = KINDS.map((k) => `<li><span class="cal-swatch cal-k-${k}" aria-hidden="true"></span>${e(t(`calendar.key.${k}`))}</li>`).join('');
  root.innerHTML =
    `<div class="cal-controls">` +
    `<div class="cal-month"><button type="button" class="cal-step" data-step="-1" aria-label="${e(t('calendar.prev'))}">‹</button>` +
    `<label class="field cal-field"><span>${e(t('calendar.month'))}</span><select class="cal-select">${opts}</select></label>` +
    `<button type="button" class="cal-step" data-step="1" aria-label="${e(t('calendar.next'))}">›</button></div>` +
    `<fieldset class="cal-sort"><legend>${e(t('calendar.sort'))}</legend><div class="cal-segs">${sorts}</div></fieldset></div>` +
    `<ul class="cal-legend" aria-label="${e(t('calendar.legend'))}">${legend}</ul>` +
    `<div class="cal-readout" aria-live="polite"></div>` +
    `<div class="cal-scroll" tabindex="0" role="region"></div>`;

  const select = root.querySelector('.cal-select');
  const scroll = root.querySelector('.cal-scroll');
  const readout = root.querySelector('.cal-readout');

  const hint = () => { readout.innerHTML = `<p class="cal-hint">${e(t('calendar.hint'))}</p>`; };
  const show = (a) => {
    const s = data.sites.find((x) => x.site === a.dataset.site);
    const d = Math.round((Date.parse(`${a.dataset.date}T00:00Z`) - Date.parse(`${data.first_day}T00:00Z`)) / 86_400_000);
    const p = dayParts(s, d);
    const chips = KINDS.map((k) => `<li><span class="cal-swatch cal-k-${k}" aria-hidden="true"></span><b>${e(fill(t('calendar.hours'), { h: p[k] }))}</b> <span>${e(t(`calendar.key.${k}`))}</span></li>`).join('');
    readout.innerHTML =
      `<p class="cal-what"><span>${e(a.dataset.date)} UTC</span> <strong>${e(name(s.site))}</strong></p>` +
      `<ul class="cal-chips" aria-label="${e(cellText(t, name(s.site), a.dataset.date, p))}">${chips}</ul>` +
      `<a class="cal-open" href="${e(compareHref(s.site, a.dataset.date, s.pick[d], share))}">${e(t('calendar.open'))} →</a>`;
  };
  const select_ = (a) => {
    selected?.classList.remove('is-selected');
    selected = a;
    a?.classList.add('is-selected');
  };

  const draw = () => {
    const m = list[month];
    select.value = String(month);
    root.querySelector('[data-step="-1"]').disabled = month === 0;
    root.querySelector('[data-step="1"]').disabled = month === list.length - 1;
    scroll.setAttribute('aria-label', fill(t('calendar.caption'), { month: label(m) }));
    scroll.innerHTML = gridHtml(t, data, m, sortBy, name, share, label(m));
    selected = null;
    armed = null;
    hint();
  };

  select.addEventListener('change', () => { month = +select.value; draw(); });
  root.addEventListener('click', (ev) => {
    const step = ev.target.closest('.cal-step');
    if (step) { month = Math.min(list.length - 1, Math.max(0, month + +step.dataset.step)); draw(); return; }
    const a = ev.target.closest('.cal-cell');
    // Touch: the first tap on a day shows its hours (and the Compare link); a second tap on the same day opens it.
    if (a && touch && a !== armed) { ev.preventDefault(); armed = a; select_(a); show(a); }
  });
  root.addEventListener('change', (ev) => {
    if (ev.target.name === 'cal-sort') { sortBy = ev.target.value; draw(); }
  });
  scroll.addEventListener('pointerdown', (ev) => { touch = ev.pointerType !== 'mouse'; });
  scroll.addEventListener('keydown', () => { touch = false; });
  scroll.addEventListener('pointerover', (ev) => {
    const a = ev.target.closest('.cal-cell');
    if (a && ev.pointerType === 'mouse') { select_(a); show(a); }
  });
  scroll.addEventListener('focusin', (ev) => {
    const a = ev.target.closest('.cal-cell');
    if (a) { select_(a); show(a); }
  });
  draw();
}
