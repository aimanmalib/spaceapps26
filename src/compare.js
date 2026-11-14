// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Scenario cards (site + UTC date/time) side by side. Inputs stay in the DOM; only result areas are redrawn.
import { fill, escapeHtml as e } from './i18n.js';
import { loadTable } from './data.js';
import { parseUtc, formatUtc, tableRange, sampleAt, isAbove, sharedScale } from './ephem.js';
import { resultHtml } from './result.js';
import { scenarioFacts } from './facts.js';
import { glanceHtml } from './glance.js';
import { relativeTable, aboveHorizon } from './terrain.js';
import { mountTimeline } from './timeline-ui.js';

let uid = 0;

// Site list grouped as in config/sites.json (Apollo, CLPS, other nations); group order = first appearance.
export function siteOptions(t, sites) {
  const groups = [...new Set(sites.map((s) => s.group))];
  return groups
    .map((g) => `<optgroup label="${e(t(`sites.group.${g}`))}">` +
      sites.filter((s) => s.group === g).map((s) => `<option value="${e(s.id)}">${e(s.name)}</option>`).join('') + `</optgroup>`)
    .join('');
}

function cardDom(t, sites, sc) {
  const id = `sc${++uid}`;
  const el = document.createElement('article');
  el.className = 'card';
  el.innerHTML =
    `<header class="card-head"><h3 class="card-title"></h3>` +
    `<button type="button" class="btn-quiet card-remove">${e(t('scenario.remove'))}</button></header>` +
    `<div class="fields"><label class="field" for="${id}-site"><span>${e(t('scenario.site'))}</span>` +
    `<select id="${id}-site">${siteOptions(t, sites)}</select></label>` +
    `<label class="field" for="${id}-time"><span>${e(t('scenario.time'))}</span>` +
    `<input id="${id}-time" type="datetime-local" step="60" required></label></div>` +
    `<div class="card-result" aria-live="polite"></div><section class="card-timeline" hidden></section>`;
  el.querySelector('select').value = sc.site;
  el.querySelector('input[type=datetime-local]').value = sc.time_utc;
  return el;
}

// horizons = {siteId: () => Promise<profile>} for sites with a terrain skyline (data/horizon/); others use the ideal sphere.
export function mountCompare(root, { t, sites, view, horizons = {}, features = {} }) {
  const list = root.querySelector('.cards');
  const add = root.querySelector('.add');
  const glance = root.querySelector('.glance-body');
  const siteById = new Map(sites.map((s) => [s.id, s]));
  const cards = [];
  let ticket = 0;

  function renumber() {
    cards.forEach((c, i) => {
      c.el.querySelector('.card-title').textContent = fill(t('scenario.label'), { n: i + 1 });
      c.el.querySelector('.card-remove').hidden = cards.length <= 1;
    });
    add.disabled = cards.length >= view.max_scenarios;
    add.textContent = add.disabled ? fill(t('tool.add_full'), { max: view.max_scenarios }) : t('tool.add');
  }

  async function update() {
    const mine = ++ticket;
    const inputs = cards.map((c) => ({ c, site: siteById.get(c.el.querySelector('select').value), ms: parseUtc(c.el.querySelector('input[type=datetime-local]').value) }));
    for (const x of inputs) x.c.el.querySelector('.card-result').innerHTML = `<p class="note">${e(t('state.loading'))}</p>`;
    const rows = await Promise.all(
      inputs.map(async (x) => {
        try {
          const [table, profile] = await Promise.all([loadTable(view.data_path, x.site.id), horizons[x.site.id]?.() ?? null]);
          const sample = sampleAt(table, x.ms);
          if (!sample) {
            const { startMs, endMs } = tableRange(table);
            const input = x.c.el.querySelector('input[type=datetime-local]');
            input.min = formatUtc(startMs);
            input.max = formatUtc(endMs);
            return { ...x, msg: fill(t('state.out_of_range'), { start: formatUtc(startMs).replace('T', ' '), end: formatUtc(endMs).replace('T', ' ') }) };
          }
          const th = view.horizon_threshold_deg;
          const up = { sun: isAbove(aboveHorizon(sample.sun, profile), th), earth: isAbove(aboveHorizon(sample.earth, profile), th) };
          const rel = relativeTable(table, profile);
          return { ...x, sample, up, profile, rel, facts: scenarioFacts(t, rel, x.ms, { sample, up }, view) };
        } catch {
          return { ...x, msg: t('state.load_error') };
        }
      }),
    );
    if (mine !== ticket) return;
    const scale = sharedScale(rows.filter((r) => r.sample).flatMap((r) => [r.sample.sun.el, r.sample.earth.el]), view.elevation_scale_steps_deg);
    for (const r of rows) {
      const box = r.c.el.querySelector('.card-result');
      box.innerHTML = r.sample ? resultHtml(t, { ...r, scale }, view) : `<p class="note note-warn">${e(r.msg)}</p>`;
      if (r.sample) r.c.tl?.draw(r.rel, r.ms);
      else r.c.tl?.hide();
    }
    if (glance) glance.innerHTML = glanceHtml(t, rows);
  }

  function addCard(sc) {
    const c = { el: cardDom(t, sites, sc) };
    c.el.addEventListener('change', update);
    if (features.g_timeline) {
      const time = c.el.querySelector('input[type=datetime-local]');
      const onTime = (ms) => {
        time.value = formatUtc(ms);
        update();
      };
      c.tl = mountTimeline(c.el.querySelector('.card-timeline'), { t, view, onTime, uid: `tl${++uid}` });
    }
    c.el.querySelector('.card-remove').addEventListener('click', () => {
      c.tl?.destroy();
      cards.splice(cards.indexOf(c), 1);
      c.el.remove();
      renumber();
      update();
      add.focus();
    });
    cards.push(c);
    list.append(c.el);
  }

  add.addEventListener('click', () => {
    if (cards.length >= view.max_scenarios) return;
    const last = cards[cards.length - 1];
    addCard({ site: last.el.querySelector('select').value, time_utc: last.el.querySelector('input[type=datetime-local]').value });
    renumber();
    update();
    cards[cards.length - 1].el.querySelector('select').focus();
  });

  for (const sc of view.default_scenarios.filter((s) => siteById.has(s.site)).slice(0, view.max_scenarios)) addCard(sc);
  renumber();
  return update();
}
