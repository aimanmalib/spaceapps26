# 0024 — Text honesty corrections (P4x)

Status: accepted, 15 November 2026

## Context

An independent review of the site, slides and form text found three statements that were not accurate:

1. "all twelve items in the challenge's 'Your solution may include' list". The twelve lettered items (a–l) were listed by SI
   from two parts of the challenge text: the "Your solution may include" list and the "Potential Considerations". The official
   list alone is shorter.
2. "English text translated and edited with SI from the author's Malay notes" (slide meta tag, About page). The author did not
   write notes; the English text was drafted by SI from the author's choices and the measured results, as `SI-DISCLOSURE.md`
   already said.
3. The SI story was told in a different order in different places.

The review also asked that the 1.3° IM-2 example carry the caveat already in the form: the 80 m terrain grid does not resolve
the small crater where the IM-2 lander stopped.

## Decision

- Every tracked file and the form kit now say "twelve items that SI listed from the challenge text (its 'Your solution may
  include' list and its 'Potential Considerations')", or a shorter sentence with the same meaning.
- The "Malay notes" claim is removed.
- The SI timeline in `SI-DISCLOSURE.md` and the Use of SI form field are told once, in time order: 14 November the author
  asked SI for an idea, SI declined and listed the options in the challenge text, the author chose all of them; 15 November the
  author asked for more, SI listed four options from the challenge text and suggested five features, the author chose them.
- Slide 7 says some features were suggested by SI. Slide 4 and the README carry the 80 m grid caveat.

The official challenge page could not be fetched from the build host (TLS certificate error), so the source for the two-part
origin of the list is the copy of the challenge text and the list shown to the author, made on 14 November 2026.

No data, numbers or features changed. Undo: `git revert` this commit, `npm run build`, `bash deploy/pasang.sh`.
