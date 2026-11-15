#!/usr/bin/env python3
# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""Coarse LOLA grids for the terrain horizon of own coordinates (ADR 0106).

Block mean of each south-polar grid of config/horizon.json by an integer factor (config/terrain-own.json: 80 m → 400 m,
240 m → 960 m), plus the unchanged 80 m pixels in a square around the pole (crop_px, factor 1). Same format as the source (16-bit little-endian DN, height = DN * 0.5 m), pole at the grid centre, so the
page samples it with the same projection as scripts/horizon.py with scale_m and offset_px from config/terrain-own.json.

Usage: python3 scripts/terrain_coarse.py        (DEM files in the cache_dir of config/horizon.json; see horizon.py --download)
Writes data/terrain/<name>.bin and updates data/SOURCES.json.
"""
import json
import pathlib
import sys

import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
SCRIPT = "scripts/terrain_coarse.py"
GENERATED_BY = "Claude Code (Anthropic) wrote this script; the heights come from LRO LOLA (NASA PDS), {how}"


def load(rel):
    return json.loads((ROOT / rel).read_text(encoding="utf-8"))


def block_mean(heights, size, factor):
    """size×size int16 grid → (size/factor)² int16 grid of block means (rounded to the nearest DN)."""
    if size % factor:
        raise ValueError(f"size {size} is not a multiple of {factor}")
    n = size // factor
    grid = heights.reshape(n, factor, n, factor).astype(np.float64).mean(axis=(1, 3))
    return np.rint(grid).astype("<i2")


def coarse_spec(src, factor):
    """Projection of the coarse grid: one coarse pixel = the centre of a factor×factor block of the source."""
    return {"size": src["size"] // factor, "scale_m": src["scale_m"] * factor,
            "offset_px": (src["offset_px"] - (factor - 1) / 2.0) / factor}


def crop_start(src, crop):
    """First row/column of a crop×crop square centred on the pole (same start for rows and columns)."""
    if (src["size"] - crop) % 2:
        raise ValueError(f"crop {crop} cannot be centred in {src['size']}")
    return (src["size"] - crop) // 2


def crop_spec(src, crop):
    return {"size": crop, "scale_m": src["scale_m"], "offset_px": src["offset_px"] - crop_start(src, crop)}


def crop(heights, size, crop_px, start):
    return heights.reshape(size, size)[start:start + crop_px, start:start + crop_px].astype("<i2")


def main():
    hcfg = load("config/horizon.json")
    tcfg = load("config/terrain-own.json")
    cache = pathlib.Path(hcfg["cache_dir"]).expanduser()
    by_name = {d["name"]: d for d in hcfg["dems"]}
    sources_path = ROOT / "data/SOURCES.json"
    sources = json.loads(sources_path.read_text(encoding="utf-8"))
    entries = {e["file"]: e for e in sources["files"]}
    for g in tcfg["grids"]:
        src = by_name[g["from"]]
        spec = crop_spec(src, g["crop_px"]) if "crop_px" in g else coarse_spec(src, g["factor"])
        for key in ("size", "scale_m", "offset_px"):
            if abs(spec[key] - g[key]) > 1e-9:
                raise ValueError(f"{g['name']}: {key} {spec[key]} in the projection, {g[key]} in config/terrain-own.json")
        img = cache / (src["name"] + ".img")
        heights = np.fromfile(img, dtype="<i2")
        if heights.size != src["size"] ** 2:
            raise ValueError(f"{img.name}: {heights.size} samples, expected {src['size'] ** 2}")
        if "crop_px" in g:
            out = crop(heights, src["size"], g["crop_px"], crop_start(src, g["crop_px"]))
        else:
            out = block_mean(heights, src["size"], g["factor"])
        path = ROOT / "data" / g["file"]
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(out.tobytes())
        old = entries.get(g["file"], {})
        entries[g["file"]] = {"file": g["file"], "url": hcfg["dem_base_url"] + src["name"] + ".img",
                              "retrieved_at": old.get("retrieved_at") or by_file_time(cache, src),
                              "license": hcfg["credit"] + " (public, no login)", "script": SCRIPT,
                              "generated_by": GENERATED_BY.format(how="cropped around the pole, unchanged" if "crop_px" in g else "block-averaged")}
        print(f"{g['name']}: {spec['size']}² px of {spec['scale_m']:.0f} m from {src['name']}, {path.stat().st_size} bytes", flush=True)
    # Existing entries keep their place (other scripts' order untouched); new ones go at the end.
    order = [e["file"] for e in sources["files"]]
    order += [k for k in entries if k not in order]
    sources["files"] = [entries[k] for k in order]
    sources_path.write_text(json.dumps(sources, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def by_file_time(cache, src):
    import datetime as dt
    mtime = (cache / (src["name"] + ".img")).stat().st_mtime
    return dt.datetime.fromtimestamp(mtime, dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


if __name__ == "__main__":
    sys.exit(main())
