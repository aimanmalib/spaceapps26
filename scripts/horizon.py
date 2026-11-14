#!/usr/bin/env python3
# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""Terrain horizon profiles (item j) from the LOLA south-polar DEMs.

For each site in config/sites.json that lies inside the DEM coverage, cast one ray per azimuth
from the site across the DEM and keep the highest elevation angle of the terrain. The angle is
measured from the local tangent plane of the ideal sphere (radius in config/horizon.json), the same
reference the JPL Horizons tables use, so "Sun elevation > terrain horizon elevation" means the Sun
is above the real skyline. The 3D geometry includes the curvature of the lunar sphere.

DEM: LOLA GDR polar stereographic grids (16-bit little-endian, height = DN * 0.5 m above 1737.4 km).
The finest grid that covers a point is used (80 m first, 240 m further out).

Usage: python3 scripts/horizon.py [site_id ...]     (DEM files must be in cache_dir; see --download)
       python3 scripts/horizon.py --download        (fetch the .img/.lbl files listed in config)
Writes data/horizon/<site_id>.json and updates data/SOURCES.json.
"""
import array
import datetime as dt
import json
import math
import pathlib
import sys
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
SCRIPT = "scripts/horizon.py"
GENERATED_BY = "Claude Code (Anthropic) wrote this script; the heights come from LRO LOLA (NASA PDS)"


def load(rel):
    return json.loads((ROOT / rel).read_text(encoding="utf-8"))


class Dem:
    """One south-polar stereographic grid. Sampling works on unit vectors (no trig per step)."""

    def __init__(self, spec, radius_m, heights):
        self.name = spec["name"]
        self.size = spec["size"]
        self.scale = spec["scale_m"]
        self.offset = spec["offset_px"]
        self.dn = spec["dn_scale_m"]
        self.k = 2.0 * radius_m / self.scale
        self.h = heights  # array('h') of size*size, row-major

    def pixel(self, x, y, z):
        """Fractional (row, col) of the unit vector (x, y, z); south pole at the grid centre."""
        f = self.k / (1.0 - z)
        return self.offset - x * f, self.offset + y * f

    def height(self, x, y, z):
        """Bilinear height (m) above the reference sphere, or None outside the grid."""
        row, col = self.pixel(x, y, z)
        r0, c0 = math.floor(row), math.floor(col)
        n = self.size
        if r0 < 0 or c0 < 0 or r0 >= n - 1 or c0 >= n - 1:
            return None
        fr, fc = row - r0, col - c0
        i = r0 * n + c0
        h = self.h
        top = h[i] + (h[i + 1] - h[i]) * fc
        bot = h[i + n] + (h[i + n + 1] - h[i + n]) * fc
        return (top + (bot - top) * fr) * self.dn


def unit(lat, lon):
    la, lo = math.radians(lat), math.radians(lon)
    return math.cos(la) * math.cos(lo), math.cos(la) * math.sin(lo), math.sin(la)


def sample(dems, x, y, z):
    """(height, dem) from the finest grid that covers the point; (None, None) if none does."""
    for dem in dems:
        h = dem.height(x, y, z)
        if h is not None:
            return h, dem
    return None, None


def steps(cfg):
    """Ray distances (m): fixed first step, then growing with distance."""
    s, first, frac, end = cfg["first_step_m"], cfg["first_step_m"], cfg["step_fraction"], cfg["max_distance_km"] * 1000.0
    out = []
    while s <= end:
        out.append(s)
        s += max(first, s * frac)
    return out


def profile(cfg, dems, lat, lon):
    """Terrain horizon for one site: elevation (deg), distance of the skyline point (km) and ray reach (km)."""
    radius = cfg["moon_radius_m"]
    ux, uy, uz = unit(lat, lon)
    h0, dem0 = sample(dems, ux, uy, uz)
    if h0 is None:
        raise ValueError(f"site {lat},{lon} is outside every DEM")
    r_obs = radius + h0 + cfg["observer_height_m"]
    # Local north and east unit vectors at the site.
    la, lo = math.radians(lat), math.radians(lon)
    nx, ny, nz = -math.sin(la) * math.cos(lo), -math.sin(la) * math.sin(lo), math.cos(la)
    ex, ey, ez = -math.sin(lo), math.cos(lo), 0.0
    dist = steps(cfg)
    trig = [(math.cos(s / radius), math.sin(s / radius), 2.0 * math.sin(s / radius / 2.0) ** 2) for s in dist]
    n_az = int(round(360.0 / cfg["azimuth_step_deg"]))
    elev, at_km, reach_km = [], [], []
    for i in range(n_az):
        az = math.radians(i * cfg["azimuth_step_deg"])
        tx, ty, tz = math.cos(az) * nx + math.sin(az) * ex, math.cos(az) * ny + math.sin(az) * ey, math.cos(az) * nz + math.sin(az) * ez
        best, best_s, reach = -90.0, 0.0, 0.0
        best_sin = -1.0
        for s, (c, sn, one_minus_c) in zip(dist, trig):
            px, py, pz = c * ux + sn * tx, c * uy + sn * ty, c * uz + sn * tz
            h, _ = sample(dems, px, py, pz)
            if h is None:
                break
            reach = s
            a = radius + h
            up = (a - r_obs) - a * one_minus_c  # (P - O) . up
            d2 = (a - r_obs) ** 2 + 2.0 * a * r_obs * one_minus_c
            sin_el = up / math.sqrt(d2)
            if sin_el > best_sin:
                best_sin, best_s = sin_el, s
        best = math.degrees(math.asin(best_sin)) if best_sin > -1.0 else -90.0
        elev.append(best)
        at_km.append(best_s / 1000.0)
        reach_km.append(reach / 1000.0)
    return {"site_height_m": h0, "site_dem": dem0.name, "elev": elev, "at_km": at_km, "reach_km": reach_km}


def read_dems(cfg):
    cache = pathlib.Path(cfg["cache_dir"]).expanduser()
    dems = []
    for spec in cfg["dems"]:  # finest first
        heights = array.array("h")
        heights.frombytes((cache / (spec["name"] + ".img")).read_bytes())
        if sys.byteorder != "little":
            heights.byteswap()
        if len(heights) != spec["size"] ** 2:
            raise ValueError(f"{spec['name']}: {len(heights)} samples, expected {spec['size'] ** 2}")
        dems.append(Dem(spec, cfg["moon_radius_m"], heights))
    return dems


def covered(cfg, site):
    return site["lat"] <= max(d["max_lat"] for d in cfg["dems"])


def download(cfg):
    cache = pathlib.Path(cfg["cache_dir"]).expanduser()
    cache.mkdir(parents=True, exist_ok=True)
    for spec in cfg["dems"]:
        for ext in (".lbl", ".img"):
            target = cache / (spec["name"] + ext)
            if not target.exists():
                print("download", target.name, flush=True)
                urllib.request.urlretrieve(cfg["dem_base_url"] + spec["name"] + ext, target)


def source_entry(cfg, rel):
    cache = pathlib.Path(cfg["cache_dir"]).expanduser()
    urls = [cfg["dem_base_url"] + d["name"] + ".img" for d in cfg["dems"]]
    mtimes = [(cache / (d["name"] + ".img")).stat().st_mtime for d in cfg["dems"]]
    retrieved = dt.datetime.fromtimestamp(min(mtimes), dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return {"file": rel, "url": urls[0], "urls": urls, "retrieved_at": retrieved,
            "license": cfg["credit"] + " (public, no login)", "script": SCRIPT, "generated_by": GENERATED_BY}


def main(argv):
    cfg = load("config/horizon.json")
    if "--download" in argv:
        download(cfg)
        return
    points = load("config/sites.json")["sites"] + load("config/pgda.json")["extra_points"]  # extra = H9(b) check points
    sites = [s for s in points if covered(cfg, s) and (not argv or s["id"] in argv)]
    dems = read_dems(cfg)
    nd = cfg["decimals"]
    sources_path = ROOT / "data/SOURCES.json"
    sources = json.loads(sources_path.read_text(encoding="utf-8"))
    by_file = {e["file"]: e for e in sources["files"]}
    for site in sites:
        p = profile(cfg, dems, site["lat"], site["lon_east"])
        out = {"site": site["id"], "lat": site["lat"], "lon_east": site["lon_east"],
               "reference": "local tangent plane of the ideal sphere (same as the JPL Horizons tables)",
               "observer_height_m": cfg["observer_height_m"], "site_height_m": round(p["site_height_m"], 1),
               "site_dem": p["site_dem"], "dems": [d["name"] for d in cfg["dems"]],
               "azimuth_step_deg": cfg["azimuth_step_deg"], "max_distance_km": cfg["max_distance_km"],
               "elev": [round(e, nd) for e in p["elev"]],
               "at_km": [round(a, 1) for a in p["at_km"]],
               "reach_km": [round(r) for r in p["reach_km"]]}
        rel = f"horizon/{site['id']}.json"
        path = ROOT / "data" / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(out, separators=(",", ":"), ensure_ascii=False) + "\n", encoding="utf-8")
        by_file[rel] = source_entry(cfg, rel)
        e = p["elev"]
        print(f"{site['id']}: height {p['site_height_m']:.0f} m ({p['site_dem']}), horizon min {min(e):.2f} max {max(e):.2f} "
              f"mean {sum(e) / len(e):.2f} deg, reach min {min(p['reach_km']):.0f} km", flush=True)
    sources["files"] = [by_file[k] for k in sorted(by_file)]
    sources_path.write_text(json.dumps(sources, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main(sys.argv[1:])
