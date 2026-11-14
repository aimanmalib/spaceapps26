// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Result HTML for one scenario: plain-language answer first, technical details in a <details> block.
import { fill, escapeHtml as e } from './i18n.js';
import { skySvg } from './sky.js';
import { horizonAt } from './terrain.js';
import { signedDeg } from './facts.js';

function deg(v, decimals) {
  return v.toFixed(decimals);
}

// One answer: plain headline, the elevation as the large number (item f), time to set/rise (item e), window length (item f).
function status(t, kind, f, sky) {
  const up = f.up;
  return (
    `<li class="answer ${up ? 'is-up' : 'is-down'} answer-${kind}">` +
    `<span class="answer-dot" aria-hidden="true"></span>` +
    `<span class="answer-text"><strong>${e(t(`${kind}.${up ? 'yes' : 'no'}`))}</strong>` +
    `<span class="answer-num"><span class="answer-deg">${e(f.elText)}</span>` +
    `<span class="answer-unit">${e(t(`${kind}.el_label`))}</span></span>` +
    `<span class="answer-when">${e(f.timing)}</span>` +
    (sky ? `<span class="answer-sky">${e(sky)}</span>` : '') +
    (f.window ? `<span class="answer-why">${e(f.window)}<span class="answer-range">${e(f.range)}</span></span>` : '') +
    `</span></li>`
  );
}

// Listed sites link to the published coordinates; own coordinates (item b) say where they came from.
function source(t, site) {
  if (site.custom) return e(t('details.coords_custom'));
  return `<a href="${e(site.source.url)}" rel="noopener noreferrer">${e(fill(t('details.coords_source'), { publisher: site.source.publisher }))}</a>`;
}

function horizonKey(r) {
  if (r.profile) return 'details.horizon_terrain';
  return r.site.custom ? 'details.horizon_custom' : 'details.horizon';
}

// r = {site, sample, up:{sun,earth}, scale, facts:{sun,earth}} (facts from facts.js); view = config/view.json.
export function resultHtml(t, r, view) {
  const d = view.decimals;
  const { sun, earth } = r.sample;
  // Terrain skyline elevation at the body's azimuth (item j); none for the ideal sphere.
  const skyAt = (b) => (r.profile ? fill(t('sky.skyline_at'), { el: signedDeg(horizonAt(r.profile, r.sample[b].az), d) }) : null);
  const row = (name, p) => `<tr><th scope="row">${e(t(name))}</th><td>${deg(p.az, d)}°</td><td>${deg(p.el, d)}°</td></tr>`;
  const ticks = ['0', '90', '180', '270', '360']
    .map((a) => `<span class="sky-az" style="left:${(+a / 360) * 100}%">${e(t(`sky.az.${a}`))}</span>`)
    .join('');
  return (
    `<ul class="answers">${status(t, 'power', r.facts.sun, skyAt('sun'))}${status(t, 'comm', r.facts.earth, skyAt('earth'))}</ul>` +
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
    `<p class="horizon-kind">${e(t(r.profile ? 'horizon.terrain' : r.site.custom ? 'horizon.custom' : 'horizon.sphere'))}</p>` +
    `<details class="tech"><summary>${e(t('details.summary'))}</summary>` +
    `<table class="tech-table"><thead><tr><th scope="col">${e(t('details.body'))}</th><th scope="col">${e(t('details.az'))}</th>` +
    `<th scope="col">${e(t('details.el'))}</th></tr></thead><tbody>${row('sky.sun', sun)}${row('sky.earth', earth)}</tbody></table>` +
    `<p>${e(fill(t('details.coords'), { lat: r.site.lat, lon: r.site.lon_east }))} ${source(t, r.site)}</p>` +
    `<p>${e(t(r.site.custom ? 'details.data_custom' : 'details.data'))}</p>` +
    `<p>${e(fill(t(horizonKey(r)), { threshold: view.horizon_threshold_deg, h: r.profile?.observer_height_m, r: r.site.radius_km }))}</p>` +
    `<p>${e(fill(t('details.scale'), { scale: r.scale }))}</p><p>${e(t('details.windows'))}</p></details>`
  );
}
