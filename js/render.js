// Draws the isometric town onto a 2D canvas.

import { SIZE, BUILDINGS, get, hasRoad } from './world.js';
import { LANDMARKS } from './cities.js';
import { TW, TH, shade, gray, poly, diamond, faceQuad } from './draw.js';
import { drawLandmark } from './landmarks.js';
import { drawDesign } from './custom.js';

export { TW, TH };
const FH = 13;                   // height of one building floor
const SKIRT = 14;                // depth of the island's dirt edge

export function tileCenter(x, y) {
  return [(x - y) * TW / 2, (x + y) * TH / 2];
}

export function screenToTile(sx, sy, cam) {
  const a = (sx - cam.x) / cam.zoom / (TW / 2);
  const b = (sy - cam.y) / cam.zoom / (TH / 2);
  return [Math.round((a + b) / 2), Math.round((b - a) / 2)];
}

// ---------- ground ----------

function drawGround(ctx, world, x, y, time) {
  const tile = get(world, x, y);
  const [cx, cy] = tileCenter(x, y);
  const grass = world.sand
    ? ((x + y) % 2 ? '#ead9a7' : '#e3d09a')
    : ((x + y) % 2 ? '#9ccc65' : '#94c45d');

  if (x === SIZE - 1) poly(ctx, [[cx + TW / 2, cy], [cx, cy + TH / 2], [cx, cy + TH / 2 + SKIRT], [cx + TW / 2, cy + SKIRT]], '#795548');
  if (y === SIZE - 1) poly(ctx, [[cx - TW / 2, cy], [cx, cy + TH / 2], [cx, cy + TH / 2 + SKIRT], [cx - TW / 2, cy + SKIRT]], '#8d6e63');

  switch (tile.t) {
    case 'water': drawWater(ctx, cx, cy, x, y, time); break;
    case 'road':
      if (tile.bridge) { drawWater(ctx, cx, cy, x, y, time); diamond(ctx, cx, cy, 0.98, '#a1887f'); diamond(ctx, cx, cy, 0.78, '#6b7280'); }
      else { diamond(ctx, cx, cy, 1, '#cfd8dc'); diamond(ctx, cx, cy, 0.86, '#6b7280'); }
      drawRoadLines(ctx, world, x, y, cx, cy);
      break;
    case 'park':
      diamond(ctx, cx, cy, 1, '#aed581');
      diamond(ctx, cx, cy, 0.35, '#e9d8a6');
      for (const [fx, fy, c] of [[-16, 2, '#ff8fab'], [14, -3, '#ffd166'], [4, 9, '#ff8fab'], [-6, -8, '#ffffff']]) {
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx + fx, cy + fy, 2.2, 0, Math.PI * 2); ctx.fill();
      }
      break;
    case 'building':
      diamond(ctx, cx, cy, 1, grass);
      diamond(ctx, cx, cy, 0.9, '#d6d3cb');
      break;
    case 'landmark':
      if (LANDMARKS[tile.id].overWater) {
        drawWater(ctx, cx, cy, x, y, time);
      } else if (LANDMARKS[tile.id].island) {
        drawWater(ctx, cx, cy, x, y, time);
        diamond(ctx, cx, cy, 0.8, '#e9d8a6');
      } else {
        diamond(ctx, cx, cy, 1, grass);
        diamond(ctx, cx, cy, 0.94, '#e6dcc5');
      }
      break;
    default:
      diamond(ctx, cx, cy, 1, grass);
  }
}

function drawWater(ctx, cx, cy, x, y, time) {
  diamond(ctx, cx, cy, 1, '#4fc3f7');
  const off = Math.sin(time / 700 + x + y) * 4;
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 10 + off, cy - 2);
  ctx.quadraticCurveTo(cx - 5 + off, cy - 5, cx + off, cy - 2);
  ctx.stroke();
}

function drawRoadLines(ctx, world, x, y, cx, cy) {
  // Screen direction of each grid neighbour: +x is down-right, +y is down-left.
  const dirs = [[1, 0, TW / 4, TH / 4], [-1, 0, -TW / 4, -TH / 4], [0, 1, -TW / 4, TH / 4], [0, -1, TW / 4, -TH / 4]];
  ctx.strokeStyle = '#ffd60a';
  ctx.lineWidth = 1.6;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  let any = false;
  for (const [dx, dy, ex, ey] of dirs) {
    if (get(world, x + dx, y + dy)?.t === 'road') {
      ctx.moveTo(cx, cy); ctx.lineTo(cx + ex, cy + ey); any = true;
    }
  }
  ctx.stroke();
  ctx.setLineDash([]);
  if (!any) { ctx.fillStyle = '#ffd60a'; ctx.fillRect(cx - 2, cy - 1, 4, 2); }
}

// ---------- objects (things that stand up) ----------

function drawTree(ctx, cx, cy, s = 1) {
  ctx.fillStyle = '#795548';
  ctx.fillRect(cx - 2 * s, cy - 10 * s, 4 * s, 10 * s);
  ctx.fillStyle = '#2e7d32';
  ctx.beginPath(); ctx.arc(cx, cy - 16 * s, 9 * s, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#43a047';
  ctx.beginPath(); ctx.arc(cx - 3 * s, cy - 19 * s, 5.5 * s, 0, Math.PI * 2); ctx.fill();
}



function easeOutBack(t) {
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
}

function drawBuilding(ctx, kind, cx, cy, connected, grow, time) {
  const spec = BUILDINGS[kind];
  const s = kind === 'tower' ? 0.62 : kind === 'house' ? 0.66 : 0.74;
  const hw = TW / 2 * s, hh = TH / 2 * s;
  const H = spec.floors * FH;
  const wall = connected ? spec.wall : gray(spec.wall);
  const roof = connected ? spec.roof : gray(spec.roof);
  const L = [cx - hw, cy], B = [cx, cy + hh], R = [cx + hw, cy], T = [cx, cy - hh];
  const up = (p, h = H) => [p[0], p[1] - h];

  ctx.save();
  if (grow < 1) growScale(ctx, cx, cy, grow);

  poly(ctx, [L, B, up(B), up(L)], shade(wall, -0.08));
  poly(ctx, [B, R, up(R), up(B)], shade(wall, -0.25));

  const lit = connected ? (kind === 'tower' ? '#e0fbfc' : '#fff3b0') : '#6b7280';
  for (let f = 0; f < spec.floors; f++) {
    for (let c = 0; c < spec.cols; c++) {
      const u0 = (c + 0.22) / spec.cols, u1 = (c + 0.78) / spec.cols;
      const v0 = f * FH + FH * 0.3, v1 = f * FH + FH * 0.78;
      if (kind === 'shop' && f === 0) continue;
      faceQuad(ctx, L, B, u0, u1, v0, v1, lit);
      if (!(f === 0 && c === Math.floor(spec.cols / 2) && kind !== 'tower')) faceQuad(ctx, B, R, u0, u1, v0, v1, shade(lit, -0.12));
    }
  }
  // Front door on the right-hand face.
  faceQuad(ctx, B, R, 0.4, 0.6, 0, FH * 0.72, '#5d4037');

  if (kind === 'shop') {
    // Big shop window and a striped awning.
    faceQuad(ctx, L, B, 0.12, 0.88, FH * 0.15, FH * 0.7, lit);
    for (let i = 0; i < 6; i++) {
      const c = i % 2 ? '#ffffff' : '#e63946';
      faceQuad(ctx, L, B, i / 6, (i + 1) / 6, FH * 0.75, FH * 0.98, connected ? c : gray('#e63946'));
      faceQuad(ctx, B, R, i / 6, (i + 1) / 6, FH * 0.75, FH * 0.98, connected ? shade(c === '#ffffff' ? '#ffffff' : '#e63946', -0.15) : gray('#c1121f'));
    }
  }

  if (kind === 'house') {
    const apex = [cx, cy - H - 16];
    poly(ctx, [up(T), up(L), apex], shade(roof, 0.15));
    poly(ctx, [up(R), up(T), apex], shade(roof, -0.05));
    poly(ctx, [up(L), up(B), apex], roof);
    poly(ctx, [up(B), up(R), apex], shade(roof, -0.25));
  } else {
    poly(ctx, [up(T), up(R), up(B), up(L)], roof);
    if (kind === 'apartment') {
      // Little water tank on the roof.
      ctx.fillStyle = shade(roof, -0.3);
      ctx.fillRect(cx - 4, cy - H - 10, 8, 8);
      ctx.fillStyle = shade(roof, 0.2);
      ctx.beginPath(); ctx.ellipse(cx, cy - H - 10, 4, 2, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (kind === 'tower') {
      ctx.strokeStyle = '#495057'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx, cy - H); ctx.lineTo(cx, cy - H - 18); ctx.stroke();
      ctx.fillStyle = Math.sin(time / 300) > 0 ? '#ff595e' : '#8d0801';
      ctx.beginPath(); ctx.arc(cx, cy - H - 18, 2, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
  if (!connected) roadSign(ctx, cx, cy - H - (kind === 'house' ? 30 : 16), time);
}

function growScale(ctx, cx, cy, grow) {
  const g = easeOutBack(grow);
  ctx.translate(cx, cy); ctx.scale(g, g); ctx.translate(-cx, -cy);
}

function drawCustom(ctx, design, cx, cy, connected, grow, time) {
  ctx.save();
  if (grow < 1) growScale(ctx, cx, cy, grow);
  const H = drawDesign(ctx, design, cx, cy, connected, time);
  ctx.restore();
  if (!connected) roadSign(ctx, cx, cy - H - 16, time);
}

// A bouncing "!" sign: this building needs a road.
function roadSign(ctx, cx, y, time) {
  const by = y + Math.sin(time / 250) * 2;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#e63946'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, by, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e63946';
  ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('!', cx, by + 1);
}

function drawCar(ctx, wx, wy, color) {
  const hw = 6, hh = 3, h = 5;
  const L = [wx - hw, wy], B = [wx, wy + hh], R = [wx + hw, wy], T = [wx, wy - hh];
  poly(ctx, [L, B, [B[0], B[1] - h], [L[0], L[1] - h]], shade(color, -0.1));
  poly(ctx, [B, R, [R[0], R[1] - h], [B[0], B[1] - h]], shade(color, -0.3));
  poly(ctx, [[T[0], T[1] - h], [R[0], R[1] - h], [B[0], B[1] - h], [L[0], L[1] - h]], color);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillRect(wx - 2, wy - h - 2, 4, 2);
}

// ---------- frame ----------

export function draw(ctx, view) {
  const { world, cam, cars, anims, particles, time, width, height, dpr } = view;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#bde0fe');
  sky.addColorStop(1, '#a2d2ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  ctx.setTransform(dpr * cam.zoom, 0, 0, dpr * cam.zoom, dpr * cam.x, dpr * cam.y);

  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) drawGround(ctx, world, x, y, time);

  // Standing objects, drawn back-to-front so near things cover far things.
  const objects = [];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const tile = get(world, x, y);
      if (tile.t === 'tree' || tile.t === 'park' || tile.t === 'building' || tile.t === 'landmark') objects.push({ d: x + y, x, y, tile });
    }
  }
  for (const car of cars) {
    const px = car.x + (car.nx - car.x) * car.t, py = car.y + (car.ny - car.y) * car.t;
    objects.push({ d: px + py + 0.01, car, px, py });
  }
  objects.sort((a, b) => a.d - b.d);

  for (const o of objects) {
    if (o.car) {
      const [wx, wy] = tileCenter(o.px, o.py);
      drawCar(ctx, wx, wy, o.car.color);
      continue;
    }
    const [cx, cy] = tileCenter(o.x, o.y);
    if (o.tile.t === 'tree') drawTree(ctx, cx, cy + 2);
    else if (o.tile.t === 'park') drawTree(ctx, cx - 12, cy + 2, 0.75);
    else if (o.tile.t === 'landmark') drawLandmark(ctx, o.tile.id, cx, cy, time);
    else {
      const start = anims.get(o.y * SIZE + o.x);
      const grow = start === undefined ? 1 : Math.min(1, (time - start) / 450);
      if (o.tile.b === 'custom') drawCustom(ctx, o.tile.d, cx, cy, hasRoad(world, o.x, o.y), grow, time);
      else drawBuilding(ctx, o.tile.b, cx, cy, hasRoad(world, o.x, o.y), grow, time);
    }
  }

  for (const p of particles) {
    ctx.fillStyle = `rgba(255,255,255,${Math.max(0, p.life)})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, 3 + (1 - p.life) * 4, 0, Math.PI * 2); ctx.fill();
  }
}
