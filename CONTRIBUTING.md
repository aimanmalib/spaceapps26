# Contributing

Thanks for helping. Still in View shows numbers that people may rely on, so a change to how an angle, a horizon or a
yes/no answer is computed needs a test and, where it applies, a fresh validation run.

This repository is an entry in the NASA Space Apps Challenge 2026. The site stays as submitted until the results are
announced; fixes for outages are welcome at any time, other changes are merged after that.

## Set up

Node.js 22 (see `.nvmrc`) and Python 3. No account, key or database is needed.

```sh
npm ci
bash scripts/gerbang-ujian.sh   # build, JavaScript tests, Python tests
npx vite                        # the site at http://localhost:5173/
```

## Before you open a pull request

- Run `bash scripts/gerbang-ujian.sh`; CI runs the same script.
- User-facing text goes in `i18n/en.json`, with the same keys in `i18n/id.json` and `i18n/ms.json`.
- Values that may change (sites, dates, thresholds, layout limits) go in `config/*.json`, not in code.
- Files under `data/` are frozen results of the scripts in `scripts/`. Change the script and list the file in
  `data/SOURCES.json`; see [`docs/REPRODUCE.md`](docs/REPRODUCE.md).
- A number in the README, the slides or a page must come from a data file, and a test should compare the two.
- Name every outside source (data, code, text, images) in [`REFERENCES.md`](REFERENCES.md).
- If a tool generated part of your change, say so in the pull request and keep the file header used in this repository
  (see [`SI-DISCLOSURE.md`](SI-DISCLOSURE.md)).
- One topic per pull request; describe how you tested it.

## Reporting security issues

Please don't open a public issue. Use
[private vulnerability reporting](https://github.com/aimanmalib/spaceapps26/security/advisories/new).

By contributing you agree that your contribution is licensed under the [Apache License 2.0](LICENSE) and that you follow
the [Code of Conduct](CODE_OF_CONDUCT.md).
