// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Loads frozen per-site tables from this site (same origin only); one request per site, cached.
const cache = new Map();

export function loadTable(basePath, siteId) {
  if (!cache.has(siteId)) {
    const p = fetch(`${basePath}${encodeURIComponent(siteId)}.json`).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    });
    p.catch(() => cache.delete(siteId));
    cache.set(siteId, p);
  }
  return cache.get(siteId);
}
