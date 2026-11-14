// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Shared start for every page: fill [data-i18n] text and point the footer link at SI-DISCLOSURE.md in the repository.
import en from '../i18n/en.json';
import app from '../config/app.json';
import { makeT, applyText } from './i18n.js';

export function initPage(doc = document) {
  const t = makeT(en);
  applyText(doc, t);
  const si = doc.getElementById('si-link');
  if (si) si.href = app.repo_url + app.si_disclosure_path;
  return { t, app };
}
