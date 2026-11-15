// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Three-state answer for the Sun and Earth discs (P4u): the yes/no answers stay defined by the centre of the disc
// (so the published validation numbers keep their meaning); this adds whether the whole disc, part of it, or none
// of it is above the horizon used. Radii = config/view.json timeline.year.disc_radius_deg (same as config/pgda.json).
import { relativeTable } from './terrain.js';
import { isAbove } from './ephem.js';

export const DISC_STATES = ['full', 'part', 'hidden'];

// margin = centre of the disc above the horizon used (deg); radiusDeg = angular radius of the disc.
export function discState(margin, radiusDeg) {
  if (margin - radiusDeg > 0) return 'full';
  if (margin + radiusDeg > 0) return 'part';
  return 'hidden';
}

export function discRadii(view) {
  return view.timeline.year.disc_radius_deg;
}

// Share of table rows with the centre of the body above the horizon used (the yes/no answer over the whole table).
export function centreShare(table, profile, body, thresholdDeg) {
  const el = relativeTable(table, profile)[body].el;
  return el.length ? el.filter((v) => isAbove(v, thresholdDeg)).length / el.length : 0;
}
