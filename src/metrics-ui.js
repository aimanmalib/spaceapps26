// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Per-card "Mission check" (ADR 0101): a small GO / RISKY / NO-GO badge in the card head and, under the answers, the
// numbers behind it for the chosen mission length. The length select stays inside the block (it must not rebuild the card).
import { fill, escapeHtml as e } from './i18n.js';
import { cardBlock } from './cardblock.js';
import { duration } from './facts.js';
import { formatUtc } from './ephem.js';
import { missionMetrics, decide } from './metrics.js';

const HOUR = 3_600_000;
const utc = (ms) => formatUtc(ms).replace('T', ' ');
const clamp = (v) => Math.max(0, Math.min(100, v));

// Long runs read as days + hours; open runs (they touch the period edge) get "≥", a whole-period run says so.
function runText(t, r) {
  if (!r.hours) return t('metrics.run_none');
  const d = `${r.open ? '≥ ' : ''}${duration(t, r.hours * HOUR)}`;
  return r.all ? fill(t('metrics.run_all'), { dur: d }) : d;
}

// The one-line reason under the decision: the failing checks, or the three values when all pass.
export function reasonText(t, m, rules, verdict, decimals) {
  const v = { sun: m.sunPct.toFixed(decimals), earth: m.earthPct.toFixed(decimals), night: Math.round(m.night.hours) };
  if (!verdict.fails.length) return fill(t('metrics.reason_pass'), { ...v, ...lim(rules) });
  const parts = verdict.fails.map((f) =>
    fill(t(f === 'sun' ? 'metrics.fail_sun' : f === 'earth' ? 'metrics.fail_earth' : 'metrics.fail_night'), { ...v, ...lim(rules) }),
  );
  const line = parts.join(t('metrics.join'));
  return line.charAt(0).toUpperCase() + line.slice(1);
}

const lim = (r) => ({ sun_min: r.sun_min_pct, earth_min: r.earth_min_pct, night_max: r.night_max_hours });

function bar(cls, label, pct, value, tick, tickLabel) {
  return (
    `<div class="mm-row ${cls}"><span class="mm-label">${e(label)}</span>` +
    `<span class="mm-track" aria-hidden="true"><span class="mm-fill" style="width:${clamp(pct).toFixed(1)}%"></span>` +
    (tick == null ? '' : `<span class="mm-tick" style="left:${clamp(tick)}%" title="${e(tickLabel)}"></span>`) +
    `</span><span class="mm-val">${e(value)}</span></div>`
  );
}

export function mountMetrics(box, { t, cfg, view, head, open, uid }) {
  box.className = 'mission-check';
  const rules = cfg.decision;
  const d = view.decimals;
  const opts = cfg.period_days_options
    .map((n) => `<option value="${n}"${n === cfg.default_period_days ? ' selected' : ''}>${e(fill(t(n === cfg.week_days ? 'metrics.days_week' : 'metrics.days'), { n }))}</option>`)
    .join('');
  box.innerHTML =
    `<details class="mm-box" id="${uid}-d"${open ? ' open' : ''}><summary>${e(t('metrics.heading'))}</summary>` +
    `<p>${e(t('metrics.intro'))}</p>` +
    `<p class="win-pick mm-pick"><label for="${uid}">${e(t('metrics.days_label'))}</label> <select id="${uid}" class="mm-days" autocomplete="off">${opts}</select></p>` +
    `<div class="mm-body" aria-live="polite"></div></details>`;
  const details = box.querySelector('details');
  const body = box.querySelector('.mm-body');
  const pick = box.querySelector('.mm-days');
  // Small decision in the card head; a click opens the block with the numbers.
  const badge = document.createElement('button');
  badge.type = 'button';
  badge.className = 'mm-badge';
  badge.setAttribute('aria-controls', `${uid}-d`);
  badge.hidden = true;
  head.querySelector('.card-title').after(badge);
  // Jump, never a smooth scroll (ADR 0033: WebKit iPhone).
  badge.addEventListener('click', () => {
    details.open = true;
    details.scrollIntoView({ block: 'start', behavior: 'auto' });
    details.querySelector('summary').focus({ preventScroll: true });
  });
  pick.addEventListener('change', (ev) => {
    ev.stopPropagation();
    render();
  });

  function render() {
    const sc = block.sc;
    if (!sc) return;
    const days = Number(pick.value);
    const m = missionMetrics(sc.table, sc.rel, sc.ms, days, {
      threshold: view.horizon_threshold_deg,
      solar: cfg.solar_constant_w_m2,
      sunRadius: view.timeline.year.disc_radius_deg.sun,
    });
    const verdict = decide(m, rules);
    const word = t(`metrics.verdict.${verdict.decision}`);
    const why = reasonText(t, m, rules, verdict, d);
    badge.hidden = false;
    badge.className = `mm-badge is-${verdict.decision}`;
    badge.innerHTML = `<span class="mm-dot" aria-hidden="true"></span>${e(word)}<span class="mm-badge-days">${e(fill(t('metrics.days_short'), { n: days }))}</span>`;
    badge.setAttribute('aria-label', fill(t('metrics.badge_label'), { days, verdict: word, why }));
    if (!details.open) return;
    const fail = (k) => (verdict.fails.includes(k) ? ' is-fail' : '');
    const pctText = (v) => `${v.toFixed(d)} %`;
    const w = (v) => `${Math.round(v)} W/m²`;
    const solar = cfg.solar_constant_w_m2;
    body.innerHTML =
      `<p class="mm-verdict is-${verdict.decision}"><span class="mm-pill">${e(word)}</span><span class="mm-why">${e(why)}</span></p>` +
      `<p class="mm-span">${e(fill(t('metrics.span'), { start: utc(sc.ms), end: utc(m.endMs), hours: Math.round(m.hours) }))}</p>` +
      (m.truncated ? `<p class="note note-warn">${e(fill(t('metrics.truncated'), { end: utc(m.endMs) }))}</p>` : '') +
      `<dl class="mm-grid">` +
      `<div class="mm-stat${fail('night')}"><dt>${e(t('metrics.night'))}</dt><dd class="mm-big">${e(runText(t, m.night))}</dd>` +
      `<dd class="mm-lim">${e(fill(t('metrics.night_limit'), { night_max: rules.night_max_hours }))}</dd></div>` +
      `<div class="mm-stat"><dt>${e(t('metrics.gap'))}</dt><dd class="mm-big">${e(runText(t, m.gap))}</dd>` +
      `<dd class="mm-lim">${e(t('metrics.gap_note'))}</dd></div></dl>` +
      `<h4 class="mm-sub">${e(t('metrics.hours_heading'))}</h4>` +
      `<div class="mm-bars">` +
      bar(`mm-sun${fail('sun')}`, t('metrics.hours_sun'), m.sunPct, pctText(m.sunPct), rules.sun_min_pct, fill(t('metrics.tick'), { v: rules.sun_min_pct })) +
      bar(`mm-earth${fail('earth')}`, t('metrics.hours_earth'), m.earthPct, pctText(m.earthPct), rules.earth_min_pct, fill(t('metrics.tick'), { v: rules.earth_min_pct })) +
      bar('mm-both', t('metrics.hours_both'), m.bothPct, pctText(m.bothPct)) +
      `</div>` +
      `<h4 class="mm-sub">${e(t('metrics.power_heading'))}</h4>` +
      `<div class="mm-bars">` +
      bar('mm-track-panel', t('metrics.power_tracking'), (m.power.tracking / solar) * 100, w(m.power.tracking)) +
      bar('mm-flat-panel', t('metrics.power_flat'), (m.power.flat / solar) * 100, w(m.power.flat)) +
      `</div>` +
      `<p class="mm-label-geo">${e(t('metrics.power_label'))}</p>` +
      `<p class="note">${e(fill(t('metrics.power_note'), { solar }))}</p>` +
      `<p class="note">${e(fill(t('metrics.rules'), lim(rules)))}</p>`;
  }

  const block = cardBlock(box, details, render, () => (badge.hidden = true));
  return block;
}
