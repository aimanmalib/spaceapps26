// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Download CSV (ADR 0110): the hourly table behind a card's answers for its mission period, as text. Pure functions; the
// button and the Blob download are src/csv-ui.js. Rows = the same hourly rows and the same rule as the Mission check
// (src/metrics.js periodRows; centre of the disc above the horizon used, view.horizon_threshold_deg).
import { formatUtc, isAbove, parseUtc } from './ephem.js';
import { horizonAt } from './terrain.js';
import { periodRows } from './metrics.js';

const MINUTE = 60_000;

// The file's schema. *_horizon_deg = elevation of the horizon used at that body's azimuth (LOLA skyline, or 0 on the
// ideal sphere); power / earth_link = that body's centre is above it; angle_source = where the az/el come from.
export const CSV_COLUMNS = [
  'scenario', 'site', 'time_utc',
  'sun_azimuth_deg', 'sun_elevation_deg', 'sun_horizon_deg', 'power',
  'earth_azimuth_deg', 'earth_elevation_deg', 'earth_horizon_deg', 'earth_link',
  'horizon', 'angle_source',
];

// One period of the table: profile = terrain skyline or null (ideal sphere); sourceAt(ms) → 'horizons' | 'engine'.
export function hourlyRows({ table, profile, fromMs, days, threshold = 0, sourceAt = () => 'horizons' }) {
  const { k0, k1 } = periodRows(table, fromMs, days);
  const start = parseUtc(table.start);
  const step = table.step_minutes * MINUTE;
  const rows = [];
  for (let k = k0; k < k1; k++) {
    const ms = start + k * step;
    const body = (b) => {
      const az = table[b].az[k];
      const el = table[b].el[k];
      const horizon = profile ? horizonAt(profile, az) : 0;
      return { az, el, horizon, up: isAbove(el - horizon, threshold) };
    };
    rows.push({ ms, sun: body('sun'), earth: body('earth'), source: sourceAt(ms) });
  }
  return rows;
}

// RFC 4180 field: quoted when it holds a comma, quote or line break. Text that a spreadsheet would run as a formula
// (= + - @ first) gets a leading apostrophe; numbers are written as numbers.
export function csvField(v) {
  if (typeof v === 'number') return String(v);
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// scenarios = [{n, site: {name}, terrain: bool, rows: hourlyRows()}] in card order → CSV text (header + one line per row).
export function csvText(scenarios, cfg) {
  const num = (v) => Number(v.toFixed(cfg.decimals));
  const yn = (up) => (up ? cfg.yes : cfg.no);
  const lines = [CSV_COLUMNS.join(',')];
  for (const s of scenarios) {
    const horizon = cfg.horizon[s.terrain ? 'terrain' : 'sphere'];
    for (const r of s.rows) {
      lines.push([
        s.n, s.site.name, formatUtc(r.ms) + 'Z',
        num(r.sun.az), num(r.sun.el), num(r.sun.horizon), yn(r.sun.up),
        num(r.earth.az), num(r.earth.el), num(r.earth.horizon), yn(r.earth.up),
        horizon, cfg.source[r.source] ?? r.source,
      ].map(csvField).join(','));
    }
  }
  return (cfg.bom ? '﻿' : '') + lines.join('\r\n') + '\r\n';
}

// Listed sites use their id; own coordinates use the numbers. Only [a-z0-9._-] is kept.
export function siteSlug(site) {
  const raw = site.custom ? `custom_${site.lat}_${site.lon_east}` : site.id;
  return String(raw).toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'site';
}

// parts = [{site, ms, days}] → "<prefix>_<site>_<YYYY-MM-DD>_<days>d[_vs_…].csv".
export function csvName(parts, cfg) {
  const one = (p) => `${siteSlug(p.site)}_${formatUtc(p.ms).slice(0, 10)}_${String(p.days).replace('.', '-')}d`;
  const name = `${cfg.file_prefix}_${parts.map(one).join('_vs_')}`;
  return `${name.slice(0, cfg.max_name_chars)}.csv`;
}
