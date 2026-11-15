# 0103: "From the lander" inside the 3D surface

Status: accepted, 15 November 2026 (evening). Idea taken from two other entries (a first-person "From the lander" view and a
first-person sky view); built by SI on the author's request.

## Context

The 3D surface (ADR 0014) shows the ground from above, stretched twice. A reader who wants to know what a person or a camera
standing at the site would see had only the flat Earth view (P4v). The answers are judged against the LOLA 80 m skyline
(data/horizon, observer 2 m, out to 300 km); the 3D surface uses the 500 m map cells out to 40 km, so its own skyline can differ.

## Decision

- A "From the lander" button in the 3D block (only on sites with a terrain skyline) swaps the orbit view for a perspective
  canvas: eye at `site_height_m + observer_height_m` of the skyline file (the same observer as the answers), ground = the same
  map heights on a sphere of 1737.4 km (curvature drop included), heights **not** stretched, so every angle on screen is true.
  The page says so. "Orbit view" switches back; keyboard focus follows.
- It opens facing Earth (`start`), a toggle faces the Sun; drag (touch keeps vertical page scroll, `touch-action: pan-y`) or
  arrow keys turn it. Field of view 60° (config).
- Sun and Earth discs are drawn at their azimuth/elevation at the chosen time, radius `F·tan(r)` with the radii of
  config/view.json (0.267°, 0.95°), so their size is true relative to the field of view. Discs are painted before the
  ground, so terrain covers them; a dashed ring + label "below skyline" / "partly below skyline" marks the three-state answer
  (disc.js), judged against the LOLA line, never against the 3D ground. Off-screen bodies get an edge label with an arrow.
- The LOLA 80 m skyline is drawn over the ground as a light line; farther terrain above the 3D ground shows as a dark band.
- Mismatch stated, not hidden: the 3D ground's own skyline (ray-marched every 0.5° / 0.25 km) is compared with the profile per
  site; when it rises more than `gap_note_deg` above the line the caption gives the worst value and azimuth. Measured: IM-1 0.22°
  (az 283.5°), IM-1 landed 0.73° (116.5°), IM-2 0.02°, Malapert 0.15°, Nobile Rim 1 0.15°, Shackleton ridge 0.03°.
- Pure geometry in `src/lander.js` (tested in `tests/lander.test.mjs`), canvas in `src/lander-ui.js`, settings in
  `config/surface3d.json` `lander`, text `lander.*` in en/id/ms. Canvas 2D, no library, no animation, no filters, no CSS
  perspective (WebKit).

## Measured

- Main bundle 20 311 → 23 799 bytes gzip. About 3 800 ground polygons in view per frame (the rest culled), redraw per
  animation frame while dragging.
- Chromium 1366 × 768 and WebKit iPhone 13 (local `vite preview`, IM-2 and IM-1 landed): drawn, drag/keys turn the view,
  Sun toggle, back to orbit, no page overflow, 0 console errors.

## Way back

`git revert` of these commits; or remove the `lander-open` button line in `src/surface3d-ui.js` (the orbit view is unchanged).
