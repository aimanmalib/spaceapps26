# 0105: Four more Artemis III candidate regions, one representative point each

Status: accepted, 15 November 2026 (night). SI-built on branch `wt/artemis`; the author adopts it when merging.

## Context

NASA's October 2024 update names nine Artemis III candidate landing regions near the south pole: Peak near Cabeus B, Haworth,
Malapert Massif, Mons Mouton Plateau, Mons Mouton, Nobile Rim 1, Nobile Rim 2, de Gerlache Rim 2 and Slater Plain (NASA news
release of 28 October 2024; NTRS 20250011660). ADR 0042 added two of them (Malapert Massif, Nobile Rim 1). Other lunar site tools
show the candidate regions. NASA publishes the regions as map outlines, not as coordinates. The site list rule stays: every coordinate is copied from a cited source, and no coordinate is made up.

## Decision

- Four regions are added to `config/sites.json` (group `future`), each named "<region> (Artemis III candidate region,
  representative point)". The point is one that the cited source gives inside the region; it is not the region's centre and not a
  chosen landing point.
  - Haworth: -86.7°, 336.3°E, the centre of LROC's NAC mosaic of "an Artemis III candidate landing site", site name Haworth
    (LROC RDR `NAC_ROI_HAWORTH_LO1`, data.lroc.im-ldi.com). The mosaic spans 86.11°S to 87.39°S.
  - Mons Mouton Plateau: 84.528°S, 30.719°E, "an example landing site" inside the Mons Mouton Plateau candidate region
    (Mahanti et al., LPSC 2025, abstract 2742). It lies about 9 km from where IM-2 landed.
  - Nobile Rim 2: -84.20156°, 60.69989°E, the best-ranked point in "Site DM2 (Nobile Rim 2)" (Peña-Asensio, Neira-Acosta and
    Sánchez-Lozano, Acta Astronautica; arXiv 2406.19863, abstract and Table 3).
  - de Gerlache Rim 2: point 726 of the same paper's Table 3, region SL2, which its Table 1 names de Gerlache Rim 2. The table
    prints 88°30'56.38"S 61°10'2.35"O. "O" is read as oeste (west), giving 298.832681°E. Measured on the LOLA 80 m grid: the west
    reading is 578 m high on the de Gerlache rim with ground under 3° slope within 500 m; the east reading would be 3,192 m below
    the reference sphere, on a crater floor far from de Gerlache. The conversion is tested (`tests/test_ephem.py`).
- The paper's regions are the 2022 set of thirteen (Haworth, Nobile Rim 2 and de Gerlache Rim 2 kept their names in 2024); the
  LPSC abstract uses the 2024 list. The point is used because the 2024 region has the same name and place.
- Left out, with no coordinate invented: Peak near Cabeus B, Mons Mouton and Slater Plain. No NASA, LROC, LPI or published paper
  page with a coordinate inside these regions was found in this session; LROC's NAC mosaics of the candidate sites were searched
  by name without a hit for them.
- Every per-site dataset is built for the four with the existing scripts, unchanged: Horizons table, LOLA skyline, map, sunlight
  layer, 1 km shifts, year shares, terrain range, overview, and the JPL Horizons and NASA PGDA checks
  (`config/validation.json` `max_pairs_total` 80 → 100 for eighteen sites at five pairs each).
- Texts that counted sites are updated in English, Malay and Indonesian (ten terrain sites, seven future targets). The README is
  not changed on this branch; its "Fourteen listed sites" check in `tests/test_ephem.py` is removed until the README names the
  four regions.
- Measured against PGDA over the same 18.6 years, Haworth agrees as closely as IM-1 and IM-2 (Sun 0.0, Earth 0.1 percentage
  points), so the home line's "other terrain sites differ more" is no longer true of every one of them. It now says "most other
  sites differ more" (seven of the eight other terrain sites, tested). "some other terrain sites differ more" was tried first: at
  1366 × 768 it wraps the line to three lines and pushes the first card's answers to 780 px, below the first screen (smoke);
  the chosen wording keeps two lines (761 px).

- On merging into `main` the author's session removed a region size ("about 15 km across") from this record and from the About
  text in three languages: no cited source states it for the 2024 list. It also updated the README and the deck for eighteen
  sites and restored the README site count check in `tests/test_ephem.py`.

## Way back

`git revert` of the commits of this branch: fourteen sites again, with the earlier numbers.
