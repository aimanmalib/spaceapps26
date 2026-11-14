#!/usr/bin/env python3
# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""H9(b): compare the terrain horizon (item j) with an independent NASA product (PGDA average visibility maps).

Points = every site with a terrain profile (data/horizon/<id>.json) plus config/pgda.json extra_points.
PGDA value: the map pixel nearest the point (polar stereographic, same formula as scripts/horizon.py) and
the range over the (2w+1)^2 window around it; only those rows are downloaded (HTTP Range).
Tool value: share of hours in the point's Horizons table with any part of the disc above the terrain skyline,
computed by the page's code (src/terrain.js via scripts/terrain_share.mjs, needs Node 22 on PATH).
Writes the "pgda" part of data/validation.json (the "horizons" part is kept) and updates data/SOURCES.json.

Usage: python3 scripts/pgda.py
"""
import array
import datetime as dt
import json
import pathlib
import subprocess
import sys
import urllib.request

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import horizon as H  # noqa: E402

ROOT = H.ROOT
OUT = "data/validation.json"
SCRIPT = "scripts/pgda.py"
GENERATED_BY = "Claude Code (Anthropic) wrote this script; reference values come from NASA GSFC PGDA / LOLA"
BODIES = ("sun", "earth")


def pixel(grid, lat, lon):
    """Nearest (row, col) of the map pixel at (lat, lon); same projection formula as the DEM sampler."""
    x, y, z = H.unit(lat, lon)
    f = 2.0 * grid["moon_radius_m"] / grid["scale_m"] / (1.0 - z)
    return round(grid["offset_px"] - x * f), round(grid["offset_px"] + y * f)


def read_window(url, grid, row, col, w, timeout):
    """Values (scaled 0..1) of the (2w+1)^2 window centred on (row, col), fetched with one byte range."""
    n = grid["size"]
    if not (w <= row < n - w and w <= col < n - w):
        raise ValueError(f"pixel {row},{col} outside the map")
    first, last = ((row - w) * n + col - w) * 2, ((row + w) * n + col + w) * 2 + 1
    req = urllib.request.Request(url, headers={"Range": f"bytes={first}-{last}"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        if r.status != 206:
            raise ValueError(f"{url}: HTTP {r.status}, expected 206 (byte range)")
        raw = r.read()
    vals = array.array("h")
    vals.frombytes(raw)
    if sys.byteorder != "little":
        vals.byteswap()
    win = [[vals[(i * n) + j] for j in range(2 * w + 1)] for i in range(2 * w + 1)]
    s = grid["scaling_factor"]
    return [[v * s for v in line] for line in win]


def points(cfg):
    sites = H.load("config/sites.json")["sites"] + cfg["extra_points"]
    out = []
    for p in sites:
        if (ROOT / f"data/horizon/{p['id']}.json").exists():
            table = f"data/ephem/{p['id']}.json"
            if not (ROOT / table).exists():
                table = f"data/check/{p['id']}.json"
            out.append(dict(p, table=table, horizon=f"data/horizon/{p['id']}.json"))
    return out


def tool_shares(cfg, pts):
    jobs = [{"id": p["id"], "table": p["table"], "horizon": p["horizon"], "radius": cfg["disc_radius_deg"]} for p in pts]
    run = subprocess.run(["node", str(ROOT / "scripts/terrain_share.mjs")], input=json.dumps(jobs),
                         capture_output=True, text=True, check=True)
    return {r["id"]: r for r in json.loads(run.stdout)}


def summarize(rows, nd):
    out = {}
    for b in BODIES:
        d = [abs(r["diff"][b]) for r in rows]
        out[b] = {"max_abs": round(max(d), nd), "mean_abs": round(sum(d) / len(d), nd)}
    return out


def main():
    cfg = H.load("config/pgda.json")
    grid, w, nd = cfg["grid"], cfg["window_px"], cfg["decimals"]
    pts = points(cfg)
    shares = tool_shares(cfg, pts)
    rows = []
    for p in pts:
        r, c = pixel(grid, p["lat"], p["lon_east"])
        ref = {}
        for b in BODIES:
            win = read_window(cfg["maps"][b]["url"], grid, r, c, w, cfg["timeout_seconds"])
            flat = [v for line in win for v in line]
            ref[b] = {"value": round(win[w][w], nd), "window_min": round(min(flat), nd), "window_max": round(max(flat), nd)}
        tool = {b: round(shares[p["id"]][b], nd) for b in BODIES}
        rows.append({"site": p["id"], "lat": p["lat"], "lon_east": p["lon_east"], "pixel": {"row": r, "col": c},
                     "tool": tool, "pgda": ref, "diff": {b: round(tool[b] - ref[b]["value"], nd) for b in BODIES},
                     "hours": shares[p["id"]]["hours"]})
        print(p["id"], tool, {b: ref[b]["value"] for b in BODIES}, flush=True)
    first = shares[pts[0]["id"]]
    start = dt.datetime.strptime(first["start"], "%Y-%m-%dT%H:%MZ")
    stop = start + dt.timedelta(minutes=first["step_minutes"] * (first["hours"] - 1))
    data = H.load(OUT)
    data["pgda"] = {
        "generated_at": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "script": SCRIPT,
        "tool_period": {"start": start.strftime("%Y-%m-%dT%H:%MZ"), "stop": stop.strftime("%Y-%m-%dT%H:%MZ"), "step_minutes": first["step_minutes"]},
        "pgda_period": "hourly steps over 18.6 years (one lunar nutation cycle)",
        "disc_radius_deg": cfg["disc_radius_deg"], "window_px": 2 * w + 1, "map_scale_m": grid["scale_m"],
        **summarize(rows, nd), "sites": rows,
    }
    (ROOT / OUT).write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    sources_path = ROOT / "data/SOURCES.json"
    sources = json.loads(sources_path.read_text(encoding="utf-8"))
    for e in sources["files"]:
        if e["file"] == "validation.json":
            e["pgda"] = {"page": cfg["page_url"], "urls": [cfg["maps"][b]["url"] for b in BODIES],
                         "labels": [cfg["maps"][b]["label"] for b in BODIES], "retrieved_at": data["pgda"]["generated_at"],
                         "license": cfg["credit"], "script": SCRIPT, "generated_by": GENERATED_BY}
    sources_path.write_text(json.dumps(sources, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
