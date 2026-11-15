// SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
// "From the lander" (ADR 0103), pure parts: the heights of data/map/<site>.json seen in perspective from the observer of the
// terrain skyline (site height + observer height), on the curved Moon, heights not stretched, so every angle is true.
// Local frame at the eye: x = east, y = north, z = up (km).
import { horizonAt } from './terrain.js';
import { sampleGrid } from './surface3d.js';

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

// One map point at (east, north) km on the map and height hM (m above the reference sphere) → local frame of an eye at
// eyeM m above the reference sphere at the map centre. The map is azimuthal equidistant, so (east, north) is a distance
// along the sphere; the point drops below the eye's level plane as the sphere curves away.
export function toLocal(east, north, hM, eyeM, radiusKm) {
  const s = Math.hypot(east, north);
  const rr = radiusKm + hM / 1000;
  const a = s / radiusKm;
  const horiz = rr * Math.sin(a);
  const z = rr * Math.cos(a) - (radiusKm + eyeM / 1000);
  return s ? { x: (horiz * east) / s, y: (horiz * north) / s, z } : { x: 0, y: 0, z };
}

// Every `stride`-th vertex of the map in the local frame (null where the map has no data), plus the grid indices used.
export function localGrid(map, eyeM, radiusKm, stride) {
  return sampleGrid(map, stride, (east, north, v) => toLocal(east, north, v, eyeM, radiusKm));
}

// Unit direction of azimuth az (from north toward east) and elevation el (deg).
export function dir(az, el) {
  return { x: Math.cos(rad(el)) * Math.sin(rad(az)), y: Math.cos(rad(el)) * Math.cos(rad(az)), z: Math.sin(rad(el)) };
}

// Pinhole camera looking toward azimuth yaw, elevation pitch (deg); hfov = horizontal field of view (deg) over w × h px.
export function view(yaw, pitch, hfov, w, h) {
  const a = rad(yaw);
  const p = rad(pitch);
  return {
    f: dir(yaw, pitch),
    r: { x: Math.cos(a), y: -Math.sin(a), z: 0 },
    u: { x: -Math.sin(a) * Math.sin(p), y: -Math.cos(a) * Math.sin(p), z: Math.cos(p) },
    F: w / 2 / Math.tan(rad(hfov) / 2),
    cx: w / 2,
    cy: h / 2,
    w,
    h,
  };
}

// Local point → camera space {x right, y up, z forward}.
export function toCam(p, v) {
  return {
    x: p.x * v.r.x + p.y * v.r.y + p.z * v.r.z,
    y: p.x * v.u.x + p.y * v.u.y + p.z * v.u.z,
    z: p.x * v.f.x + p.y * v.f.y + p.z * v.f.z,
  };
}

// Camera-space point in front of the eye → screen px (x right, y down).
export function toScreen(q, v) {
  return [v.cx + (v.F * q.x) / q.z, v.cy - (v.F * q.y) / q.z];
}

// Screen position of the direction (az, el), or null when it is behind the eye.
export function dirScreen(az, el, v) {
  const q = toCam(dir(az, el), v);
  return q.z > 1e-6 ? toScreen(q, v) : null;
}

// Disc of angular radius radiusDeg → radius in px at the centre of the view (to scale with the field of view).
export function discPx(radiusDeg, v) {
  return v.F * Math.tan(rad(radiusDeg));
}

// Polygon (camera space) clipped to z ≥ near (Sutherland–Hodgman against one plane).
export function clipNear(poly, near) {
  const out = [];
  for (let k = 0; k < poly.length; k++) {
    const a = poly[k];
    const b = poly[(k + 1) % poly.length];
    const ina = a.z >= near;
    const inb = b.z >= near;
    if (ina) out.push(a);
    if (ina !== inb) {
      const s = (near - a.z) / (b.z - a.z);
      out.push({ x: a.x + (b.x - a.x) * s, y: a.y + (b.y - a.y) * s, z: near });
    }
  }
  return out;
}

// Ground quads seen by the camera, far → near (painter's order by distance of the quad centre from the eye).
// Each = {i: map cell index of its first corner, pts: screen px}. Quads wholly behind the eye or off the canvas are dropped.
export function groundPolys(grid, v, near) {
  const { m, idx, n, pts } = grid;
  const cam = pts.map((p) => (p ? toCam(p, v) : null));
  const out = [];
  for (let r = 0; r < m - 1; r++) {
    for (let c = 0; c < m - 1; c++) {
      const k = [r * m + c, r * m + c + 1, (r + 1) * m + c + 1, (r + 1) * m + c];
      const q = k.map((j) => cam[j]);
      if (q.includes(null)) continue;
      const clipped = clipNear(q, near);
      if (clipped.length < 3) continue;
      const s = clipped.map((p) => toScreen(p, v));
      if (s.every(([x]) => x < 0) || s.every(([x]) => x > v.w) || s.every(([, y]) => y < 0) || s.every(([, y]) => y > v.h)) continue;
      const w = k.map((j) => pts[j]);
      const d = Math.hypot((w[0].x + w[2].x) / 2, (w[0].y + w[2].y) / 2, (w[0].z + w[2].z) / 2);
      out.push({ i: idx[r] * n + idx[c], pts: s, d });
    }
  }
  return out.sort((a, b) => b.d - a.d);
}

// Height (m) of the map at (east, north) km, bilinear between cells; null outside the map or next to a cell without data.
export function heightAt(map, east, north) {
  const n = map.cells;
  const h = map.half_width_km;
  const step = (2 * h) / (n - 1);
  const c = (east + h) / step;
  const r = (h - north) / step;
  if (c < 0 || r < 0 || c > n - 1 || r > n - 1) return null;
  const c0 = Math.min(Math.floor(c), n - 2);
  const r0 = Math.min(Math.floor(r), n - 2);
  const fc = c - c0;
  const fr = r - r0;
  const v = [map.height_m[r0 * n + c0], map.height_m[r0 * n + c0 + 1], map.height_m[(r0 + 1) * n + c0], map.height_m[(r0 + 1) * n + c0 + 1]];
  if (v.includes(null)) return null;
  return (v[0] * (1 - fc) + v[1] * fc) * (1 - fr) + (v[2] * (1 - fc) + v[3] * fc) * fr;
}

// Skyline of the 3D ground alone (deg per azimuth, every azStep): highest elevation seen along each ray, sampled every
// kmStep out to the edge of the map. -90 where the ray meets no ground.
export function groundSkyline(map, eyeM, radiusKm, azStep, kmStep) {
  const out = [];
  for (let az = 0; az < 360 - 1e-9; az += azStep) {
    const se = Math.sin(rad(az));
    const ce = Math.cos(rad(az));
    let best = -90;
    for (let s = kmStep; ; s += kmStep) {
      const v = heightAt(map, s * se, s * ce);
      if (v === null) {
        if (Math.abs(s * se) > map.half_width_km || Math.abs(s * ce) > map.half_width_km) break;
        continue;
      }
      const p = toLocal(s * se, s * ce, v, eyeM, radiusKm);
      best = Math.max(best, deg(Math.atan2(p.z, Math.hypot(p.x, p.y))));
    }
    out.push(best);
  }
  return out;
}

// How far the 3D ground's skyline stands above the LOLA profile used for the answers (deg) at its worst, and where.
export function skylineGap(ground, azStep, profile) {
  let above = -Infinity;
  let az = 0;
  ground.forEach((g, k) => {
    const d = g - horizonAt(profile, k * azStep);
    if (d > above) {
      above = d;
      az = k * azStep;
    }
  });
  return { above, az };
}

export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
export const wrap360 = (a) => ((a % 360) + 360) % 360;
