# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""2D map (item h): heights from the LOLA polar DEM on a square grid around each terrain-horizon site.

Grid: local north up, east right; each cell centre is placed along the great circle from the site (azimuthal
equidistant), so straight lines from the centre are true azimuths and the skyline distances of item j can be drawn
on it. Heights come from the same grids and bilinear reading as scripts/horizon.py.

Usage: python3 scripts/map2d.py [site_id ...]   (DEM files must be in the cache: scripts/horizon.py --download)
Writes data/map/<site_id>.json and updates data/SOURCES.json.
"""
import json
import math
import sys

import horizon as H

SCRIPT = "scripts/map2d.py"
GENERATED_BY = "Claude Code (Anthropic) wrote this script; the heights come from LRO LOLA (NASA PDS)"


def grid_points(lat, lon, half_km, cells, radius_m):
    """Unit vectors of the cell centres, row-major, first row = north edge, first column = west edge."""
    ux, uy, uz = H.unit(lat, lon)
    la, lo = math.radians(lat), math.radians(lon)
    n = (-math.sin(la) * math.cos(lo), -math.sin(la) * math.sin(lo), math.cos(la))
    e = (-math.sin(lo), math.cos(lo), 0.0)
    step = 2.0 * half_km / (cells - 1)
    out = []
    for r in range(cells):
        north = half_km - r * step
        for c in range(cells):
            east = -half_km + c * step
            d = math.hypot(east, north) * 1000.0 / radius_m  # angle along the surface (rad)
            if d == 0.0:
                out.append((ux, uy, uz))
                continue
            az = math.atan2(east, north)
            t = tuple(math.cos(az) * n[i] + math.sin(az) * e[i] for i in range(3))
            cd, sd = math.cos(d), math.sin(d)
            out.append((cd * ux + sd * t[0], cd * uy + sd * t[1], cd * uz + sd * t[2]))
    return out


def heights(dems, points):
    """Height (m, rounded) per point; None where no grid covers it."""
    out = []
    for p in points:
        h, _ = H.sample(dems, *p)
        out.append(None if h is None else round(h))
    return out


def build(cfg, mcfg, dems, site):
    pts = grid_points(site["lat"], site["lon_east"], mcfg["half_width_km"], mcfg["cells"], cfg["moon_radius_m"])
    hs = heights(dems, pts)
    known = [h for h in hs if h is not None]
    return {"site": site["id"], "lat": site["lat"], "lon_east": site["lon_east"],
            "projection": "azimuthal equidistant around the site, north up (distances along the surface of the ideal sphere)",
            "reference": "height above the 1737.4 km reference sphere (LOLA)",
            "half_width_km": mcfg["half_width_km"], "cells": mcfg["cells"], "dems": [d["name"] for d in cfg["dems"]],
            "min_m": min(known), "max_m": max(known), "height_m": hs}


def main(argv):
    cfg = H.load("config/horizon.json")
    mcfg = H.load("config/map2d.json")
    sites = [s for s in H.load("config/sites.json")["sites"] if H.covered(cfg, s) and (not argv or s["id"] in argv)]
    dems = H.read_dems(cfg)
    sources_path = H.ROOT / "data/SOURCES.json"
    sources = json.loads(sources_path.read_text(encoding="utf-8"))
    by_file = {e["file"]: e for e in sources["files"]}
    for site in sites:
        out = build(cfg, mcfg, dems, site)
        rel = f"map/{site['id']}.json"
        path = H.ROOT / "data" / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(out, separators=(",", ":"), ensure_ascii=False) + "\n", encoding="utf-8")
        entry = H.source_entry(cfg, rel)
        entry.update(script=SCRIPT, generated_by=GENERATED_BY)
        by_file[rel] = entry
        print(f"{site['id']}: {out['cells']}x{out['cells']} cells, {out['min_m']}..{out['max_m']} m, "
              f"{path.stat().st_size // 1024} KB", flush=True)
    sources["files"] = [by_file[k] for k in sorted(by_file)]
    sources_path.write_text(json.dumps(sources, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main(sys.argv[1:])
