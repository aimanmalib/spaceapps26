// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Lunar eclipses in the tables (ADR 0109): for every listed site, the frozen JPL Horizons table and then the in-browser
// engine (src/moonsky.js, as the page computes later dates, ADR 0104) up to config/years.json stop; every stretch of
// hours with part of the Sun behind Earth (src/eclipse.js) is matched with the NASA GSFC list in config/eclipses.json.
// Writes data/eclipses.json. Run: node scripts/eclipses.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { parseUtc, tableRange } from '../src/ephem.js';
import { computeTable } from '../src/moonsky.js';
import { eclipseRows, eclipseSpans } from '../src/eclipse.js';

const root = new URL('..', import.meta.url);
const read = (rel) => JSON.parse(readFileSync(new URL(rel, root), 'utf8'));
const eph = read('config/ephemeris.json');
const yearsCfg = read('config/years.json');
const custom = read('config/custom.json');
const view = read('config/view.json');
const cfg = read('config/eclipses.json');
const sites = read('config/sites.json').sites;
const radii = view.timeline.year.disc_radius_deg;
const HOUR = 3_600_000;
const iso = (ms) => new Date(ms).toISOString().slice(0, 16).replace('T', ' ');
const nasa = cfg.nasa.map((x) => ({ ...x, ms: Date.parse(`${x.date}T${x.greatest_td}Z`) }));
const stop = parseUtc(yearsCfg.stop);

const found = [];
for (const s of sites) {
  const frozen = read(`data/ephem/${s.id}.json`);
  const fr = tableRange(frozen);
  const step = frozen.step_minutes * 60_000;
  const eng = computeTable(s, { startMs: fr.endMs + step, endMs: stop, stepMinutes: eph.step_minutes, radiusKm: custom.moon_radius_km, decimals: eph.decimals });
  for (const [tb, source] of [[frozen, 'horizons'], [eng, 'engine']]) {
    const t0 = tableRange(tb).startMs;
    for (const sp of eclipseSpans(eclipseRows(tb, radii))) {
      const peakMs = t0 + sp.peak * step;
      const near = nasa.find((x) => Math.abs(x.ms - peakMs) <= cfg.match_hours * HOUR);
      found.push({
        site: s.id, source, peak_utc: iso(peakMs), from_utc: iso(t0 + sp.k0 * step), to_utc: iso(t0 + sp.k1 * step),
        rows: sp.k1 - sp.k0 + 1, max_share: +sp.share.toFixed(3), centre_rows: sp.centre,
        sun_el_at_peak: tb.sun.el[sp.peak], earth_el_at_peak: tb.earth.el[sp.peak], nasa: near ? near.date : null,
      });
    }
  }
}
const unmatched = found.filter((f) => !f.nasa);
const missed = nasa.filter((x) => x.umbral_mag > 0).flatMap((x) => sites.filter((s) => !found.some((f) => f.site === s.id && f.nasa === x.date)).map((s) => `${x.date} ${s.id}`));
const perEclipse = nasa.map((x) => {
  const f = found.filter((y) => y.nasa === x.date);
  return { date: x.date, type: x.type, umbral_mag: x.umbral_mag, sites_seen: f.length, of: sites.length,
    max_share: f.length ? Math.max(...f.map((y) => y.max_share)) : 0,
    sun_up_sites: f.filter((y) => y.sun_el_at_peak > 0).map((y) => y.site) };
});
const out = {
  generated_by: 'scripts/eclipses.mjs (Claude Code, Anthropic); inputs config/eclipses.json, config/sites.json, data/ephem, src/moonsky.js',
  rule: 'stretches of hourly rows with part of the Sun behind Earth (Sun–Earth angle below the sum of the disc radii, config/view.json)',
  radii_deg: radii,
  range: { from: eph.start, to: yearsCfg.stop },
  match_hours: cfg.match_hours,
  summary: { found: found.length, unmatched: unmatched.length, missed_umbral: missed.length, nasa: nasa.length, pass: unmatched.length === 0 && missed.length === 0 },
  per_eclipse: perEclipse,
  missed_umbral: missed,
  found,
};
writeFileSync(new URL('data/eclipses.json', root), JSON.stringify(out, null, 1) + '\n');
console.log(JSON.stringify({ summary: out.summary, per_eclipse: perEclipse }, null, 1));
