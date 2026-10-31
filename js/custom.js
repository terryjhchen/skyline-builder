// Buildings the player designs in the Building Studio: the choices they can make,
// how they are drawn, and the sentences that describe them.

import { TW, shade, gray, poly, faceQuad, circle, line } from './draw.js';

const FH = 13;                   // height of one floor
export const MAX_FLOORS = 20;

export const COLORS = [
  { v: '#f4a261', label: 'orange' }, { v: '#e63946', label: 'red' }, { v: '#ffd166', label: 'yellow' },
  { v: '#90be6d', label: 'green' }, { v: '#5fa8d3', label: 'blue' }, { v: '#9d79bc', label: 'purple' },
  { v: '#f4acb7', label: 'pink' }, { v: '#f1f1f1', label: 'white' }, { v: '#9aa5b1', label: 'gray' },
];

export const OPTIONS = {
  shape: [
    { v: 'box', icon: '⬛', label: 'Box', say: 'It is shaped like a box.' },
    { v: 'slim', icon: '▮', label: 'Slim', say: 'It is tall and thin.' },
    { v: 'stepped', icon: '🎂', label: 'Steps', say: 'It has steps like a big cake.' },
    { v: 'round', icon: '🥫', label: 'Round', say: 'It is round like a can.' },
  ],
  windows: [
    { v: 'small', icon: '▫️', label: 'Small', say: 'It has small windows.' },
    { v: 'big', icon: '⬜', label: 'Big', say: 'It has big windows.' },
    { v: 'glass', icon: '💎', label: 'Glass', say: 'It has shiny glass all around.' },
  ],
  roof: [
    { v: 'flat', icon: '➖', label: 'Flat', say: 'It has a flat roof.' },
    { v: 'pointy', icon: '🔺', label: 'Pointy', say: 'It has a pointy roof.' },
    { v: 'spire', icon: '📡', label: 'Spire', say: 'It has a tall spire on top.' },
    { v: 'dome', icon: '🔵', label: 'Dome', say: 'It has a round dome on top.' },
    { v: 'garden', icon: '🌳', label: 'Garden', say: 'It has a garden on the roof!' },
    { v: 'helipad', icon: '🚁', label: 'Helipad', say: 'Helicopters can land on the roof!' },
    { v: 'pool', icon: '🏊', label: 'Pool', say: 'It has a swimming pool on the roof!' },
  ],
};

export function newDesign() {
  return { name: '', floors: 6, shape: 'box', color: '#5fa8d3', windows: 'small', roof: 'flat' };
}

export function designName(d) {
  return d.name.trim() || 'My Building';
}

export function peopleIn(d) {
  return d.floors * 4;
}

// Short sentences about a design, for reading practice.
export function describeDesign(d) {
  const find = (key) => OPTIONS[key].find((o) => o.v === d[key]).say;
  const color = COLORS.find((c) => c.v === d.color)?.label || 'colorful';
  const floors = d.floors === 1 ? '1 floor' : `${d.floors} floors`;
  return `${designName(d)} has ${floors}. It is ${color}. ${find('shape')} ${find('windows')} ${find('roof')}`;
}

// Splits the floors into stacked tiers: [floors, footprint size].
function tiers(d) {
  const f = d.floors;
  if (d.shape === 'slim') return [[f, 0.52]];
  if (d.shape === 'stepped') {
    const a = Math.ceil(f * 0.5), b = Math.ceil((f - a) * 0.6), c = f - a - b;
    return [[a, 0.84], [b, 0.64], [c, 0.44]].filter(([n]) => n > 0);
  }
  return [[f, d.shape === 'round' ? 0.7 : 0.74]];
}

function boxTier(ctx, cx, baseY, hw, n, wall, lit, style, firstFloor) {
  const hh = hw / 2, H = n * FH;
  const L = [cx - hw, baseY], B = [cx, baseY + hh], R = [cx + hw, baseY], T = [cx, baseY - hh];
  const up = (p) => [p[0], p[1] - H];
  poly(ctx, [L, B, up(B), up(L)], shade(wall, -0.08));
  poly(ctx, [B, R, up(R), up(B)], shade(wall, -0.25));

  const cols = style === 'big' ? 2 : style === 'glass' ? 1 : Math.max(2, Math.round(hw / 9));
  for (let f = 0; f < n; f++) {
    for (let c = 0; c < cols; c++) {
      const [u0, u1, v0, v1] = style === 'big' ? [(c + 0.12) / cols, (c + 0.88) / cols, 0.15, 0.85]
        : style === 'glass' ? [0.04, 0.96, 0.18, 0.88]
        : [(c + 0.25) / cols, (c + 0.75) / cols, 0.3, 0.75];
      const lo = (f + v0) * FH, hi = (f + v1) * FH;
      faceQuad(ctx, L, B, u0, u1, lo, hi, lit);
      faceQuad(ctx, B, R, u0, u1, lo, hi, shade(lit, -0.12));
    }
  }
  if (firstFloor) faceQuad(ctx, B, R, 0.4, 0.6, 0, FH * 0.72, '#5d4037');
  poly(ctx, [up(T), up(R), up(B), up(L)], shade(wall, 0.12));
}

function roundTier(ctx, cx, baseY, hw, n, wall, lit, style, firstFloor) {
  const hh = hw / 2, H = n * FH, top = baseY - H;
  const g = ctx.createLinearGradient(cx - hw, 0, cx + hw, 0);
  g.addColorStop(0, shade(wall, -0.02));
  g.addColorStop(1, shade(wall, -0.32));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(cx + hw, top);
  ctx.lineTo(cx + hw, baseY);
  ctx.ellipse(cx, baseY, hw, hh, 0, 0, Math.PI);
  ctx.lineTo(cx - hw, top);
  ctx.closePath();
  ctx.fill();

  for (let f = 0; f < n; f++) {
    const y0 = baseY - f * FH;
    if (style === 'glass') {
      ctx.fillStyle = lit;
      ctx.beginPath();
      ctx.ellipse(cx, y0 - FH * 0.18, hw * 0.99, hh, 0, 0.12, Math.PI - 0.12);
      ctx.ellipse(cx, y0 - FH * 0.88, hw * 0.99, hh, 0, Math.PI - 0.12, 0.12, true);
      ctx.closePath();
      ctx.fill();
      continue;
    }
    const cols = style === 'big' ? 4 : 6;
    for (let k = 0; k < cols; k++) {
      const t = (Math.PI * (k + 0.5)) / cols;
      const x = cx + Math.cos(t) * hw, y = y0 + Math.sin(t) * hh;
      const w = (style === 'big' ? 6 : 3.5) * Math.sin(t) + 0.5;
      const [v0, v1] = style === 'big' ? [0.15, 0.85] : [0.3, 0.75];
      poly(ctx, [[x - w / 2, y - v0 * FH], [x + w / 2, y - v0 * FH], [x + w / 2, y - v1 * FH], [x - w / 2, y - v1 * FH]],
        Math.cos(t) > 0 ? shade(lit, -0.15) : lit);
    }
  }
  if (firstFloor) poly(ctx, [[cx - 3, baseY + hh], [cx + 3, baseY + hh], [cx + 3, baseY + hh - FH * 0.72], [cx - 3, baseY + hh - FH * 0.72]], '#5d4037');
  ctx.fillStyle = shade(wall, 0.12);
  ctx.beginPath(); ctx.ellipse(cx, top, hw, hh, 0, 0, Math.PI * 2); ctx.fill();
}

// A shape on the roof, smaller than the roof by k.
function roofPatch(ctx, cx, topY, hw, round, k, fill) {
  const w = hw * k, h = w / 2;
  if (round) {
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.ellipse(cx, topY, w, h, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    poly(ctx, [[cx, topY - h], [cx + w, topY], [cx, topY + h], [cx - w, topY]], fill);
  }
}

function drawRoof(ctx, roof, cx, topY, hw, round, connected, time) {
  const hh = hw / 2;
  const c = (hex) => (connected ? hex : gray(hex));
  switch (roof) {
    case 'pointy': {
      const apex = [cx, topY - hw * 0.9], roofC = c('#c8553d');
      if (round) {
        ctx.fillStyle = roofC;
        ctx.beginPath(); ctx.ellipse(cx, topY, hw, hh, 0, 0, Math.PI * 2); ctx.fill();
        poly(ctx, [[cx - hw, topY], [cx, topY + hh], apex], shade(roofC, 0.05));
        poly(ctx, [[cx, topY + hh], [cx + hw, topY], apex], shade(roofC, -0.2));
      } else {
        const L = [cx - hw, topY], B = [cx, topY + hh], R = [cx + hw, topY], T = [cx, topY - hh];
        poly(ctx, [T, L, apex], shade(roofC, 0.15));
        poly(ctx, [R, T, apex], shade(roofC, -0.05));
        poly(ctx, [L, B, apex], roofC);
        poly(ctx, [B, R, apex], shade(roofC, -0.25));
      }
      break;
    }
    case 'spire':
      line(ctx, [[cx, topY], [cx, topY - 30]], '#495057', 2);
      circle(ctx, cx, topY - 30, 2.2, Math.sin(time / 300) > 0 ? '#ff595e' : '#8d0801');
      break;
    case 'dome':
      ctx.fillStyle = c('#b8c4cc');
      ctx.beginPath(); ctx.ellipse(cx, topY, hw * 0.75, hw * 0.7, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = c('#dfe7ec');
      ctx.beginPath(); ctx.ellipse(cx - hw * 0.25, topY - hw * 0.4, hw * 0.15, hw * 0.12, 0, 0, Math.PI * 2); ctx.fill();
      circle(ctx, cx, topY - hw * 0.72, 1.8, '#8d6e63');
      break;
    case 'garden':
      roofPatch(ctx, cx, topY, hw, round, 0.85, c('#7cb342'));
      for (const [dx, dy] of [[-hw * 0.35, 0], [hw * 0.3, -hh * 0.2], [0, hh * 0.35]]) {
        circle(ctx, cx + dx, topY + dy - 4, 3.5, c('#2e7d32'));
        circle(ctx, cx + dx - 1, topY + dy - 5.5, 2, c('#43a047'));
      }
      circle(ctx, cx + hw * 0.1, topY - hh * 0.3, 1.2, '#ff8fab');
      break;
    case 'helipad':
      roofPatch(ctx, cx, topY, hw, round, 0.88, '#6b7280');
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(cx, topY, hw * 0.55, hh * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#ffd60a';
      ctx.font = `bold ${Math.max(6, hw * 0.4)}px system-ui`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.save(); ctx.translate(cx, topY); ctx.scale(1, 0.55); ctx.fillText('H', 0, 1); ctx.restore();
      break;
    case 'pool': {
      roofPatch(ctx, cx, topY, hw, round, 0.88, '#eeeeee');
      roofPatch(ctx, cx, topY, hw, round, 0.55, '#4fc3f7');
      const off = Math.sin(time / 600) * hw * 0.1;
      line(ctx, [[cx - hw * 0.2 + off, topY], [cx + off, topY - 1.5], [cx + hw * 0.2 + off, topY]], 'rgba(255,255,255,0.8)', 1);
      break;
    }
  }
}

// Draws a design standing on (cx, cy). Returns its height in pixels.
export function drawDesign(ctx, d, cx, cy, connected, time) {
  const wall = connected ? d.color : gray(d.color);
  const lit = connected ? (d.windows === 'glass' ? '#cdeffd' : '#fff3b0') : '#6b7280';
  const round = d.shape === 'round';
  let base = cy, floor = 0, hw = TW / 2;
  for (const [n, s] of tiers(d)) {
    hw = (TW / 2) * s;
    (round ? roundTier : boxTier)(ctx, cx, base, hw, n, wall, lit, d.windows, floor === 0);
    base -= n * FH;
    floor += n;
  }
  drawRoof(ctx, d.roof, cx, base, hw, round, connected, time);
  return cy - base + (d.roof === 'pointy' ? hw * 0.9 : d.roof === 'spire' ? 30 : d.roof === 'dome' ? hw * 0.7 : 0);
}
