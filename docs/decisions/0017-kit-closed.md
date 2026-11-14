# 0017: Submission kit closed (P3c)

Date: 2026-11-14. Status: accepted.

## Decision

- **Release, not patent:** the work is recorded as released to the public. The challenge terms ask for open, downloadable
  content under an OSI licence, and this repository becomes public under Apache-2.0 when the author submits. No patent
  filing is planned (PRD K10).
- **Public-text check:** the README, `SI-DISCLOSURE.md`, `REFERENCES.md`, the four HTML pages, `i18n/` and `demo/` (deck
  source and PDF) were run through the author's pre-publication check before the kit was handed over; it passed. The same
  check passed for making the whole repository public.
- **Deployed site = this commit's parent (`047a6f4`):** the live check confirmed a valid certificate, `GET /` 200 and the
  served commit on the first attempt. This record changes no site file, so no redeploy is needed.
- **Hand-over:** the author was sent the site link, the project-name default and the English summary, with the rule that no
  reply means the draft text is used. The repository stays private until the author submits (PRD L4a).

## Way back

If the author decides to file a patent before the repository goes public, the release record is reverted first; after the
repository is public the release cannot be undone.
