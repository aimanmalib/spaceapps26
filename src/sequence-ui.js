// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Per-card sequential comparison: step buttons (previous/next site keeps the date, earlier/later keeps the site)
// and the "If the date moves" block (same answers for the chosen time and the following steps).
import { fill, escapeHtml as e } from './i18n.js';
import { cardBlock } from './cardblock.js';
import { duration, signedDeg } from './facts.js';
import { formatUtc, parseUtc } from './ephem.js';
import { dateRows, summary, stepId } from './sequence.js';

const HOUR = 3_600_000;

// Buttons fire a bubbling 'change' on the card's own select/time input, so the card updates as if edited by hand.
export function mountSteps(box, { t, seq, select, time, skip }) {
  const dur = duration(t, seq.button_step_hours * HOUR);
  const btn = (cls, key) => `<button type="button" class="btn-step ${cls}">${e(fill(t(key), { dur }))}</button>`;
  box.className = 'card-steps';
  box.setAttribute('role', 'group');
  box.setAttribute('aria-label', t('seq.steps_label'));
  box.innerHTML = btn('step-site-prev', 'seq.prev_site') + btn('step-site-next', 'seq.next_site') +
    btn('step-time-prev', 'seq.prev_time') + btn('step-time-next', 'seq.next_time');
  const fire = (el) => el.dispatchEvent(new Event('change', { bubbles: true }));
  const site = (dir) => {
    const ids = [...select.options].map((o) => o.value).filter((v) => v !== skip);
    select.value = stepId(ids, select.value, dir);
    fire(select);
  };
  const move = (dir) => {
    const ms = parseUtc(time.value);
    if (Number.isNaN(ms)) return;
    time.value = formatUtc(ms + dir * seq.button_step_hours * HOUR);
    fire(time);
  };
  box.querySelector('.step-site-prev').addEventListener('click', () => site(-1));
  box.querySelector('.step-site-next').addEventListener('click', () => site(1));
  box.querySelector('.step-time-prev').addEventListener('click', () => move(-1));
  box.querySelector('.step-time-next').addEventListener('click', () => move(1));
}

export function mountSequence(box, { t, view, open }) {
  const seq = view.sequence;
  box.className = 'sequence';
  box.innerHTML =
    `<details class="tech seq-box"${open ? ' open' : ''}><summary>${e(t('seq.heading'))}</summary>` +
    `<p>${e(fill(t('seq.intro'), { n: seq.table_steps, dur: duration(t, seq.table_step_hours * HOUR) }))}</p>` +
    `<div class="seq-body" aria-live="polite"></div></details>`;
  const details = box.querySelector('details');
  const body = box.querySelector('.seq-body');
  const cell = (a) =>
    `<td class="${a.up ? 'is-up' : 'is-down'}"><span class="shift-ans">${e(t(a.up ? 'shift.yes' : 'shift.no'))}</span> ` +
    `<span class="shift-num">${e(signedDeg(a.margin, view.decimals))}</span></td>`;
  const row = (r, ms) => {
    const cls = [r.hours === 0 ? 'shift-base' : '', r.changed ? 'seq-changed' : ''].join(' ').trim();
    const date = formatUtc(ms + r.hours * HOUR).replace('T', ' ');
    const flag = r.hours === 0 ? t('seq.chosen') : r.changed ? t('seq.changed') : '';
    return `<tr class="${cls}"><th scope="row">${e(date)}${flag ? ` <span class="seq-flag">${e(flag)}</span>` : ''}</th>` +
      (r.answers ? cell(r.answers.sun) + cell(r.answers.earth) : `<td colspan="2">${e(t('shift.out'))}</td>`) + `</tr>`;
  };

  function render() {
    const sc = block.sc;
    if (!sc || !details.open) return;
    const rows = dateRows(sc.table, sc.profile, sc.sample, sc.ms, seq.table_steps, seq.table_step_hours, view.horizon_threshold_deg);
    const s = summary(rows);
    body.innerHTML =
      `<p class="shift-sum seq-sum">${e(fill(t('seq.summary'), s))}</p>` +
      `<table class="tech-table shift-table seq-table"><thead><tr><th scope="col">${e(t('seq.col.date'))}</th>` +
      `<th scope="col">${e(t('shift.col.sun'))}</th><th scope="col">${e(t('shift.col.earth'))}</th></tr></thead><tbody>` +
      rows.map((r) => row(r, sc.ms)).join('') + `</tbody></table>`;
  }

  const block = cardBlock(box, details, render);
  return block;
}
