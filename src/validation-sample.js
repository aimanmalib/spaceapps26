// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// P4q: the terrain-horizon check against NASA PGDA at many random points (data/validation.json "pgda_sample").
// Numbers come straight from the file; the scatter charts are drawn from its rows (nothing is recomputed here).
import { fill, escapeHtml as e } from './i18n.js';

const BODIES = ['sun', 'earth'];
const pp = (v) => (v * 100).toFixed(1);

// One square scatter chart: x = PGDA value, y = this tool, both 0–100 %, with the y = x line. Pure SVG, no script.
export function scatterSvg(points, body, label, size = 240, pad = 34, end = 16) {
  const span = size - pad - end; // room left/below for tick labels, right/top so the last label is not cut
  const x = (v) => pad + v * span;
  const y = (v) => size - pad - v * span;
  const ticks = [0, 0.5, 1]
    .map((v) =>
      `<line class="sc-grid" x1="${x(v)}" y1="${y(0)}" x2="${x(v)}" y2="${y(1)}"/>` +
      `<line class="sc-grid" x1="${x(0)}" y1="${y(v)}" x2="${x(1)}" y2="${y(v)}"/>` +
      `<text class="sc-tick" x="${x(v)}" y="${size - pad + 14}" text-anchor="middle">${v * 100}</text>` +
      `<text class="sc-tick" x="${pad - 6}" y="${y(v) + 4}" text-anchor="end">${v * 100}</text>`)
    .join('');
  const dots = points
    .map((p) => `<circle class="sc-dot sc-${body}" cx="${x(p.pgda[body].value).toFixed(1)}" cy="${y(p.tool[body]).toFixed(1)}" r="3"/>`)
    .join('');
  return (
    `<svg class="sc-svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="${e(label)}">` +
    ticks +
    `<line class="sc-one" x1="${x(0)}" y1="${y(0)}" x2="${x(1)}" y2="${y(1)}"/>` +
    dots +
    '</svg>'
  );
}

export function sampleHtml(t, s, page) {
  const row = (b) =>
    `<tr><th scope="row">${e(t(`val.sample.${b}`))}</th><td>${pp(s[b].median_abs)}</td><td>${pp(s[b].p90_abs)}</td>` +
    `<td>${pp(s[b].max_abs)}</td><td>${e(fill(t('val.of'), { n: s[b].within_window, of: s.count }))}</td></tr>`;
  const charts = BODIES.map((b) => {
    const label = fill(t('val.sample.chart'), { body: t(`val.sample.${b}`), n: s.count });
    return `<figure class="sc-fig">${scatterSvg(s.points, b, label)}<figcaption>${e(label)}</figcaption></figure>`;
  }).join('');
  const heading = t('val.sample.heading');
  return (
    `<h2>${e(heading)}</h2>` +
    `<p>${e(fill(t('val.sample.intro'), { n: s.count, lat: Math.abs(s.lat_max), seed: s.seed }))}</p>` +
    `<div class="table-scroll" tabindex="0" role="region" aria-label="${e(heading)}">` +
    `<table class="data-table"><thead><tr><th scope="col"></th><th scope="col">${e(t('val.sample.col.median'))}</th>` +
    `<th scope="col">${e(t('val.sample.col.p90'))}</th><th scope="col">${e(t('val.sample.col.max'))}</th>` +
    `<th scope="col">${e(fill(t('val.sample.col.within'), { n: s.window_px }))}</th></tr></thead>` +
    `<tbody>${BODIES.map(row).join('')}</tbody></table></div>` +
    `<div class="sc-row">${charts}</div>` +
    `<p class="data-label">${e(t('val.sample.method'))}</p>` +
    `<p class="data-label">${e(fill(t('val.sample.generated'), { at: s.generated_at }))} ` +
    `<a href="${e(page)}" rel="noopener noreferrer">${e(t('val.pgda.source'))}</a></p>`
  );
}
