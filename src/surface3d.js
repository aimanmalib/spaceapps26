// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// 3D surface (item i), pure parts: the heights of data/map/<site>.json (x = east, y = north in km, site at 0,0)
// seen from above at a fixed tilt, turned to any compass direction (orthographic, painter's order far → near).

const rad = (d) => (d * Math.PI) / 180;

// Viewer facing azimuth `lookDeg` (from north toward east), looking down by `tiltDeg` from horizontal.
export function camera(lookDeg, tiltDeg) {
  const a = rad(lookDeg);
  const t = rad(tiltDeg);
  return { fx: Math.sin(a), fy: Math.cos(a), rx: Math.cos(a), ry: -Math.sin(a), ct: Math.cos(t), st: Math.sin(t) };
}

// Point (km, z already scaled) → screen x (right), screen y (up), depth (larger = farther from the viewer).
export function project(x, y, z, cam) {
  const d = x * cam.fx + y * cam.fy;
  return { sx: x * cam.rx + y * cam.ry, sy: z * cam.ct + d * cam.st, depth: d * cam.ct - z * cam.st };
}

// Screen box that holds the square map at any turn: half width h km, heights zMin..zMax (scaled km).
export function frame(h, zMin, zMax, cam) {
  const R = h * Math.SQRT2;
  return { left: -R, right: R, bottom: -R * cam.st + zMin * cam.ct, top: R * cam.st + zMax * cam.ct };
}

// Quads of the grid every `stride` cells, far → near. Each = {i: cell index of its first corner, pts: 4 projected corners}.
// z = height (m) / 1000 × exaggeration. Quads touching a cell without data are left out.
export function quads(map, stride, exaggeration, cam) {
  const n = map.cells;
  const h = map.half_width_km;
  const step = (2 * h) / (n - 1);
  const idx = [];
  for (let k = 0; k < n; k += stride) idx.push(k);
  if (idx[idx.length - 1] !== n - 1) idx.push(n - 1);
  const m = idx.length;
  const pts = new Array(m * m);
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < m; c++) {
      const v = map.height_m[idx[r] * n + idx[c]];
      pts[r * m + c] = v === null ? null : project(-h + idx[c] * step, h - idx[r] * step, (v / 1000) * exaggeration, cam);
    }
  }
  const out = [];
  for (let r = 0; r < m - 1; r++) {
    for (let c = 0; c < m - 1; c++) {
      const q = [pts[r * m + c], pts[r * m + c + 1], pts[(r + 1) * m + c + 1], pts[(r + 1) * m + c]];
      if (q.includes(null)) continue;
      out.push({ i: idx[r] * n + idx[c], pts: q, depth: (q[0].depth + q[1].depth + q[2].depth + q[3].depth) / 4 });
    }
  }
  return out.sort((a, b) => b.depth - a.depth);
}

// End of a ray of length `km` from point (x, y, z) toward azimuth az, elevation el (deg). Vertical part scaled like the heights.
export function rayEnd(x, y, z, az, el, km, exaggeration) {
  return {
    x: x + km * Math.cos(rad(el)) * Math.sin(rad(az)),
    y: y + km * Math.cos(rad(el)) * Math.cos(rad(az)),
    z: z + km * Math.sin(rad(el)) * exaggeration,
  };
}
