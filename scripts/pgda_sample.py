#!/usr/bin/env python3
# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""P4q: the H9(b) check (scripts/pgda.py) repeated at many random points instead of the listed sites.

Points: config/pgda.json "sample" (fixed seed), spread evenly over the area south of sample.lat_max.
Tool value per point: its own LOLA skyline (scripts/horizon.py ray casting, DEM files in the cache folder) and
Sun/Earth angles from the in-browser engine (scripts/pgda_sample_share.mjs, Node 22 on PATH) over the one-year
period of config/ephemeris.json; share of hours with any part of the disc above the skyline.
PGDA value: nearest pixel + range of the (2w+1)^2 window, read with HTTP byte ranges (scripts/pgda.py).
Writes only the "pgda_sample" block of data/validation.json; every other block is kept as it is.

Usage: nice -n 19 python3 scripts/pgda_sample.py      (one process; about 5 s per point)
"""
import datetime as dt
import json
import math
import random
import subprocess
import sys
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import horizon as H  # noqa: E402
import pgda  # noqa: E402

ROOT = H.ROOT
OUT = "data/validation.json"
SCRIPT = "scripts/pgda_sample.py"


def draw_points(sample):
    """count points, uniform over the spherical cap south of lat_max (uniform in sin(lat) and in longitude)."""
    rng = random.Random(sample["seed"])
    top, nd = math.sin(math.radians(sample["lat_max"])), sample["decimals_coords"]
    out = []
    for i in range(sample["count"]):
        lat = math.degrees(math.asin(rng.uniform(-1.0, top)))
        lon = rng.uniform(0.0, 360.0)
        out.append({"id": f"p{i:03d}", "lat": round(lat, nd), "lon_east": round(lon, nd)})
    return out


def percentile(values, q):
    """Linear-interpolation percentile (same as numpy's default) of a non-empty list."""
    v = sorted(values)
    k = (len(v) - 1) * q
    lo = math.floor(k)
    hi = min(lo + 1, len(v) - 1)
    return v[lo] + (v[hi] - v[lo]) * (k - lo)


def summarize(rows, nd):
    out = {}
    for b in pgda.BODIES:
        d = [abs(r["diff"][b]) for r in rows]
        inside = sum(1 for r in rows if r["pgda"][b]["window_min"] <= r["tool"][b] <= r["pgda"][b]["window_max"])
        out[b] = {"median_abs": round(percentile(d, 0.5), nd), "p90_abs": round(percentile(d, 0.9), nd),
                  "max_abs": round(max(d), nd), "mean_signed": round(sum(r["diff"][b] for r in rows) / len(rows), nd),
                  "within_window": inside}
    return out


def main():
    cfg = H.load("config/pgda.json")
    hcfg = H.load("config/horizon.json")
    eph = H.load("config/ephemeris.json")
    sample, grid, w, nd = cfg["sample"], cfg["grid"], cfg["window_px"], cfg["decimals"]
    pts = draw_points(sample)
    dems = H.read_dems(hcfg)
    for p in pts:
        prof = H.profile(hcfg, dems, p["lat"], p["lon_east"])
        p["elev"] = [round(e, hcfg["decimals"]) for e in prof["elev"]]
        p["azimuth_step_deg"] = hcfg["azimuth_step_deg"]
        p["site_dem"] = prof["site_dem"]
        print(p["id"], p["lat"], p["lon_east"], "skyline max", max(p["elev"]), flush=True)
    run = subprocess.run(["node", str(ROOT / "scripts/pgda_sample_share.mjs")],
                         input=json.dumps({"radius": cfg["disc_radius_deg"], "points": pts}),
                         capture_output=True, text=True, check=True)
    shares = {r["id"]: r for r in json.loads(run.stdout)}
    rows = []
    for p in pts:
        r, c = pgda.pixel(grid, p["lat"], p["lon_east"])
        ref = {}
        for b in pgda.BODIES:
            win = pgda.read_window(cfg["maps"][b]["url"], grid, r, c, w, cfg["timeout_seconds"])
            flat = [v for line in win for v in line]
            ref[b] = {"value": round(win[w][w], nd), "window_min": round(min(flat), nd), "window_max": round(max(flat), nd)}
        tool = {b: round(shares[p["id"]][b], nd) for b in pgda.BODIES}
        rows.append({"point": p["id"], "lat": p["lat"], "lon_east": p["lon_east"], "pixel": {"row": r, "col": c},
                     "tool": tool, "pgda": ref, "diff": {b: round(tool[b] - ref[b]["value"], nd) for b in pgda.BODIES}})
        print(p["id"], tool, {b: ref[b]["value"] for b in pgda.BODIES}, flush=True)
    data = H.load(OUT)
    data["pgda_sample"] = {
        "generated_at": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "script": SCRIPT,
        "seed": sample["seed"], "count": len(rows), "lat_max": sample["lat_max"],
        "area": f"random points spread evenly over the area south of {abs(sample['lat_max'])} S (fixed seed)",
        "tool_period": {"start": eph["start"], "stop": eph["stop"], "step_minutes": eph["step_minutes"],
                        "hours": shares[pts[0]["id"]]["hours"]},
        "pgda_period": "hourly steps over 18.6 years (one lunar nutation cycle)",
        "angles": "Astronomy Engine in the page's code (src/moonsky.js), not JPL Horizons",
        "skyline": "LOLA ray casting, same settings as data/horizon/ (config/horizon.json)",
        "disc_radius_deg": cfg["disc_radius_deg"], "window_px": 2 * w + 1, "map_scale_m": grid["scale_m"],
        "sources": {"pgda": cfg["page_url"], "maps": [cfg["maps"][b]["url"] for b in pgda.BODIES],
                    "dems": [hcfg["dem_base_url"] + d["name"] + ".img" for d in hcfg["dems"]]},
        **summarize(rows, nd), "points": rows,
    }
    (ROOT / OUT).write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
