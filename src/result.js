// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Result HTML for one scenario: plain-language answer first, technical details in a <details> block.
import { fill, escapeHtml as e } from './i18n.js';
import { skySvg } from './sky.js';

function deg(v, decimals) {
  return v.toFixed(decimals);
}

// One answer: plain headline, the elevation as the large number (item f), time to set/rise (item e), window length (item f).
function status(t, kind, f) {
  const up = f.up;
  return (
    `<li class="answer ${up ? 'is-up' : 'is-down'} answer-${kind}">` +
    `<span class="answer-dot" aria-hidden="true"></span>` +
    `<span class="answer-text"><strong>${e(t(`${kind}.${up ? 'yes' : 'no'}`))}</strong>` +
    `<span class="answer-num"><span class="answer-deg">${e(f.elText)}</span>` +
    `<span class="answer-unit">${e(t(`${kind}.el_label`))}</span></span>` +
    `<span class="answer-when">${e(f.timing)}</span>` +
    (f.window ? `<span class="answer-why">${e(f.window)}<span class="answer-range">${e(f.range)}</span></span>` : '') +
    `</span></li>`
  );
}

// r = {site, sample, up:{sun,earth}, scale, facts:{sun,earth}} (facts from facts.js); view = config/view.json.
export function resultHtml(t, r, view) {
  const d = view.decimals;
  const { sun, earth } = r.sample;
  const row = (name, p) => `<tr><th scope="row">${e(t(name))}</th><td>${deg(p.az, d)}°</td><td>${deg(p.el, d)}°</td></tr>`;
  const ticks = ['0', '90', '180', '270', '360']
    .map((a) => `<span class="sky-az" style="left:${(+a / 360) * 100}%">${e(t(`sky.az.${a}`))}</span>`)
    .join('');
  return (
    `<ul class="answers">${status(t, 'power', r.facts.sun)}${status(t, 'comm', r.facts.earth)}</ul>` +
    `<figure class="sky">` +
    `<div class="sky-plot" role="img" aria-label="${e(fill(t('sky.aria'), { saz: deg(sun.az, 0), sel: deg(sun.el, d), eaz: deg(earth.az, 0), eel: deg(earth.el, d) }))}">` +
    `<span class="sky-el sky-el-top">+${r.scale}°</span><span class="sky-el sky-el-mid">0°</span>` +
    `<span class="sky-el sky-el-bottom">−${r.scale}°</span>` +
    skySvg(r.sample, r.scale, r.up) +
    `</div><div class="sky-axis" aria-hidden="true">${ticks}</div>` +
    `<figcaption class="sky-legend"><span class="key key-sun">${e(t('sky.sun'))}</span>` +
    `<span class="key key-earth">${e(t('sky.earth'))}</span><span class="key key-down">${e(t('sky.below'))}</span></figcaption>` +
    `</figure>` +
    `<details class="tech"><summary>${e(t('details.summary'))}</summary>` +
    `<table class="tech-table"><thead><tr><th scope="col">${e(t('details.body'))}</th><th scope="col">${e(t('details.az'))}</th>` +
    `<th scope="col">${e(t('details.el'))}</th></tr></thead><tbody>${row('sky.sun', sun)}${row('sky.earth', earth)}</tbody></table>` +
    `<p>${e(fill(t('details.coords'), { lat: r.site.lat, lon: r.site.lon_east }))} ` +
    `<a href="${e(r.site.source.url)}" rel="noopener noreferrer">${e(fill(t('details.coords_source'), { publisher: r.site.source.publisher }))}</a></p>` +
    `<p>${e(t('details.data'))}</p><p>${e(fill(t('details.horizon'), { threshold: view.horizon_threshold_deg }))}</p>` +
    `<p>${e(fill(t('details.scale'), { scale: r.scale }))}</p><p>${e(t('details.windows'))}</p></details>`
  );
}
