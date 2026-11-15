// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Overview page (P4s): the one-year table of every listed site from data/overview.json, sortable by column.
import sitesConfig from '../config/sites.json';
import data from '../data/overview.json';
import calendarData from '../data/calendar.json';
import calendarCfg from '../config/calendar.json';
import view from '../config/view.json';
import { initPage, lang } from './page.js';
import { fill, escapeHtml as e } from './i18n.js';
import { tableHtml, findings, defaultDir } from './overview.js';
import { mountCalendar } from './calendar-ui.js';

const { t } = initPage();
const names = new Map(sitesConfig.sites.map((s) => [s.id, s.name]));
const name = (id) => names.get(id) ?? id;
const hours = data.sites[0]?.hours ?? 0;

document.getElementById('ov-intro').textContent = fill(t('ov.intro'), { start: data.period.start, stop: data.period.stop, hours });
document.getElementById('ov-findings').innerHTML = findings(t, data, name).map((s) => `<li>${e(s)}</li>`).join('');

const root = document.getElementById('overview');
let sort = { col: 'both', dir: 'desc' };
const draw = (focusCol) => {
  root.innerHTML = tableHtml(t, data, name, sort);
  if (focusCol) root.querySelector(`.ov-sort[data-col="${focusCol}"]`)?.focus();
};
root.addEventListener('click', (ev) => {
  const col = ev.target.closest('.ov-sort')?.dataset.col;
  if (!col) return;
  sort = col === sort.col ? { col, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: defaultDir(col) };
  draw(col);
});
draw();

// Site-day calendar (ADR 0102).
mountCalendar(document.getElementById('calendar'), { t, data: calendarData, cfg: calendarCfg, share: view.share, name, lang });
