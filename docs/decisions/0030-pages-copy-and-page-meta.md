# 0030 — GitHub Pages copy prepared, page metadata, favicon, robots (P4y)

Status: accepted, 15 November 2026. Access only, from the independent review (P4y); design and code by SI (SI-DISCLOSURE.md).
No data file changes, no new text: titles and descriptions come from `i18n/en.json` as before.

## Context
The live site runs on one server and must stay reachable until 26 January 2027. A second copy on GitHub Pages removes that single
point and gives a link that does not sit under the author's own domain. Pages serves a project site under a sub-path
(`/spaceapps26/`), so the build must not use root-absolute links. Link previews and crawlers read the HTML before scripts run, and
the pages had empty `<meta name="description">` and some empty `<title>` until the language file loaded.

## Decision
- The build stays relative (`base: './'`; Vite rewrites the photo path). `e2e/subpath.py` serves `dist/` under `/spaceapps26/`
  only (anything outside the prefix is 404, as on Pages) and runs the same smoke test as the live site.
- `deploy/pages.sh` builds HEAD and force-pushes `dist/` (+ `version.json`, `.nojekyll`) as the single commit of branch
  `gh-pages`. It never turns Pages on and never changes visibility: both are the author's settings after the repository is public.
- The build copies `demo/demo.pdf` into `dist/demo/demo.pdf`, so each copy links its own deck (`/demo/demo.pdf` is also live on
  the main site now).
- `src/static-meta.js` (Vite `transformIndexHtml`, post) writes title, description, `og:type/title/description` and a relative
  favicon link into every page from the keys each page already names. No `og:image`: an image URL must be absolute and the
  build serves two hosts.
- `public/favicon.svg`: a plain drawn disc over a horizon (no logo); `public/robots.txt` allows crawling.
- `docs/hantar/BORANG-TAMPAL.md` (not in git) lists the Pages links as extra options, marked "use after Pages is turned on and
  tested in a private window"; the existing links stay; the link choice (K4) stays with the author.

## Undo
`git revert` the P4y commit + `bash deploy/pasang.sh`; delete the branch with `git push origin --delete gh-pages`.
