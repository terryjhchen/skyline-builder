// Simple, chunky drawings of each city's famous places, standing on (cx, cy).

import { poly, shade, box, circle, line, facePoint, faceQuad } from './draw.js';

// A tapering iron tower with an arch between its legs (Eiffel Tower, Tokyo Tower).
function latticeTower(ctx, cx, cy, height, color, bands) {
  const top = cy - height;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - 24, cy + 6);
  ctx.quadraticCurveTo(cx - 8, cy - height * 0.35, cx - 2, top);
  ctx.lineTo(cx + 2, top);
  ctx.quadraticCurveTo(cx + 8, cy - height * 0.35, cx + 24, cy + 6);
  ctx.lineTo(cx + 13, cy + 6);
  ctx.quadraticCurveTo(cx, cy - 22, cx - 13, cy + 6);
  ctx.closePath();
  ctx.fill();
  // Criss-cross lattice.
  ctx.strokeStyle = shade(color, 0.25);
  ctx.lineWidth = 0.8;
  for (let i = 1; i < 9; i++) {
    const y = cy - (height * i) / 10;
    const w = 22 * Math.pow(1 - i / 10, 1.6) + 2;
    ctx.beginPath(); ctx.moveTo(cx - w, y); ctx.lineTo(cx + w * 0.6, y - height / 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + w, y); ctx.lineTo(cx - w * 0.6, y - height / 10); ctx.stroke();
  }
  for (const [frac, w] of [[0.25, 18], [0.55, 9]]) {
    const y = cy - height * frac;
    poly(ctx, [[cx - w, y], [cx + w, y], [cx + w, y - 3], [cx - w, y - 3]], bands ? '#ffffff' : shade(color, -0.25));
  }
  line(ctx, [[cx, top], [cx, top - 12]], shade(color, -0.3), 1.5);
}

function arch(ctx, p0, p1, color) {
  const pts = [facePoint(p0, p1, 0.32, 0), facePoint(p0, p1, 0.68, 0)];
  for (let a = 0; a <= Math.PI; a += Math.PI / 8) {
    pts.push(facePoint(p0, p1, 0.5 + 0.18 * Math.cos(a), 22 + 9 * Math.sin(a)));
  }
  poly(ctx, pts, color);
}

const DRAW = {
  eiffel(ctx, cx, cy) { latticeTower(ctx, cx, cy, 112, '#8d6e63', false); },

  tokyotower(ctx, cx, cy) { latticeTower(ctx, cx, cy, 116, '#e63946', true); },

  arc(ctx, cx, cy) {
    const { L, B, R } = box(ctx, cx, cy, 22, 42, '#eadcc0');
    arch(ctx, L, B, '#5d5346');
    arch(ctx, B, R, '#4a4238');
  },

  bigben(ctx, cx, cy) {
    box(ctx, cx, cy, 20, 10, '#cdb07e');
    const { L, B, R, T } = box(ctx, cx, cy, 10, 72, '#d4b483');
    for (const [p0, p1] of [[L, B], [B, R]]) {
      faceQuad(ctx, p0, p1, 0.08, 0.92, 52, 68, '#b8860b');
      const [x, y] = facePoint(p0, p1, 0.5, 60);
      ctx.fillStyle = '#fffdf2';
      ctx.beginPath(); ctx.ellipse(x, y, 3.6, 5, 0, 0, Math.PI * 2); ctx.fill();
      line(ctx, [[x, y], [x, y - 3.5]], '#333', 0.8);
      line(ctx, [[x, y], [x - 1.5, y + 1.5]], '#333', 0.8);
    }
    const apex = [cx, cy - 98], up = (p) => [p[0], p[1] - 72];
    poly(ctx, [up(L), up(B), apex], '#5c6b73');
    poly(ctx, [up(B), up(R), apex], '#46535a');
    poly(ctx, [up(T), up(L), apex], '#6c7b83');
  },

  eye(ctx, cx, cy, time) {
    const hx = cx, hy = cy - 44, r = 38;
    line(ctx, [[cx - 14, cy + 4], [hx, hy], [cx + 10, cy + 6]], '#90a4ae', 3);
    ctx.strokeStyle = '#eceff1'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(hx, hy, r, 0, Math.PI * 2); ctx.stroke();
    const spin = time / 9000;
    for (let i = 0; i < 16; i++) {
      const a = spin + (i / 16) * Math.PI * 2;
      const x = hx + Math.cos(a) * r, y = hy + Math.sin(a) * r;
      line(ctx, [[hx, hy], [x, y]], 'rgba(236,239,241,0.7)', 0.8);
      circle(ctx, x, y, 2.6, '#81d4fa');
    }
    circle(ctx, hx, hy, 3, '#78909c');
  },

  liberty(ctx, cx, cy, time) {
    box(ctx, cx, cy, 12, 22, '#cdb38b');
    const g = '#5fa58f';
    poly(ctx, [[cx - 6, cy - 22], [cx + 6, cy - 22], [cx + 3, cy - 50], [cx - 3, cy - 50]], g);
    circle(ctx, cx, cy - 54, 3.6, g);
    for (let i = -2; i <= 2; i++) line(ctx, [[cx + i * 1.4, cy - 57], [cx + i * 2.6, cy - 61]], g, 1);
    line(ctx, [[cx + 3, cy - 47], [cx + 8, cy - 68]], g, 3);
    circle(ctx, cx + 8, cy - 71, 3 + Math.sin(time / 120) * 0.6, '#ffb703');
    poly(ctx, [[cx - 7, cy - 38], [cx - 3, cy - 38], [cx - 3, cy - 30], [cx - 7, cy - 30]], shade(g, -0.2));
  },

  empire(ctx, cx, cy, time) {
    const c = '#c9c3b8';
    box(ctx, cx, cy, 20, 48, c);
    box(ctx, cx, cy, 14, 32, c, 48);
    box(ctx, cx, cy, 9, 20, c, 80);
    box(ctx, cx, cy, 4, 12, '#b8b1a5', 100);
    line(ctx, [[cx, cy - 112], [cx, cy - 136]], '#8a8378', 1.5);
    circle(ctx, cx, cy - 136, 1.8, Math.sin(time / 300) > 0 ? '#ff595e' : '#8d0801');
  },

  pagoda(ctx, cx, cy) {
    for (let i = 0; i < 5; i++) {
      const lift = i * 15;
      box(ctx, cx, cy, 15 - i * 2, 11, '#c0392b', lift);
      box(ctx, cx, cy, 22 - i * 2.5, 3, '#2f3e46', lift + 11);
    }
    line(ctx, [[cx, cy - 78], [cx, cy - 96]], '#e9c46a', 2);
  },

  opera(ctx, cx, cy) {
    box(ctx, cx, cy, 28, 6, '#d6c7a1');
    const shells = [[-14, -3, 38], [-2, 3, 32], [10, 8, 24], [-20, 4, 22]];
    for (const [dx, dy, h] of shells) {
      const x = cx + dx, y = cy - 6 + dy;
      ctx.fillStyle = '#f8f9fa';
      ctx.strokeStyle = '#cfd8dc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 8, y);
      ctx.quadraticCurveTo(x - 6, y - h * 0.7, x + 4, y - h);
      ctx.quadraticCurveTo(x + 8, y - h * 0.4, x + 10, y + 3);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
  },

  harbour(ctx, cx, cy) {
    const a = [cx - 34, cy - 17 - 8], b = [cx + 34, cy + 17 - 8];
    box(ctx, a[0] + 4, a[1] + 10, 6, 24, '#bcaaa4');
    line(ctx, [a, b], '#607d8b', 6);
    ctx.strokeStyle = '#78909c'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(cx, cy - 70, b[0], b[1]); ctx.stroke();
    for (let t = 0.15; t < 0.9; t += 0.14) {
      const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
      const ay = (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * (cy - 70) + t * t * b[1];
      line(ctx, [[x, y], [x, ay]], '#90a4ae', 1);
    }
    box(ctx, b[0] - 4, b[1] + 10, 6, 24, '#bcaaa4');
  },

  colosseum(ctx, cx, cy) {
    const rx = 30, ry = 15, h = 26, top = cy - h;
    ctx.fillStyle = '#e3c393';
    ctx.beginPath(); ctx.ellipse(cx, top, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c8a165';
    ctx.beginPath(); ctx.ellipse(cx, top + 2, rx - 9, ry - 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d4ad74';
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI);
    ctx.lineTo(cx - rx, top);
    ctx.ellipse(cx, top, rx, ry, 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.fill();
    for (let row = 0; row < 3; row++) {
      for (let k = 1; k < 12; k++) {
        const t = (k / 12) * Math.PI;
        const x = cx + Math.cos(t) * rx * 0.97, y = cy + Math.sin(t) * ry - row * 8 - 3;
        poly(ctx, [[x - 1.3, y], [x + 1.3, y], [x + 1.3, y - 5], [x - 1.3, y - 5]], '#8a6a45');
      }
    }
  },

  pantheon(ctx, cx, cy) {
    const { L, B } = box(ctx, cx, cy, 22, 18, '#d7ccc8');
    ctx.fillStyle = '#bcaaa4';
    ctx.beginPath(); ctx.ellipse(cx, cy - 18, 17, 17, 0, Math.PI, 0); ctx.fill();
    circle(ctx, cx, cy - 34, 2, '#8d6e63');
    for (let i = 0; i < 6; i++) faceQuad(ctx, L, B, 0.1 + i * 0.15, 0.16 + i * 0.15, 0, 16, '#f5f0eb');
    poly(ctx, [facePoint(L, B, 0, 18), facePoint(L, B, 1, 18), facePoint(L, B, 0.5, 28)], '#e7dfd9');
  },

  pyramid(ctx, cx, cy) {
    const L = [cx - 32, cy], B = [cx, cy + 16], R = [cx + 32, cy], apex = [cx, cy - 50];
    poly(ctx, [L, B, apex], '#e9c46a');
    poly(ctx, [B, R, apex], '#c9a343');
    ctx.strokeStyle = 'rgba(120,90,30,0.35)'; ctx.lineWidth = 0.8;
    for (let t = 0.15; t < 1; t += 0.15) {
      const lerp = (p) => [p[0] + (apex[0] - p[0]) * t, p[1] + (apex[1] - p[1]) * t];
      ctx.beginPath(); ctx.moveTo(...lerp(L)); ctx.lineTo(...lerp(B)); ctx.lineTo(...lerp(R)); ctx.stroke();
    }
  },

  sphinx(ctx, cx, cy) {
    const c = '#d9a85b';
    box(ctx, cx - 4, cy - 2, 16, 11, c);
    box(ctx, cx + 14, cy + 7, 5, 4, c);
    box(ctx, cx + 8, cy + 3, 6, 14, c, 8);
    line(ctx, [[cx + 3, cy - 10], [cx + 3, cy - 18]], '#3d5a80', 1.5);
    line(ctx, [[cx + 13, cy - 7], [cx + 13, cy - 15]], '#3d5a80', 1.5);
  },

  christ(ctx, cx, cy) {
    ctx.fillStyle = '#4f772d';
    ctx.beginPath();
    ctx.moveTo(cx - 32, cy + 2);
    ctx.quadraticCurveTo(cx - 14, cy - 44, cx, cy - 42);
    ctx.quadraticCurveTo(cx + 14, cy - 44, cx + 32, cy + 2);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3a5a22';
    ctx.beginPath(); ctx.moveTo(cx, cy - 42); ctx.quadraticCurveTo(cx + 14, cy - 44, cx + 32, cy + 2); ctx.lineTo(cx, cy + 14); ctx.closePath(); ctx.fill();
    poly(ctx, [[cx - 3, cy - 42], [cx + 3, cy - 42], [cx + 3, cy - 46], [cx - 3, cy - 46]], '#d6d6d6');
    poly(ctx, [[cx - 3, cy - 46], [cx + 3, cy - 46], [cx + 2, cy - 72], [cx - 2, cy - 72]], '#f5f5f5');
    poly(ctx, [[cx - 15, cy - 66], [cx + 15, cy - 66], [cx + 15, cy - 69], [cx - 15, cy - 69]], '#f5f5f5');
    circle(ctx, cx, cy - 75, 3, '#f5f5f5');
  },

  sugarloaf(ctx, cx, cy, time) {
    ctx.fillStyle = '#7a6f69';
    ctx.beginPath();
    ctx.moveTo(cx - 26, cy + 6);
    ctx.bezierCurveTo(cx - 26, cy - 50, cx - 10, cy - 66, cx, cy - 64);
    ctx.bezierCurveTo(cx + 14, cy - 62, cx + 22, cy - 30, cx + 24, cy + 6);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5a8f3a';
    ctx.beginPath(); ctx.ellipse(cx, cy + 2, 27, 10, 0, 0, Math.PI * 2); ctx.fill();
    const a = [cx - 2, cy - 64], b = [cx - 60, cy - 20];
    line(ctx, [a, b], '#333', 0.8);
    const t = (Math.sin(time / 2500) + 1) / 2;
    const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
    poly(ctx, [[x - 3, y + 1], [x + 3, y + 1], [x + 3, y + 6], [x - 3, y + 6]], '#e63946');
  },

  burj(ctx, cx, cy, time) {
    const c = '#b0c4de';
    box(ctx, cx, cy, 14, 44, c);
    box(ctx, cx, cy, 10, 44, c, 44);
    box(ctx, cx, cy, 7, 38, c, 88);
    box(ctx, cx, cy, 4, 32, c, 126);
    line(ctx, [[cx, cy - 158], [cx, cy - 196]], '#8fa3bf', 2);
    circle(ctx, cx, cy - 196, 1.8, Math.sin(time / 300) > 0 ? '#ff595e' : '#8d0801');
  },

  burjarab(ctx, cx, cy) {
    line(ctx, [[cx - 8, cy + 2], [cx - 8, cy - 76]], '#adb5bd', 2.5);
    ctx.fillStyle = '#f8f9fa';
    ctx.strokeStyle = '#ced4da'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy + 2);
    ctx.lineTo(cx - 6, cy - 70);
    ctx.quadraticCurveTo(cx + 26, cy - 42, cx + 14, cy + 4);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#adb5bd';
    ctx.beginPath(); ctx.ellipse(cx - 15, cy - 50, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
  },
};

export function drawLandmark(ctx, id, cx, cy, time) {
  DRAW[id]?.(ctx, cx, cy, time);
}
