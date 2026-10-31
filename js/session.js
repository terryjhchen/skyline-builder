// A play session: three small jobs for today, shown when a city is picked.
// Finishing them ends the session with a calm "see you tomorrow".

import { LANDMARKS, capitalize } from './cities.js';
import { stats } from './world.js';
import * as pip from './pip.js';

const $ = (id) => document.getElementById(id);
const RESUME_MS = 2 * 60 * 60 * 1000; // an unfinished session is kept for 2 hours

// Each job counts progress since the session started (b = stats at the start).
const JOBS = {
  landmark: {
    icon: '📍', need: 1,
    text: (j) => `Build a road to ${LANDMARKS[j.landmark].name}.`,
    hint: (j) => `Tourists want to visit ${LANDMARKS[j.landmark].name}! Tap Road. Draw a road next to it.`,
    count: (s, b, j) => (s.landmarks[j.landmark] ? 1 : 0),
  },
  houses: {
    icon: '🏠', need: 2,
    text: () => 'Build 2 houses next to a road.',
    hint: () => 'Tap House. Then tap the grass next to a road.',
    count: (s, b) => s.connected.house - b.connected.house,
  },
  shop: {
    icon: '🏪', need: 1,
    text: () => 'Build a shop next to a road.',
    hint: () => 'People need food. Tap Shop. Put it next to a road.',
    count: (s, b) => s.connected.shop - b.connected.shop,
  },
  apartment: {
    icon: '🏢', need: 1,
    text: () => 'Build an apartment next to a road.',
    hint: () => 'An apartment has lots of homes. Tap Apartment. Put it next to a road.',
    count: (s, b) => s.connected.apartment - b.connected.apartment,
  },
  tower: {
    icon: '🏙️', need: 1,
    text: () => 'Build a tall tower next to a road.',
    hint: () => 'Towers are very tall! Tap Tower. Put it next to a road.',
    count: (s, b) => s.connected.tower - b.connected.tower,
  },
  parks: {
    icon: '🌳', need: 2,
    text: () => 'Make 2 parks.',
    hint: () => 'Kids need a place to play. Tap Park. Then tap the grass.',
    count: (s, b) => s.parks - b.parks,
  },
  design: {
    icon: '🎨', need: 1,
    text: () => 'Design your own building. Then build it next to a road.',
    hint: () => 'Tap Design. Make your building and give it a name. Then tap a spot next to a road.',
    count: (s, b) => (s.connected.custom || 0) - (b.connected.custom || 0),
  },
  bridge: {
    icon: '🌉', need: 1,
    text: () => 'Build a new bridge over the water.',
    hint: () => 'Tap Road. Draw a road across the water to make a bridge.',
    count: (s, b) => s.bridges - b.bridges,
  },
  people: {
    icon: '👥', need: 30,
    text: () => 'Help 30 more people move in.',
    hint: () => 'Houses, apartments and towers bring new people. Remember the roads!',
    count: (s, b) => s.people - b.people,
  },
};

let world = null, city = null, onSave = () => {};

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function newSession() {
  const s = stats(world);
  const jobs = [];
  const unlinked = Object.keys(s.landmarks).filter((id) => !s.landmarks[id]);
  if (unlinked.length) jobs.push({ id: 'landmark', landmark: unlinked[0] });
  // A brand-new city gets the easy jobs; later visits always include a
  // Studio design plus a mix of the rest.
  const pool = s.buildings === 0
    ? ['houses', 'shop', 'parks']
    : ['design', ...shuffle(['houses', 'shop', 'apartment', 'tower', 'parks', 'bridge', 'people'])];
  for (const id of pool) if (jobs.length < 3) jobs.push({ id });
  world.session = { started: Date.now(), base: s, jobs, done: false };
}

function progress(job) {
  const def = JOBS[job.id];
  const n = Math.max(0, Math.min(def.need, def.count(stats(world), world.session.base, job)));
  return { n, need: def.need, done: n >= def.need };
}

function nextJob() {
  return world.session.jobs.find((j) => !progress(j).done);
}

export function doneCount() {
  if (!world?.session) return '';
  return `${world.session.jobs.filter((j) => progress(j).done).length}/${world.session.jobs.length}`;
}

function renderJobs() {
  $('jobs-title').textContent = `Today in ${city.name} ${city.flag}`;
  const list = $('jobs-list');
  list.innerHTML = '';
  for (const job of world.session.jobs) {
    const def = JOBS[job.id], p = progress(job);
    const li = document.createElement('li');
    li.className = p.done ? 'done' : '';
    li.innerHTML = `<span class="check">${p.done ? '✅' : '⬜'}</span><span class="job-icon">${def.icon}</span>
      <span class="job-text"></span>${def.need > 1 ? `<span class="job-count">${p.n}/${p.need}</span>` : ''}`;
    li.querySelector('.job-text').textContent = def.text(job);
    list.appendChild(li);
  }
}

function jobsSpeech() {
  return `Today in ${city.name}. Here are your jobs. ` +
    world.session.jobs.map((j, i) => `${i + 1}. ${JOBS[j.id].text(j)}`).join(' ');
}

export function showJobs() {
  renderJobs();
  $('jobs-dialog').showModal();
}

function giveHint() {
  const job = nextJob();
  if (job) pip.say(JOBS[job.id].hint(job));
}

function finish() {
  world.session.done = true;
  onSave();
  const s = stats(world);
  $('done-text').textContent =
    `You did all your jobs in ${city.name} today. ${s.people} people live in your city now. Great work, builder!`;
  setTimeout(() => $('done-dialog').showModal(), 900);
  pip.hide();
}

// Called after every change to the city.
export function check() {
  if (!world?.session || world.session.done) return;
  const before = world.session.finished || [];
  const finished = world.session.jobs.map((j, i) => (progress(j).done ? i : -1)).filter((i) => i >= 0);
  world.session.finished = finished;
  const fresh = finished.filter((i) => !before.includes(i));
  if (!fresh.length) return;
  if (finished.length === world.session.jobs.length) { finish(); return; }
  const done = world.session.jobs[fresh[0]];
  const next = nextJob();
  pip.say(`You did it! ✅ ${JOBS[done.id].text(done)} Next job: ${JOBS[next.id].text(next)}`,
    'OK 👍', giveHint);
}

// Starts (or resumes) a session for the picked city and shows today's jobs.
export function start(w, c, saveFn) {
  world = w; city = c; onSave = saveFn;
  const old = world.session;
  const resume = old && !old.done && Date.now() - old.started < RESUME_MS;
  if (!resume) newSession();
  world.session.finished = world.session.jobs.map((j, i) => (progress(j).done ? i : -1)).filter((i) => i >= 0);
  onSave();
  $('jobs-intro').textContent = resume
    ? `Welcome back to ${city.name}! Here are the jobs you were doing:`
    : `Welcome to ${city.name}! ${city.name} is in ${city.country}. Here are your jobs for today:`;
  pip.hide();
  showJobs();
}

$('jobs-speak').addEventListener('click', () => pip.speak(`${$('jobs-intro').textContent} ${jobsSpeech()}`));
$('jobs-go').addEventListener('click', () => { $('jobs-dialog').close(); giveHint(); });
$('done-speak').addEventListener('click', () => pip.speak(`All jobs done! ${$('done-text').textContent} See you tomorrow!`));
$('done-keep').addEventListener('click', () => {
  $('done-dialog').close();
  pip.say(`Keep building ${city.name} as long as you like. Have fun! 🏗️`);
});
$('done-bye').addEventListener('click', () => {
  $('done-dialog').close();
  $('sleep-title').textContent = `Good night, ${capitalize(city.name)}! 🌙`;
  $('sleep').hidden = false;
});
