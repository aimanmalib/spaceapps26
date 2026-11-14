#!/usr/bin/env python3
# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""Freeze Sun and Earth azimuth/elevation for each site in config/sites.json.

Source: JPL Horizons API (observer on the lunar surface, CENTER='coord@301', GEODETIC site
coordinates, QUANTITIES='4' = apparent azimuth and elevation, airless). Elevations are relative
to the ideal-sphere horizon, not terrain. One request at a time with a pause between requests.

Usage: python3 scripts/fetch_horizons.py [id ...]
Writes data/ephem/<site_id>.json (config/sites.json), data/check/<id>.json (check_points in
config/ephemeris.json) and updates data/SOURCES.json.
"""
import datetime as dt
import json
import pathlib
import sys
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
SCRIPT = "scripts/fetch_horizons.py"
GENERATED_BY = "Claude Code (Anthropic) wrote this script; the numbers come from JPL Horizons"
LICENSE = "Credit: JPL Horizons System, Solar System Dynamics Group, NASA/JPL-Caltech (public API, no login)"


def load(rel):
    return json.loads((ROOT / rel).read_text(encoding="utf-8"))


def write_json(rel, obj):
    path = ROOT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, separators=(",", ":"), ensure_ascii=False) + "\n", encoding="utf-8")


def request_params(cfg, site, body_code, span):
    coord = f"{site['lon_east']},{site['lat']},{cfg['site_altitude_km']}"
    return {
        "format": "json", "COMMAND": f"'{body_code}'", "CENTER": "'coord@301'",
        "COORD_TYPE": "'GEODETIC'", "SITE_COORD": f"'{coord}'", "EPHEM_TYPE": "'OBSERVER'",
        "QUANTITIES": "'4'", "START_TIME": f"'{span[0]}'", "STOP_TIME": f"'{span[1]}'",
        "STEP_SIZE": f"'{cfg['step_minutes']} m'", "OBJ_DATA": "'NO'", "ANG_FORMAT": "'DEG'",
        "CSV_FORMAT": "'YES'", "MAKE_EPHEM": "'YES'",
    }


def parse_rows(result):
    """Return [(datetime, az, el)] from the CSV block between $$SOE and $$EOE."""
    if "$$SOE" not in result:
        raise ValueError("Horizons result has no $$SOE block: " + result[:300])
    block = result.split("$$SOE", 1)[1].split("$$EOE", 1)[0]
    rows = []
    for line in block.strip().splitlines():
        cells = [c.strip() for c in line.split(",")]
        when = dt.datetime.strptime(cells[0], "%Y-%b-%d %H:%M").replace(tzinfo=dt.timezone.utc)
        rows.append((when, float(cells[3]), float(cells[4])))
    return rows


def check_grid(rows, start, step_minutes):
    step = dt.timedelta(minutes=step_minutes)
    for i, (when, _, _) in enumerate(rows):
        if when != start + i * step:
            raise ValueError(f"row {i} at {when} breaks the {step_minutes}-minute grid")


def parse_time(text):
    return dt.datetime.strptime(text, "%Y-%m-%d %H:%M").replace(tzinfo=dt.timezone.utc)


def fetch(cfg, site, body_code, span):
    url = cfg["api_url"] + "?" + urllib.parse.urlencode(request_params(cfg, site, body_code, span))
    with urllib.request.urlopen(url, timeout=cfg["timeout_seconds"]) as resp:
        payload = json.load(resp)
    return url, parse_rows(payload["result"])


def freeze(cfg, point, span, rel):
    """Fetch Sun and Earth for one point, write data/<rel>, return its SOURCES entry."""
    start = parse_time(span[0])
    out = {"site": point["id"], "lat": point["lat"], "lon_east": point["lon_east"],
           "start": start.strftime("%Y-%m-%dT%H:%MZ"), "step_minutes": cfg["step_minutes"]}
    urls = []
    for name, code in cfg["bodies"].items():
        url, rows = fetch(cfg, point, code, span)
        check_grid(rows, start, cfg["step_minutes"])
        nd = cfg["decimals"]
        out[name] = {"az": [round(r[1], nd) for r in rows], "el": [round(r[2], nd) for r in rows]}
        urls.append(url)
        print(f"{point['id']} {name}: {len(rows)} rows", flush=True)
        time.sleep(cfg["pause_seconds"])
    write_json("data/" + rel, out)
    return {
        "file": rel, "url": urls[0], "urls": urls,
        "retrieved_at": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "license": LICENSE, "script": SCRIPT, "generated_by": GENERATED_BY,
    }


def main(argv):
    cfg = load("config/ephemeris.json")
    jobs = [(s, (cfg["start"], cfg["stop"]), f"ephem/{s['id']}.json") for s in load("config/sites.json")["sites"]]
    jobs += [(c, (c["start"], c["stop"]), f"check/{c['id']}.json") for c in cfg.get("check_points", [])]
    # H9(b) points that are not landing sites: full table range, kept with the check files.
    jobs += [(p, (cfg["start"], cfg["stop"]), f"check/{p['id']}.json") for p in load("config/pgda.json")["extra_points"]]
    wanted = set(argv) or {j[0]["id"] for j in jobs}
    sources_path = "data/SOURCES.json"
    sources = load(sources_path) if (ROOT / sources_path).exists() else {"files": []}
    by_file = {e["file"]: e for e in sources["files"]}
    for point, span, rel in jobs:
        if point["id"] in wanted:
            by_file[rel] = freeze(cfg, point, span, rel)
    sources["files"] = [by_file[k] for k in sorted(by_file)]
    (ROOT / sources_path).write_text(json.dumps(sources, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main(sys.argv[1:])
