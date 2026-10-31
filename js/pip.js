// Pip the builder bird: shows short sentences for reading practice
// and can read them aloud.

const $ = (id) => document.getElementById(id);
const panel = $('pip'), textEl = $('pip-text'), button = $('pip-next'), speakBtn = $('pip-speak');
const SETTINGS_KEY = 'skyline-settings-v1';

let onButton = null;
let current = '';
let settings = { autoRead: false };
try { settings = { ...settings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) }; } catch {}

export function speak(text) {
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/\p{Extended_Pictographic}|️/gu, ''));
    u.rate = 0.85;
    u.pitch = 1.15;
    speechSynthesis.speak(u);
  } catch {}
}

export function hide() {
  panel.classList.add('hidden');
}

export function say(text, buttonLabel = 'OK 👍', cb = hide) {
  current = text;
  textEl.textContent = text;
  button.hidden = !buttonLabel;
  button.textContent = buttonLabel || '';
  onButton = cb;
  panel.classList.remove('hidden');
  if (settings.autoRead) speak(text);
}

export function getAutoRead() { return settings.autoRead; }
export function setAutoRead(on) {
  settings.autoRead = on;
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch {}
}

button.addEventListener('click', () => onButton && onButton());
speakBtn.addEventListener('click', () => speak(current));
$('pip-face').addEventListener('click', () => panel.classList.toggle('hidden'));
