#!/usr/bin/env python3
# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""Terrain range for the terrain sites (ADR 0041): how much the skyline, and with it the two answers, can change
within one LOLA pixel and with the observer's height. Added on 15 November 2026 from an SI red-team review that the
author adopted.

For every listed site with a skyline in data/horizon/: the skyline is recomputed (scripts/horizon.py ray casting, DEM
files in the cache folder) at the 3 x 3 block of points config/band.json offset_m apart, with the observer at each of
observer_heights_m. Per azimuth the lowest and highest of those skylines are kept ("lo", "hi"). For each variant
scripts/band_share.mjs counts the share of the site's one-year Horizons table with the centre of the disc above the
skyline (the cards' yes/no rule) and with any part of it above (the one-year rule); the file keeps the lowest and
highest share, and the share of hours in which an answer differs between the lowest and the highest skyline. The site's own Horizons angles are used for every variant (80 m moves them by less than 0.003 degrees).

Usage: nice -n 19 python3 scripts/band.py [site_id ...]      (about 80 s per site)
Writes data/band/<site_id>.json and updates data/SOURCES.json.
"""
import json
import subprocess
import sys

import horizon as H
from pgda_period import block_points

ROOT = H.ROOT
SCRIPT = "scripts/band.py"
BODIES = ("sun", "earth")


def envelope(profiles, nd):
    """Lowest and highest skyline elevation per azimuth over a list of profiles (lists of equal length)."""
    lo = [round(min(col), nd) for col in zip(*profiles)]
    hi = [round(max(col), nd) for col in zip(*profiles)]
    return lo, hi


def main(argv):
    cfg = H.load("config/horizon.json")
    band = H.load("config/band.json")
    view = H.load("config/view.json")
    sites = [s for s in H.load("config/sites.json")["sites"]
             if (ROOT / "data/horizon" / f"{s['id']}.json").exists() and (not argv or s["id"] in argv)]
    dems = H.read_dems(cfg)
    nd = cfg["decimals"]
    sources_path = ROOT / "data/SOURCES.json"
    sources = json.loads(sources_path.read_text(encoding="utf-8"))
    by_file = {e["file"]: e for e in sources["files"]}
    for site in sites:
        variants = []
        for dx, dy, la, lo_ in block_points(site["lat"], site["lon_east"], band["offset_m"], cfg["moon_radius_m"]):
            for h in band["observer_heights_m"]:
                p = H.profile(dict(cfg, observer_height_m=h), dems, la, lo_)
                variants.append({"dx_m": dx, "dy_m": dy, "height_m": h, "elev": [round(e, nd) for e in p["elev"]]})
                print(f"{site['id']} {dx:+d} {dy:+d} m, observer {h} m", flush=True)
        lo, hi = envelope([v["elev"] for v in variants], nd)
        run = subprocess.run(["node", str(ROOT / "scripts/band_share.mjs")],
                             input=json.dumps({"table": f"data/ephem/{site['id']}.json", "azimuth_step_deg": cfg["azimuth_step_deg"],
                                               "threshold_deg": view["horizon_threshold_deg"],
                                               "radius": view["timeline"]["year"]["disc_radius_deg"],
                                               "lo": lo, "hi": hi, "profiles": [v["elev"] for v in variants]}),
                             capture_output=True, text=True, check=True)
        shares = json.loads(run.stdout)
        published = H.load(f"data/horizon/{site['id']}.json")
        own = next(i for i, v in enumerate(variants) if v["dx_m"] == 0 and v["dy_m"] == 0 and v["height_m"] == published["observer_height_m"])
        if variants[own]["elev"] != published["elev"]:
            raise ValueError(f"{site['id']}: the centre variant does not reproduce data/horizon/")
        year = {rule: {b: {"site": shares["rows"][own][rule][b], "min": min(r[rule][b] for r in shares["rows"]),
                           "max": max(r[rule][b] for r in shares["rows"])} for b in BODIES} for rule in ("centre", "disc")}
        out = {"site": site["id"], "offset_m": band["offset_m"], "observer_heights_m": band["observer_heights_m"],
               "variants": len(variants), "azimuth_step_deg": cfg["azimuth_step_deg"],
               "reference": "local tangent plane of the ideal sphere at each point (same as data/horizon/)",
               "angles": "the site's JPL Horizons table for every variant",
               "year": {"hours": shares["hours"], "rule_centre": "centre of the disc above the skyline (the cards' yes/no rule)",
                        "rule_disc": "any part of the disc above the skyline (the one-year rule)", **year,
                        "changes": shares["changes"],
                        "rule_changes": "share of hours in which the yes/no answer differs between the lowest and the highest skyline"},
               "points": [{"dx_m": v["dx_m"], "dy_m": v["dy_m"], "height_m": v["height_m"], "centre": r["centre"], "disc": r["disc"]}
                          for v, r in zip(variants, shares["rows"])],
               "lo": lo, "hi": hi}
        rel = f"band/{site['id']}.json"
        path = ROOT / "data" / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(out, separators=(",", ":"), ensure_ascii=False) + "\n", encoding="utf-8")
        entry = H.source_entry(cfg, rel)
        entry["script"] = SCRIPT
        by_file[rel] = entry
        print(site["id"], json.dumps(year), flush=True)
    sources["files"] = [by_file[k] for k in sorted(by_file)]
    sources_path.write_text(json.dumps(sources, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main(sys.argv[1:])
