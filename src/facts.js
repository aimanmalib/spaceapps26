// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Key numbers for one scenario as plain text: elevation, time to set/rise (item e), length of the window (item f).
// Shared by the scenario card and the side-by-side table so both always say the same thing.
import { fill } from './i18n.js';
import { formatUtc } from './ephem.js';
import { windowAt, durationParts } from './windows.js';

export const BODIES = ['sun', 'earth'];

export function duration(t, ms) {
  return durationParts(ms)
    .map((p) => fill(t(`dur.${p.unit}`), { n: p.n }))
    .join(' ');
}

function utc(ms) {
  return formatUtc(ms).replace('T', ' ');
}

export function signedDeg(el, decimals) {
  const v = Math.abs(el).toFixed(decimals);
  return `${el > 0 && +v > 0 ? '+' : el < 0 && +v > 0 ? '−' : ''}${v}°`;
}

// One body: {el, up, elText, timing, window (sentence), windowShort (table cell), range}.
export function bodyFacts(t, table, ms, body, el, up, view) {
  const w = windowAt(table, ms, body, up, view.horizon_threshold_deg);
  const k = `${body}.${up ? 'set' : 'rise'}`;
  let timing;
  if (w.none) timing = fill(t(`time.${body}.no_rise`), { end: utc(w.dataEnd) });
  else if (up && w.endOpen) timing = fill(t(`time.${body}.no_set`), { end: utc(w.end) });
  else timing = fill(t(`time.${k}_in`), { dur: duration(t, (up ? w.end : w.start) - ms) });
  let window = null;
  let windowShort = null;
  let range = null;
  if (!w.none) {
    const dur = duration(t, w.end - w.start);
    const open = w.startOpen || w.endOpen;
    const d = open ? fill(t('win.at_least'), { dur }) : dur;
    window = fill(t(`win.${body}.${up ? 'now' : 'next'}`), { dur: d });
    windowShort = up ? d : fill(t('win.next_short'), { dur: d });
    range = fill(t('win.range'), { from: utc(w.start), to: utc(w.end) });
  }
  return { el, up, elText: signedDeg(el, view.decimals), timing, window, windowShort, range };
}

// r = {sample, up:{sun,earth}}; table = the site's Horizons table.
export function scenarioFacts(t, table, ms, r, view) {
  return Object.fromEntries(BODIES.map((b) => [b, bodyFacts(t, table, ms, b, r.sample[b].el, r.up[b], view)]));
}
