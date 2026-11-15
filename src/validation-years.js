// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Validation page: the in-browser engine against JPL Horizons for dates after the frozen tables (ADR 0104,
// data/validation-years.json, scripts/validate_years.py). Numbers come straight from the file.
import { fill, escapeHtml as e } from './i18n.js';

const QUANTITIES = ['sun_az', 'sun_el', 'earth_az', 'earth_el'];

// Largest azimuth difference and how far that body was from the zenith (azimuth is undefined there; ADR 0113).
function worstAz(y, deg) {
  let w = null;
  for (const r of y.pairs) for (const b of ['sun', 'earth']) if (!w || Math.abs(r.diff[b].az) > w.v) w = { v: Math.abs(r.diff[b].az), site: r.site, el: r.horizons[b].el };
  return w ? { az: deg(w.v), site: w.site, zd: `${(90 - Math.abs(w.el)).toFixed(2)}°` } : { az: '', site: '', zd: '' };
}

// y = data/validation-years.json; d = decimals shown (config/validation.json "decimals_report").
export function yearsHtml(t, y, d) {
  const s = y.summary;
  const deg = (v) => `${Number(v).toFixed(d)}°`;
  const rows = QUANTITIES.map((q) =>
    `<tr><th scope="row">${e(t(`val.q.${q}`))}</th><td>${deg(s.by_quantity[q].max_abs_deg)}</td><td>${deg(s.by_quantity[q].mean_abs_deg)}</td></tr>`).join('');
  const heading = t('val.years.heading');
  const lastYear = Number(y.to.slice(0, 4)) - (y.to.slice(5, 10) === '01-01' ? 1 : 0);
  return (
    `<h2 id="later-years">${e(heading)}</h2>` +
    `<p>${e(fill(t('val.years.intro'), {
      n: y.pairs.length, from: y.from.slice(0, 4), to: lastYear, max: Number(s.max_abs_deg).toFixed(d), mean: Number(s.mean_abs_deg).toFixed(d),
      power: s.same_answer.power, comm: s.same_answer.comm, of: s.same_answer.of, limit: y.max_sky_deg,
    }))}</p>` +
    `<div class="table-scroll" tabindex="0" role="region" aria-label="${e(heading)}"><table class="data-table"><thead><tr>` +
    `<th scope="col">${e(t('val.col.quantity'))}</th><th scope="col">${e(t('val.col.max'))}</th><th scope="col">${e(t('val.col.mean'))}</th>` +
    `</tr></thead><tbody>${rows}</tbody></table></div>` +
    (s.sky_separation ? `<p class="data-label">${e(fill(t('val.years.sky'), { sun: deg(s.sky_separation.sun.max_deg), earth: deg(s.sky_separation.earth.max_deg), ...worstAz(y, deg) }))}</p>` : '') +
    `<p class="data-label">${e(fill(t('val.years.generated'), { at: y.generated_at, seed: y.seed }))}</p>`
  );
}
