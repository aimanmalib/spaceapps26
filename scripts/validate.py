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

"scale" part (ADR 0108, --scale): config/validation.json "scale" pairs at every listed site over the frozen tables AND the
later dates (shown = frozen table up to its end, engine after it, as the page does), Horizons asked in polite batches
(scripts/horizons_batch.py, raw answers cached in data/horizons-cache.json). Pairs go to data/validation-scale.json; the
summary, the answers that differ (if any) and "all_checks" (every Horizons check of the project together) go to the
"scale" block of data/validation.json, which the first-screen line and the Validation page read.

Usage: python3 scripts/validate.py            # listed-site tables + engine
       python3 scripts/validate.py --engine   # engine part only (listed-site pairs read from data/validation.json)
       python3 scripts/validate.py --scale    # check at scale (run it last: all_checks reads the other checks)
"""
import datetime as dt
import json
import math
import random
import subprocess
import sys
import time

sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent))
import fetch_horizons as fh  # noqa: E402
import horizons_batch as hb  # noqa: E402

OUT = "data/validation.json"
SCALE_OUT = "data/validation-scale.json"
YEARS_OUT = "data/validation-years.json"
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


def mark_sources(pairs, eph):
    """Each pair gets "source": "table" (frozen Horizons table, up to its end) or "engine" (after it), as src/years.js."""
    end = fh.parse_time(eph["stop"])
    step = dt.timedelta(minutes=eph["step_minutes"])
    for p in pairs:
        t = fh.parse_time(p["time_utc"].replace("T", " "))
        if end < t < end + step:
            raise ValueError(f"{p['site']} {p['time_utc']} is in the hour that mixes table and engine rows; change the seed")
        p["source"] = "table" if t <= end else "engine"
    return pairs


def shown_by_source(pairs):
    """What the page shows: frozen table (scripts/shown_angles.mjs) or engine (scripts/engine_angles.mjs) per pair."""
    shown = [None] * len(pairs)
    for source, script in (("table", "scripts/shown_angles.mjs"), ("engine", "scripts/engine_angles.mjs")):
        idx = [i for i, p in enumerate(pairs) if p["source"] == source]
        for i, sample in zip(idx, shown_angles([pairs[i] for i in idx], script) if idx else []):
            shown[i] = sample
    return shown


def batch_refs(client, eph, pairs, by_id):
    """Horizons angles for every pair: one batched request per site and body (cached)."""
    refs = [{} for _ in pairs]
    for sid in sorted({p["site"] for p in pairs}):
        idx = [i for i, p in enumerate(pairs) if p["site"] == sid]
        for body, code in eph["bodies"].items():
            got = client.angles(by_id[sid], code, [pairs[i]["time_utc"].replace("T", " ") for i in idx])
            for i in idx:
                az, el = got[pairs[i]["time_utc"]]
                refs[i][body] = {"az": az, "el": el}
    return refs


def sky_separation(a, b):
    """Angle on the sky (degrees) between two directions {az, el}; haversine form, steady for small angles."""
    az1, el1, az2, el2 = (math.radians(x) for x in (a["az"], a["el"], b["az"], b["el"]))
    h = math.sin((el2 - el1) / 2) ** 2 + math.cos(el1) * math.cos(el2) * math.sin((az2 - az1) / 2) ** 2
    return math.degrees(2 * math.asin(min(1.0, math.sqrt(h))))


def separation_summary(rows, nd):
    """Largest and average angle on the sky between shown and Horizons, per body: azimuth differences grow near the
    zenith and nadir, where a small shift on the sky turns the azimuth a lot; this number does not."""
    out = {}
    for b in ("sun", "earth"):
        vals = [sky_separation(r["shown"][b], r["horizons"][b]) for r in rows]
        out[b] = {"max_deg": round(max(vals), nd), "mean_deg": round(sum(vals) / len(vals), nd)}
    return out


def differing(rows, threshold):
    """Pairs where the page and Horizons give a different yes/no answer (reported, never dropped)."""
    out = []
    for r in rows:
        for kind, b in (("power", "sun"), ("comm", "earth")):
            if (r["shown"][b]["el"] > threshold) != (r["horizons"][b]["el"] > threshold):
                out.append({"site": r["site"], "time_utc": r["time_utc"], "source": r["source"], "answer": kind,
                            "shown_el": r["shown"][b]["el"], "horizons_el": r["horizons"][b]["el"]})
    return out


def all_checks(v, years, scale_rows, listed, nd, threshold):
    """Every Horizons check together, each (point, minute) once: H9(a) table pairs, engine at unnamed points (the
    listed-site engine rows reuse the H9(a) pairs), later years, and the check at scale."""
    parts = {
        "table": v["horizons"]["pairs"],
        "engine_points": [r for r in v["engine"]["pairs"] if r["site"] not in listed],
        "later_years": years["pairs"],
        "scale": scale_rows,
    }
    rows = [r for part in parts.values() for r in part]
    return dict(summarize(rows, nd, threshold), pairs=len(rows), angles=4 * len(rows),
                parts={k: len(p) for k, p in parts.items()}, different=len(differing([dict(r, source="") for r in rows], threshold)))


def scale_part(eph, vcfg, sites, nd, threshold, now):
    scfg = vcfg["scale"]
    by_id = {s["id"]: s for s in sites}
    span = {"start": scfg["from"], "stop": scfg["to"], "step_minutes": eph["step_minutes"]}
    pairs = mark_sources(draw_pairs(sites, span, scfg, with_coords=True), eph)
    client = hb.Client(eph, scfg)
    refs = batch_refs(client, eph, pairs, by_id)
    client.prune()
    print(f"Horizons requests sent this run: {client.sent} (cached answers used: {len(client.used)})", flush=True)
    rows = compare(pairs, shown_by_source(pairs), refs, nd)
    by_source = {}
    for source in ("table", "engine"):
        sub = [r for r in rows if r["source"] == source]
        by_source[source] = dict(summarize(sub, nd, threshold), first=min(r["time_utc"] for r in sub), last=max(r["time_utc"] for r in sub))
    summary = dict(summarize(rows, nd, threshold), sky_separation=separation_summary(rows, nd), by_source=by_source,
                   different_answers=differing(rows, threshold))
    head = {"generated_at": now, "script": SCRIPT + " --scale", "seed": scfg["seed"], "from": scfg["from"], "to": scfg["to"],
            "sites": len(sites), "pairs_per_site": scfg["pairs_per_site"], "horizons_requests": len(client.used)}
    return head, summary, rows


def write_sources(entries):
    sources = fh.load("data/SOURCES.json")
    by_file = {e["file"]: e for e in sources["files"]}
    for e in entries:
        by_file[e["file"]] = {**by_file.get(e["file"], {}), **e}
    sources["files"] = [by_file[k] for k in sorted(by_file)]
    (fh.ROOT / "data/SOURCES.json").write_text(json.dumps(sources, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main_scale(eph, vcfg, sites, nd, threshold, now):
    head, summary, rows = scale_part(eph, vcfg, sites, nd, threshold, now)
    (fh.ROOT / SCALE_OUT).write_text(json.dumps(dict(head, summary=summary, pairs=rows), indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    v = fh.load(OUT)
    v["scale"] = dict(head, file=SCALE_OUT.split("/", 1)[1], **summary,
                      all_checks=all_checks(v, fh.load(YEARS_OUT), rows, {s["id"] for s in sites}, nd, threshold))
    (fh.ROOT / OUT).write_text(json.dumps(v, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    note = "Check at scale (ADR 0108): config/validation.json scale pairs at every listed site, frozen-table and engine dates; Horizons asked in batches of minutes (TLIST, calendar UT), one request per site and body."
    write_sources([
        {"file": "validation-scale.json", "url": eph["api_url"], "note": note, "retrieved_at": now, "license": fh.LICENSE,
         "script": SCRIPT + " --scale", "generated_by": GENERATED_BY},
        {"file": vcfg["scale"]["cache_file"].split("/", 1)[1], "url": eph["api_url"],
         "note": "Raw JPL Horizons answers of the check at scale, keyed by request (the full request URL is kept with each answer); a second run reads them instead of asking again.",
         "retrieved_at": now, "license": fh.LICENSE, "script": SCRIPT + " --scale", "generated_by": GENERATED_BY},
    ])
    a = v["scale"]["all_checks"]
    print(f"scale: {len(rows)} pairs, max {summary['max_abs_deg']}°, same {summary['same_answer']}; "
          f"all checks: {a['pairs']} pairs, max {a['max_abs_deg']}°, same {a['same_answer']}, different {a['different']}")


def main(argv):
    eph, vcfg = fh.load("config/ephemeris.json"), fh.load("config/validation.json")
    threshold = fh.load("config/view.json")["horizon_threshold_deg"]
    sites = fh.load("config/sites.json")["sites"]
    by_id = {s["id"]: s for s in sites}
    nd = vcfg["decimals_report"]
    old = fh.load(OUT) if (fh.ROOT / OUT).exists() else {}
    now = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    if "--scale" in argv:
        return main_scale(eph, vcfg, sites, nd, threshold, now)
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
        # Blocks written by scripts/pgda_period.py, scripts/pgda_sample.py and --scale are kept as they are.
        **{k: old[k] for k in ("pgda_period", "pgda_sample", "scale") if k in old},
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
