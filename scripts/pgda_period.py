#!/usr/bin/env python3
# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""The PGDA check (scripts/pgda.py) repeated over the same length of time as the NASA maps, and a sensitivity test at
the ridge check point. Added on 15 November 2026 from an SI red-team review that the author adopted.

1. Same period: at every point of the "pgda" block, the published skyline (data/horizon/) with Sun/Earth angles from
   the in-browser engine (scripts/pgda_period_share.mjs) over config/pgda.json "period" (18.6 years, hourly), instead
   of the tool's one-year table. Also the lowest and highest share of any full calendar year inside that period.
2. Ridge point: the skyline recomputed (scripts/horizon.py ray casting, DEM files in the cache folder) with the
   observer at each height of period.ridge.observer_heights_m, and at the 3 x 3 block of points block_offset_m apart
   (one PGDA pixel) at the usual observer height; the same 18.6-year share for each.
PGDA values are taken from the "pgda" block (no network). Writes only the "pgda_period" block of data/validation.json.

Usage: nice -n 19 python3 scripts/pgda_period.py      (one process; about 2 minutes)
"""
import datetime as dt
import json
import math
import pathlib
import subprocess
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import horizon as H  # noqa: E402
import pgda  # noqa: E402
from shifts import moved  # noqa: E402

ROOT = H.ROOT
OUT = "data/validation.json"
SCRIPT = "scripts/pgda_period.py"


def block_points(lat, lon, offset_m, radius_m):
    """The 3 x 3 block around (lat, lon): (dx_m east, dy_m north, lat, lon), centre included."""
    out = []
    for dy in (-offset_m, 0, offset_m):
        for dx in (-offset_m, 0, offset_m):
            dist = math.hypot(dx, dy)
            la, lo = (lat, lon) if dist == 0 else moved(lat, lon, math.degrees(math.atan2(dx, dy)) % 360.0, dist, radius_m)
            out.append((dx, dy, la, lo))
    return out


def summarize(rows, nd):
    out = {}
    for b in pgda.BODIES:
        d = [abs(r["diff"][b]) for r in rows]
        out[b] = {"max_abs": round(max(d), nd), "mean_abs": round(sum(d) / len(d), nd)}
    return out


def site_group(rows, ids, nd):
    """Largest and smallest difference per body (and the largest of either body) over the rows whose site is in ids."""
    part = [r for r in rows if r["site"] in ids]
    return {"ids": [r["site"] for r in part], "max_abs": round(max(abs(r["diff"][b]) for r in part for b in pgda.BODIES), nd),
            **{b: {"min_abs": round(min(abs(r["diff"][b]) for r in part), nd), "max_abs": round(max(abs(r["diff"][b]) for r in part), nd)}
               for b in pgda.BODIES}}


def main():
    cfg = H.load("config/pgda.json")
    hcfg = H.load("config/horizon.json")
    per, nd = cfg["period"], cfg["decimals"]
    ridge_cfg = per["ridge"]
    data = H.load(OUT)
    base = data["pgda"]["sites"]
    listed = {s["id"] for s in H.load("config/sites.json")["sites"]}
    headline = set(per["headline_sites"])  # the two sites named in the one-line summary on the home page
    others = listed - headline  # every other listed site with a terrain skyline
    step = hcfg["azimuth_step_deg"]
    jobs = []
    for s in base:
        prof = H.load(f"data/horizon/{s['site']}.json")
        jobs.append({"id": s["site"], "lat": s["lat"], "lon_east": s["lon_east"], "elev": prof["elev"], "azimuth_step_deg": step, "years": True})
    ridge = next(s for s in base if s["site"] == ridge_cfg["point"])
    dems = H.read_dems(hcfg)
    observer = []
    for h in ridge_cfg["observer_heights_m"]:
        p = H.profile(dict(hcfg, observer_height_m=h), dems, ridge["lat"], ridge["lon_east"])
        jid = f"observer-{h}"
        jobs.append({"id": jid, "lat": ridge["lat"], "lon_east": ridge["lon_east"], "elev": [round(e, hcfg["decimals"]) for e in p["elev"]], "azimuth_step_deg": step})
        observer.append({"id": jid, "height_m": h, "near": sum(1 for a in p["at_km"] if a < ridge_cfg["near_km"])})
        print("ridge observer", h, "m: skyline closer than", ridge_cfg["near_km"], "km on", observer[-1]["near"], "of", len(p["at_km"]), flush=True)
    block = []
    for dx, dy, la, lo in block_points(ridge["lat"], ridge["lon_east"], ridge_cfg["block_offset_m"], hcfg["moon_radius_m"]):
        p = H.profile(hcfg, dems, la, lo)
        jid = f"block-{dx}-{dy}"
        jobs.append({"id": jid, "lat": la, "lon_east": lo, "elev": [round(e, hcfg["decimals"]) for e in p["elev"]], "azimuth_step_deg": step})
        block.append({"id": jid, "dx_m": dx, "dy_m": dy, "lat": round(la, 6), "lon_east": round(lo, 6)})
        print("ridge block", dx, dy, flush=True)
    run = subprocess.run(["node", str(ROOT / "scripts/pgda_period_share.mjs")],
                         input=json.dumps({"radius": cfg["disc_radius_deg"], "start": per["start"], "years": per["years"], "points": jobs}),
                         capture_output=True, text=True, check=True)
    res = {r["id"]: r for r in json.loads(run.stdout)}
    rows = []
    for s in base:
        r = res[s["site"]]
        tool = {b: round(r[b], nd) for b in pgda.BODIES}
        ref = {b: s["pgda"][b]["value"] for b in pgda.BODIES}
        rows.append({"site": s["site"], "lat": s["lat"], "lon_east": s["lon_east"], "tool": tool, "pgda": ref,
                     "diff": {b: round(tool[b] - ref[b], nd) for b in pgda.BODIES},
                     "one_year": {b: {"min": round(r["years"][b][0], nd), "max": round(r["years"][b][1], nd)} for b in pgda.BODIES},
                     "calendar_years": r["years"]["count"]})
        print(s["site"], tool, ref, rows[-1]["one_year"], flush=True)
    for o in observer:
        o.update({b: round(res[o["id"]][b], nd) for b in pgda.BODIES})
        del o["id"]
    for p in block:
        p.update({b: round(res[p["id"]][b], nd) for b in pgda.BODIES})
        del p["id"]
    first = res[base[0]["site"]]
    data["pgda_period"] = {
        "generated_at": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "script": SCRIPT,
        "period": {"start": first["start"], "stop": first["stop"], "years": per["years"], "hours": first["hours"], "step_minutes": 60},
        "period_note": "The PGDA label gives the length of its simulation (18.6 years, hourly) but not its dates; this check starts at the first date in that label.",
        "angles": "Astronomy Engine in the page's code (src/moonsky.js), not JPL Horizons",
        "rule": "share of hourly steps with any part of the disc above the skyline (the PGDA rule)",
        "disc_radius_deg": cfg["disc_radius_deg"],
        **summarize(rows, nd), "landing_sites": site_group(rows, headline, nd),
        **({"other_sites": site_group(rows, others, nd)} if any(r["site"] in others for r in rows) else {}), "sites": rows,
        "ridge": {
            "site": ridge["site"], "lat": ridge["lat"], "lon_east": ridge["lon_east"], "pgda": ridge["pgda"],
            "azimuths": int(round(360.0 / step)), "near_km": ridge_cfg["near_km"], "observer": observer,
            "block": {"offset_m": ridge_cfg["block_offset_m"], "observer_height_m": hcfg["observer_height_m"],
                      **{b: {"min": min(p[b] for p in block), "max": max(p[b] for p in block)} for b in pgda.BODIES}, "points": block},
        },
    }
    (ROOT / OUT).write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    sources_path = ROOT / "data/SOURCES.json"
    sources = json.loads(sources_path.read_text(encoding="utf-8"))
    for e in sources["files"]:
        if e["file"] == "validation.json":
            e["pgda_period"] = {"note": "No download: PGDA values from the pgda block; skylines from data/horizon/ and, for the ridge "
                                "point, LOLA ray casting (DEM files as for data/horizon/); Sun/Earth angles from Astronomy Engine.",
                                "label": cfg["maps"]["sun"]["label"], "computed_at": data["pgda_period"]["generated_at"],
                                "script": SCRIPT, "generated_by": pgda.GENERATED_BY}
    sources_path.write_text(json.dumps(sources, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
