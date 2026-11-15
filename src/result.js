// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Result HTML for one scenario: plain-language answer first, technical details in a <details> block.
import { fill, escapeHtml as e } from './i18n.js';
import { skySvg } from './sky.js';
import { horizonAt } from './terrain.js';
import { signedDeg } from './facts.js';
import { panoHtml } from './pano.js';
import { bandHtml } from './band.js';

function deg(v, decimals) {
  return v.toFixed(decimals);
}

// The large number: distance above/below the horizon used (terrain skyline or ideal sphere), so it never contradicts
// the answer and matches the small-shifts table. body = 'sky.sun' | 'sky.earth'.
function marginLabel(t, f, body, terrain, decimals) {
  const dir = t(f.margin > 0 ? 'answer.above' : 'answer.below');
  const text = fill(t(terrain ? 'answer.margin_terrain' : 'answer.margin_sphere'), { body: t(body), dir });
  return { num: `${Math.abs(f.margin).toFixed(decimals)}°`, text };
}

// Elevation line and window length fold under each answer (P4v): the Earth view below carries the picture.
function more(t, sky, f) {
  if (!sky && !f.window) return '';
  return (
    `<details class="answer-more"><summary>${e(t('answer.more'))}</summary>` +
    (sky ? `<span class="answer-sky">${e(sky)}</span>` : '') +
    (f.window ? `<span class="answer-why">${e(f.window)}<span class="answer-range">${e(f.range)}</span></span>` : '') +
    `</details>`
  );
}

// One answer: plain headline, the margin from the horizon as the large number (item f), time to set/rise (item e),
// window length (item f); on terrain sites a small line gives the Horizons elevation and the skyline behind the margin.
function status(t, kind, f, m, sky, disc, flip = false) {
  const up = f.up;
  return (
    `<li class="answer ${up ? 'is-up' : 'is-down'} answer-${kind}${flip ? ' is-flip' : ''}">` +
    `<span class="answer-dot" aria-hidden="true"></span>` +
    `<span class="answer-text"><strong>${e(t(`${kind}.${up ? 'yes' : 'no'}`))}</strong>` +
    `<span class="answer-num"><span class="answer-deg">${e(m.num)}</span>` +
    `<span class="answer-unit">${e(m.text)}</span></span>` +
    (disc ? `<span class="answer-disc is-${disc.state}">${e(disc.text)}</span>` : '') +
    (f.eclipseText ? `<span class="answer-eclipse">${e(f.eclipseText)}</span>` : '') +
    `<span class="answer-when">${e(f.timing)}</span>` +
    more(t, sky, f) +
    `</span></li>`
  );
}

// Listed sites link to the published coordinates; own coordinates (item b) say where they came from.
function source(t, site) {
  if (site.custom) return e(t('details.coords_custom'));
  return `<a href="${e(site.source.url)}" rel="noopener noreferrer">${e(fill(t('details.coords_source'), { publisher: site.source.publisher }))}</a>`;
}

function horizonKey(r) {
  if (r.profile?.ownTerrain) return 'terrainown.details';
  if (r.profile) return 'details.horizon_terrain';
  return r.site.custom ? 'details.horizon_custom' : 'details.horizon';
}

// Line under the panorama naming the horizon used; own points get the grid label of ADR 0106 or the sphere.
function kindKey(r) {
  if (r.profile?.ownTerrain) {
    if (r.profile.grid_m === r.own?.pole) return 'terrainown.horizon_pole';
    return r.profile.grid_m === r.own?.fine ? 'terrainown.horizon' : 'terrainown.horizon_outer';
  }
  if (r.profile) return 'horizon.terrain';
  if (r.site.custom) return r.terrainFailed ? 'terrainown.failed' : 'horizon.custom';
  return 'horizon.sphere';
}

// Near-horizon strip (terrain sites): the same panorama at ±view.near_horizon_deg, so the gap between the Sun/Earth
// and the skyline is visible (polar angles are a few degrees; the shared scale above can be ±90°).
function nearStrip(t, r, view, ticks) {
  const s = view.near_horizon_deg;
  const aria = fill(t('sky.near_aria'), { deg: s, sm: r.facts.sun.marginText, em: r.facts.earth.marginText });
  return (
    `<figure class="sky sky-near">` +
    `<div class="sky-plot" role="img" aria-label="${e(aria)}">` +
    `<span class="sky-el sky-el-top">+${s}°</span><span class="sky-el sky-el-mid">0°</span><span class="sky-el sky-el-bottom">−${s}°</span>` +
    skySvg(r.sample, s, r.up, r.profile) +
    `</div><div class="sky-axis" aria-hidden="true">${ticks}</div>` +
    `<figcaption class="sky-legend">${e(fill(t('sky.near_caption'), { deg: s }))}</figcaption></figure>`
  );
}

// r = {site, sample, up:{sun,earth}, scale, facts:{sun,earth}} (facts from facts.js); view = config/view.json.
export function resultHtml(t, r, view) {
  const d = view.decimals;
  const { sun, earth } = r.sample;
  // Horizons elevation + terrain skyline elevation at the body's azimuth (item j); none for the ideal sphere.
  const skyAt = (b, kind) =>
    r.profile
      ? fill(t(r.source === 'engine' ? 'years.el_line' : 'answer.el_line'), { label: t(`${kind}.el_label`), el: r.facts[b].elText, sky: signedDeg(horizonAt(r.profile, r.sample[b].az), d) })
      : null;
  // Three-state disc label (P4u): whole disc / partly hidden / hidden, against the horizon used.
  const discAt = (b) =>
    r.disc ? { state: r.disc[b], text: fill(t(`disc.${b}.${r.disc[b]}`), { line: t(r.profile ? 'disc.line_terrain' : 'disc.line_sphere') }) } : null;
  // A Sun behind Earth (lunar eclipse seen from the site, ADR 0109): the large number is the share of the Sun hidden.
  const answer = (kind, b, body) => status(t, kind, r.facts[b], r.facts[b].eclipseNum ?? marginLabel(t, r.facts[b], body, !!r.profile, d), skyAt(b, kind), discAt(b), !!r.range?.judge[b].flip);
  const row = (name, p) => `<tr><th scope="row">${e(t(name))}</th><td>${deg(p.az, d)}°</td><td>${deg(p.el, d)}°</td></tr>`;
  const ticks = ['0', '90', '180', '270', '360']
    .map((a) => `<span class="sky-az" style="left:${(+a / 360) * 100}%">${e(t(`sky.az.${a}`))}</span>`)
    .join('');
  return (
    panoHtml(t, r, view) +
    `<ul class="answers">${answer('power', 'sun', 'sky.sun')}${answer('comm', 'earth', 'sky.earth')}${r.range ? bandHtml(t, r.range.band, r.range.judge) : ''}</ul>` +
    `<figure class="sky">` +
    `<div class="sky-plot" role="img" aria-label="${e(fill(t('sky.aria'), { saz: deg(sun.az, 0), sel: deg(sun.el, d), eaz: deg(earth.az, 0), eel: deg(earth.el, d) }))}">` +
    `<span class="sky-el sky-el-top">+${r.scale}°</span><span class="sky-el sky-el-mid">0°</span>` +
    `<span class="sky-el sky-el-bottom">−${r.scale}°</span>` +
    skySvg(r.sample, r.scale, r.up, r.profile) +
    `</div><div class="sky-axis" aria-hidden="true">${ticks}</div>` +
    `<figcaption class="sky-legend"><span class="key key-sun">${e(t('sky.sun'))}</span>` +
    `<span class="key key-earth">${e(t('sky.earth'))}</span><span class="key key-down">${e(t('sky.below'))}</span>` +
    `<span class="key-line">${e(t(r.profile ? 'sky.terrain' : 'sky.sphere'))}</span></figcaption>` +
    `</figure>` +
    (r.profile ? nearStrip(t, r, view, ticks) : '') +
    `<p class="horizon-kind">${e(fill(t(kindKey(r)), r.own ?? {}))}</p>` +
    `<details class="tech"><summary>${e(t('details.summary'))}</summary>` +
    `<table class="tech-table"><thead><tr><th scope="col">${e(t('details.body'))}</th><th scope="col">${e(t('details.az'))}</th>` +
    `<th scope="col">${e(t('details.el'))}</th></tr></thead><tbody>${row('sky.sun', sun)}${row('sky.earth', earth)}</tbody></table>` +
    `<p>${e(fill(t('details.coords'), { lat: r.site.lat, lon: r.site.lon_east }))} ${source(t, r.site)}</p>` +
    `<p>${e(t(r.site.custom ? 'details.data_custom' : r.source === 'engine' ? 'years.details_data' : 'details.data'))}</p>` +
    `<p>${e(fill(t(horizonKey(r)), { ...r.own, threshold: view.horizon_threshold_deg, h: r.profile?.observer_height_m, r: r.site.radius_km }))}</p>` +
    `<p>${e(fill(t('details.scale'), { scale: r.scale }))}</p><p>${e(t('details.windows'))}</p></details>`
  );
}
