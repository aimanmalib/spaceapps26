#!/usr/bin/env python3
# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""Later dates (ADR 0104): the in-browser engine against JPL Horizons on random dates after the frozen tables.

Draws config/years.json check.pairs (site, minute) pairs at random (fixed seed): a listed site from config/sites.json
and a minute in check.from..check.to, never on a table hour. "Shown" = the engine through scripts/engine_angles.mjs
(same engine, grid, rounding and interpolation as the page past the frozen tables). "Horizons" = a fresh one-minute
Horizons request for the same site and minute (same request as scripts/validate.py). Writes data/validation-years.json
and its data/SOURCES.json entry. "passed" is true only when every direction is within check.max_sky_deg on the sky and every
yes/no answer is the same; the page then labels the engine "validated against JPL Horizons" for these dates.

Usage: python3 scripts/validate_years.py   (Node 22 on PATH; about two minutes, two Horizons requests per pair)
"""
import datetime as dt
import json
import random
import sys

sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent))
import fetch_horizons as fh  # noqa: E402
import validate as v  # noqa: E402

OUT = "data/validation-years.json"
SCRIPT = "scripts/validate_years.py"


def draw_pairs(sites, eph, check):
    """check.pairs (site, minute) pairs, fixed seed, inside [from, to), never on a table row; sorted by time."""
    rng = random.Random(check["seed"])
    start = fh.parse_time(check["from"])
    total = int((fh.parse_time(check["to"]) - start).total_seconds() // 60)
    seen = set()
    while len(seen) < check["pairs"]:
        site = rng.choice(sites)
        minute = rng.randrange(1, total)
        if minute % eph["step_minutes"]:
            seen.add((minute, site["id"]))
    by_id = {s["id"]: s for s in sites}
    return [{"site": sid, "time_utc": (start + dt.timedelta(minutes=m)).strftime("%Y-%m-%dT%H:%M"),
             "lat": by_id[sid]["lat"], "lon_east": by_id[sid]["lon_east"]} for m, sid in sorted(seen)]


def passed(summary, max_sky):
    """The rule (ADR 0113): Sun and Earth directions within max_sky on the sky (great circle) and every yes/no answer the same."""
    same, sky = summary["same_answer"], summary["sky_separation"]
    return (sky["sun"]["max_deg"] <= max_sky and sky["earth"]["max_deg"] <= max_sky
            and same["power"] == same["of"] and same["comm"] == same["of"])


def main():
    eph, vcfg = fh.load("config/ephemeris.json"), fh.load("config/validation.json")
    check = fh.load("config/years.json")["check"]
    threshold = fh.load("config/view.json")["horizon_threshold_deg"]
    sites = fh.load("config/sites.json")["sites"]
    nd = vcfg["decimals_report"]
    pairs = draw_pairs(sites, eph, check)
    for block in check.get("extra", []):  # later ranges, own fixed seed each (ADR 0113)
        pairs += draw_pairs(sites, eph, block)
    pairs.sort(key=lambda p: (p["time_utc"], p["site"]))
    last_to = max([check["to"]] + [b["to"] for b in check.get("extra", [])])
    old = fh.load(OUT) if (fh.ROOT / OUT).exists() else {}
    # --reuse: recorded Horizons answers for pairs already in the file; only new pairs are asked (same request as before).
    recorded = {(r["site"], r["time_utc"]): r["horizons"] for r in old.get("pairs", [])} if "--reuse" in sys.argv else {}
    missing = [p for p in pairs if (p["site"], p["time_utc"]) not in recorded]
    fetched = dict(zip([(p["site"], p["time_utc"]) for p in missing], v.fetch_refs(eph, vcfg, missing, {s["id"]: s for s in sites}))) if missing else {}
    refs = [recorded.get((p["site"], p["time_utc"])) or fetched[(p["site"], p["time_utc"])] for p in pairs]
    print(f"recorded answers reused: {len(pairs) - len(missing)}, new Horizons pairs: {len(missing)}", flush=True)
    rows = v.compare(pairs, v.shown_angles(pairs, "scripts/engine_angles.mjs"), refs, nd)
    summary = v.summarize(rows, nd, threshold)
    summary["sky_separation"] = v.separation_summary(rows, nd)  # information only; "passed" keeps the rule of config/years.json
    now = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    result = {"generated_at": now, "script": SCRIPT, "seed": check["seed"], "from": check["from"], "to": last_to, "extra": check.get("extra", []),
              "max_sky_deg": check["max_sky_deg"], "passed": passed(summary, check["max_sky_deg"]),
              "horizons_retrieved_at": now if missing else old.get("horizons_retrieved_at", old.get("generated_at")),
              "summary": summary, "pairs": rows}
    (fh.ROOT / OUT).write_text(json.dumps(result, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    if not missing:
        print(f"max {summary['max_abs_deg']}°, on the sky {summary['sky_separation']}, same answers {summary['same_answer']}, passed {result['passed']} (recorded answers)")
        return
    sources = fh.load("data/SOURCES.json")
    by_file = {e["file"]: e for e in sources["files"]}
    by_file["validation-years.json"] = {
        "file": "validation-years.json", "url": eph["api_url"],
        "note": "Engine (src/moonsky.js) against JPL Horizons on random listed-site pairs after the frozen tables (config/years.json check); one Horizons request per pair and body, 1-minute span.",
        "retrieved_at": now, "license": fh.LICENSE, "script": SCRIPT, "generated_by": v.GENERATED_BY,
    }
    sources["files"] = [by_file[k] for k in sorted(by_file)]
    (fh.ROOT / "data/SOURCES.json").write_text(json.dumps(sources, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"max {summary['max_abs_deg']}°, same answers {summary['same_answer']}, passed {result['passed']}")


if __name__ == "__main__":
    main()
