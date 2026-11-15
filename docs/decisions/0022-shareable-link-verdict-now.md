<!-- SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md -->
# 0022: Shareable link, plain verdict sentence and "Now" button (P4n)

Date: 2026-11-15. Status: accepted. No change to `data/`.

## Context

Second of the five features SI suggested at the author's request on 15 November; the author chose all five (declared in
SI-DISCLOSURE.md and `si-disclosure.json` with P4m, ADR 0021).

## Decision

- Link format: one query value per card, `?s=<site id>,<YYYY-MM-DDTHH:MM>` (UTC), own coordinates
  `?s=custom,<lat>,<lon east>,<YYYY-MM-DDTHH:MM>`. Parameter name and separator in `config/view.json` `share`. Readable in
  the address bar; `:` is left unescaped (allowed in a query), percent-encoded links read the same.
- Decoding (`src/share.js`, pure): a value is used only if the site id is in `config/sites.json` (or `custom` with
  coordinates that pass the same checks as the input fields), and the time is exactly `YYYY-MM-DDTHH:MM` and maps back to
  itself (no rolled-over month 13). Others, and values past `max_scenarios`, are skipped and counted; the count is shown as a
  notice. No readable value = the default scenarios (the deck story and tests rely on them). A time outside the data is
  kept and the card shows its usual out-of-range message.
- "Copy link" builds the link from the cards on press, shows it in a read-only field and tries the clipboard; if the
  clipboard is refused, the field text is selected and the notice says to copy it. The address bar is not rewritten, and
  nothing is stored.
- "Set all to now (UTC)": current time rounded down to `now_step_minutes`, checked on every press against the frozen
  tables' range (`config/ephemeris.json` start/stop); outside it the button is disabled and a line says why.
- Verdict: one sentence per scenario above the side-by-side table, from the same two answers as the card (four templates
  in `i18n/en.json`). It is placed in the side-by-side section, not on the card, so the first-screen limits (ADR 0019)
  do not move.
- Direct link to the "one kilometre" case (IM-2, 2026-11-14 00:00 UTC) in README, deck slide 4 footer and form text;
  `e2e/smoke.py` opens it on all three profiles.

## Consequences

- Rollback: `git revert` of the commit + `deploy/pasang.sh` + re-render `demo/demo.pdf`; remove the "Copy link" bullet and
  the "Open this case" link from the form kit.
