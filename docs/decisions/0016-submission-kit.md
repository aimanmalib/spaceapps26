# 0016: Submission kit: demo deck, gallery media and form text (P3b)

Date: 2026-11-14. Status: accepted.

## Decision

- **Demo deck (PRD H4, K8):** `demo/slides.html`, seven 1280 × 720 px slides in the site's own colour tokens, rendered by
  `scripts/render_demo.py` (Playwright Chromium `page.pdf`) to `demo/demo.pdf`, one 16:9 page per slide (960 × 540 pt).
  Slide 1 carries the team name, member name and challenge; slide 6 says how NASA data is used and the measured checks.
  Every number on the slides is tested against `data/validation.json` or copied from the README's measured example
  (`tests/test_demo.py`). The PDF is committed because the form links to it on GitHub; regenerate it after any slide change.
- **Gallery (§8):** five PNG and one GIF in `docs/media/`, real screenshots of the deployed site made by
  `scripts/capture_media.py` (settings in `config/media.json`). The GIF is the first scenario card at IM-2 while the timeline
  slider is stepped across one lunar day (30 frames), joined with Pillow. No drawn, edited or generated images. Each file is
  far below the form's 10 MB limit (largest 0.93 MB).
- **Form text (K14, H10):** `docs/hantar/teks.md` (paragraph sources) and `docs/hantar/BORANG-TAMPAL.md` (eight fields in form
  order, measured length each). Both stay out of git (`docs/hantar/` is internal). Project Name = the K17 default
  "Lunar Landing Site Navigator" because the author has not given a name.
- **Style check:** `gilap sumbang --gaya` passes for `BORANG-TAMPAL.md`. On `demo/slides.html` it reports "power" and
  "NSSDCA"; both are kept: "power generation" is the challenge's own wording (quoted), and NSSDCA is the name of the NASA data
  center the fact sheets come from. The house list targets Malay slang ("power" = great) and all-caps shouting.
- **No cropped screenshots (review fix):** the first deck used `object-fit: cover`, which cut slide text mid-word on slides
  4–6. Slide images now use `object-fit: contain` on the surface colour (test `test_screenshots_are_never_cropped`). The
  full-page shots `compare` and `validation` are captured at a viewport close to the deck slot (about 0.9 wide per tall,
  `config/media.json` "viewports"); slide 5 shows the 2D map only, and points to `docs/media/surface-3d.png` for the 3D view.

## Rollback

Delete `demo/` and `docs/media/` and the README links; the site does not use them.
