// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// "Now" and "Copy link" buttons under the cards, the link field, and the notice for a link that could not be read.
// state() = current scenarios ({site, time_utc, coords?}); setTimes(value) sets every card's time and redraws.
import { fill, escapeHtml as e } from './i18n.js';
import { formatUtc } from './ephem.js';
import { encodeScenarios, nowTime } from './share.js';

const utc = (ms) => formatUtc(ms).replace('T', ' ');

export function mountShare(box, { t, cfg, range, state, setTimes, rejected = 0, clock = () => Date.now(), uid }) {
  box.innerHTML =
    `<button type="button" class="btn share-now"></button>` +
    `<button type="button" class="btn share-copy">${e(t('share.copy'))}</button>` +
    `<p class="note share-now-why" hidden></p>` +
    `<p class="share-field" hidden><label for="${uid}">${e(t('share.field'))}</label>` +
    `<input id="${uid}" class="share-url" type="text" readonly spellcheck="false"></p>` +
    `<p class="note share-status" role="status"></p>`;
  const now = box.querySelector('.share-now');
  const why = box.querySelector('.share-now-why');
  const field = box.querySelector('.share-field');
  const url = box.querySelector('.share-url');
  const status = box.querySelector('.share-status');
  const say = (text, warn = false) => {
    status.textContent = text;
    status.classList.toggle('note-warn', warn);
  };
  if (rejected) say(fill(t('share.rejected'), { n: rejected }), true);

  // "Now" is checked on each press, so a page left open across the end of the data disables itself then.
  const refreshNow = () => {
    const value = nowTime(clock(), range, cfg.now_step_minutes);
    now.textContent = t(value ? 'share.now' : 'share.now_off');
    now.disabled = !value;
    why.hidden = !!value;
    why.textContent = value ? '' : fill(t('share.now_why'), { start: utc(range.startMs), end: utc(range.endMs) });
    return value;
  };
  refreshNow();
  now.addEventListener('click', () => {
    const value = refreshNow();
    if (!value) return;
    setTimes(value);
    say(fill(t('share.now_done'), { time: value.replace('T', ' ') }));
  });

  box.querySelector('.share-copy').addEventListener('click', async () => {
    const link = new URL(encodeScenarios(state(), cfg), location.href.split(/[?#]/)[0]).href;
    url.value = link;
    field.hidden = false;
    try {
      await navigator.clipboard.writeText(link);
      say(t('share.copied'));
    } catch {
      url.select();
      say(t('share.copy_failed'));
    }
  });
}
