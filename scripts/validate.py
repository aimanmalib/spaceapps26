#!/usr/bin/env python3
# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""H9(a): compare the Sun/Earth angles the site shows with JPL Horizons asked directly.

For each site in config/sites.json, draw `pairs_per_site` minutes (fixed seed, config/validation.json)
inside the frozen table range and never on a table row. "Shown" = the frozen hourly table read by the
page's own code (src/ephem.js, through scripts/shown_angles.mjs, needs Node 22 on PATH). "Horizons" = a
fresh one-minute Horizons request for the same site and minute (same request shape as fetch_horizons.py).
Writes data/validation.json (the "pgda" and "pgda_sample" parts are kept as is) and updates data/SOURCES.json.

"engine" part (item b, own coordinates): the in-browser engine (scripts/engine_angles.mjs) at the same listed-site
pairs (Horizons values reused) and at new pairs on the unnamed check points of config/validation.json "engine".

Usage: python3 scripts/validate.py            # listed-site tables + engine
       python3 scripts/validate.py --engine   # engine part only (listed-site pairs read from data/validation.json)
"""
import datetime as dt
import json
import random
import subprocess
import sys
import time

sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent))
import fetch_horizons as fh  # noqa: E402

OUT = "data/validation.json"
SCRIPT = "scripts/validate.py"
GENERATED_BY = "Claude Code (Anthropic) wrote this script; reference numbers come from JPL Horizons"
QUANTITIES = [("sun", "az"), ("sun", "el"), ("earth", "az"), ("earth", "el")]


def az_diff(a, b):
    """Signed smallest difference a - b on a circle, in (-180, 180]."""
    d = (a - b) % 360.0
    return d - 360.0 if d > 180.0 else d


def draw_pairs(sites, eph, vcfg, per_site="pairs_per_site", with_coords=False):
    rng = random.Random(vcfg["seed"])
    start = fh.parse_time(eph["start"])
    total = int((fh.parse_time(eph["stop"]) - start).total_seconds() // 60)
    pairs = []
    for site in sites:
        seen = set()
        while len(seen) < vcfg[per_site]:
            minute = rng.randrange(1, total)
            if minute % eph["step_minutes"]:
                seen.add(minute)
        for minute in sorted(seen):
            when = start + dt.timedelta(minutes=minute)
            pair = {"site": site["id"], "time_utc": when.strftime("%Y-%m-%dT%H:%M")}
            pairs.append(dict(pair, lat=site["lat"], lon_east=site["lon_east"]) if with_coords else pair)
    if len(pairs) > vcfg["max_pairs_total"]:
        raise ValueError(f"{len(pairs)} pairs > max_pairs_total {vcfg['max_pairs_total']}")
    return pairs


def shown_angles(pairs, script="scripts/shown_angles.mjs"):
    run = subprocess.run(["node", str(fh.ROOT / script)], input=json.dumps(pairs),
                         capture_output=True, text=True, check=True)
    return json.loads(run.stdout)


def horizons_angles(eph, vcfg, site, when):
    cfg = dict(eph, step_minutes=int(vcfg["horizons_step"].split()[0]))
    t = fh.parse_time(when.replace("T", " "))
    span = (t.strftime("%Y-%m-%d %H:%M"), (t + dt.timedelta(minutes=1)).strftime("%Y-%m-%d %H:%M"))
    out = {}
    for name, code in eph["bodies"].items():
        _, rows = fh.fetch(cfg, site, code, span)
        if rows[0][0] != t:
            raise ValueError(f"Horizons first row {rows[0][0]} != {t}")
        out[name] = {"az": rows[0][1], "el": rows[0][2]}
        time.sleep(vcfg["pause_seconds"])
    return out


def summarize(rows, nd, threshold):
    stats = {}
    for body, key in QUANTITIES:
        vals = [abs(r["diff"][body][key]) for r in rows]
        stats[f"{body}_{key}"] = {"max_abs_deg": round(max(vals), nd), "mean_abs_deg": round(sum(vals) / len(vals), nd)}
    same = {kind: sum((r["shown"][b]["el"] > threshold) == (r["horizons"][b]["el"] > threshold) for r in rows)
            for kind, b in (("power", "sun"), ("comm", "earth"))}
    return {
        "max_abs_deg": max(s["max_abs_deg"] for s in stats.values()),
        "mean_abs_deg": round(sum(s["mean_abs_deg"] for s in stats.values()) / len(stats), nd),
        "by_quantity": stats, "same_answer": dict(same, of=len(rows)),
    }


def compare(pairs, shown, refs, nd):
    """Rows {pair…, shown, horizons, diff}; refs[i] = Horizons angles for pairs[i]."""
    rows = []
    for pair, sample, ref in zip(pairs, shown, refs):
        if sample is None:
            raise ValueError(f"no shown value for {pair}")
        diff = {b: {"az": round(az_diff(sample[b]["az"], ref[b]["az"]), nd), "el": round(sample[b]["el"] - ref[b]["el"], nd)}
                for b in ("sun", "earth")}
        shown_r = {b: {k: round(v, nd) for k, v in sample[b].items()} for b in ("sun", "earth")}
        rows.append(dict(pair, shown=shown_r, horizons=ref, diff=diff))
        print(f"{pair['site']} {pair['time_utc']}: {diff}", flush=True)
    return rows


def fetch_refs(eph, vcfg, pairs, by_id):
    return [horizons_angles(eph, vcfg, by_id[p["site"]], p["time_utc"]) for p in pairs]


def engine_part(eph, vcfg, site_rows, by_id, nd, threshold):
    """Own coordinates (item b): engine at the listed-site pairs (refs reused) + new pairs at unnamed points."""
    ecfg = vcfg["engine"]
    points = ecfg["points"]
    new = draw_pairs(points, eph, ecfg, "pairs_per_point", with_coords=True)
    reused = [dict(site=r["site"], time_utc=r["time_utc"], lat=by_id[r["site"]]["lat"], lon_east=by_id[r["site"]]["lon_east"])
              for r in site_rows]
    refs = [r["horizons"] for r in site_rows] + fetch_refs(eph, vcfg, new, {**by_id, **{p["id"]: p for p in points}})
    pairs = reused + new
    rows = compare(pairs, shown_angles(pairs, "scripts/engine_angles.mjs"), refs, nd)
    return dict(summarize(rows, nd, threshold), seed=ecfg["seed"], points=len(points), pairs=rows)


def main(argv):
    eph, vcfg = fh.load("config/ephemeris.json"), fh.load("config/validation.json")
    threshold = fh.load("config/view.json")["horizon_threshold_deg"]
    sites = fh.load("config/sites.json")["sites"]
    by_id = {s["id"]: s for s in sites}
    nd = vcfg["decimals_report"]
    old = fh.load(OUT) if (fh.ROOT / OUT).exists() else {}
    now = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    if "--engine" in argv:
        horizons = old["horizons"]
    else:
        pairs = draw_pairs(sites, eph, vcfg)
        rows = compare(pairs, shown_angles(pairs), fetch_refs(eph, vcfg, pairs, by_id), nd)
        horizons = dict(summarize(rows, nd, threshold), pairs=rows)
    engine = dict(engine_part(eph, vcfg, horizons["pairs"], by_id, nd, threshold), generated_at=now)
    result = {
        "generated_at": old.get("generated_at", now) if "--engine" in argv else now, "script": SCRIPT, "seed": vcfg["seed"],
        "horizons": horizons, "engine": engine,
        "pgda": old.get("pgda", {"sites": []}),
        **({"pgda_sample": old["pgda_sample"]} if "pgda_sample" in old else {}),  # written by scripts/pgda_sample.py
    }
    (fh.ROOT / OUT).write_text(json.dumps(result, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    sources = fh.load("data/SOURCES.json")
    by_file = {e["file"]: e for e in sources["files"]}
    by_file["validation.json"] = {
        **by_file.get("validation.json", {}),  # keeps the "pgda" part written by scripts/pgda.py
        "file": "validation.json", "url": eph["api_url"],
        "note": "One Horizons request per pair and body (same parameters as the ephem tables, 1-minute span). The \"engine\" part reuses the listed-site answers and adds pairs at unnamed check points (config/validation.json).",
        "retrieved_at": now, "license": fh.LICENSE, "script": SCRIPT, "generated_by": GENERATED_BY,
    }
    sources["files"] = [by_file[k] for k in sorted(by_file)]
    (fh.ROOT / "data/SOURCES.json").write_text(json.dumps(sources, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main(sys.argv[1:])
