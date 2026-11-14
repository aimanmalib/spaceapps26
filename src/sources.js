// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Data sources page: every frozen file in data/ with where it came from (data/SOURCES.json), every site coordinate with the
// page it was copied from (config/sites.json), and the quoted NASA fact sheets (config/moon-earth.json).
import { escapeHtml as e } from './i18n.js';

const link = (url, text) => `<a href="${e(url)}" rel="noopener">${e(text)}</a>`;

// Short readable label for a long request URL: host + path, without the query.
export function shortUrl(url) {
  try {
    const u = new URL(url);
    return u.host + u.pathname;
  } catch {
    return String(url);
  }
}

// Horizons requests differ only by COMMAND (10 = Sun, 399 = Earth): name the body after the short URL.
export function urlLabel(t, url) {
  let cmd = null;
  try {
    cmd = new URL(url).searchParams.get('COMMAND')?.replace(/'/g, '') ?? null;
  } catch {
    cmd = null;
  }
  const key = `sources.cmd.${cmd}`;
  return cmd && t(key) !== key ? `${shortUrl(url)} — ${t(key)}` : shortUrl(url);
}

function sourceLinks(t, f) {
  const urls = f.urls?.length ? f.urls : [f.url];
  const out = urls.map((u) => link(u, urlLabel(t, u)));
  if (f.pgda) out.push(...f.pgda.urls.map((u) => link(u, shortUrl(u))));
  return out.join('<br>');
}

export function filesHtml(t, sources, repoUrl) {
  const rows = sources.files.map((f) => {
    const credit = [f.license, f.pgda?.license].filter(Boolean).map(e).join('<br>');
    return `<li class="src-item"><h3 class="src-file">${link(`./data/${f.file}`, `data/${f.file}`)}</h3><dl class="src-dl">` +
      `<dt>${e(t('sources.col.source'))}</dt><dd>${sourceLinks(t, f)}</dd>` +
      `<dt>${e(t('sources.col.retrieved'))}</dt><dd>${e(f.retrieved_at)}</dd>` +
      `<dt>${e(t('sources.col.script'))}</dt><dd>${link(`${repoUrl}/blob/main/${f.script}`, f.script)}</dd>` +
      `<dt>${e(t('sources.col.credit'))}</dt><dd>${credit}</dd></dl></li>`;
  });
  return `<ul class="src-list">${rows.join('')}</ul>`;
}

export function sitesHtml(t, sites) {
  const rows = sites.map((s) => `<li class="src-item"><h3 class="src-file">${e(s.name)}</h3><dl class="src-dl">` +
    `<dt>${e(t('sources.col.coords'))}</dt><dd>${e(s.source.text)}</dd>` +
    `<dt>${e(t('sources.col.publisher'))}</dt><dd>${link(s.source.url, s.source.publisher)}</dd></dl></li>`);
  return `<ul class="src-list">${rows.join('')}</ul>`;
}

export function factsHtml(meSources) {
  return `<ul class="src-plain">${Object.values(meSources).map((s) => `<li>${link(s.url, s.title)}</li>`).join('')}</ul>`;
}
