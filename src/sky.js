// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Horizon panorama as SVG markup: x = azimuth 0–360° (north at both edges), y = elevation within ±scale°.
// Shapes only; all text is HTML around it (readable at 320 px). Colours come from CSS classes (tokens in styles.css).

export const VIEW = { w: 360, h: 120, pad: 8, r: 6 };

export function yFor(el, scale) {
  const half = VIEW.h / 2 - VIEW.pad;
  const clamped = Math.max(-scale, Math.min(scale, el));
  return VIEW.h / 2 - (clamped / scale) * half;
}

function marker(cls, pos, scale, above) {
  const x = Math.max(VIEW.r, Math.min(VIEW.w - VIEW.r, pos.az));
  const y = yFor(pos.el, scale).toFixed(2);
  const state = above ? 'is-up' : 'is-down';
  return `<circle class="sky-${cls} ${state}" cx="${x.toFixed(2)}" cy="${y}" r="${VIEW.r}"/>`;
}

// sample = {sun:{az,el}, earth:{az,el}}; up = {sun: bool, earth: bool}.
export function skySvg(sample, scale, up) {
  const mid = VIEW.h / 2;
  const grid = [90, 180, 270].map((x) => `<line class="sky-grid" x1="${x}" y1="0" x2="${x}" y2="${VIEW.h}"/>`).join('');
  return (
    `<svg class="sky-svg" viewBox="0 0 ${VIEW.w} ${VIEW.h}" aria-hidden="true" focusable="false">` +
    `<rect class="sky-above" x="0" y="0" width="${VIEW.w}" height="${mid}"/>` +
    `<rect class="sky-ground" x="0" y="${mid}" width="${VIEW.w}" height="${mid}"/>` +
    grid +
    `<line class="sky-horizon" x1="0" y1="${mid}" x2="${VIEW.w}" y2="${mid}"/>` +
    marker('earth', sample.earth, scale, up.earth) +
    marker('sun', sample.sun, scale, up.sun) +
    `</svg>`
  );
}
