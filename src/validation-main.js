// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
import sitesConfig from '../config/sites.json';
import vcfg from '../config/validation.json';
import data from '../data/validation.json';
import { initPage } from './page.js';
import pgdaCfg from '../config/pgda.json';
import { validationHtml, engineHtml, pgdaHtml } from './validation.js';
import { sampleHtml } from './validation-sample.js';

const { t } = initPage();

const names = new Map(sitesConfig.sites.map((s) => [s.id, s.name]));
const root = document.getElementById('validation');
if (root) {
  root.innerHTML =
    validationHtml(t, data, (id) => names.get(id) ?? id, vcfg.decimals_report) +
    (data.engine?.pairs?.length ? engineHtml(t, data.engine, (id) => names.get(id), vcfg.decimals_report) : '') +
    (data.pgda?.sites?.length ? pgdaHtml(t, data.pgda, (id) => names.get(id), pgdaCfg.page_url) : '') +
    (data.pgda_sample?.points?.length ? sampleHtml(t, data.pgda_sample, pgdaCfg.page_url) : '');
}
