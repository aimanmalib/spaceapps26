// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Scenario cards (site + UTC date/time) side by side. Inputs stay in the DOM; only result areas are redrawn.
import { fill, escapeHtml as e } from './i18n.js';
import { loadTable } from './data.js';
import { parseUtc, formatUtc, tableRange, sampleAt, sharedScale } from './ephem.js';
import { resultHtml } from './result.js';
import { scenarioFacts } from './facts.js';
import { glanceHtml } from './glance.js';
import { relativeTable } from './terrain.js';
import { judge } from './shifts.js';
import { discState, discRadii } from './disc.js';
import { bandJudge } from './band.js';
import { mountTimeline } from './timeline-ui.js';
import { mountShifts } from './shifts-ui.js';
import { mountEarthView } from './earthview-ui.js';
import { mountMoonEarth } from './moonearth-ui.js';
import { mountMap } from './map2d-ui.js';
import { mountSurface } from './surface3d-ui.js';
import { mountSteps, mountSequence } from './sequence-ui.js';
import { mountWindows } from './mission-ui.js';
import { mountShare } from './share-ui.js';
import { verdictText, encodeScenarios } from './share.js';
import { sourceHtml } from './years.js';
import { CUSTOM_ID, customOptionHtml, customFieldsHtml, syncFields, readCustom, invalidText } from './custom.js';

let uid = 0;

// First-card blocks that start open (config/view.json "first_card"); each block draws on its own 'toggle'.
function openBlock(card, cls) {
  const d = card.querySelector(`${cls} details`);
  if (d) d.open = true;
}

// Site list grouped as in config/sites.json (Apollo, CLPS, other nations); group order = first appearance.
export function siteOptions(t, sites) {
  const groups = [...new Set(sites.map((s) => s.group))];
  return groups
    .map((g) => `<optgroup label="${e(t(`sites.group.${g}`))}">` +
      sites.filter((s) => s.group === g).map((s) => `<option value="${e(s.id)}">${e(s.name)}</option>`).join('') + `</optgroup>`)
    .join('');
}

function cardDom(t, sites, sc, custom) {
  const id = `sc${++uid}`;
  const el = document.createElement('article');
  el.className = 'card';
  el.innerHTML =
    `<header class="card-head"><h3 class="card-title"></h3>` +
    `<button type="button" class="btn-quiet card-remove">${e(t('scenario.remove'))}</button></header>` +
    `<div class="fields"><label class="field" for="${id}-site"><span>${e(t('scenario.site'))}</span>` +
    `<select id="${id}-site">${siteOptions(t, sites)}${custom ? customOptionHtml(t) : ''}</select></label>` +
    (custom ? customFieldsHtml(t, id, custom.cfg) : '') +
    `<label class="field" for="${id}-time"><span>${e(t('scenario.time'))}</span>` +
    `<input id="${id}-time" type="datetime-local" step="60" required></label></div>` +
    `<div class="card-result" aria-live="polite"></div><div class="card-steps"></div><section class="card-timeline" hidden></section><section class="card-shifts" hidden></section><section class="card-seq" hidden></section><section class="card-win" hidden></section><section class="card-me" hidden></section><section class="card-map" hidden></section><section class="card-surface" hidden></section>`;
  el.querySelector('select').value = sc.site;
  el.querySelector('input[type=datetime-local]').value = sc.time_utc;
  if (custom && sc.coords) [...el.querySelectorAll('.custom-fields input')].forEach((input, i) => (input.value = sc.coords[i]));
  if (custom) syncFields(el, null, custom.cfg);
  return el;
}

// horizons = {siteId: () => Promise<profile>} for sites with a terrain skyline (data/horizon/); others use the ideal sphere.
// custom = {cfg: config/custom.json, tables: site → Promise<table>} when item b is on (src/custom.js).
// shifts = item l settings for src/shifts-ui.js when item l is on; me = config/moon-earth.json when item k is on;
// map = {cfg: config/map2d.json, maps: siteId → () => Promise<data/map file>} when item h is on;
// surface = {cfg: config/surface3d.json, light: config/map2d.json, maps} when item i is on.
// earthview = {cfg: config/earthview.json, dirs: config/shifts.json, places, engine} (P4v; terrain sites only).
// years = src/years.js makeYears() + {checked} (ADR 0104): tables for dates past the frozen Horizons range.
export function mountCompare(root, { t, sites, view, horizons = {}, bands = {}, features = {}, custom = null, shifts = null, me = null, map = null, surface = null, share = null, earthview = null, years = null }) {
  const list = root.querySelector('.cards');
  const add = root.querySelector('.add');
  const glance = root.querySelector('.glance-body');
  const verdicts = root.querySelector('.verdicts');
  const siteById = new Map(sites.map((s) => [s.id, s]));
  const cards = [];
  // Kept here, not looked up each time: on phones the button lives inside the first card, so it is parked back in
  // .tool-actions before any card is removed (otherwise it leaves the page with that card).
  const exBtn = root.querySelector('.example');
  const exActions = root.querySelector('.tool-actions');
  const parkExample = () => {
    if (exBtn && exActions && exBtn.parentElement !== exActions) exActions.prepend(exBtn);
  };
  const exampleNarrow = view.example_below_answers_max_width_px && window.matchMedia?.(`(max-width: ${view.example_below_answers_max_width_px}px)`);
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
    if (exBtn?.closest('.card')) exBtn.remove(); // the results below are rebuilt; placeExample() puts it back
    const inputs = cards.map((c) => ({ c, site: siteFor(c.el), ms: parseUtc(c.el.querySelector('input[type=datetime-local]').value) }));
    for (const x of inputs) x.c.el.querySelector('.card-result').innerHTML = `<p class="note">${e(t(x.site.custom ? 'custom.computing' : 'state.loading'))}</p>`;
    const rows = await Promise.all(
      inputs.map(async (x) => {
        if (x.site.error) return { ...x, msg: invalidText(t, x.site.error, custom.cfg) };
        try {
          const table = years ? years.table(x.site, x.ms) : x.site.custom ? custom.tables(x.site) : loadTable(view.data_path, x.site.id);
          const [tb, profile, band] = await Promise.all([table, x.site.custom ? null : horizons[x.site.id]?.() ?? null, x.site.custom ? null : bands[x.site.id]?.() ?? null]);
          return { ...x, ...answer(x, tb, profile, band) };
        } catch {
          return { ...x, msg: t('state.load_error') };
        }
      }),
    );
    if (mine !== ticket) return;
    draw(rows);
  }

  // Own coordinates (item b) or a listed site.
  function siteFor(el) {
    const id = el.querySelector('select').value;
    return custom && id === CUSTOM_ID ? readCustom(t, el, custom.cfg) : siteById.get(id);
  }

  function answer(x, table, profile, band = null) {
    const sample = sampleAt(table, x.ms);
    if (!sample) {
      const { startMs, endMs } = years?.range ?? tableRange(table);
      const input = x.c.el.querySelector('input[type=datetime-local]');
      input.min = formatUtc(startMs);
      input.max = formatUtc(endMs);
      return { msg: fill(t(years ? 'years.out_of_range' : 'state.out_of_range'), { start: formatUtc(startMs).replace('T', ' '), end: formatUtc(endMs).replace('T', ' ') }) };
    }
    // Same judgement as the small-shifts table (item l), so the card and that table show one set of numbers.
    const j = judge(sample, profile, view.horizon_threshold_deg);
    const up = { sun: j.sun.up, earth: j.earth.up };
    const margin = { sun: j.sun.margin, earth: j.earth.margin };
    // Three-state label (P4u): whole disc / part of it / none above the horizon used; yes/no stays the centre rule.
    const radii = discRadii(view);
    const disc = { sun: discState(j.sun.margin, radii.sun), earth: discState(j.earth.margin, radii.earth) };
    const rel = relativeTable(table, profile);
    // Terrain range (ADR 0041): does an answer change between the lowest and highest skyline around the site?
    const range = band && profile ? { band, judge: bandJudge(sample, band, view.horizon_threshold_deg) } : null;
    // Where the angles come from (ADR 0104): the JPL Horizons table or the in-browser engine.
    const source = years ? years.sourceAt(x.site, x.ms) : x.site.custom ? 'engine' : 'horizons';
    return { sample, up, disc, profile, rel, table, range, source, facts: scenarioFacts(t, rel, x.ms, { sample, up, margin }, view) };
  }

  function draw(rows) {
    const scale = sharedScale(rows.filter((r) => r.sample).flatMap((r) => [r.sample.sun.el, r.sample.earth.el]), view.elevation_scale_steps_deg);
    for (const r of rows) {
      const box = r.c.el.querySelector('.card-result');
      box.innerHTML = r.sample ? resultHtml(t, { ...r, scale }, view) : `<p class="note note-warn">${e(r.msg)}</p>`;
      if (r.sample && years) box.querySelector('.horizon-kind')?.insertAdjacentHTML('afterend', sourceHtml(t, r.source, r.ms > years.range.frozenEndMs, years.checked));
      // Earth view (P4v): right under the two answers, only where a LOLA terrain skyline exists.
      if (r.c.ev && r.sample && r.profile) {
        box.querySelector('.answers').after(r.c.evBox);
        r.c.ev.draw({ site: r.site, profile: r.profile, sample: r.sample, ms: r.ms, source: r.source });
      } else r.c.ev?.hide();
      if (r.sample) r.c.tl?.draw(r.rel, r.ms);
      else r.c.tl?.hide();
      if (r.sample) r.c.sh?.draw({ site: r.site, table: r.table, profile: r.profile, sample: r.sample, ms: r.ms });
      else r.c.sh?.hide();
      if (r.sample) r.c.seq?.draw({ table: r.table, profile: r.profile, sample: r.sample, ms: r.ms });
      else r.c.seq?.hide();
      if (r.sample) r.c.win?.draw({ rel: r.rel, ms: r.ms });
      else r.c.win?.hide();
      if (r.sample) r.c.me?.draw({ table: r.table, ms: r.ms });
      else r.c.me?.hide();
      for (const b of [r.c.map, r.c.surf]) {
        if (r.sample) b?.draw({ site: r.site, profile: r.profile, sample: r.sample, up: r.up });
        else b?.hide();
      }
    }
    placeExample();
    if (glance) glance.innerHTML = glanceHtml(t, rows);
    // Plain verdict per scenario (SI suggestion chosen by the author), from the same two answers as the card.
    if (verdicts) {
      verdicts.innerHTML = rows
        .map((r, i) => `<li><strong>${e(fill(t('scenario.label'), { n: i + 1 }))}:</strong> ${e(r.sample ? verdictText(t, r.site.name, r.up, r.disc) : t('verdict.no_answer'))}</li>`)
        .join('');
    }
  }

  function addCard(sc) {
    const c = { el: cardDom(t, sites, sc, custom), prev: siteById.get(sc.site) ?? null };
    c.el.addEventListener('change', (ev) => {
      // Sliders (timeline, 3D view) update their own block on 'input'; a card update here would rebuild them and drop focus.
      if (ev.target.matches('input[type=range]')) return;
      if (custom && ev.target.matches('select')) syncFields(c.el, c.prev, custom.cfg);
      c.prev = siteById.get(c.el.querySelector('select').value) ?? c.prev;
      update();
    });
    if (features.g_timeline) {
      const time = c.el.querySelector('input[type=datetime-local]');
      const onTime = (ms) => {
        time.value = formatUtc(ms);
        update();
      };
      c.tl = mountTimeline(c.el.querySelector('.card-timeline'), { t, view, onTime, uid: `tl${++uid}` });
    }
    const first = cards.length === 0;
    if (earthview) {
      c.evBox = document.createElement('section');
      c.ev = mountEarthView(c.evBox, { t, view, ev: earthview, uid: `ev${++uid}` });
    }
    if (features.l_small_shifts && shifts) c.sh = mountShifts(c.el.querySelector('.card-shifts'), { t, view, shifts });
    if (first && view.first_card?.shifts_open) openBlock(c.el, '.shifts');
    // Sequential comparison (challenge text): step buttons + "If the date moves", open on the first card only.
    if (view.sequence) {
      mountSteps(c.el.querySelector('.card-steps'), { t, seq: view.sequence, select: c.el.querySelector('select'), time: c.el.querySelector('input[type=datetime-local]'), skip: CUSTOM_ID });
      c.seq = mountSequence(c.el.querySelector('.card-seq'), { t, view, open: first && view.first_card?.sequence_open });
    }
    // Mission window finder (SI suggestion chosen by the author): open on the first card only.
    if (view.windows) {
      const time = c.el.querySelector('input[type=datetime-local]');
      c.win = mountWindows(c.el.querySelector('.card-win'), { t, view, time, open: first && view.first_card?.windows_open, uid: `win${++uid}` });
    }
    if (features.k_moon_vs_earth && me) c.me = mountMoonEarth(c.el.querySelector('.card-me'), { t, me });
    if (features.h_map_2d && map) c.map = mountMap(c.el.querySelector('.card-map'), { t, ...map });
    const wide = view.first_card?.map_open_min_width_px;
    if (first && wide && window.matchMedia(`(min-width: ${wide}px)`).matches) openBlock(c.el, '.map2d');
    if (features.i_surface_3d && surface) c.surf = mountSurface(c.el.querySelector('.card-surface'), { t, ...surface, uid: `surf${++uid}` });
    c.el.querySelector('.card-remove').addEventListener('click', () => {
      parkExample();
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
    const coords = [...last.el.querySelectorAll('.custom-fields input')].map((i) => i.value);
    addCard({ site: last.el.querySelector('select').value, time_utc: last.el.querySelector('input[type=datetime-local]').value, coords });
    renumber();
    update();
    cards[cards.length - 1].el.querySelector('select').focus();
  });

  // "Show me the one-kilometre example" (P4p): view.example replaces the cards, then the page scrolls to its Earth view.
  function mountExample() {
    const btn = exBtn;
    const status = root.querySelector('.example-status');
    const sc = view.example;
    if (!btn || !sc || !siteById.has(sc.site)) return;
    btn.textContent = t('tool.example');
    btn.hidden = false;
    btn.addEventListener('click', async () => {
      parkExample();
      for (const c of cards.splice(0)) {
        c.tl?.destroy();
        c.el.remove();
      }
      addCard({ ...sc });
      renumber();
      if (share) history.replaceState(null, '', encodeScenarios([sc], share.cfg));
      await update();
      const c = cards[0];
      const target = c.evBox && !c.evBox.hidden && c.evBox.isConnected ? c.evBox : c.el;
      const heading = target.querySelector('.ev-title, .card-title');
      const km = earthview?.dirs?.location_offset_km ?? '';
      status.textContent = fill(t('tool.example_done'), { site: siteById.get(sc.site).name, time: sc.time_utc.replace('T', ' '), km });
      heading?.setAttribute('tabindex', '-1');
      heading?.focus({ preventScroll: true });
      // Jump, never animate (ADR 0033): on WebKit iPhone a smooth scroll started after the cards are replaced can end at the
      // page bottom. Wait two frames for the new card's layout, jump, then check once more after late content (map, 3D).
      const margin = view.example_scroll_margin_px ?? 0;
      const jump = () => {
        if (!target.isConnected) return;
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - margin, behavior: 'auto' });
      };
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      jump();
      setTimeout(() => {
        const top = target.getBoundingClientRect().top;
        if (top < -1 || top > window.innerHeight / 2) jump();
      }, view.example_scroll_recheck_ms ?? 400);
    });
  }

  // Narrow windows (config example_below_answers_max_width_px): the example button sits right under the first card's two
  // answers, so the first answer still starts inside a phone's first screen (ADR 0033); wider windows keep it above the cards.
  function placeExample() {
    if (!exBtn || exBtn.hidden) return;
    const answers = exampleNarrow?.matches && cards[0]?.el.querySelector('.card-result .answers');
    // The view toward Earth keeps its place right under the answers (P4v); the button then follows that view.
    const ev = cards[0]?.evBox;
    if (answers) (ev?.parentElement === answers.parentElement ? ev : answers).after(exBtn);
    else parkExample();
  }

  // A shared link (src/share.js) replaces the default scenarios; the defaults stay when it has none that can be read.
  const start = share?.scenarios?.length ? share.scenarios : view.default_scenarios.filter((s) => siteById.has(s.site)).slice(0, view.max_scenarios);
  for (const sc of start) addCard(sc);
  renumber();
  const shareBox = root.querySelector('.share');
  if (share && shareBox) {
    const timeOf = (c) => c.el.querySelector('input[type=datetime-local]');
    const state = () => cards.map((c) => ({ site: c.el.querySelector('select').value, time_utc: timeOf(c).value, coords: [...c.el.querySelectorAll('.custom-fields input')].map((i) => i.value) }));
    const setTimes = (value) => {
      for (const c of cards) timeOf(c).value = value;
      update();
    };
    mountShare(shareBox, { t, cfg: share.cfg, range: share.range, rejected: share.rejected, state, setTimes, uid: `share${++uid}` });
  }
  mountExample();
  placeExample();
  exampleNarrow?.addEventListener?.('change', placeExample);
  return update();
}
