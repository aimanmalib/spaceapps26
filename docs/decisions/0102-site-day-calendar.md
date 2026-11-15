# 0102: Site-day calendar on the Overview page

Status: accepted, 15 November 2026. Asked for by the author after looking at a competing entry (moonfrom.earth).

## Context

The Overview table gives one year per site in a few numbers. It does not show *when* in the year a site has the Sun, Earth or
both, so choosing a date still means opening Compare site by site. A heat calendar of every listed site × every day answers
"which days, where" at a glance and hands the chosen day to Compare.

## Decision

- `scripts/calendar.mjs` counts the frozen hourly tables (`data/ephem`) against the horizon used (`data/horizon` LOLA skyline
  where it exists, else the ideal sphere) into a NEW file `data/calendar.json` (+ one entry in `data/SOURCES.json`): per site and
  per whole UTC day, the hours with the Sun, Earth and both. Rule and disc radius = `data/overview.json` (any part of the disc
  above the horizon). The table's single extra row at 2027-11-01 00:00 is not a whole day and is left out; the tests add it back
  and get the overview shares exactly. No existing data file or published number changes.
- One cell = one day, drawn as a stacked bar from the bottom: both (green, Sun yellow + Earth blue), Sun only, Earth only,
  neither. A colour key sits above the grid; the numbers are in each cell's label and in a fixed-height readout on hover,
  keyboard focus or tap.
- Month picker (select + previous/next), sort by Power (Sun hours), Comms (Earth hours) or Both for the month shown, most first,
  ties in the order of `config/sites.json`. Month names come from `Intl.DateTimeFormat` in the page language.
- A cell is a link to Compare in the existing `?s=<site>,<YYYY-MM-DDTHH:MM>` format. Its hour is the middle of the day's
  longest stretch with both in view (else Sun, else Earth; `config/calendar.json` `pick_order`), measured by disc centre where
  the day has such a stretch so Compare gives the same answer. Measured: 152 of 4,750 days with a counted state have that state
  only with a partly visible disc; there Compare shows the "partly hidden" line (e.g. IM-2, 2026-12-14). On a touch screen the
  first tap shows the day's hours and the second tap on the same day opens it (the readout also carries the link).
- Phones: the grid scrolls sideways inside its own box with the site names sticky; the page itself never scrolls sideways.
- Settings in `config/calendar.json`; text in `i18n/*.json` (`calendar.*`). Unit tests: `tests/calendar.test.mjs`.

## Way back

`git revert` of the calendar commits, then `bash deploy/pasang.sh` and `bash deploy/pages.sh`.
