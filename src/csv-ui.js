// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// "Download CSV" (ADR 0110): one button at the foot of every card and one under the side-by-side table. The file is built
// in the browser from the tables the cards already loaded (src/csv.js) and saved through a Blob link: no server, no request.
import { fill, escapeHtml as e } from './i18n.js';
import { hourlyRows, csvText, csvName } from './csv.js';

// Kept alive a while after the click: Safari (iPhone) can still be reading the Blob when the click handler returns.
const REVOKE_AFTER_MS = 60_000;

export function downloadText(name, text, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.hidden = true;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_AFTER_MS);
}

// list = [{n, site, ms, days, table, profile, sourceAt, eclipse}] → {name, text, rows}.
export function buildCsv(list, cfg, threshold) {
  const scenarios = list.map((s) => ({
    n: s.n, site: s.site, terrain: !!s.profile,
    rows: hourlyRows({ table: s.table, profile: s.profile, fromMs: s.ms, days: s.days, threshold, sourceAt: s.sourceAt, eclipse: s.eclipse }),
  }));
  return { name: csvName(list, cfg), text: csvText(scenarios, cfg), rows: scenarios.reduce((a, s) => a + s.rows.length, 0) };
}

// A line with the button, what the file holds, and a status that speaks only after a click.
// get() → the list for buildCsv, or [] when there is no answer to save; note() → the text next to the button.
function mountLine(box, { t, cfg, threshold, label, aria, get, note }) {
  box.innerHTML =
    `<button type="button" class="btn-quiet csv-btn">${e(label)}</button>` +
    `<span class="note csv-note"></span><span class="note csv-status" role="status"></span>`;
  const btn = box.querySelector('button');
  const noteEl = box.querySelector('.csv-note');
  const status = box.querySelector('.csv-status');
  btn.addEventListener('click', () => {
    const list = get();
    if (!list.length) return;
    const out = buildCsv(list, cfg, threshold);
    downloadText(out.name, out.text);
    status.textContent = fill(t('csv.done'), { name: out.name, rows: out.rows });
  });
  return {
    // ok = there is something to save; called after every redraw of the cards.
    state(ok) {
      btn.disabled = !ok;
      if (aria) btn.setAttribute('aria-label', aria());
      noteEl.textContent = note();
      status.textContent = '';
    },
  };
}

// Card foot. days() = the card's mission length (the Mission check select), n() = its number on the page.
export function mountCardCsv(card, { t, cfg, threshold, get, days, n }) {
  const box = document.createElement('p');
  box.className = 'csv-line card-csv';
  card.append(box);
  return mountLine(box, {
    t, cfg, threshold, label: t('csv.button'),
    aria: () => fill(t('csv.aria'), { n: n() }),
    get: () => [get()].filter(Boolean),
    note: () => fill(t('csv.note'), { days: days() }),
  });
}

// Under the side-by-side table: every card in one file, one block of rows per scenario.
export function mountTableCsv(section, { t, cfg, threshold, getAll }) {
  const box = document.createElement('p');
  box.className = 'csv-line glance-csv';
  section.append(box);
  return mountLine(box, { t, cfg, threshold, label: t('csv.all_button'), get: getAll, note: () => t('csv.all_note') });
}
