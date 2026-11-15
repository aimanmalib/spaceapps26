// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Interface language (P4t): English by default; ?lang=<code> picks one of the languages in config/lang.json. No storage.

// The language code asked for in the address, or the default when it is missing or not offered.
export function pickLang(search, cfg) {
  const want = new URLSearchParams(search).get(cfg.param);
  return cfg.languages.some((l) => l.code === want) ? want : cfg.default;
}

// The same address with the language set (the default language removes the parameter); other parameters are kept.
export function withLang(href, code, cfg, base) {
  const url = new URL(href, base);
  if (code === cfg.default) url.searchParams.delete(cfg.param);
  else url.searchParams.set(cfg.param, code);
  return url.href;
}

// True for a link to one of this site's own pages (same origin, an .html page or a folder), which should keep the language.
export function isOwnPage(href, base) {
  let url;
  try { url = new URL(href, base); } catch { return false; }
  if (url.origin !== new URL(base).origin) return false;
  return /(\.html|\/)$/.test(url.pathname);
}
