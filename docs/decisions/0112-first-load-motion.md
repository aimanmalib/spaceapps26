# 0112: First-load motion (the first card's strip plays one lunar day, then stops on the chosen time)

Status: accepted, 15 November 2026 (late evening). Asked for by the author: competing entries open with a cinematic page;
this tool opens on the answer (ADR 0040) and keeps that layout. The motion happens inside the answer instead.

## Decision

- On the first draw of Compare, the first card's 360° horizon strip plays one lunar day (29.53 days of the card's own table)
  in 5 seconds, eased in and out: the Sun travels around the skyline once and Earth makes its small libration wobble, each
  marker filled or hollow by the same rule as the card (`judge`, terrain skyline when there is one). Over the last 15 % of the
  playback the markers slide onto the chosen time's own sample. Then the two markers, their labels and the strip get back the
  exact attributes the card was drawn with.
- Which lunar day: the one that ends at the chosen time when the table holds it, otherwise the one that starts there (one
  synodic month later the Sun is back at about the same azimuth, so the playback still ends where the chosen time shows it).
  If the table holds neither, nothing plays.
- Once per page load (the first draw only). Never with `prefers-reduced-motion: reduce`, in a hidden tab, or under automation
  (`navigator.webdriver`), so the smoke test and the media captures see the drawn state at once, as before.
- Only the `left`/`top` of the two markers and their labels and two classes change, frame by frame from
  `requestAnimationFrame`: no layout change, no CSS animation, no filter, no `backdrop-filter`, no `perspective()` (the WebKit
  traps). While it plays, the strip's two corner labels are hidden, because a body beyond the strip's scale rides along the top
  edge where they sit. The verdict, numbers and everything else in the card show the chosen time throughout.
- Code: `src/first-day.js` (window, frame sample, gating, playback) called once from `draw()` in `src/compare.js`; one CSS line
  in `src/styles.css`; settings in `config/view.json` `first_load_motion` (`duration_ms`, `lunar_day_days`, `land_fraction`).
  `tests/first-day.test.mjs` checks on the real IM-2 table that the last frame is exactly the chosen time, that the Sun turns
  once around (360° ± 20°) for both window kinds, and that nothing plays under automation or with reduced motion.

## Measured (15 November 2026, `npx vite preview`)

Recorded with Playwright video in Chromium 1366 × 768 and WebKit iPhone 13 with `navigator.webdriver` set to false: 24 to 25
different marker states in 7 s, the Sun round the skyline and back, the corner labels back at the end; the strip's final HTML
is identical to the strip of a load under automation (no motion); 0 console errors. Frames looked at by eye.

## Fixed values (CLAUDE.md)

No new text (no i18n change). Product-grade UI: checked on the recordings above. Change without code: the three settings in
`config/view.json`. One small module.

## Rollback

Remove `first_load_motion` from `config/view.json` (nothing plays), or revert the commits of this ADR.
