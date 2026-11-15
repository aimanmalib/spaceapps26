// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// 2D map (item h), pure parts: relief shading of data/map/<site>.json and overlay geometry in km
// (x = east, y = north, site at 0,0; the grid is azimuthal equidistant, so azimuths are straight lines from the site).

// Point at azimuth az (deg from north toward east) and distance km from the site.
export function polar(az, km) {
  const a = (az * Math.PI) / 180;
  return { x: km * Math.sin(a), y: km * Math.cos(a) };
}

// Where a ray from the site at azimuth az leaves the square map (half width h km).
export function edgePoint(az, h) {
  const { x, y } = polar(az, 1);
  const k = h / Math.max(Math.abs(x), Math.abs(y));
  return { x: x * k, y: y * k };
}

// Terrain skyline points (item j profile) every `everyDeg`, only those that fall inside the map.
export function skylinePoints(profile, everyDeg, h) {
  const n = profile.at_km.length;
  const stride = Math.max(1, Math.round(everyDeg / profile.azimuth_step_deg));
  const out = [];
  for (let i = 0; i < n; i += stride) {
    const p = polar(i * profile.azimuth_step_deg, profile.at_km[i]);
    if (Math.abs(p.x) <= h && Math.abs(p.y) <= h) out.push(p);
  }
  return out;
}

// Shade 0..1 per cell from the height gradient (standard hillshade, fixed light), and height 0..1 between min and max.
// Cells without data (null) get shade and height null.
export function relief(map, light) {
  const n = map.cells;
  const cellM = ((2 * map.half_width_km) / (n - 1)) * 1000;
  const h = map.height_m;
  const az = (light.azimuth_deg * Math.PI) / 180;
  const zen = ((90 - light.elevation_deg) * Math.PI) / 180;
  const at = (r, c) => h[Math.min(n - 1, Math.max(0, r)) * n + Math.min(n - 1, Math.max(0, c))];
  const span = map.max_m - map.min_m || 1;
  const shade = new Array(n * n);
  const level = new Array(n * n);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const i = r * n + c;
      const v = h[i];
      const nb = [at(r, c + 1), at(r, c - 1), at(r - 1, c), at(r + 1, c)];
      if (v === null || nb.includes(null)) {
        shade[i] = level[i] = null;
        continue;
      }
      const dzdx = (nb[0] - nb[1]) / (2 * cellM); // toward east
      const dzdy = (nb[2] - nb[3]) / (2 * cellM); // toward north (row 0 = north)
      const slope = Math.atan(Math.hypot(dzdx, dzdy));
      const aspect = Math.atan2(-dzdx, -dzdy); // downhill direction, from north toward east
      const s = Math.cos(zen) * Math.cos(slope) + Math.sin(zen) * Math.sin(slope) * Math.cos(az - aspect);
      shade[i] = Math.max(0, s);
      level[i] = (v - map.min_m) / span;
    }
  }
  return { shade, level };
}

// RGBA bytes: colour from low→high, darkened by the shade (strength 0..1). Colours = [r,g,b] 0..255.
export function pixels(rel, low, high, strength) {
  const n = rel.level.length;
  const out = new Uint8ClampedArray(n * 4);
  for (let i = 0; i < n; i++) {
    const t = rel.level[i];
    if (t === null) continue; // transparent: no data
    const k = 1 - strength + strength * rel.shade[i];
    for (let ch = 0; ch < 3; ch++) out[i * 4 + ch] = (low[ch] + (high[ch] - low[ch]) * t) * k;
    out[i * 4 + 3] = 255;
  }
  return out;
}

// "#rrggbb" or "rgb(r, g, b)" → [r,g,b].
export function parseColor(s) {
  const v = s.trim();
  if (v.startsWith('#')) return [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16));
  return v.match(/\d+/g).slice(0, 3).map(Number);
}

// Slope in degrees per cell from the same height gradient as relief(); null where a cell or a neighbour has no data.
export function slopes(map) {
  const n = map.cells;
  const cellM = ((2 * map.half_width_km) / (n - 1)) * 1000;
  const h = map.height_m;
  const at = (r, c) => h[Math.min(n - 1, Math.max(0, r)) * n + Math.min(n - 1, Math.max(0, c))];
  const out = new Array(n * n);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const nb = [at(r, c + 1), at(r, c - 1), at(r - 1, c), at(r + 1, c)];
      if (h[r * n + c] === null || nb.includes(null)) {
        out[r * n + c] = null;
        continue;
      }
      const g = Math.hypot((nb[0] - nb[1]) / (2 * cellM), (nb[2] - nb[3]) / (2 * cellM));
      out[r * n + c] = (Math.atan(g) * 180) / Math.PI;
    }
  }
  return out;
}

// RGBA bytes for values between lo and hi (clamped) on a colour ramp of evenly spaced stops ([r,g,b] each).
// null = transparent (no data).
export function rampPixels(values, lo, hi, stops) {
  const out = new Uint8ClampedArray(values.length * 4);
  const last = stops.length - 1;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v === null || v === undefined) continue;
    const t = Math.min(1, Math.max(0, (v - lo) / (hi - lo || 1))) * last;
    const k = Math.min(last - 1, Math.floor(t));
    const f = t - k;
    for (let ch = 0; ch < 3; ch++) out[i * 4 + ch] = stops[k][ch] + (stops[k + 1][ch] - stops[k][ch]) * f;
    out[i * 4 + 3] = 255;
  }
  return out;
}
