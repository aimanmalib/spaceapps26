// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
import en from '../i18n/en.json';
import features from '../config/features.json';
import view from '../config/view.json';
import eph from '../config/ephemeris.json';
import { initPage } from './page.js';
import { itemsHtml, limitationsHtml } from './about.js';

const { t } = initPage();
const values = { max: view.max_scenarios, start: eph.start, stop: eph.stop };
const items = document.getElementById('about-items');
if (items) items.innerHTML = itemsHtml(t, features.items, values);
const lims = document.getElementById('about-lims');
if (lims) lims.innerHTML = limitationsHtml(t, en, values);
