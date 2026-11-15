// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// P4s: one-year overview of every listed site (data/overview.json, built by scripts/overview.mjs).
// Pure helpers: counting the hourly rows (used by the build script and the tests) and the table/findings markup.
// Rule = the one-year caption of the timeline: an hour counts when any part of the disc is above the horizon used.
import { fill, escapeHtml as e } from './i18n.js';


// Per-row yes/no for both bodies from a horizon-relative table (terrain or ideal sphere), disc radius per body (deg).
export function visibleRows(relTable, radius) {
  const n = relTable.sun.el.length;
  const sun = relTable.sun.el.map((v) => v + radius.sun > 0);
  const earth = relTable.earth.el.map((v) => v + radius.earth > 0);
  return { n, sun, earth, both: sun.map((s, k) => s && earth[k]) };
}

// Longest run of consecutive true rows → {first, last, rows} (row indices), or null when there is none.
export function longestRun(flags) {
  let best = null;
  let open = -1;
  flags.forEach((f, k) => {
    if (f && open < 0) open = k;
    if (open >= 0 && (!f || k === flags.length - 1)) {
      const last = f ? k : k - 1;
      if (!best || last - open + 1 > best.rows) best = { first: open, last, rows: last - open + 1 };
      open = -1;
    }
  });
  return best;
}

const share = (flags) => flags.filter(Boolean).length / flags.length;

// One overview row from a horizon-relative table; startMs/stepMinutes place the run on the calendar.
export function overviewRow(relTable, radius, startMs, round = (v) => v) {
  const v = visibleRows(relTable, radius);
  const run = longestRun(v.both);
  const at = (k) => new Date(startMs + k * relTable.step_minutes * 60_000).toISOString().slice(0, 16) + 'Z';
  return {
    hours: v.n,
    sun: round(share(v.sun)),
    earth: round(share(v.earth)),
    both: round(share(v.both)),
    longest_both: run && {
      start: at(run.first),
      end: at(run.last),
      hours: run.rows,
      start_open: run.first === 0,
      end_open: run.last === v.n - 1,
    },
  };
}

export const COLUMNS = ['name', 'sun', 'earth', 'both', 'longest', 'horizon'];

// Sort key per column; the longest run sorts by its length (no run = −1).
function key(row, col, name) {
  if (col === 'name') return name(row.site);
  if (col === 'longest') return row.longest_both ? row.longest_both.hours : -1;
  if (col === 'horizon') return row.horizon;
  return row[col];
}

// Sorted copy: text columns A→Z, number columns largest first by default; dir = 'asc' | 'desc'.
export function sortRows(rows, col, dir, name) {
  const sign = dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = key(a, col, name);
    const y = key(b, col, name);
    const c = typeof x === 'string' ? x.localeCompare(y) : x - y;
    return c * sign || name(a.site).localeCompare(name(b.site));
  });
}

export const defaultDir = (col) => (col === 'name' || col === 'horizon' ? 'asc' : 'desc');

const pct = (v) => (v * 100).toFixed(1);
const days = (h) => (h / 24).toFixed(1);
const date = (iso) => iso.slice(0, 10);

function runCell(t, r) {
  if (!r) return e(t('ov.none'));
  const open = r.start_open || r.end_open ? ` ${t('ov.open')}` : '';
  return `${e(fill(t('ov.days'), { d: days(r.hours) }))}<br><span class="ov-dates">${e(fill(t('ov.range'), { start: date(r.start), end: date(r.end) }))}${e(open)}</span>`;
}

// Table markup; sort = {col, dir}. Column headers are buttons (keyboard), the sorted one carries aria-sort.
export function tableHtml(t, data, name, sort) {
  const rows = sortRows(data.sites, sort.col, sort.dir, name);
  const th = (c) => {
    const aria = c === sort.col ? ` aria-sort="${sort.dir === 'asc' ? 'ascending' : 'descending'}"` : '';
    const mark = c === sort.col ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : '';
    return `<th scope="col"${aria}><button type="button" class="ov-sort" data-col="${c}">${e(t(`ov.col.${c}`))}<span aria-hidden="true">${mark}</span></button></th>`;
  };
  const body = rows
    .map(
      (r) =>
        `<tr><th scope="row">${e(name(r.site))}</th><td>${pct(r.sun)}</td><td>${pct(r.earth)}</td><td>${pct(r.both)}</td>` +
        `<td>${runCell(t, r.longest_both)}</td><td>${e(t(`ov.horizon.${r.horizon}`))}</td></tr>`,
    )
    .join('');
  const caption = t('ov.caption');
  return (
    `<div class="table-scroll" tabindex="0" role="region" aria-label="${e(caption)}">` +
    `<table class="data-table ov-table"><thead><tr>${COLUMNS.map(th).join('')}</tr></thead>` +
    `<tbody>${body}</tbody></table></div>`
  );
}

// Plain findings read off the table: most hours with the Sun, most hours with both, longest unbroken run with both.
// Ties name every site with the top value. Wording = "most"/"longest", no ranking of sites for landing.
export function findings(t, data, name) {
  const top = (val) => {
    const best = Math.max(...data.sites.map(val));
    return { best, names: data.sites.filter((s) => val(s) === best).map((s) => name(s.site)).join(', ') };
  };
  const sun = top((s) => s.sun);
  const both = top((s) => s.both);
  const run = top((s) => (s.longest_both ? s.longest_both.hours : -1));
  const r = data.sites.find((s) => s.longest_both && s.longest_both.hours === run.best).longest_both;
  return [
    fill(t('ov.find.sun'), { sites: sun.names, pct: pct(sun.best) }),
    fill(t('ov.find.both'), { sites: both.names, pct: pct(both.best) }),
    fill(t('ov.find.run'), { sites: run.names, d: days(run.best), start: date(r.start), end: date(r.end) }),
  ];
}

