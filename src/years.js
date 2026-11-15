// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Dates past the frozen JPL Horizons tables (ADR 0104). Inside the frozen range a listed site reads its Horizons table;
// after it, the Sun/Earth angles come from the in-browser engine (src/moonsky.js) in blocks of config/years.json
// chunk_days, padded on both sides. The result always has the frozen-table shape (src/ephem.js), so the cards,
// timeline, "If the date moves" and "Next windows" work unchanged; rows up to the frozen end stay the Horizons rows.
import { parseUtc } from './ephem.js';
import { escapeHtml } from './i18n.js';

const MINUTE = 60_000;
const DAY = 1440 * MINUTE;

// {startMs, frozenEndMs, endMs, stepMs}: all accepted dates, and where the Horizons tables stop.
export function yearsRange(eph, cfg) {
  return { startMs: parseUtc(eph.start), frozenEndMs: parseUtc(eph.stop), endMs: parseUtc(cfg.stop), stepMs: eph.step_minutes * MINUTE };
}

// Span {startMs, endMs} of the table used for time ms, or null for the frozen table (and for times outside the range).
export function spanFor(ms, range, cfg) {
  const pad = cfg.pad_days * DAY;
  const len = cfg.chunk_days * DAY;
  if (!Number.isFinite(ms) || ms < range.startMs || ms > range.endMs || ms + pad <= range.frozenEndMs) return null;
  const last = Math.max(0, Math.ceil((range.endMs - range.frozenEndMs) / len) - 1);
  const k = Math.min(last, Math.max(0, Math.floor((ms - range.frozenEndMs) / len)));
  const from = range.frozenEndMs + k * len;
  return { startMs: Math.max(range.startMs, from - pad), endMs: Math.min(range.endMs, from + len + pad) };
}

// Where the angles at ms come from: 'horizons' (frozen table, listed sites) or 'engine' (in-browser).
export function sourceAt(site, ms, range) {
  return !site.custom && ms <= range.frozenEndMs ? 'horizons' : 'engine';
}

// Frozen rows up to the frozen end, then engine rows: one table on the shared hourly grid over span.
// eng covers (frozenEnd, span.endMs] or more, on the same grid.
export function mergeTables(frozen, eng, span, range) {
  const step = range.stepMs;
  const out = { ...frozen, start: new Date(span.startMs).toISOString().slice(0, 16) + 'Z', step_minutes: step / MINUTE,
    sun: { az: [], el: [] }, earth: { az: [], el: [] }, engine_from: new Date(range.frozenEndMs + step).toISOString().slice(0, 16) + 'Z' };
  const f0 = parseUtc(frozen.start);
  const e0 = parseUtc(eng.start);
  for (let ms = span.startMs; ms <= span.endMs; ms += step) {
    const [tb, i] = ms <= range.frozenEndMs ? [frozen, Math.round((ms - f0) / step)] : [eng, Math.round((ms - e0) / step)];
    for (const b of ['sun', 'earth']) {
      out[b].az.push(tb[b].az[i]);
      out[b].el.push(tb[b].el[i]);
    }
  }
  return out;
}

// frozen = siteId → Promise<frozen table>; engine = (site, {startMs, endMs}) → Promise<engine table>.
// table(site, ms) → Promise<table>; engineAt(point, ms) → Promise<table> for the nearby points (always the engine).
export function makeYears({ eph, cfg, frozen, engine }) {
  const range = yearsRange(eph, cfg);
  const cache = new Map();
  const full = { startMs: range.startMs, endMs: range.frozenEndMs };
  function table(site, ms) {
    const span = spanFor(ms, range, cfg);
    if (site.custom) return engine(site, span ?? full);
    if (!span) return frozen(site.id);
    const key = `${site.id}@${span.startMs}`;
    if (!cache.has(key)) {
      const eng = engine(site, { startMs: Math.max(span.startMs, range.frozenEndMs + range.stepMs), endMs: span.endMs });
      const p = Promise.all([frozen(site.id), eng]).then(([f, e]) => mergeTables(f, e, span, range));
      p.catch(() => cache.delete(key));
      cache.set(key, p);
      if (cache.size > cfg.cache_tables) cache.delete(cache.keys().next().value);
    }
    return cache.get(key);
  }
  const engineAt = (point, ms) => engine(point, spanFor(ms, range, cfg) ?? full);
  return { range, table, engineAt, sourceAt: (site, ms) => sourceAt(site, ms, range) };
}

// Label key for the card: Horizons table, or the engine (validated / not validated over the later years).
// check = summary from data/validation-years.json ({max_abs_deg, same_answer:{power, comm, of}}).
export function checkPassed(check, maxDiffDeg) {
  if (!check || !check.same_answer?.of) return false;
  return check.max_abs_deg <= maxDiffDeg && check.same_answer.power === check.same_answer.of && check.same_answer.comm === check.same_answer.of;
}

export function sourceKey(source, laterYears, passed) {
  if (source === 'horizons') return 'years.source.horizons';
  if (!laterYears) return 'years.source.engine';
  return passed ? 'years.source.engine' : 'years.source.engine_unchecked';
}

// One line under the horizon line of a card: which source gave this card's angles.
export function sourceHtml(t, source, laterYears, passed) {
  return `<p class="angle-source is-${source}">${escapeHtml(t(sourceKey(source, laterYears, passed)))}</p>`;
}
