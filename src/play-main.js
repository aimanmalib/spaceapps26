// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Educational game page (play.html): one round at a time, two yes/no questions, Check, then the real answers with
// their margins, the horizon picture and a computed reason; final score. No timer, account, storage or sound.
import sitesConfig from '../config/sites.json';
import view from '../config/view.json';
import game from '../config/game.json';
import { initPage } from './page.js';
import { fill, escapeHtml as e } from './i18n.js';
import { loadTable } from './data.js';
import { sharedScale } from './ephem.js';
import { skySvg } from './sky.js';
import { encodeScenarios } from './share.js';
import { QUESTIONS, roundAnswers, marks, reasonText, playableRounds } from './game.js';

const { t } = initPage();
const root = document.getElementById('game');
const siteById = new Map(sitesConfig.sites.map((s) => [s.id, s]));
const horizons = Object.fromEntries(
  Object.entries(import.meta.glob('../data/horizon/*.json', { import: 'default' })).map(([path, load]) => [path.split('/').pop().replace('.json', ''), load]),
);
const rounds = playableRounds(game.rounds, siteById);
const d = view.decimals;
let index = 0;
let score = 0;

function radios(q) {
  const opt = (v) => `<label class="game-opt"><input type="radio" name="${q.body}" value="${v}"><span>${e(t(`play.${v}`))}</span></label>`;
  return `<fieldset class="game-q"><legend>${e(t(`play.q_${q.key}`))}</legend><div class="game-opts">${opt('yes')}${opt('no')}</div></fieldset>`;
}

function roundHtml(r, site, profile) {
  return (
    `<p class="game-progress">${e(fill(t('play.progress'), { n: index + 1, total: rounds.length, score, max: 2 * index }))}</p>` +
    `<h2 class="game-site" tabindex="-1">${e(site.name)}</h2>` +
    `<p class="data-label">${e(fill(t('play.where'), { time: r.time_utc.replace('T', ' '), lat: site.lat, lon: site.lon_east }))} ` +
    `${e(t(profile ? 'horizon.terrain' : 'horizon.sphere'))}</p>` +
    `<form class="game-form" novalidate>${QUESTIONS.map(radios).join('')}` +
    `<p class="note note-warn game-missing" role="alert" hidden>${e(t('play.missing'))}</p>` +
    `<button type="submit" class="btn game-check">${e(t('play.check'))}</button></form>` +
    `<div class="game-result" hidden></div>`
  );
}

function resultHtml(r, site, profile, a, m) {
  const items = QUESTIONS.map((q) => {
    const j = a.judged[q.body];
    const ok = m[q.body];
    return (
      `<li class="game-mark ${ok ? 'is-right' : 'is-wrong'}"><strong>${e(t(ok ? 'play.right' : 'play.wrong'))}</strong> ` +
      `${e(t(`${q.key}.${j.up ? 'yes' : 'no'}`))}. ${e(reasonText(t, q.body, a.sample, profile, j.margin, d))}</li>`
    );
  }).join('');
  const scale = sharedScale([a.sample.sun.el, a.sample.earth.el], view.elevation_scale_steps_deg);
  const up = { sun: a.judged.sun.up, earth: a.judged.earth.up };
  const last = index === rounds.length - 1;
  return (
    `<ul class="game-marks">${items}</ul>` +
    `<figure class="sky"><div class="sky-plot" role="img" aria-label="${e(fill(t('play.sky_aria'), { scale }))}">` +
    `<span class="sky-el sky-el-top">+${scale}°</span><span class="sky-el sky-el-mid">0°</span><span class="sky-el sky-el-bottom">−${scale}°</span>` +
    `${skySvg(a.sample, scale, up, profile)}</div>` +
    `<figcaption class="sky-legend"><span class="key key-sun">${e(t('sky.sun'))}</span><span class="key key-earth">${e(t('sky.earth'))}</span>` +
    `<span class="key key-down">${e(t('sky.below'))}</span><span class="key-line">${e(t(profile ? 'sky.terrain' : 'sky.sphere'))}</span></figcaption></figure>` +
    `<p class="game-links"><a class="game-open" href="./${encodeScenarios([{ site: r.site, time_utc: r.time_utc }], view.share)}">${e(t('play.open'))}</a></p>` +
    `<button type="button" class="btn game-next">${e(t(last ? 'play.finish' : 'play.next'))}</button>`
  );
}

async function showRound() {
  const r = rounds[index];
  const site = siteById.get(r.site);
  root.innerHTML = `<p class="note">${e(t('state.loading'))}</p>`;
  let table;
  let profile;
  try {
    [table, profile] = await Promise.all([loadTable(view.data_path, r.site), horizons[r.site]?.() ?? null]);
  } catch {
    root.innerHTML = `<p class="note note-warn">${e(t('state.load_error'))}</p>`;
    return;
  }
  const a = roundAnswers(table, profile, r.time_utc, view.horizon_threshold_deg);
  if (!a) {
    root.innerHTML = `<p class="note note-warn">${e(t('state.load_error'))}</p>`;
    return;
  }
  root.innerHTML = roundHtml(r, site, profile);
  const form = root.querySelector('.game-form');
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const pick = (b) => form.querySelector(`input[name=${b}]:checked`)?.value;
    const missing = QUESTIONS.find((q) => !pick(q.body));
    if (missing) {
      form.querySelector('.game-missing').hidden = false;
      form.querySelector(`input[name=${missing.body}]`).focus();
      return;
    }
    const m = marks(a.judged, { sun: pick('sun') === 'yes', earth: pick('earth') === 'yes' });
    score += m.points;
    for (const el of form.querySelectorAll('input, button')) el.disabled = true;
    form.querySelector('.game-missing').hidden = true;
    const box = root.querySelector('.game-result');
    box.innerHTML = resultHtml(r, site, profile, a, m);
    box.hidden = false;
    box.querySelector('.game-next').addEventListener('click', () => {
      index += 1;
      if (index < rounds.length) showRound().then(focusHeading);
      else showScore();
    });
    box.querySelector('.game-marks').setAttribute('tabindex', '-1');
    box.querySelector('.game-marks').focus();
  });
}

function focusHeading() {
  root.querySelector('.game-site')?.focus();
}

function showScore() {
  root.innerHTML =
    `<h2 class="game-score" tabindex="-1">${e(fill(t('play.score'), { score, max: 2 * rounds.length }))}</h2>` +
    `<p class="lede">${e(t('play.score_note'))}</p>` +
    `<p class="game-links"><a href="./">${e(t('play.to_tool'))}</a></p>` +
    `<button type="button" class="btn game-again">${e(t('play.again'))}</button>`;
  root.querySelector('.game-again').addEventListener('click', () => {
    index = 0;
    score = 0;
    showRound().then(focusHeading);
  });
  root.querySelector('.game-score').focus();
}

if (root && rounds.length) showRound();
