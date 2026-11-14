# 0014 — 3D surface around each terrain site (item i)

- Status: accepted
- Date: 2026-11-14

## Context

Item i of the challenge list is a 3D surface. PRD §2c puts it in tier T3, to be built only if T0–T2 passed before Sunday 06:00
MYT. P2c (the last T1 step) was done on Saturday 14 November around 16:34 MYT, so the condition holds. K5 asks for no UI framework
and a JS budget of 300 KB gzip. WebKit (iPhone) is the riskiest target.

## Decision

1. **No new data.** The surface uses the heights already frozen for the 2D map (`data/map/<site>.json`, ADR 0013): IM-1 and
   IM-2, 80 × 80 km, LOLA. Colours and relief shading are the 2D map's (`src/map2d.js`, same fixed light, same CSS tokens).
2. **Canvas 2D, no library, no WebGL** (`src/surface3d.js` pure, `src/surface3d-ui.js`): orthographic view tilted down by a fixed
   angle; every second cell becomes a quad (81 × 81 grid); quads are painted far → near (painter's order), which is exact enough
   for a height field seen from above. WebGL or a 3D library would add weight and WebKit risk for no gain at this grid size.
3. **Turn, not animate:** a range slider (keyboard accessible) sets the compass direction the view looks toward; nothing moves by
   itself, so reduced motion needs no special case.
4. The site and the Sun and Earth directions at the chosen time are drawn from the site (dashed when below the horizon, as in the
   2D map). Heights are stretched by a factor in `config/surface3d.json` (2 now); the direction lines are stretched the same way so
   they stay consistent with the ground, and the page says they look steeper than they are.
5. All settings (grid step, tilt, stretch, slider step, line length, canvas width) in `config/surface3d.json`; all text in
   `i18n/en.json`; switch `i_surface_3d` in `config/features.json`.

## Measured

- Main JS bundle 13 893 → 15 523 bytes gzip (+1.6 KB); all JS including data chunks 173 650 bytes gzip (budget 300 KB).
- Smoke (Chromium 1280 / 320, WebKit iPhone 13, local build): surface drawn, slider turns the view by keyboard, block fits the
  card, other sites say there is no surface, 0 console errors.

## Consequences

- Only IM-1 and IM-2 have a 3D surface; other sites and own coordinates do not (Limitations, P3a).
- No cast shadows; the lines are drawn over the ground, not hidden by it (stated on the page).
- Undo: set `i_surface_3d` false in `config/features.json` (the block is not mounted); delete the two `surface3d` modules.
