// Game loop, touch input, toolbar and camera.

import { SIZE, createWorld, load, save, place, describe, stats, get, NEIGHBORS } from './world.js';
import { TW, TH, tileCenter, screenToTile, draw } from './render.js';
import { CITIES, cityById } from './cities.js';
import * as pip from './pip.js';
import * as session from './session.js';
import * as studio from './studio.js';
import { designName } from './custom.js';

const TOOL_TIPS = {
  look: 'Tap anything in your town to learn about it. Drag to move around.',
  road: 'Roads help people get around. Drag your finger to draw a road.',
  house: 'A house is a home for a family. Tap the grass next to a road.',
  shop: 'A shop sells food and toys. Tap a spot next to a road.',
  apartment: 'An apartment has many homes stacked up high!',
  tower: 'A tower is very, very tall. It has 10 floors!',
  park: 'Parks have trees and flowers. Drag your finger to make a park.',
  remove: 'The bulldozer takes things away. Tap something to remove it.',
};
const PAINT_TOOLS = new Set(['road', 'park']);
const CAR_COLORS = ['#e63946', '#ffb703', '#219ebc', '#ffffff', '#8338ec', '#fb8500'];

const canvas = document.getElementById('city');
const ctx = canvas.getContext('2d');
const $ = (id) => document.getElementById(id);

let world = null;   // set once a city is picked
let tool = 'look';
let design = null;  // the Studio design being built when tool is 'custom'
let width = 0, height = 0, dpr = 1;
const cam = { x: 0, y: 0, zoom: 1 };
const anims = new Map();
const particles = [];
let cars = [];
let undoStack = [];
let current = null;

// ---------- editing ----------

function snapshot() { return JSON.stringify(world.tiles); }

function afterChange() {
  current = stats(world);
  $('people-count').textContent = current.people;
  $('undo').disabled = undoStack.length === 0;
  save(world);
  session.check();
  $('jobs-count').textContent = session.doneCount();
}

function puff(x, y) {
  const [cx, cy] = tileCenter(x, y);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    particles.push({ x: cx, y: cy, vx: Math.cos(a) * 30, vy: Math.sin(a) * 15 - 10, life: 1 });
  }
}

// Applies the current tool to one tile; returns true if anything changed.
function applyTool(x, y, quiet) {
  const result = place(world, tool, x, y, design);
  if (result.changed) {
    if (get(world, x, y).t === 'building') anims.set(y * SIZE + x, performance.now());
    puff(x, y);
  }
  if (result.msg && !quiet) pip.say(result.msg);
  return result.changed;
}

function tap(x, y) {
  if (!get(world, x, y)) return;
  if (tool === 'look') {
    pip.say(describe(world, x, y));
    return;
  }
  const before = snapshot();
  if (applyTool(x, y, false)) {
    undoStack.push(before);
    if (undoStack.length > 40) undoStack.shift();
  }
  afterChange();
}

let stroke = null; // { before, last: [x, y], changed }

function strokeTo(x, y) {
  // Walk one grid step at a time so fast swipes still make a joined road.
  let [lx, ly] = stroke.last;
  while (lx !== x || ly !== y) {
    if (Math.abs(x - lx) >= Math.abs(y - ly)) lx += Math.sign(x - lx);
    else ly += Math.sign(y - ly);
    if (applyTool(lx, ly, true)) stroke.changed = true;
  }
  stroke.last = [x, y];
}

function beginStroke(x, y) {
  stroke = { before: snapshot(), last: [x, y], changed: applyTool(x, y, true) };
}

function endStroke() {
  if (!stroke) return;
  if (stroke.changed) undoStack.push(stroke.before);
  stroke = null;
  afterChange();
}

function undo() {
  if (!undoStack.length) return;
  world.tiles = JSON.parse(undoStack.pop());
  afterChange();
}

// ---------- camera ----------

function clampCam() {
  cam.zoom = Math.max(0.45, Math.min(2.5, cam.zoom));
  const minX = -SIZE * TW / 2, maxX = SIZE * TW / 2, minY = -TH / 2, maxY = SIZE * TH;
  cam.x = Math.min(width * 0.7 - minX * cam.zoom, Math.max(width * 0.3 - maxX * cam.zoom, cam.x));
  cam.y = Math.min(height * 0.7 - minY * cam.zoom, Math.max(height * 0.3 - maxY * cam.zoom, cam.y));
}

// Centres between the middle of the map and the city's landmarks so both show.
function centerCamera(city) {
  cam.zoom = Math.min(1.1, Math.max(0.6, width / 420));
  const mid = (SIZE - 1) / 2;
  const n = city.landmarks.length;
  const lx = city.landmarks.reduce((sum, [, x]) => sum + x, 0) / n;
  const ly = city.landmarks.reduce((sum, [, , y]) => sum + y, 0) / n;
  const [mx, my] = tileCenter(mid * 0.4 + lx * 0.6, mid * 0.4 + ly * 0.6);
  cam.x = width / 2 - mx * cam.zoom;
  cam.y = height / 2 - my * cam.zoom - 40;
}

function resize() {
  dpr = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  clampCam();
}

// ---------- touch input ----------
// One finger: tap to use a tool, drag to move the map (or paint with Road/Park).
// Two fingers: pinch to zoom and move.

const pointers = new Map();
let gesture = null;

function tileAt(e) { return screenToTile(e.clientX, e.clientY, cam); }

canvas.addEventListener('pointerdown', (e) => {
  if (!world) return;
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 1) {
    gesture = { type: 'one', sx: e.clientX, sy: e.clientY, cx: cam.x, cy: cam.y, moved: false };
    if (PAINT_TOOLS.has(tool)) {
      const [x, y] = tileAt(e);
      if (get(world, x, y)) { beginStroke(x, y); gesture.painting = true; }
    }
  } else if (pointers.size === 2) {
    endStroke();
    const [a, b] = [...pointers.values()];
    gesture = {
      type: 'pinch', dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
      mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, zoom: cam.zoom, cx: cam.x, cy: cam.y,
    };
  }
});

canvas.addEventListener('pointermove', (e) => {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (!gesture) return;
  if (gesture.type === 'one') {
    const dx = e.clientX - gesture.sx, dy = e.clientY - gesture.sy;
    if (Math.hypot(dx, dy) > 8) gesture.moved = true;
    if (gesture.painting) {
      const [x, y] = tileAt(e);
      if (get(world, x, y)) strokeTo(x, y);
    } else if (gesture.moved) {
      cam.x = gesture.cx + dx; cam.y = gesture.cy + dy; clampCam();
    }
  } else if (gesture.type === 'pinch' && pointers.size >= 2) {
    const [a, b] = [...pointers.values()];
    const zoom = Math.max(0.45, Math.min(2.5, gesture.zoom * Math.hypot(a.x - b.x, a.y - b.y) / gesture.dist));
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    cam.x = mx - (gesture.mx - gesture.cx) / gesture.zoom * zoom;
    cam.y = my - (gesture.my - gesture.cy) / gesture.zoom * zoom;
    cam.zoom = zoom;
    clampCam();
  }
});

function pointerEnd(e) {
  if (!pointers.has(e.pointerId)) return;
  pointers.delete(e.pointerId);
  if (gesture?.type === 'one') {
    if (gesture.painting) endStroke();
    else if (!gesture.moved) { const [x, y] = tileAt(e); tap(x, y); }
    gesture = null;
  } else if (gesture?.type === 'pinch' && pointers.size === 0) {
    gesture = null;
  }
}
canvas.addEventListener('pointerup', pointerEnd);
canvas.addEventListener('pointercancel', pointerEnd);

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zoom = Math.max(0.45, Math.min(2.5, cam.zoom * (e.deltaY < 0 ? 1.1 : 0.9)));
  cam.x = e.clientX - (e.clientX - cam.x) / cam.zoom * zoom;
  cam.y = e.clientY - (e.clientY - cam.y) / cam.zoom * zoom;
  cam.zoom = zoom;
  clampCam();
}, { passive: false });

// ---------- cars ----------

function roadTiles() {
  const list = [];
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (get(world, x, y).t === 'road') list.push([x, y]);
  return list;
}

function pickNext(car) {
  const options = NEIGHBORS.map(([dx, dy]) => [car.x + dx, car.y + dy]).filter(([x, y]) => get(world, x, y)?.t === 'road');
  const forward = options.filter(([x, y]) => x !== car.px || y !== car.py);
  const pool = forward.length ? forward : options;
  const [nx, ny] = pool.length ? pool[Math.floor(Math.random() * pool.length)] : [car.x, car.y];
  car.nx = nx; car.ny = ny;
}

function updateCars(dt) {
  if (!world) return;
  const roads = roadTiles();
  const target = current.people > 0 ? Math.min(12, Math.floor(roads.length / 4)) : 0;
  cars = cars.filter((c) => get(world, c.x, c.y)?.t === 'road' && get(world, c.nx, c.ny)?.t === 'road');
  while (cars.length < target && roads.length) {
    const [x, y] = roads[Math.floor(Math.random() * roads.length)];
    const car = { x, y, px: x, py: y, nx: x, ny: y, t: 0, speed: 0.6 + Math.random() * 0.5,
      color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)] };
    pickNext(car);
    cars.push(car);
  }
  cars.length = Math.min(cars.length, target);
  for (const car of cars) {
    car.t += dt * car.speed;
    if (car.t >= 1) {
      car.px = car.x; car.py = car.y;
      car.x = car.nx; car.y = car.ny;
      car.t = 0;
      pickNext(car);
    }
  }
}

// ---------- toolbar & menu ----------

function selectTool(name) {
  tool = name;
  for (const btn of document.querySelectorAll('#toolbar button')) {
    btn.classList.toggle('selected', btn.dataset.tool === (name === 'custom' ? 'design' : name));
  }
  pip.say(name === 'custom'
    ? `Tap a spot next to a road to build ${designName(design)}!`
    : TOOL_TIPS[name]);
}

function buildDesign(d) {
  design = d;
  selectTool('custom');
}

for (const btn of document.querySelectorAll('#toolbar button')) {
  btn.addEventListener('click', () => {
    if (btn.dataset.tool === 'design') studio.open(buildDesign);
    else selectTool(btn.dataset.tool);
  });
}

$('undo').addEventListener('click', undo);

$('city-name').addEventListener('click', session.showJobs);
$('jobs-btn').addEventListener('click', session.showJobs);

const menu = $('menu-dialog');
$('menu').addEventListener('click', () => {
  $('auto-read').checked = pip.getAutoRead();
  menu.showModal();
});
$('auto-read').addEventListener('change', (e) => pip.setAutoRead(e.target.checked));
$('menu-close').addEventListener('click', () => menu.close());
$('pick-city').addEventListener('click', () => { menu.close(); showPicker(); });
$('new-town').addEventListener('click', () => {
  if (!confirm('Start this city over? Everything built here will be gone.')) return;
  menu.close();
  openCity(cityById(world.city), true);
});

// ---------- city picker ----------

function openCity(city, fresh) {
  world = (!fresh && load(city.id)) || createWorld(city);
  undoStack = [];
  cars = [];
  anims.clear();
  $('city-name').textContent = `${city.flag} ${city.name}`;
  $('picker').hidden = true;
  $('sleep').hidden = true;
  selectTool('look');
  pip.hide();
  centerCamera(city);
  clampCam();
  session.start(world, city, () => save(world));
  afterChange();
}

function showPicker() {
  const list = $('city-list');
  list.innerHTML = '';
  for (const city of CITIES) {
    const saved = load(city.id);
    const btn = document.createElement('button');
    btn.className = 'city-card';
    btn.innerHTML = `<span class="flag">${city.flag}</span><span class="name">${city.name}</span>
      <span class="country">in ${city.country}</span>${saved ? `<span class="saved">👥 ${stats(saved).people}</span>` : ''}`;
    btn.addEventListener('click', () => openCity(city));
    list.appendChild(btn);
  }
  $('sleep').hidden = true;
  $('picker').hidden = false;
}

$('sleep-pick').addEventListener('click', showPicker);

// ---------- main loop ----------

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  updateCars(dt);
  for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * 2; }
  while (particles.length && particles[0].life <= 0) particles.shift();
  if (world) draw(ctx, { world, cam, cars, anims, particles, time: now, width, height, dpr });
  requestAnimationFrame(frame);
}

window.addEventListener('resize', resize);
resize();
showPicker();
requestAnimationFrame(frame);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
