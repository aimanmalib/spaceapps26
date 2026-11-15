// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Page for teachers (teach.html): fills the activity steps and the Moon and Earth facts; Print uses the browser's print.
import sitesConfig from '../config/sites.json';
import view from '../config/view.json';
import teach from '../config/teach.json';
import me from '../config/moon-earth.json';
import shifts from '../config/shifts.json';
import ephem from '../config/ephemeris.json';
import { initPage } from './page.js';
import { fill } from './i18n.js';
import { stepsHtml, factsHtml, totalMinutes } from './teach.js';

const { t } = initPage();
const names = new Map(sitesConfig.sites.map((s) => [s.id, s.name]));
const base = new URL('./', location.href).href;
const values = { shifts: t('shift.heading'), km: shifts.location_offset_km, start: ephem.start, stop: ephem.stop };

document.getElementById('teach-heading').textContent = fill(t('teach.heading'), { minutes: totalMinutes(teach.steps) });
document.getElementById('teach-steps').innerHTML = stepsHtml({ t, cfg: teach, share: view.share, siteName: (id) => names.get(id) ?? id, base, values });
document.getElementById('teach-facts').innerHTML = factsHtml({ t, keys: teach.facts, me });
document.getElementById('teach-limits').textContent = fill(t('teach.limits'), values);
document.getElementById('teach-print').addEventListener('click', () => window.print());
