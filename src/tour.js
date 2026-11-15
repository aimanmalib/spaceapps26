// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Guided tour (ADR 0110): "Take the tour" opens a small dialog that walks through config/tour.json steps, outlining each
// step's part of the page. It never opens by itself. Native modal <dialog>: focus moves in and stays in, Esc closes, focus
// goes back to the button. No animation, no filter or backdrop-filter (WebKit crash, CLAUDE.md); jumps, never smooth scroll.
import { fill, escapeHtml as e } from './i18n.js';

const visible = (el) => el.getClientRects().length > 0;

// Steps whose target is on the page now: [{id, els}] (els = every visible match, in document order).
export function liveSteps(cfg, doc = document) {
  return cfg.steps
    .map((s) => ({ id: s.id, els: [...doc.querySelectorAll(s.target)].filter(visible) }))
    .filter((s) => s.els.length);
}

export function mountTour(actions, { t, cfg, uid = 'tour' }) {
  if (!actions || typeof HTMLDialogElement === 'undefined') return null;
  const start = document.createElement('button');
  start.type = 'button';
  start.className = 'btn-quiet tour-start';
  start.textContent = t('tour.start');
  start.setAttribute('aria-haspopup', 'dialog');
  (actions.querySelector('.how') ?? actions.lastElementChild)?.after(start);

  const dlg = document.createElement('dialog');
  dlg.className = 'tour';
  dlg.setAttribute('aria-labelledby', `${uid}-title`);
  dlg.setAttribute('aria-describedby', `${uid}-text`);
  dlg.innerHTML =
    `<p class="tour-count"></p>` +
    `<h2 class="tour-title" id="${uid}-title"></h2>` +
    `<p class="tour-text" id="${uid}-text" aria-live="polite"></p>` +
    `<div class="tour-nav"><button type="button" class="btn-quiet tour-back">${e(t('tour.back'))}</button>` +
    `<button type="button" class="btn tour-next"></button></div>` +
    `<button type="button" class="btn-quiet tour-close" aria-label="${e(t('tour.close'))}">${e(t('tour.close_short'))}</button>`;
  document.body.append(dlg);
  const [count, title, text] = ['.tour-count', '.tour-title', '.tour-text'].map((s) => dlg.querySelector(s));
  const back = dlg.querySelector('.tour-back');
  const next = dlg.querySelector('.tour-next');
  let steps = [];
  let i = 0;

  const unmark = () => document.querySelectorAll('.tour-on').forEach((el) => el.classList.remove('tour-on'));
  function show(k) {
    i = k;
    unmark();
    const s = steps[i];
    for (const el of s.els) el.classList.add('tour-on');
    count.textContent = fill(t('tour.step'), { n: i + 1, total: steps.length });
    title.textContent = t(`tour.${s.id}.title`);
    text.textContent = t(`tour.${s.id}.text`);
    back.hidden = i === 0;
    next.textContent = t(i === steps.length - 1 ? 'tour.done' : 'tour.next');
    if (document.activeElement === back && back.hidden) next.focus();
    reveal(s.els);
  }

  // Every outlined part above the dialog when they fit there (centred in that room), else the first at the top. Jumps only.
  function reveal(els) {
    els[0].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' }); // also inside sideways-scrolling rows
    const boxes = els.map((el) => el.getBoundingClientRect());
    const top = Math.min(...boxes.map((b) => b.top));
    const height = Math.max(...boxes.map((b) => b.bottom)) - top;
    const room = dlg.getBoundingClientRect().top;
    const gap = Math.min(16, room / 8);
    const offset = height <= room - 2 * gap ? (room - height) / 2 : gap;
    window.scrollTo({ top: window.scrollY + top - offset, behavior: 'auto' });
  }

  start.addEventListener('click', () => {
    steps = liveSteps(cfg);
    if (!steps.length) return;
    dlg.showModal();
    show(0);
    next.focus();
  });
  next.addEventListener('click', () => (i < steps.length - 1 ? show(i + 1) : dlg.close()));
  back.addEventListener('click', () => i > 0 && show(i - 1));
  dlg.querySelector('.tour-close').addEventListener('click', () => dlg.close());
  // Esc (the dialog's cancel), Finish and Close all end here.
  dlg.addEventListener('close', () => {
    unmark();
    start.focus({ preventScroll: true });
  });
  return { start, dlg };
}
