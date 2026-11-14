#!/usr/bin/env python3
# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""Terrain skylines of points a short distance from each terrain site (item l, small shifts in location).
For every site with a profile in data/horizon/ that is listed in config/sites.json, move location_offset_km
along the sphere in each direction of config/shifts.json and compute the terrain horizon there with the
same ray casting as scripts/horizon.py (LOLA polar DEMs in the cache folder).
Usage: python3 scripts/shifts.py [site_id ...]
Writes data/shift/<site_id>.json and updates data/SOURCES.json.
"""
import json
import math
import sys

import horizon

ROOT = horizon.ROOT
SCRIPT = "scripts/shifts.py"


def moved(lat, lon, azimuth_deg, distance_m, radius_m):
    """Point reached by walking distance_m along a great circle from (lat, lon) toward azimuth_deg (from north, east positive)."""
    la, lo, az, d = math.radians(lat), math.radians(lon), math.radians(azimuth_deg), distance_m / radius_m
    la2 = math.asin(math.sin(la) * math.cos(d) + math.cos(la) * math.sin(d) * math.cos(az))
    lo2 = lo + math.atan2(math.sin(az) * math.sin(d) * math.cos(la), math.cos(d) - math.sin(la) * math.sin(la2))
    return math.degrees(la2), math.degrees(lo2) % 360.0


def main(argv):
    cfg = horizon.load("config/horizon.json")
    sh = horizon.load("config/shifts.json")
    sites = [s for s in horizon.load("config/sites.json")["sites"]
             if (ROOT / "data/horizon" / f"{s['id']}.json").exists() and (not argv or s["id"] in argv)]
    dems = horizon.read_dems(cfg)
    nd, pd = cfg["decimals"], sh["decimals"]
    sources_path = ROOT / "data/SOURCES.json"
    sources = json.loads(sources_path.read_text(encoding="utf-8"))
    by_file = {e["file"]: e for e in sources["files"]}
    for site in sites:
        points = []
        for d in sh["directions"]:
            lat, lon = moved(site["lat"], site["lon_east"], d["azimuth_deg"], sh["location_offset_km"] * 1000.0, cfg["moon_radius_m"])
            p = horizon.profile(cfg, dems, lat, lon)
            points.append({"dir": d["id"], "lat": round(lat, pd), "lon_east": round(lon, pd),
                           "site_height_m": round(p["site_height_m"], 1), "elev": [round(e, nd) for e in p["elev"]]})
            print(f"{site['id']} {d['id']}: {lat:.5f} {lon:.5f}, height {p['site_height_m']:.0f} m", flush=True)
        out = {"site": site["id"], "offset_km": sh["location_offset_km"],
               "reference": "local tangent plane of the ideal sphere at each point (same as data/horizon/)",
               "observer_height_m": cfg["observer_height_m"], "azimuth_step_deg": cfg["azimuth_step_deg"],
               "max_distance_km": cfg["max_distance_km"], "points": points}
        rel = f"shift/{site['id']}.json"
        path = ROOT / "data" / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(out, separators=(",", ":"), ensure_ascii=False) + "\n", encoding="utf-8")
        entry = horizon.source_entry(cfg, rel)
        entry["script"] = SCRIPT
        by_file[rel] = entry
    sources["files"] = [by_file[k] for k in sorted(by_file)]
    sources_path.write_text(json.dumps(sources, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main(sys.argv[1:])
