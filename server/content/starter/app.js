// The engine of the starter: rounds, feedback, rising difficulty, sound, speech, reward and
// progress kept on the device. It knows nothing about the subject – that is tasks.js.
import { APP, makeTask } from './tasks.js';

const $ = (id) => document.getElementById(id);
const screens = ['start', 'task', 'done'];
const show = (name) => screens.forEach((s) => { $(s).hidden = s !== name; });

// ---- progress, on this device only (no account, nothing leaves the device) ----
const store = {
  read() {
    try { return JSON.parse(localStorage.getItem(APP.storageKey)) || {}; } catch { return {}; }
  },
  write(patch) {
    try { localStorage.setItem(APP.storageKey, JSON.stringify({ ...this.read(), ...patch })); } catch { /* private mode: play without saving */ }
  },
};

// ---- sound: made in the browser, so there are no files to load or license ----
let soundOn = store.read().sound !== false;
let audio;
function tone(notes) {
  if (!soundOn) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    let at = audio.currentTime;
    for (const [hz, seconds] of notes) {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.frequency.value = hz;
      gain.gain.setValueAtTime(0.15, at);
      gain.gain.exponentialRampToValueAtTime(0.001, at + seconds);
      osc.connect(gain).connect(audio.destination);
      osc.start(at);
      osc.stop(at + seconds);
      at += seconds * 0.8;
    }
  } catch { /* no sound on this device: the app works without it */ }
}
const sounds = {
  right: () => tone([[660, 0.12], [880, 0.2]]),
  wrong: () => tone([[220, 0.25]]),
  done: () => tone([[523, 0.12], [659, 0.12], [784, 0.12], [1047, 0.3]]),
};
function paintSound() {
  $('sound').textContent = soundOn ? '🔊' : '🔇';
  $('sound').setAttribute('aria-pressed', String(soundOn));
  $('sound').setAttribute('aria-label', soundOn ? 'Ljud på' : 'Ljud av');
}

// ---- speech: the browser's own Swedish voice, for those who do not read yet ----
function speak(text) {
  if (!soundOn || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'sv-SE';
  u.rate = 0.9;
  speechSynthesis.speak(u);
}

// ---- a round ----
let level = Math.min(store.read().level || 1, APP.maxLevel);
let round; // { done, firstTry, streak, task }

function drawPicture(picture) {
  const el = $('picture');
  el.replaceChildren();
  el.hidden = !picture;
  if (!picture) return;
  for (let i = 0; i < picture.total; i++) {
    const dot = document.createElement('div');
    dot.className = i < picture.filled ? 'dot full' : 'dot';
    el.append(dot);
  }
}

function nextTask() {
  const task = makeTask(level);
  round.task = task;
  round.missed = false;
  $('prompt').textContent = task.prompt;
  $('feedback').textContent = '';
  drawPicture(task.picture);
  const answers = $('answers');
  answers.replaceChildren();
  for (const option of task.options) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'answer';
    button.textContent = option;
    button.addEventListener('click', () => choose(button, option));
    answers.append(button);
  }
  $('progress').style.width = `${(round.done / APP.roundLength) * 100}%`;
  $('progress').parentElement.setAttribute('aria-valuenow', String(round.done));
  $('progress').parentElement.setAttribute('aria-valuemax', String(APP.roundLength));
}

function choose(button, option) {
  const { task } = round;
  if (button.disabled) return;
  if (option !== task.answer) {
    // wrong: say so kindly, give a hint, let the child try again – nothing is lost
    round.missed = true;
    round.streak = 0;
    button.disabled = true;
    button.classList.add('wrong');
    button.textContent = `${option} ✗`;
    $('feedback').textContent = `Nästan! ${task.hint}`;
    sounds.wrong();
    return;
  }
  button.classList.add('right');
  button.textContent = `${option} ✓`;
  for (const b of $('answers').children) b.disabled = true;
  $('feedback').textContent = 'Rätt!';
  sounds.right();
  round.done += 1;
  if (!round.missed) {
    round.firstTry += 1;
    round.streak += 1;
  }
  // difficulty: up after three right in a row, down after a task that took three tries
  if (round.streak >= 3 && level < APP.maxLevel) { level += 1; round.streak = 0; }
  else if ($('answers').querySelectorAll('.wrong').length >= 2 && level > 1) level -= 1;
  setTimeout(round.done >= APP.roundLength ? finish : nextTask, 900);
}

function stars(n) {
  const of = 3;
  const got = n >= APP.roundLength ? 3 : n >= APP.roundLength * 0.6 ? 2 : 1;
  return '★'.repeat(got) + '☆'.repeat(of - got);
}

function finish() {
  const best = Math.max(store.read().best || 0, round.firstTry);
  store.write({ level, best });
  $('progress').style.width = '100%';
  $('result').textContent = `${stars(round.firstTry)}  ${round.firstTry} av ${APP.roundLength} på första försöket`;
  const reward = $('reward');
  reward.replaceChildren();
  ['⭐', '🎉', '✨', '🌟', '🎈', '⭐', '✨', '🎉'].forEach((symbol, i, all) => {
    const span = document.createElement('span');
    const angle = (i / all.length) * Math.PI * 2;
    span.textContent = symbol;
    span.style.setProperty('--dx', `${Math.cos(angle) * 2.2}em`);
    span.style.setProperty('--dy', `${Math.sin(angle) * 2.2}em`);
    reward.append(span);
  });
  show('done');
  sounds.done();
}

function start() {
  round = { done: 0, firstTry: 0, streak: 0, missed: false, task: null };
  show('task');
  nextTask();
  speak(round.task.say);
}

// ---- wiring ----
document.title = APP.title;
$('title').textContent = APP.title;
$('lead').textContent = APP.lead;
const saved = store.read();
if (saved.best) $('best').textContent = `Ditt bästa: ${stars(saved.best)}`;
paintSound();
$('play').addEventListener('click', start);
$('again').addEventListener('click', start);
$('speak').addEventListener('click', () => speak(round.task.say));
$('sound').addEventListener('click', () => {
  soundOn = !soundOn;
  store.write({ sound: soundOn });
  if (!soundOn && 'speechSynthesis' in window) speechSynthesis.cancel();
  paintSound();
});
