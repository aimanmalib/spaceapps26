#!/usr/bin/env python3
# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""H9(a): compare the Sun/Earth angles the site shows with JPL Horizons asked directly.

For each site in config/sites.json, draw `pairs_per_site` minutes (fixed seed, config/validation.json)
inside the frozen table range and never on a table row. "Shown" = the frozen hourly table read by the
page's own code (src/ephem.js, through scripts/shown_angles.mjs, needs Node 22 on PATH). "Horizons" = a
fresh one-minute Horizons request for the same site and minute (same request shape as fetch_horizons.py).
Writes data/validation.json (the "pgda" part is kept as is) and updates data/SOURCES.json.

Usage: python3 scripts/validate.py
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


def draw_pairs(sites, eph, vcfg):
    rng = random.Random(vcfg["seed"])
    start = fh.parse_time(eph["start"])
    total = int((fh.parse_time(eph["stop"]) - start).total_seconds() // 60)
    pairs = []
    for site in sites:
        seen = set()
        while len(seen) < vcfg["pairs_per_site"]:
            minute = rng.randrange(1, total)
            if minute % eph["step_minutes"]:
                seen.add(minute)
        for minute in sorted(seen):
            when = start + dt.timedelta(minutes=minute)
            pairs.append({"site": site["id"], "time_utc": when.strftime("%Y-%m-%dT%H:%M")})
    if len(pairs) > vcfg["max_pairs_total"]:
        raise ValueError(f"{len(pairs)} pairs > max_pairs_total {vcfg['max_pairs_total']}")
    return pairs


def shown_angles(pairs):
    run = subprocess.run(["node", str(fh.ROOT / "scripts/shown_angles.mjs")], input=json.dumps(pairs),
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


def main():
    eph, vcfg = fh.load("config/ephemeris.json"), fh.load("config/validation.json")
    threshold = fh.load("config/view.json")["horizon_threshold_deg"]
    sites = fh.load("config/sites.json")["sites"]
    by_id = {s["id"]: s for s in sites}
    pairs = draw_pairs(sites, eph, vcfg)
    shown = shown_angles(pairs)
    nd = vcfg["decimals_report"]
    rows, urls = [], []
    for pair, sample in zip(pairs, shown):
        if sample is None:
            raise ValueError(f"no shown value for {pair}")
        ref = horizons_angles(eph, vcfg, by_id[pair["site"]], pair["time_utc"])
        diff = {b: {"az": round(az_diff(sample[b]["az"], ref[b]["az"]), nd), "el": round(sample[b]["el"] - ref[b]["el"], nd)}
                for b in ("sun", "earth")}
        shown_r = {b: {k: round(v, nd) for k, v in sample[b].items()} for b in ("sun", "earth")}
        rows.append(dict(pair, shown=shown_r, horizons=ref, diff=diff))
        print(f"{pair['site']} {pair['time_utc']}: {diff}", flush=True)
    old = fh.load(OUT) if (fh.ROOT / OUT).exists() else {}
    now = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    result = {
        "generated_at": now, "script": SCRIPT, "seed": vcfg["seed"],
        "horizons": dict(summarize(rows, nd, threshold), pairs=rows),
        "pgda": old.get("pgda", {"sites": []}),
    }
    (fh.ROOT / OUT).write_text(json.dumps(result, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    sources = fh.load("data/SOURCES.json")
    by_file = {e["file"]: e for e in sources["files"]}
    by_file["validation.json"] = {
        "file": "validation.json", "url": eph["api_url"],
        "note": "One Horizons request per pair and body (same parameters as the ephem tables, 1-minute span).",
        "retrieved_at": now, "license": fh.LICENSE, "script": SCRIPT, "generated_by": GENERATED_BY,
    }
    sources["files"] = [by_file[k] for k in sorted(by_file)]
    (fh.ROOT / "data/SOURCES.json").write_text(json.dumps(sources, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
