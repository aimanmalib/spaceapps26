// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Terrain range (ADR 0041): data/band/<site>.json holds, per azimuth, the lowest and highest skyline over the nine
// points one LOLA pixel apart around a terrain site, with the observer on the ground and at the usual height
// (scripts/band.py). An answer "changes inside the range" when the Sun or Earth is above the lowest of those skylines
// but not above the highest. Pure functions; the card shows the result under its two answers and in the strip.
import { fill, escapeHtml as e } from './i18n.js';
import { horizonAt } from './terrain.js';
import { isAbove } from './ephem.js';

export const BODIES = ['sun', 'earth'];

// Same answer rule as the cards, against the lowest and the highest skyline in the body's direction.
export function bandJudge(sample, band, thresholdDeg) {
  const step = band.azimuth_step_deg;
  const one = (b) => {
    const { az, el } = sample[b];
    const lo = horizonAt({ elev: band.lo, azimuth_step_deg: step }, az);
    const hi = horizonAt({ elev: band.hi, azimuth_step_deg: step }, az);
    const upLow = isAbove(el - lo, thresholdDeg);
    const upHigh = isAbove(el - hi, thresholdDeg);
    return { lo, hi, upLow, upHigh, flip: upLow !== upHigh };
  };
  return { sun: one('sun'), earth: one('earth') };
}

// Which sentence: 'hold' (no answer changes), 'sun', 'earth' or 'both'.
export function bandKey(j) {
  return j.sun.flip ? (j.earth.flip ? 'both' : 'sun') : j.earth.flip ? 'earth' : 'hold';
}

const pct = (v) => (v * 100).toFixed(1);

// One list row under the two answers: does an answer change, what the range is, and the one-year shares across it.
export function bandHtml(t, band, j) {
  const key = bandKey(j);
  const y = band.year.centre;
  const [h0, h1] = [Math.min(...band.observer_heights_m), Math.max(...band.observer_heights_m)];
  return (
    `<li class="band${key === 'hold' ? '' : ' is-flip'}">` +
    `<span class="band-flag">${e(t(`band.${key}`))}</span> ` +
    `<span class="band-what">${e(fill(t('band.what'), { n: band.variants / band.observer_heights_m.length, m: band.offset_m, h0, h1 }))}</span> ` +
    `<span class="band-year">${e(fill(t('band.year'), {
      s: pct(y.sun.site), smin: pct(y.sun.min), smax: pct(y.sun.max), e: pct(y.earth.site), emin: pct(y.earth.min), emax: pct(y.earth.max),
    }))}</span></li>`
  );
}
