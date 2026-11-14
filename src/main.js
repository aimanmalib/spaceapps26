// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
import en from '../i18n/en.json';
import app from '../config/app.json';
import { makeT, applyText } from './i18n.js';

const t = makeT(en);
applyText(document, t);

const si = document.getElementById('si-link');
if (si) si.href = app.repo_url + app.si_disclosure_path;
