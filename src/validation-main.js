// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
import en from '../i18n/en.json';
import app from '../config/app.json';
import sitesConfig from '../config/sites.json';
import vcfg from '../config/validation.json';
import data from '../data/validation.json';
import { makeT, applyText } from './i18n.js';
import pgdaCfg from '../config/pgda.json';
import { validationHtml, engineHtml, pgdaHtml } from './validation.js';

const t = makeT(en);
applyText(document, t);

const si = document.getElementById('si-link');
if (si) si.href = app.repo_url + app.si_disclosure_path;

const names = new Map(sitesConfig.sites.map((s) => [s.id, s.name]));
const root = document.getElementById('validation');
if (root) {
  root.innerHTML =
    validationHtml(t, data, (id) => names.get(id) ?? id, vcfg.decimals_report) +
    (data.engine?.pairs?.length ? engineHtml(t, data.engine, (id) => names.get(id), vcfg.decimals_report) : '') +
    (data.pgda?.sites?.length ? pgdaHtml(t, data.pgda, (id) => names.get(id), pgdaCfg.page_url) : '');
}
