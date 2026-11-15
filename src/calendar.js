// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Site-day calendar (ADR 0102): every listed site × every UTC day of the one-year table, from data/calendar.json
// (built by scripts/calendar.mjs). Pure helpers: the daily count (build script + tests), months, sorting, the grid markup.
// Rule = data/overview.json: an hour counts when any part of the disc is above the horizon used.
import { fill, escapeHtml as e } from './i18n.js';
import { visibleRows, longestRun } from './overview.js';

const DAY_MS = 86_400_000;
const pad = (n) => String(n).padStart(2, '0');

// Per UTC day: hours with the Sun, Earth and both counted, and the hour (0–23) a cell opens on Compare.
// Only whole days are kept (the one-year table ends with a single row at 00:00 of the next day).
export function dailyCounts(relTable, radius, pickOrder, fallbackHour, centreDeg = 0) {
  const v = visibleRows(relTable, radius);
  const c = visibleRows(relTable, { sun: -centreDeg, earth: -centreDeg }); // centre above the horizon: Compare's answer
  const perDay = (24 * 60) / relTable.step_minutes;
  const days = Math.floor(v.n / perDay);
  const out = { sun: [], earth: [], both: [], pick: [] };
  for (let d = 0; d < days; d++) {
    const rows = Array.from({ length: perDay }, (_, k) => d * perDay + k);
    for (const b of ['sun', 'earth', 'both']) out[b].push(rows.filter((k) => v[b][k]).length);
    // The first state in pickOrder counted that day; the middle row of the day's longest stretch with that state by
    // centre (what Compare answers), else by any part of the disc (a day with only a partly visible disc).
    let pick = null;
    const b = pickOrder.find((x) => rows.some((r) => v[x][r]));
    if (b) {
      const run = longestRun(rows.map((r) => c[b][r])) ?? longestRun(rows.map((r) => v[b][r]));
      pick = Math.floor((run.first + run.last) / 2);
    }
    out.pick.push(Math.floor(((pick ?? fallbackHour) * relTable.step_minutes) / 60));
  }
  return out;
}

// Day index → "YYYY-MM-DD" from the first day of the file.
export const dayIso = (firstDay, d) => new Date(Date.parse(`${firstDay}T00:00Z`) + d * DAY_MS).toISOString().slice(0, 10);

// Months covered by the file: [{key: "YYYY-MM", from, to}] with day indices [from, to).
export function months(firstDay, days) {
  const out = [];
  for (let d = 0; d < days; d++) {
    const key = dayIso(firstDay, d).slice(0, 7);
    if (out.at(-1)?.key === key) out.at(-1).to = d + 1;
    else out.push({ key, from: d, to: d + 1 });
  }
  return out;
}

// Hours counted for one sort option in one month: power = Sun, comms = Earth, both = both.
const FIELD = { power: 'sun', comms: 'earth', both: 'both' };
export const monthTotal = (site, sortBy, m) => site[FIELD[sortBy]].slice(m.from, m.to).reduce((a, b) => a + b, 0);

// Sites sorted by the month's hours for the chosen option (most first); ties keep the order of config/sites.json.
export function sortSites(sites, sortBy, m) {
  return sites.map((s, i) => ({ s, i, v: monthTotal(s, sortBy, m) })).sort((a, b) => b.v - a.v || a.i - b.i).map((x) => x.s);
}

// The four parts of one day (hours): both, Sun only, Earth only, neither.
export function dayParts(site, d) {
  const both = site.both[d];
  const sun = site.sun[d] - both;
  const earth = site.earth[d] - both;
  return { both, sun, earth, none: 24 - both - sun - earth };
}

// The Compare link for one cell: the existing "?s=<site>,<YYYY-MM-DDTHH:MM>" format (src/share.js).
export const compareHref = (site, iso, hour, share) => `./?${share.param}=${site}${share.separator}${iso}T${pad(hour)}:00`;

// One readable line for a cell (title, aria-label and the readout).
export function cellText(t, siteName, iso, parts) {
  return fill(t('calendar.cell'), { site: siteName, date: iso, both: parts.both, sun: parts.sun, earth: parts.earth, none: parts.none });
}

// Grid markup for one month: a table with one row per site and one link per day. Each link carries its numbers in data-*
// for the readout; the cell's colour is a stacked bar (both, Sun only, Earth only, neither) from the hours of that day.
export function gridHtml(t, data, m, sortBy, name, share, monthLabel = m.key) {
  const rows = sortSites(data.sites, sortBy, m);
  const dayNums = Array.from({ length: m.to - m.from }, (_, k) => m.from + k);
  const head = dayNums.map((d) => `<th scope="col"><span>${+dayIso(data.first_day, d).slice(8)}</span></th>`).join('');
  const body = rows
    .map((s) => {
      const nm = name(s.site);
      const cells = dayNums
        .map((d) => {
          const iso = dayIso(data.first_day, d);
          const p = dayParts(s, d);
          const label = cellText(t, nm, iso, p);
          const style = `--b:${(p.both / 24).toFixed(4)};--s:${(p.sun / 24).toFixed(4)};--e:${(p.earth / 24).toFixed(4)}`;
          return `<td><a class="cal-cell" href="${e(compareHref(s.site, iso, s.pick[d], share))}" style="${style}" aria-label="${e(label)}" ` +
            `data-site="${e(s.site)}" data-date="${iso}" data-both="${p.both}" data-sun="${p.sun}" data-earth="${p.earth}" data-none="${p.none}"></a></td>`;
        })
        .join('');
      const total = monthTotal(s, sortBy, m);
      return `<tr><th scope="row" title="${e(nm)}"><span class="cal-name">${e(nm)}</span><span class="cal-total">${e(fill(t('calendar.total'), { h: total }))}</span></th>${cells}</tr>`;
    })
    .join('');
  const caption = fill(t('calendar.caption'), { month: monthLabel });
  return (
    `<table class="cal-table"><caption class="sr-only">${e(caption)}</caption>` +
    `<thead><tr><th scope="col" class="cal-corner">${e(t('calendar.col_site'))}</th>${head}</tr></thead><tbody>${body}</tbody></table>`
  );
}
