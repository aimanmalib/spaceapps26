// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Shareable link (SI suggestion chosen by the author, 15 Nov): the scenarios as a query string, one "s" value per card:
// "<site id>,<YYYY-MM-DDTHH:MM>" (UTC) or "custom,<lat>,<lon east>,<YYYY-MM-DDTHH:MM>". No storage, nothing personal.
// Also the plain verdict sentence and the "Now" time. Settings: config/view.json "share".
import { fill } from './i18n.js';
import { parseUtc, formatUtc } from './ephem.js';
import { CUSTOM_ID, parseCoords } from './custom.js';

// scenarios = [{site, time_utc, coords?: [lat, lon]}] → "?s=…&s=…".
export function encodeScenarios(scenarios, cfg) {
  const one = (sc) => [sc.site, ...(sc.site === CUSTOM_ID ? (sc.coords ?? []).map((v) => String(v).trim().replace('−', '-')) : []), sc.time_utc];
  return '?' + scenarios.map((sc) => `${cfg.param}=${one(sc).map(encodeURIComponent).join(cfg.separator).replace(/%3A/g, ':')}`).join('&');
}

// Query string → {scenarios, rejected}. Unknown sites, bad times or bad coordinates are skipped and counted; extra
// scenarios beyond max are counted too. No "s" values = {scenarios: [], rejected: 0} (the page keeps its defaults).
export function decodeScenarios(search, { cfg, siteIds, max, custom }) {
  const values = new URLSearchParams(search).getAll(cfg.param);
  const scenarios = [];
  let rejected = 0;
  for (const v of values) {
    const sc = parseOne(v.split(cfg.separator), siteIds, custom);
    if (sc && scenarios.length < max) scenarios.push(sc);
    else rejected++;
  }
  return { scenarios, rejected };
}

function parseOne(parts, siteIds, custom) {
  const time = parts[parts.length - 1];
  // Exact "YYYY-MM-DDTHH:MM" that maps back to itself (no rolled-over month 13 or day 40).
  const ms = parseUtc(time);
  if (!Number.isFinite(ms) || formatUtc(ms) !== time) return null;
  const time_utc = time;
  if (parts[0] === CUSTOM_ID) {
    if (!custom || parts.length !== 4 || parseCoords(parts[1], parts[2], custom).error) return null;
    return { site: CUSTOM_ID, time_utc, coords: [parts[1], parts[2]] };
  }
  return parts.length === 2 && siteIds.has(parts[0]) ? { site: parts[0], time_utc } : null;
}

// Current time rounded down to the step, or null when outside [startMs, endMs] of the data.
export function nowTime(nowMs, { startMs, endMs }, stepMinutes) {
  const step = stepMinutes * 60_000;
  const ms = Math.floor(nowMs / step) * step;
  return ms >= startMs && ms <= endMs ? formatUtc(ms) : null;
}

// One plain sentence from the same two answers as the card (up = {sun, earth}); disc = {sun, earth} three-state
// labels (src/disc.js) add one short sentence for each disc that is only partly above the horizon.
export function verdictText(t, siteName, up, disc = null) {
  const key = up.sun ? (up.earth ? 'both' : 'sun') : up.earth ? 'earth' : 'none';
  const part = disc ? ['sun', 'earth'].filter((b) => disc[b] === 'part').map((b) => ' ' + t(`verdict.part_${b}`)).join('') : '';
  return fill(t(`verdict.${key}`), { site: siteName }) + part;
}
