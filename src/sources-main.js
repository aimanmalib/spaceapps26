// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
import sources from '../data/SOURCES.json';
import sitesConfig from '../config/sites.json';
import meCfg from '../config/moon-earth.json';
import { initPage } from './page.js';
import { filesHtml, sitesHtml, factsHtml } from './sources.js';

const { t, app } = initPage();
const put = (id, html) => {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
};
put('src-files', filesHtml(t, sources, app.repo_url));
put('src-sites', sitesHtml(t, sitesConfig.sites));
put('src-facts', factsHtml(meCfg.sources));
const refs = document.getElementById('refs-link');
if (refs) refs.href = `${app.repo_url}/blob/main/REFERENCES.md`;
