// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// Measured contrast (WCAG 2.x relative luminance) of every text colour token on both page backgrounds: ≥ 4.5:1.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const token = (name) => {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(m, `token --${name} is a #rrggbb colour`);
  return m[1];
};
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

test('contrast formula matches known values', () => {
  assert.equal(ratio('#000000', '#ffffff').toFixed(1), '21.0');
  assert.equal(ratio('#777777', '#ffffff').toFixed(2), '4.48');
});

test('every text colour token reaches 4.5:1 on the page and card backgrounds', () => {
  const low = [];
  for (const fg of ['text', 'muted', 'quiet', 'accent', 'earth', 'warn', 'go']) {
    for (const bg of ['bg', 'surface', 'sky']) {
      const r = ratio(token(fg), token(bg));
      if (r < 4.5) low.push(`${fg} on ${bg}: ${r.toFixed(2)}`);
    }
  }
  assert.deepEqual(low, []);
});
