// The Building Studio: design a building, save it, then build it in any city.

import { TW } from './draw.js';
import { COLORS, OPTIONS, MAX_FLOORS, newDesign, designName, describeDesign, drawDesign } from './custom.js';
import * as pip from './pip.js';

const $ = (id) => document.getElementById(id);
const DESIGNS_KEY = 'skyline-designs-v1';
const MAX_DESIGNS = 12;

let designs = [];
try { designs = JSON.parse(localStorage.getItem(DESIGNS_KEY)) || []; } catch {}

let editing = null;      // the design being changed
let editingId = null;    // id of the saved design, or null for a new one
let onBuild = () => {};
let raf = 0;

function saveDesigns() {
  try { localStorage.setItem(DESIGNS_KEY, JSON.stringify(designs)); } catch {}
}

// Draws a design centred in a canvas, scaled to fit.
function paint(canvas, d, time) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const tall = d.floors * 13 + 50;
  const k = Math.min(2.6, (h - 24) / tall, w / (TW * 1.3));
  ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * w / 2, dpr * (h - 18));
  ctx.fillStyle = '#9ccc65';
  ctx.beginPath(); ctx.moveTo(0, -TW * 0.3); ctx.lineTo(TW * 0.6, 0); ctx.lineTo(0, TW * 0.3); ctx.lineTo(-TW * 0.6, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#d6d3cb';
  ctx.beginPath(); ctx.moveTo(0, -TW * 0.24); ctx.lineTo(TW * 0.48, 0); ctx.lineTo(0, TW * 0.24); ctx.lineTo(-TW * 0.48, 0); ctx.closePath(); ctx.fill();
  drawDesign(ctx, d, 0, 0, true, time);
}

// ---------- list of saved designs ----------

function showList() {
  $('studio-edit').hidden = true;
  $('studio-list').hidden = false;
  cancelAnimationFrame(raf);
  const list = $('design-list');
  list.innerHTML = '';
  $('design-empty').hidden = designs.length > 0;
  for (const d of designs) {
    const card = document.createElement('div');
    card.className = 'design-card';
    card.innerHTML = `<canvas></canvas><b></b>
      <div class="design-actions"><button class="primary build">🏗️ Build</button><button class="change">✏️ Change</button></div>`;
    card.querySelector('b').textContent = designName(d);
    card.querySelector('.build').addEventListener('click', () => build(d));
    card.querySelector('.change').addEventListener('click', () => edit(d));
    list.appendChild(card);
    requestAnimationFrame(() => paint(card.querySelector('canvas'), d, 0));
  }
}

// ---------- editing ----------

function chip(label, selected, onPick, extra = '') {
  const b = document.createElement('button');
  b.className = `chip${selected ? ' selected' : ''}`;
  b.innerHTML = extra;
  b.append(label);
  b.addEventListener('click', onPick);
  return b;
}

function renderOptions() {
  $('floors-val').textContent = editing.floors === 1 ? '1 floor' : `${editing.floors} floors`;
  $('floors-minus').disabled = editing.floors <= 1;
  $('floors-plus').disabled = editing.floors >= MAX_FLOORS;
  for (const key of Object.keys(OPTIONS)) {
    const box = $(`opt-${key}`);
    box.innerHTML = '';
    for (const o of OPTIONS[key]) {
      box.appendChild(chip(o.label, editing[key] === o.v, () => change(key, o.v), `<span>${o.icon}</span>`));
    }
  }
  const colors = $('opt-color');
  colors.innerHTML = '';
  for (const c of COLORS) {
    const b = chip('', editing.color === c.v, () => change('color', c.v), `<span class="swatch" style="background:${c.v}"></span>`);
    b.setAttribute('aria-label', c.label);
    b.classList.add('color-chip');
    colors.appendChild(b);
  }
  $('studio-say').textContent = describeDesign(editing);
}

function change(key, value) {
  editing[key] = value;
  renderOptions();
}

function loop(now) {
  paint($('studio-canvas'), editing, now);
  raf = requestAnimationFrame(loop);
}

function edit(d) {
  editing = d ? { ...d } : newDesign();
  editingId = d ? d.id : null;
  $('design-name').value = editing.name;
  $('design-delete').hidden = !d;
  $('studio-list').hidden = true;
  $('studio-edit').hidden = false;
  $('studio').scrollTop = 0;
  renderOptions();
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(loop);
}

function build(d) {
  close();
  onBuild(d);
}

function saveAndBuild() {
  editing.name = $('design-name').value.trim().slice(0, 24);
  if (editingId) {
    const i = designs.findIndex((x) => x.id === editingId);
    designs[i] = { ...editing, id: editingId };
  } else {
    if (designs.length >= MAX_DESIGNS) {
      alert(`You have ${MAX_DESIGNS} buildings already. Change or delete one to make room.`);
      return;
    }
    designs.unshift({ ...editing, id: Date.now() });
  }
  saveDesigns();
  build(designs.find((x) => x.id === (editingId || designs[0].id)));
}

export function open(buildFn) {
  onBuild = buildFn;
  $('studio').hidden = false;
  pip.hide();
  if (designs.length) showList();
  else edit(null);
}

function close() {
  cancelAnimationFrame(raf);
  $('studio').hidden = true;
}

$('studio-close').addEventListener('click', close);
$('design-new').addEventListener('click', () => edit(null));
$('design-back').addEventListener('click', () => (designs.length ? showList() : close()));
$('design-save').addEventListener('click', saveAndBuild);
$('design-delete').addEventListener('click', () => {
  if (!confirm(`Delete ${designName(editing)}? Buildings already in your cities will stay.`)) return;
  designs = designs.filter((x) => x.id !== editingId);
  saveDesigns();
  showList();
});
$('design-name').addEventListener('input', (e) => {
  editing.name = e.target.value.slice(0, 24);
  $('studio-say').textContent = describeDesign(editing);
});
$('floors-minus').addEventListener('click', () => change('floors', Math.max(1, editing.floors - 1)));
$('floors-plus').addEventListener('click', () => change('floors', Math.min(MAX_FLOORS, editing.floors + 1)));
$('studio-speak').addEventListener('click', () => pip.speak($('studio-say').textContent));
