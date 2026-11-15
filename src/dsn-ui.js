// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// One line in a card's technical details (ADR 0109): which Deep Space Network complex sees the Moon at the card time.
// The engine and config load the first time the details open; the line is rebuilt with each card redraw.
import { fill, escapeHtml as e } from './i18n.js';
import { duration, signedDeg } from './facts.js';

// res = dsnAt(); earthUp = the card's Earth answer.
export function dsnText(t, cfg, res, earthUp, ms) {
  const name = (id) => t(`realism.dsn.${id}`);
  const list = res.rows.map((r) => fill(t('realism.dsn.item'), { name: name(r.id), el: signedDeg(r.el, 0) })).join(' · ');
  const up = res.rows.filter((r) => r.up).map((r) => name(r.id));
  let verdict;
  if (up.length) verdict = fill(t(earthUp ? 'realism.dsn.ok' : 'realism.dsn.ok_no_earth'), { names: up.join(', ') });
  else if (res.next) verdict = fill(t('realism.dsn.wait'), { name: name(res.next.id), dur: duration(t, res.next.ms - ms) });
  else verdict = fill(t('realism.dsn.none'), { h: cfg.next_hours });
  return `${fill(t('realism.dsn.lead'), { min: cfg.min_elevation_deg })} ${list}. ${verdict}`;
}

export function mountDsn(details, { t, ms, earthUp }) {
  if (!details) return;
  const p = document.createElement('p');
  p.className = 'dsn-line';
  p.hidden = true;
  details.append(p);
  const fillLine = () =>
    Promise.all([import('./dsn.js'), import('../config/dsn.json')])
      .then(([m, c]) => {
        const cfg = c.default;
        p.innerHTML = `${e(dsnText(t, cfg, m.dsnAt(cfg, ms), earthUp, ms))} <a href="${e(cfg.source_url)}" rel="noopener noreferrer">${e(t('realism.dsn.source'))}</a>`;
        p.hidden = false;
      })
      .catch(() => {});
  if (details.open) fillLine();
  else details.addEventListener('toggle', () => details.open && p.hidden && fillLine());
}
