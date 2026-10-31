// World state: the tile grid, building rules, stats and saving.
// Each city has its own saved world.

import { LANDMARKS, capitalize } from './cities.js';
import { designName, peopleIn } from './custom.js';

export const SIZE = 16;
const SAVE_PREFIX = 'skyline-city-';

export const BUILDINGS = {
  house:     { a: 'a house',      floors: 1,  people: 4,  wall: '#f6bd60', roof: '#e76f51', cols: 1 },
  shop:      { a: 'a shop',       floors: 2,  people: 0,  wall: '#90be6d', roof: '#577590', cols: 2 },
  apartment: { a: 'an apartment', floors: 5,  people: 20, wall: '#d4a373', roof: '#6c584c', cols: 2 },
  tower:     { a: 'a tower',      floors: 10, people: 40, wall: '#8ecae6', roof: '#457b9d', cols: 3 },
};

function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createWorld(city) {
  const rand = mulberry32(city.seed);
  const tiles = [];
  for (let i = 0; i < SIZE * SIZE; i++) tiles.push({ t: 'grass' });

  if (city.water === 'river') {
    // A river winding across the map, always connected edge to edge.
    let rx = 10;
    for (let y = 0; y < SIZE; y++) {
      tiles[y * SIZE + rx].t = 'water';
      if (rand() < 0.35) {
        const nx = Math.max(8, Math.min(13, rx + (rand() < 0.5 ? -1 : 1)));
        tiles[y * SIZE + nx].t = 'water';
        rx = nx;
      }
    }
  } else {
    // A sea along one side with a wiggly coast.
    let coast = 12;
    for (let y = 0; y < SIZE; y++) {
      for (let x = coast; x < SIZE; x++) tiles[y * SIZE + x].t = 'water';
      if (rand() < 0.4) coast = Math.max(11, Math.min(12, coast + (rand() < 0.5 ? -1 : 1)));
    }
  }

  const treeChance = city.sand ? 0.05 : 0.12;
  for (const tile of tiles) {
    if (tile.t === 'grass' && rand() < treeChance) tile.t = 'tree';
  }
  for (const [id, x, y] of city.landmarks) tiles[y * SIZE + x] = { t: 'landmark', id };
  return { city: city.id, sand: !!city.sand, tiles, session: null };
}

export function get(world, x, y) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return null;
  return world.tiles[y * SIZE + x];
}

export const NEIGHBORS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function hasRoad(world, x, y) {
  return NEIGHBORS.some(([dx, dy]) => get(world, x + dx, y + dy)?.t === 'road');
}

// Applies a tool to one tile. Returns { changed, msg } where msg is a
// short, simple sentence for Pip to say (or undefined). `design` is the
// Studio design to build when the tool is 'custom'.
export function place(world, tool, x, y, design) {
  const tile = get(world, x, y);
  if (!tile) return { changed: false };

  if (tile.t === 'landmark') {
    const name = LANDMARKS[tile.id].name;
    if (tool === 'remove') return { changed: false, msg: `You can't take away ${name}! It is a famous place.` };
    if (BUILDINGS[tool] || tool === 'custom') return { changed: false, msg: `${capitalize(name)} is here. Pick an empty spot.` };
    return { changed: false };
  }

  if (tool === 'road') {
    if (tile.t === 'grass' || tile.t === 'tree' || tile.t === 'park') {
      world.tiles[y * SIZE + x] = { t: 'road' };
      return { changed: true };
    }
    if (tile.t === 'water') {
      world.tiles[y * SIZE + x] = { t: 'road', bridge: true };
      return { changed: true };
    }
    return { changed: false };
  }

  if (tool === 'park') {
    if (tile.t === 'grass' || tile.t === 'tree') {
      world.tiles[y * SIZE + x] = { t: 'park' };
      return { changed: true };
    }
    return { changed: false };
  }

  if (tool === 'remove') {
    if (tile.t === 'water') return { changed: false, msg: "You can't take away the river! 🐟" };
    if (tile.t === 'grass') return { changed: false, msg: 'There is nothing here to take away.' };
    world.tiles[y * SIZE + x] = { t: tile.bridge ? 'water' : 'grass' };
    return { changed: true };
  }

  const spec = tool === 'custom' ? { a: designName(design) } : BUILDINGS[tool];
  if (spec) {
    if (tile.t === 'water') return { changed: false, msg: `You can't build ${spec.a} on water! Try the grass.` };
    if (tile.t === 'road') return { changed: false, msg: 'A road is here. Pick an empty spot next to it.' };
    if (tile.t === 'building') return { changed: false, msg: 'A building is already here. Pick an empty spot.' };
    world.tiles[y * SIZE + x] = tool === 'custom'
      ? { t: 'building', b: 'custom', d: { ...design } }
      : { t: 'building', b: tool };
    if (!hasRoad(world, x, y)) {
      return { changed: true, msg: `Uh oh! ${capitalize(spec.a)} needs a road. Build a road next to it.` };
    }
    if (tool === 'custom') {
      return { changed: true, msg: `You built ${spec.a}! 🎉 It has ${design.floors} floors. ${peopleIn(design)} people live here.` };
    }
    return { changed: true, msg: builtMessage(tool) };
  }
  return { changed: false };
}

function builtMessage(kind) {
  switch (kind) {
    case 'house': return 'You built a house! 🏠 A family of 4 moved in.';
    case 'shop': return 'You built a shop! 🏪 Now people can buy food and toys.';
    case 'apartment': return 'You built an apartment! It has 5 floors. 20 people live here.';
    case 'tower': return 'Wow! Your tower has 10 floors! 🏙️ 40 people live here.';
  }
}

// What Pip says when the Look tool taps a tile.
export function describe(world, x, y) {
  const tile = get(world, x, y);
  if (!tile) return null;
  switch (tile.t) {
    case 'grass': return 'This is grass. You can build here.';
    case 'tree': return 'This is a tree. Birds live in trees! 🐦';
    case 'water': return 'This is the river. Fish swim here. 🐟';
    case 'park': return 'This is a park. Kids play here. 🌼';
    case 'landmark': return LANDMARKS[tile.id].fact;
    case 'road': return tile.bridge
      ? 'This is a bridge. Cars drive over the water! 🌉'
      : 'This is a road. Cars drive on it. 🚗';
    case 'building': {
      if (tile.b === 'custom') {
        const name = designName(tile.d);
        if (!hasRoad(world, x, y)) return `This is ${name}. It needs a road next to it.`;
        return `This is ${name}. You made it! It has ${tile.d.floors} floors. ${peopleIn(tile.d)} people live here. 😊`;
      }
      const spec = BUILDINGS[tile.b];
      if (!hasRoad(world, x, y)) return `This is ${spec.a}. It needs a road next to it.`;
      if (tile.b === 'shop') return 'This is a shop. People buy food and toys here. 🍎';
      return `This is ${spec.a}. ${spec.people} people live here. 😊`;
    }
  }
}

export function stats(world) {
  const s = { people: 0, buildings: 0, roads: 0, bridges: 0, parks: 0, landmarks: {},
    connected: { house: 0, shop: 0, apartment: 0, tower: 0, custom: 0 } };
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const tile = world.tiles[y * SIZE + x];
      if (tile.t === 'road') { s.roads++; if (tile.bridge) s.bridges++; }
      if (tile.t === 'park') s.parks++;
      if (tile.t === 'landmark') s.landmarks[tile.id] = hasRoad(world, x, y);
      if (tile.t === 'building') {
        s.buildings++;
        if (hasRoad(world, x, y)) {
          s.connected[tile.b]++;
          s.people += tile.b === 'custom' ? peopleIn(tile.d) : BUILDINGS[tile.b].people;
        }
      }
    }
  }
  return s;
}

export function save(world) {
  try { localStorage.setItem(SAVE_PREFIX + world.city, JSON.stringify(world)); } catch {}
}

export function load(cityId) {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_PREFIX + cityId));
    if (data && Array.isArray(data.tiles) && data.tiles.length === SIZE * SIZE) return data;
  } catch {}
  return null;
}
