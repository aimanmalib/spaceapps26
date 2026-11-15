// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Educational game (challenge text: "an educational game"): pure functions. A round = one listed site + one UTC time;
// its answers come from the same table, skyline and judgement as the Compare page (src/shifts.js judge), never from
// config. The page is src/play-main.js; rounds are config/game.json.
import { fill } from './i18n.js';
import { sampleAt, parseUtc } from './ephem.js';
import { judge } from './shifts.js';
import { horizonAt } from './terrain.js';

export const QUESTIONS = [
  { body: 'sun', key: 'power' },
  { body: 'earth', key: 'comm' },
];

// table = data/ephem/<site>.json, profile = data/horizon/<site>.json or null. Null when the time is outside the table.
export function roundAnswers(table, profile, timeUtc, thresholdDeg) {
  const sample = sampleAt(table, parseUtc(timeUtc));
  if (!sample) return null;
  return { sample, judged: judge(sample, profile, thresholdDeg) };
}

// guesses = {sun: bool|null, earth: bool|null} → {sun: bool, earth: bool, points: 0–2}.
export function marks(judged, guesses) {
  const sun = guesses.sun === judged.sun.up;
  const earth = guesses.earth === judged.earth.up;
  return { sun, earth, points: Number(sun) + Number(earth) };
}

function signed(v, d) {
  return `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(d)}`;
}

// One sentence per question, computed from the same numbers: body elevation, horizon in that direction, margin.
export function reasonText(t, body, sample, profile, margin, decimals) {
  const pos = sample[body];
  const values = {
    body: t(`sky.${body}`),
    el: signed(pos.el, decimals),
    az: pos.az.toFixed(0),
    sky: profile ? signed(horizonAt(profile, pos.az), decimals) : '0',
    margin: Math.abs(margin).toFixed(decimals),
    dir: t(margin > 0 ? 'answer.above' : 'answer.below'),
  };
  return fill(t(profile ? 'play.reason_terrain' : 'play.reason_sphere'), values);
}

// Rounds whose site is listed (unknown ids in config are skipped).
export function playableRounds(rounds, siteIds) {
  return rounds.filter((r) => siteIds.has(r.site));
}
