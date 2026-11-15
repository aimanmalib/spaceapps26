#!/usr/bin/env python3
# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""2D map layer "Average sunlight (NASA PGDA)" (P4k): the NASA GSFC PGDA average Sun visibility map read on the same
grid as data/map/<site>.json (same cell centres, scripts/map2d.py grid_points), nearest map pixel per cell.

The values are NASA's (share of hourly steps over 18.6 years when any part of the Sun's disc was visible, LOLA
terrain, Mazarico et al. 2011); this script only reads them. Only the map rows that cover each site's square are
downloaded (one HTTP byte range per site); nothing large is stored.

Usage: python3 scripts/map_sunlight.py [site_id ...]
Writes data/map-sunlight/<site_id>.json (new files; data/map/ is not changed) and adds their data/SOURCES.json entries.
"""
import array
import datetime as dt
import json
import sys
import urllib.request

import horizon as H
import map2d as M
import pgda as P

SCRIPT = "scripts/map_sunlight.py"
GENERATED_BY = ("Claude Code (Anthropic) wrote this script; the values are NASA GSFC PGDA average Sun visibility "
                "(LOLA Science Team / E. Mazarico)")


def cell_pixels(grid, pts):
    """(row, col) of the PGDA pixel nearest each cell centre (unit vectors from map2d.grid_points)."""
    out = []
    for x, y, z in pts:
        f = 2.0 * grid["moon_radius_m"] / grid["scale_m"] / (1.0 - z)
        out.append((round(grid["offset_px"] - x * f), round(grid["offset_px"] + y * f)))
    return out


def read_rows(url, grid, r0, r1, timeout):
    """All pixel values (raw int16) of rows r0..r1 inclusive, one byte range."""
    n = grid["size"]
    if not (0 <= r0 <= r1 < n):
        raise ValueError(f"rows {r0}..{r1} outside the map")
    req = urllib.request.Request(url, headers={"Range": f"bytes={r0 * n * 2}-{(r1 + 1) * n * 2 - 1}"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        if r.status != 206:
            raise ValueError(f"{url}: HTTP {r.status}, expected 206 (byte range)")
        raw = r.read()
    vals = array.array("h")
    vals.frombytes(raw)
    if sys.byteorder != "little":
        vals.byteswap()
    if len(vals) != (r1 - r0 + 1) * n:
        raise ValueError(f"{url}: short read")
    return vals


def percent(grid, pix, fetch):
    """Per cell: PGDA Sun visibility in percent (rounded), from rows fetched with fetch(r0, r1)."""
    n = grid["size"]
    rows = [r for r, _ in pix]
    cols = [c for _, c in pix]
    if min(cols) < 0 or max(cols) >= n:
        raise ValueError("map square outside the PGDA map")
    r0, r1 = min(rows), max(rows)
    vals = fetch(r0, r1)
    s = grid["scaling_factor"]
    return [round(vals[(r - r0) * n + c] * s * 100) for r, c in pix]


def build(hcfg, mcfg, pcfg, site, fetch):
    pts = M.grid_points(site["lat"], site["lon_east"], mcfg["half_width_km"], mcfg["cells"], hcfg["moon_radius_m"])
    pct = percent(pcfg["grid"], cell_pixels(pcfg["grid"], pts), fetch)
    return {"site": site["id"], "lat": site["lat"], "lon_east": site["lon_east"],
            "what": "NASA GSFC PGDA average Sun visibility: share of hourly steps over 18.6 years when any part of the "
                    "Sun's disc was visible (LOLA terrain). Read by this tool, not computed by it.",
            "grid": "same cells as data/map/" + site["id"] + ".json; nearest PGDA pixel (" +
                    str(pcfg["grid"]["scale_m"]) + " m) per cell",
            "half_width_km": mcfg["half_width_km"], "cells": mcfg["cells"],
            "min_pct": min(pct), "max_pct": max(pct), "sunlight_pct": pct}


def main(argv):
    hcfg = H.load("config/horizon.json")
    mcfg = H.load("config/map2d.json")
    pcfg = H.load("config/pgda.json")
    url = pcfg["maps"]["sun"]["url"]
    have = {p.stem for p in (H.ROOT / "data/map").glob("*.json")}
    sites = [s for s in H.load("config/sites.json")["sites"] if s["id"] in have and (not argv or s["id"] in argv)]
    sources_path = H.ROOT / "data/SOURCES.json"
    sources = json.loads(sources_path.read_text(encoding="utf-8"))
    by_file = {e["file"]: e for e in sources["files"]}
    now = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    for site in sites:
        out = build(hcfg, mcfg, pcfg, site,
                    lambda r0, r1: read_rows(url, pcfg["grid"], r0, r1, pcfg["timeout_seconds"]))
        rel = f"map-sunlight/{site['id']}.json"
        path = H.ROOT / "data" / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(out, separators=(",", ":"), ensure_ascii=False) + "\n", encoding="utf-8")
        by_file[rel] = {"file": rel, "url": url, "page": pcfg["page_url"], "retrieved_at": now,
                        "license": pcfg["credit"], "script": SCRIPT, "generated_by": GENERATED_BY}
        print(f"{site['id']}: {out['min_pct']}..{out['max_pct']} %, {path.stat().st_size // 1024} KB", flush=True)
    order = [e["file"] for e in sources["files"]]  # keep the existing order; new files go at the end
    order += [k for k in by_file if k not in order]
    sources["files"] = [by_file[k] for k in order]
    sources_path.write_text(json.dumps(sources, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main(sys.argv[1:])
