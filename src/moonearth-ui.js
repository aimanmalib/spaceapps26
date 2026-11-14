// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Per-card block "Moon and Earth compared" (item k). Quoted values from config/moon-earth.json, motion measured from the
// card's own table. Redrawn when the scenario changes, only while the block is open.
import { fill, escapeHtml as e } from './i18n.js';
import { formatUtc } from './ephem.js';
import { signedDeg } from './facts.js';
import { rateAt, earthSpread, horizonKm, meanSunRate } from './moonearth.js';

const utc = (ms) => formatUtc(ms).replace('T', ' ');

// me = config/moon-earth.json
export function mountMoonEarth(box, { t, me }) {
  const d = me.decimals;
  const n = (v) => v.toFixed(d);
  const link = (s) => `<a href="${e(s.url)}" rel="noopener">${e(s.title)}</a>`;
  box.className = 'moonearth';
  box.innerHTML =
    `<details class="tech me-box"><summary>${e(t('me.heading'))}</summary>` +
    `<div class="me-body" aria-live="polite"></div>` +
    `<blockquote class="me-quote"><p>“${e(me.challenge_quote)}”</p><footer>— ${link(me.sources.challenge)}</footer></blockquote>` +
    `<p class="me-src">${e(t('me.sources'))} ${link(me.sources.moon)} · ${link(me.sources.earth)}.</p></details>`;
  const details = box.querySelector('details');
  const body = box.querySelector('.me-body');
  let sc = null;

  const row = (name, moon, earth) =>
    `<tr><th scope="row">${e(name)}</th><td>${e(moon)}</td><td>${e(earth)}</td></tr>`;

  function render() {
    if (!sc || !details.open) return;
    const sun = rateAt(sc.table, sc.ms, 'sun');
    const earthRate = rateAt(sc.table, sc.ms, 'earth');
    const spread = earthSpread(sc.table);
    const h = me.observer_height_m;
    const perHour = (v) => (v === null ? t('me.na') : fill(t('me.per_hour'), { v: n(v) }));
    body.innerHTML =
      `<table class="tech-table me-table"><thead><tr><th scope="col"></th>` +
      `<th scope="col">${e(t('me.col.moon'))}</th><th scope="col">${e(t('me.col.earth'))}</th></tr></thead><tbody>` +
      row(t('me.row.day'), fill(t('me.days'), { v: me.moon.synodic_period_days }), fill(t('me.hours'), { v: me.earth.length_of_day_hours })) +
      row(t('me.row.sun_rate'), perHour(sun), perHour(meanSunRate(me.earth.length_of_day_hours))) +
      row(t('me.row.air'), me.moon.surface_pressure_text, me.earth.surface_pressure_text) +
      row(fill(t('me.row.horizon'), { h }), fill(t('me.km'), { v: n(horizonKm(me.moon.radius_km, h)) }), fill(t('me.km'), { v: n(horizonKm(me.earth.radius_km, h)) })) +
      `</tbody></table>` +
      `<p class="me-note">${e(fill(t('me.sun_note'), { v: n(meanSunRate(me.moon.synodic_period_days * 24)) }))}</p>` +
      `<p class="me-earth">${e(fill(t('me.earth_sky'), {
        from: utc(spread.from), to: utc(spread.to), az: n(spread.az),
        min: signedDeg(spread.elMin, d), max: signedDeg(spread.elMax, d), rate: perHour(earthRate),
      }))}</p>`;
  }

  details.addEventListener('toggle', render);
  return {
    // s = {table (raw Sun/Earth angles), ms}
    draw(s) {
      sc = s;
      box.hidden = false;
      render();
    },
    hide() {
      sc = null;
      box.hidden = true;
    },
  };
}
