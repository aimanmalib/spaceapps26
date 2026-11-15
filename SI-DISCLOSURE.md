# SI disclosure (Super Intelligence / SI use)

This project was built for the NASA Space Apps Challenge 2026 with heavy use of SI. The challenge guidance says SI "should not be used
to (come up with your idea of how to solve the challenge)" and asks teams to "clearly indicate where and how SI tools were utilized".
This file is that statement. A machine-readable copy is in `si-disclosure.json`.

SI tools used: **Claude Code (Anthropic)**, running Claude models.

## Who decided what

| Decision or work | Who |
|---|---|
| Taking part; the Jakarta (virtual) event; the challenge Lunar Landing Site Navigator (after an SI feasibility comparison of the challenges) | Author |
| The audiences: all three named in the challenge (mission planners, educators, the public) | Author |
| What the tool shows and does: all twelve items that SI listed from the challenge text (its "Your solution may include" list and its "Potential Considerations") | Author |
| Team name (the author's own name) | Author |
| Project name: suggested by SI, chosen by the author | Author (choice); SI (suggestions) |
| Further options from the challenge text (sequential comparison, an educational game, terrain for custom coordinates, slopes and shadow conditions on the map) | Author, who chose all four on 15 November 2026 from NASA's own wording, listed by SI |
| Further features suggested by SI (mission window finder, shareable links with a plain verdict and a Now button, a page for teachers, a guided tour built as one button that opens the one-kilometre example; then a real NASA photograph on the first screen, a one-year overview of every listed site, Indonesian and Malay interface options) | Suggested by SI at the author's request on 15 November 2026; the author considered each list and chose all of them |
| The aim of a Global Award, and adopting changes from an SI red-team review of the entry (15 November 2026, evening): the NASA PGDA comparison repeated over the same 18.6 years, with a sensitivity test at the ridge check point; a 360° horizon strip and a one-line verdict at the top of every card; the terrain range on the terrain cards; four more south polar sites (three future targets and the place where IM-1 came to rest) | Author (the aim, and which changes to adopt); SI (the review, its measurements and the changes) |
| Features added on the evening of 15 November 2026 because other public entries to this challenge had them: ready-made comparisons with an opening sentence about rescheduling; a mission check (GO / RISKY / NO-GO, longest night, panel geometry estimate); a calendar of every site by day; a view from the lander; dates to the end of 2030 | Author (asked for them); SI (the comparison with the other entries, the design, the code and the tests, built by several SI sessions in parallel) |
| More additions on the night of 15 November 2026: four more Artemis III candidate regions; a terrain skyline for own coordinates south of 75°S; lunar eclipses, an example battery size and ground stations; a visual pass (typeface, type scale, card hierarchy, one header and footer); a JPL Horizons check at scale and README sections for scientists; a CSV download and a guided tour; a first-load motion on the horizon strip | Author (the aim, and the instruction to close the gaps to other public entries); SI (the comparison with the other entries and their READMEs, the choice of these additions, the sources, the design, all code, numbers and text) |
| Indonesian and Malay translations of the interface (optional; English is the default and the reference) | SI, not reviewed by a native speaker |
| Accepting the open-source participant terms | Author |
| The list of options itself | Drawn by SI from two parts of NASA's challenge text ("Your solution may include" and "Potential Considerations") and translated into Malay by SI |
| Build order (technical dependency and the emphasis in NASA's text), interface design, all code and data scripts, tests, slide layout | SI, on the author's instructions |
| English text (README, slides, form fields) | English text drafted by SI from the author's choices and the measured results, reviewed by the author |
| Account, final checks and "Submit for Judging" | Author |

### How the idea was chosen (14 November 2026, Malaysia time, UTC+8)

1. About 12:30: SI compared the 14 challenges by data access and time, recommended this challenge as feasible, and translated the
   challenge text into Malay.
2. About 12:40: the author created the team and selected this challenge.
3. About 12:44: the author asked SI for an idea. SI declined, because NASA's guidance says SI should not come up with the idea,
   and instead listed the options in the challenge text: three audiences (A–C) and twelve items (a–l), drawn from its
   "Your solution may include" list and its "Potential Considerations".
4. About 12:46: the author chose all three audiences and all twelve items.
5. 15 November, morning: the author asked for the entry to be made stronger; SI listed four options that NASA's challenge text
   names but the tool did not yet have (sequential comparison, an educational game, terrain for custom coordinates, slopes and
   shadow conditions on the map); the author chose all four.
6. 15 November, morning: the author asked SI to suggest features; SI suggested five (mission window finder, shareable links with
   a plain verdict and a Now button, a page for teachers, a guided tour built as one button that opens the one-kilometre example); the author considered the list and chose all five. SI then
   suggested three more (a real NASA photograph on the first screen, a one-year overview of every listed site, Indonesian and Malay
   interface options); the author chose all three.
7. 15 November, evening: the author set the aim of a Global Award and asked SI to red-team the entry against it. SI measured the
   gaps and listed seven possible changes; the author chose which to adopt. Adopted and built so far: the NASA PGDA comparison
   repeated over the same 18.6 years, with a sensitivity test at the ridge check point (the earlier text gave the different
   periods as the reason for the largest difference; the measurement shows they are not); and a 360° horizon strip with a
   one-line verdict at the top of every card, so the first screen shows the horizon, the Sun and Earth (the layout and wording
   are SI's); and the terrain range on the IM-1 and IM-2 cards (nine points 80 m apart, observer at 0 m and at 2 m), which
   marks an answer that changes inside that range; and four more south polar sites, each with its own LOLA skyline: three
   future targets (Malapert Massif, Nobile Rim 1, the Shackleton connecting ridge) and the place where IM-1 came to rest. SI
   picked these three targets because a NASA or LROC page states a coordinate for them, and copied each coordinate from that
   page. The review listed two more changes that were not built (a power index, dates beyond one year). The review's findings
   are SI's, not the author's own analysis.
8. 15 November, evening: the author asked SI to add features that other public entries to this challenge had and this one
   lacked. SI compared the entries and listed such features; the author asked for these to be built: ready-made comparisons with
   an opening sentence about rescheduling, a mission check with a GO / RISKY / NO-GO line, a calendar of every site by day, a
   view from the lander, and dates to the end of 2030. Several SI sessions built them in parallel, each on its own branch, and
   one SI session merged the branches that passed the tests. The ideas for these features came from the other entries; the
   code, the numbers and the text were written for this project, and no code, text or image was copied.
9. 15 November, night: on the same instruction (aim for a Global Award, close the gaps to other public entries), SI compared the
   live site with the other entries again and read their READMEs, then proposed more additions; the author approved the plan and
   SI sessions built them in parallel: four more Artemis III candidate regions (SI searched for sources that print a coordinate
   inside each region and copied one point per region; three regions were left out because no such source was found); a terrain
   skyline for own coordinates south of 75°S, an option from the challenge text that the author had chosen in step 5 and that an
   earlier test had dropped; lunar eclipses at the site, an example battery size for the longest night and the Deep Space Network
   complex in view; a visual pass (self-hosted typeface, one type scale, the decision first in every card); and a JPL Horizons
   check at scale with README sections for scientists; a CSV download of the hourly table and a five-step tour; one header and
   footer on every page; and a first-load motion on the first card's horizon strip. A branch with dates to 2040 was built and left out, because its check against JPL Horizons did not pass.
   One SI session merged the branches that passed the tests and moved the
   README's reference sections to `docs/DETAILS.md`. The ideas for these additions came from the challenge text and from the other
   entries; no code, text or image was copied. This night's code, numbers and text are SI's work on the author's instructions.

The original chat messages are not published.

### The twelve items (listed by SI from NASA's challenge text, as shown to the author)

a. Known sites (Apollo, CLPS targets, other national programmes) · b. Custom coordinates · c. Side-by-side comparison of sites or
dates · d. Pick a date and time; see changes across the lunar day and season · e. Time left before sunset or Earthset · f. Key
numbers: Sun elevation, duration of sunlight, Earth visibility windows · g. Timeline or animation of Sun and Earth motion ·
h. 2D map · i. 3D surface · j. True horizon from terrain (LOLA), not a smooth Moon · k. How conditions on the Moon differ from
Earth · l. Why small shifts in location or date have a large effect.

Items are built in tiers; anything unfinished at the deadline is listed under "What it does, and limitations" in `docs/DETAILS.md`.

## Where SI-generated content is

- **Code and data scripts:** generated by SI. Generated source files carry the header
  `SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md`.
- **Data:** values come from NASA sources (JPL Horizons, LRO LOLA). The scripts that fetch and process them are SI-generated; each
  entry in `data/SOURCES.json` has a `generated_by` field.
- **Web page:** carries `<meta name="si-disclosure">` and a footer link to this file.
- **Text:** English text drafted by SI from the author's choices and the measured results, reviewed by the author, plus quoted NASA
  challenge text.
- **Images, video, audio:** none generated by SI. Screenshots are real captures of the app. One real NASA photograph (Apollo 8,
  AS08-14-2383, credit: NASA, from the NASA Image and Video Library) is shown on the home page, the About page and slide 1.
  No NASA logos, flags or mission insignia are used.
