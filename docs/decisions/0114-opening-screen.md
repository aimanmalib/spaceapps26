# 0114: Opening screen over Compare (once per browser session)

Status: accepted, 15 November 2026 (night). Asked for by the author: competing entries open with a cinematic page; this tool
keeps the answer as its first screen (ADR 0040) and adds an opening layer above it, which leaves the page under it as it was.

## Decision

- A full-screen native modal `<dialog>` over Compare: the Apollo 8 Earthrise photo already on the site
  (`public/media/as08-14-2383.jpg`, NASA, credited on the layer), the name "Still in View", one question ("Will your landing
  site still have sunlight and a line to Earth?") and two buttons: "Open the navigator" (closes the layer, keyboard focus
  starts there) and "Take the tour" (closes it and starts the guided tour of ADR 0110; left out when the page has no tour).
- Esc closes it (native dialog), and so does a click anywhere but the two buttons. The dialog keeps keyboard focus inside while
  open; the page does not scroll behind it (`overflow: hidden` on `html` while open).
- Shows once per browser session (`sessionStorage`, read and written inside try/catch; blocked storage = it shows again on
  the next load). Never under automation (`navigator.webdriver`) and never on a shared link (`?s=` in the address), so shared
  links, the smoke test and the media captures see the page as before.
- Motion: a 16 s drift of the photo (scale 1.1 → 1) and one fade of the text, with `transform` and `opacity` only: no filter,
  no `backdrop-filter`, no `perspective()` (WebKit traps). None with `prefers-reduced-motion: reduce`.
- Code: `src/intro.js` (when to show, markup, mount), `src/intro.css` (loaded before the layer is shown), one call in
  `src/main.js` after the tour button exists. Settings: `config/view.json` `intro` (`enabled`, `photo`, `session_key`).
  Text: i18n `intro.*` in English, Indonesian and Malay. `tests/intro.test.mjs` checks when it shows and its text.

## Measured (15 November 2026, `npx vite preview`, Chromium 1366 × 768 and WebKit iPhone 13, webdriver set to false)

Open on a plain first load with focus on "Open the navigator"; Esc closes it; the page under it unchanged (first strip at
484 px and 507 px from the top, the same as a load without the layer); not shown again in the same session, on a shared
link or under automation; "Take the tour" closes it and opens the tour; 0 console errors.

## Rollback

`config/view.json` `intro.enabled` = false, or revert the commits of this ADR.
