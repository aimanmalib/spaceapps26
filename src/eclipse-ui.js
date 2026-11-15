// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Card text for a lunar eclipse seen from the site (ADR 0109): the power answer's facts when Earth is in front of the Sun.
// With the Sun's centre behind Earth the answer turns to "no sunlight" and the large number becomes the hidden share;
// with only part of the disc covered the answer stays and one line says how much is covered and until when.
import { fill } from './i18n.js';
import { formatUtc } from './ephem.js';
import { duration } from './facts.js';

// Own stylesheet, loaded only in the browser (the unit tests import this module in Node); styles.css stays untouched.
if (typeof document !== 'undefined') import('./realism.css');

const utc = (ms) => formatUtc(ms).replace('T', ' ');
export const pctText = (share) => `${Math.round(share * 100)} %`;

// f = bodyFacts of the Sun (src/facts.js, horizon only); ecl = eclipseAround(); horizonUp = Sun's centre above the horizon used.
export function eclipseFacts(t, f, ecl, horizonUp, ms, line) {
  const end = ecl.endMs == null ? t('realism.eclipse.open') : utc(ecl.endMs);
  const pct = pctText(ecl.now.share);
  if (horizonUp && ecl.now.centre) {
    const timing = ecl.centreEndMs == null
      ? fill(t('realism.eclipse.timing_open'), { end })
      : fill(t('realism.eclipse.timing'), { dur: duration(t, ecl.centreEndMs - ms), end });
    return {
      ...f, up: false, eclipse: ecl, timing, window: null, windowShort: null, range: null,
      eclipseNum: { num: pct, text: t('realism.eclipse.unit') },
      eclipseText: fill(t('realism.eclipse.line_hidden'), { margin: `${Math.abs(f.margin).toFixed(1)}°`, line }),
    };
  }
  return { ...f, eclipse: ecl, eclipseText: fill(t('realism.eclipse.line_part'), { pct, end }) };
}
