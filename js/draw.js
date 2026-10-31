// Small canvas drawing helpers shared by the town and landmark drawings.

export const TW = 64, TH = 32;   // tile diamond size in world pixels

export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const target = amt < 0 ? 0 : 255, k = Math.abs(amt);
  const ch = (v) => Math.round(v + (target - v) * k);
  return `rgb(${ch(n >> 16)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}

export function gray(hex) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (v) => Math.round(v * 0.35 + 165 * 0.65);
  const h = (v) => mix(v).toString(16).padStart(2, '0');
  return `#${h(n >> 16)}${h((n >> 8) & 255)}${h(n & 255)}`;
}

export function poly(ctx, pts, fill) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

export function diamond(ctx, cx, cy, s, fill) {
  const hw = TW / 2 * s, hh = TH / 2 * s;
  poly(ctx, [[cx, cy - hh], [cx + hw, cy], [cx, cy + hh], [cx - hw, cy]], fill);
}

// A point on a building face: start at p0, go fraction u toward p1, then up by v.
export function facePoint(p0, p1, u, v) {
  return [p0[0] + (p1[0] - p0[0]) * u, p0[1] + (p1[1] - p0[1]) * u - v];
}

export function faceQuad(ctx, p0, p1, u0, u1, v0, v1, fill) {
  poly(ctx, [facePoint(p0, p1, u0, v0), facePoint(p0, p1, u1, v0), facePoint(p0, p1, u1, v1), facePoint(p0, p1, u0, v1)], fill);
}

// An isometric box standing on (cx, cy), raised by `lift`. Returns its corners.
export function box(ctx, cx, cy, hw, h, color, lift = 0) {
  const hh = hw / 2, y = cy - lift;
  const L = [cx - hw, y], B = [cx, y + hh], R = [cx + hw, y], T = [cx, y - hh];
  const up = (p) => [p[0], p[1] - h];
  poly(ctx, [L, B, up(B), up(L)], shade(color, -0.08));
  poly(ctx, [B, R, up(R), up(B)], shade(color, -0.25));
  poly(ctx, [up(T), up(R), up(B), up(L)], shade(color, 0.1));
  return { L, B, R, T };
}

export function circle(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}

export function line(ctx, pts, stroke, width) {
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
}
