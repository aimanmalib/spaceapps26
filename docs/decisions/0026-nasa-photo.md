# 0026 — One real NASA photograph on the home page, the About page and slide 1 (P4r)

Status: accepted, 15 November 2026. Suggested by SI, chosen by the author on 15 November (SI-DISCLOSURE.md, row of features
suggested by SI).

## Decision

- Photograph: Apollo 8, AS08-14-2383 (24 December 1968), Earth over the horizon of the Moon. Source page
  <https://images.nasa.gov/details/as08-14-2383>; file `as08-14-2383~medium.jpg` (1280 × 1280, 67 KB), stored **unchanged** as
  `public/media/as08-14-2383.jpg` (served as `/media/as08-14-2383.jpg`). It is not in `data/`: that folder holds the frozen
  data and the gate keeps media files under `docs/media/`, `public/` or `demo/`; `data/` is unchanged by this decision. No re-encoding, so no
  image library is needed; the crop is CSS `object-fit: cover` only.
- Terms checked on NASA's images and media guidelines page (<https://www.nasa.gov/nasa-brand-center/images-and-media/>): NASA
  content "generally are not subject to copyright in the United States"; "NASA should be acknowledged as the source of the
  material". The photo has no person, logo, insignia or flag. The NASA insignia stays unused.
- Credit in: footer of the home page, caption on the About page, caption on slide 1, a "Photograph" section on the Data sources page,
  `REFERENCES.md`, form field 7 (NASA Data) in the submission kit.
- Placement: home page masthead, at the right of the title, out of flow (absolute, no extra height, no layout shift). On phones
  (≤ 30rem) it is hidden, so the first answers keep their place (first-screen limits in `e2e/smoke.py`: 838 ≤ 900 at 1280 × 900,
  649 ≤ 664 on iPhone 13, both unchanged from before this change). The About page shows the whole scene on every screen size.
  Per the independent reviewer's amendment, the photo yields to the Earth view (P4v) if that needs the space.
- Wording corrected everywhere "only real screenshots" was written: real screenshots of the tool plus one credited NASA
  photograph. "No SI-generated images, video or audio" stays true.
- Contrast: the title text never overlaps the photo (padding on the masthead); `e2e/smoke.py` checks no overlap and computes the
  contrast of the eyebrow and title colours against the page background (≥ 4.5:1).

## Undo

`git revert <P4r commit>` + `npm run build` + `bash deploy/pasang.sh`, then restore the "only real screenshots" lines in the
submission kit (`docs/hantar/`, not tracked) and remove the NASA Data row for the photo.
