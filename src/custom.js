// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Item b (own coordinates): the extra site-list entry, the latitude/longitude fields, input checks and the table
// provider (computed in a Web Worker by src/moonsky.js, cached per point). Limits and grid come from config/custom.json.
import { fill, escapeHtml as e } from './i18n.js';
import { parseUtc } from './ephem.js';

export const CUSTOM_ID = 'custom';

// Numbers shown in text use the typographic minus, as elsewhere on the page.
const num = (v) => String(v).replace('-', '−');

export function customOptionHtml(t) {
  return `<optgroup label="${e(t('sites.group.custom'))}"><option value="${CUSTOM_ID}">${e(t('custom.option'))}</option></optgroup>`;
}

// more = extra hint values (terrain limit of ADR 0106).
export function customFieldsHtml(t, id, cfg, more = {}) {
  const field = (key, name) =>
    `<label class="field" for="${id}-${key}"><span>${e(t(`custom.${key}`))}</span>` +
    `<input id="${id}-${key}" name="${name}" type="text" autocomplete="off" spellcheck="false" aria-describedby="${id}-hint"></label>`;
  return (
    `<fieldset class="custom-fields" hidden><legend>${e(t('custom.legend'))}</legend>` +
    `<div class="custom-pair">${field('lat', 'lat')}${field('lon', 'lon')}</div>` +
    `<p class="note custom-hint" id="${id}-hint">${e(fill(t('custom.hint'), { ...more, latMin: num(cfg.lat_min), latMax: num(cfg.lat_max) }))}</p></fieldset>`
  );
}

// East longitude in [0, 360).
export function normLon(lon) {
  return lon >= 0 && lon < 360 ? lon : ((lon % 360) + 360) % 360;
}

// Text from the two fields → {lat, lon_east} or {error: 'lat' | 'lon'}.
export function parseCoords(latText, lonText, cfg) {
  const parse = (s) => (/^\s*[-+]?(\d+(\.\d*)?|\.\d+)\s*$/.test(String(s).replace('−', '-')) ? Number(String(s).replace('−', '-')) : NaN);
  const lat = parse(latText);
  const lon = parse(lonText);
  if (!(lat >= cfg.lat_min && lat <= cfg.lat_max)) return { error: 'lat' };
  if (!(lon >= cfg.lon_min && lon <= cfg.lon_max)) return { error: 'lon' };
  return { lat, lon_east: normLon(lon) };
}

export function customSite(t, p, radiusKm) {
  return { id: CUSTOM_ID, custom: true, lat: p.lat, lon_east: p.lon_east, radius_km: radiusKm, name: fill(t('custom.name'), { lat: num(p.lat), lon: num(p.lon_east) }) };
}

// Message for a rejected field ('lat' | 'lon') with the configured limits.
export function invalidText(t, field, cfg) {
  return fill(t(`custom.invalid.${field}`), { min: num(cfg[`${field}_min`]), max: num(cfg[`${field}_max`]) });
}

// Shows the fields when "Your own coordinates" is chosen; the first time, fills them with the previous site's coordinates.
export function syncFields(cardEl, prevSite, cfg) {
  const box = cardEl.querySelector('.custom-fields');
  if (!box) return;
  const on = cardEl.querySelector('select').value === CUSTOM_ID;
  box.hidden = !on;
  const [lat, lon] = box.querySelectorAll('input');
  if (on && !lat.value && !lon.value) {
    const from = prevSite ?? cfg.first_point;
    lat.value = String(from.lat);
    lon.value = String(from.lon_east);
  }
}

// Reads the card's coordinates; marks the bad field. Returns a site or {error}.
export function readCustom(t, cardEl, cfg) {
  const [lat, lon] = cardEl.querySelectorAll('.custom-fields input');
  const p = parseCoords(lat.value, lon.value, cfg);
  lat.setAttribute('aria-invalid', String(p.error === 'lat'));
  lon.setAttribute('aria-invalid', String(p.error === 'lon'));
  return p.error ? { error: p.error, name: t('custom.option') } : customSite(t, p, cfg.moon_radius_km);
}

// (site, span?) → Promise<table> on the frozen tables' grid (config/ephemeris.json); span = {startMs, endMs} on that grid,
// default the frozen tables' range (later dates, ADR 0104: src/years.js). One worker, small LRU cache.
export function makeCustomTables(cfg, eph, makeWorker) {
  const cache = new Map();
  const waiting = new Map();
  let worker = null;
  let next = 0;
  const opts = { startMs: parseUtc(eph.start), endMs: parseUtc(eph.stop), stepMinutes: eph.step_minutes, radiusKm: cfg.moon_radius_km, decimals: cfg.decimals };
  function start() {
    worker = makeWorker();
    worker.onmessage = ({ data }) => {
      const w = waiting.get(data.id);
      waiting.delete(data.id);
      if (data.error) w?.reject(new Error(data.error));
      else w?.resolve(data.table);
    };
    worker.onerror = () => {
      for (const w of waiting.values()) w.reject(new Error('worker'));
      waiting.clear();
      worker = null;
    };
  }
  return (site, span = null) => {
    const o = span ? { ...opts, startMs: span.startMs, endMs: span.endMs } : opts;
    const key = `${site.lat},${site.lon_east},${o.startMs},${o.endMs}`;
    if (!cache.has(key)) {
      if (!worker) start();
      const id = ++next;
      const p = new Promise((resolve, reject) => waiting.set(id, { resolve, reject }));
      p.catch(() => cache.delete(key));
      worker.postMessage({ id, site: { lat: site.lat, lon_east: site.lon_east }, opts: o });
      cache.set(key, p);
      if (cache.size > cfg.cache_tables) cache.delete(cache.keys().next().value);
    }
    return cache.get(key);
  };
}
