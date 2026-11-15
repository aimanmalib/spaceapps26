// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Build-time page metadata (P4y): link previews and crawlers read the HTML before any script runs, so the page title,
// the description and the og: tags are written into each page from i18n/en.json (English stays the default). The same
// keys the page already names (data-i18n on <title>, data-i18n-attr on the description) are used: no text lives here.
// All links stay relative so the build works at a site root and under a sub-path (e.g. /spaceapps26/).

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// share (config/app.json share_image): one absolute image address for link previews; a real screenshot of the tool.
export function staticMeta(html, en, share) {
  const titleKey = html.match(/<title data-i18n="([^"]+)"/)?.[1];
  const descKey = html.match(/<meta name="description" content="[^"]*" data-i18n-attr="content:([^"]+)"/)?.[1];
  const title = titleKey && en[titleKey];
  const desc = descKey && en[descKey];
  let out = html;
  if (title) out = out.replace(/(<title data-i18n="[^"]+">)[^<]*(<\/title>)/, `$1${esc(title)}$2`);
  if (desc) out = out.replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(desc)}$2`);
  const tags = [
    '<link rel="icon" href="./favicon.svg" type="image/svg+xml" />',
    '<meta property="og:type" content="website" />',
    title && `<meta property="og:title" content="${esc(title)}" />`,
    desc && `<meta property="og:description" content="${esc(desc)}" />`,
    share?.url && `<meta property="og:image" content="${esc(share.url)}" />`,
    share?.url && share.width && `<meta property="og:image:width" content="${esc(share.width)}" />`,
    share?.url && share.height && `<meta property="og:image:height" content="${esc(share.height)}" />`,
    share?.url && en[share.alt_key] && `<meta property="og:image:alt" content="${esc(en[share.alt_key])}" />`,
    share?.url && '<meta name="twitter:card" content="summary_large_image" />',
  ].filter(Boolean);
  if (out.includes('rel="icon"')) return out;
  return out.replace('</head>', `    ${tags.join('\n    ')}\n  </head>`);
}
