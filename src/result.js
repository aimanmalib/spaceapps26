// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Result HTML for one scenario: plain-language answer first, technical details in a <details> block.
import { fill, escapeHtml as e } from './i18n.js';
import { skySvg } from './sky.js';

function deg(v, decimals) {
  return v.toFixed(decimals);
}

function status(t, kind, up, el, decimals) {
  const key = `${kind}.${up ? 'up' : 'down'}`;
  const meaning = t(`${kind}.${up ? 'yes' : 'no'}`);
  return (
    `<li class="answer ${up ? 'is-up' : 'is-down'} answer-${kind}">` +
    `<span class="answer-dot" aria-hidden="true"></span>` +
    `<span class="answer-text"><strong>${e(meaning)}</strong>` +
    `<span class="answer-why">${e(fill(t(key), { deg: deg(Math.abs(el), decimals) }))}</span></span></li>`
  );
}

// r = {site, sample, up:{sun,earth}, scale}; view = config/view.json.
export function resultHtml(t, r, view) {
  const d = view.decimals;
  const { sun, earth } = r.sample;
  const row = (name, p) => `<tr><th scope="row">${e(t(name))}</th><td>${deg(p.az, d)}°</td><td>${deg(p.el, d)}°</td></tr>`;
  const ticks = ['0', '90', '180', '270', '360']
    .map((a) => `<span class="sky-az" style="left:${(+a / 360) * 100}%">${e(t(`sky.az.${a}`))}</span>`)
    .join('');
  return (
    `<ul class="answers">${status(t, 'power', r.up.sun, sun.el, d)}${status(t, 'comm', r.up.earth, earth.el, d)}</ul>` +
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
    `<p>${e(fill(t('details.scale'), { scale: r.scale }))}</p></details>`
  );
}
