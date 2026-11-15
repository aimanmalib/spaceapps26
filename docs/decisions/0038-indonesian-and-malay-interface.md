# 0038: Optional Indonesian and Malay interface text (P4t)

Status: accepted, 15 November 2026.

## Context

SI suggested an Indonesian and Malay interface option on 15 November at the author's request; the author chose it (recorded in
SI-DISCLOSURE.md). The submission guide asks for English material, so English must stay the default and complete. The deck, README,
form text and SI-DISCLOSURE.md stay English only.

## Decision

- `i18n/id.json` and `i18n/ms.json` hold every key of `i18n/en.json` (SI translations, not reviewed by a native speaker). Technical
  terms, numbers, units, site, mission and product names, and quotations of NASA text are left as written.
- `?lang=id` or `?lang=ms` in any page address picks the language (`config/lang.json`: default, parameter, codes and the languages'
  own names). Anything else = English. No storage: the choice lives in the address only, and the site's own page links carry it
  (rewritten at start; links written later are fixed when followed). Shared scenario links stay language-free.
- `src/page.js` loads a translation with a dynamic import only when one is asked for (top-level await; the build target already
  supports it), so the English page carries no extra text. `<html lang>` follows the choice.
- Every page footer gets a switcher (English, Bahasa Indonesia, Bahasa Melayu); on non-English pages one visible line says the text
  was translated by SI, is not reviewed by a native speaker, and that the English version is the reference (`lang.note`).
- Tests: `tests/lang.test.mjs` (same keys, no empty values, same `{placeholders}`, the note translated; address handling).
  Smoke: every page with `?lang=id` and `?lang=ms` on all profiles — `<html lang>`, switcher and note, no untranslated key, nav
  keeps the language, no horizontal overflow, no console errors; English default has no note.

## Way back

`git revert` of the P4t commit and `bash deploy/pasang.sh`: the site returns to English only (README limitation line restored by the
revert).
