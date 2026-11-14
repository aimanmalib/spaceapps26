// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
import en from '../i18n/en.json';
import app from '../config/app.json';
import sitesConfig from '../config/sites.json';
import view from '../config/view.json';
import features from '../config/features.json';
import { makeT, applyText } from './i18n.js';
import { mountCompare } from './compare.js';

const t = makeT(en);
applyText(document, t);

const si = document.getElementById('si-link');
if (si) si.href = app.repo_url + app.si_disclosure_path;

const root = document.getElementById('compare');
// Terrain skylines (item j) exist only for sites inside the LOLA polar grids; each loads on first use.
const horizons = Object.fromEntries(
  Object.entries(import.meta.glob('../data/horizon/*.json', { import: 'default' })).map(([path, load]) => [path.split('/').pop().replace('.json', ''), load]),
);
if (root) mountCompare(root, { t, sites: sitesConfig.sites, view, horizons, features: features.items });
