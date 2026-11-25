// Sizzle & Serve — entry point: the loop, the input, the wiring.
// Keyboard and mouse both drive the same chef. `?shot=name&seed=N` stages
// one deterministic scene for a screenshot instead of starting the title.
import { VIEW } from './config.js';
import { setMuted, sfx, unlockAudio } from './audio.js';
import { clickAt, interact, resetPlayer, updateChop, updatePlayer } from './player.js';
import { render } from './render.js';
import { stateForShot } from './shots.js';
import { createState, tick } from './state.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;

let state;
let hint = '';
let hintUntil = 0;
let lastTickSecond = -1;
let paused = false;

/** Fit the 960x600 kitchen into the window, keeping its shape. */
function resize() {
  const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
  canvas.width = Math.round(VIEW.width * scale);
  canvas.height = Math.round(VIEW.height * scale);
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
}
window.addEventListener('resize', resize);
resize();

/** Say something to the screen-reader status line. */
function announce(line) {
  if (status) status.textContent = line;
}

if (shotName) {
  // Screenshot mode: stage the scene, render it, and keep it alive.
  const staged = stateForShot(shotName, seed);
  state = staged.state;
  hint = staged.hint;
  hintUntil = Infinity;
} else {
  state = createState(seed);
  resetPlayer(state);
}

const keys = new Set();
let holdingE = false;

function showHint(line, seconds) {
  hint = line;
  hintUntil = performance.now() / 1000 + (seconds || 3);
}

window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  unlockAudio();
  if (e.repeat) return;
  keys.add(e.code);
  if (e.code === 'KeyM') {
    state.muted = !state.muted;
    setMuted(state.muted);
    showHint(state.muted ? 'Sound off' : 'Sound on', 2);
    return;
  }
  if (e.code === 'KeyP' && state.screen === 'play') {
    paused = !paused;
    showHint(paused ? 'Paused — P to resume' : '', 2);
    return;
  }
  if (e.code === 'KeyR' && (state.screen === 'over' || state.screen === 'play')) {
    restart();
    return;
  }
  if (state.screen === 'title' && (e.code === 'Enter' || e.code === 'Space')) {
    startGame();
    return;
  }
  if (state.screen === 'over' && (e.code === 'Enter' || e.code === 'Space')) {
    restart();
    return;
  }
  if (e.code === 'KeyE' || e.code === 'Space') {
    holdingE = true;
    if (state.screen === 'play') {
      const line = interact(state, sfx);
      if (line) showHint(line, 3);
    }
  }
});
window.addEventListener('keyup', (e) => {
  keys.delete(e.code);
  if (e.code === 'KeyE' || e.code === 'Space') holdingE = false;
});

canvas.addEventListener('pointerdown', (e) => {
  unlockAudio();
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * VIEW.width;
  const y = ((e.clientY - rect.top) / rect.height) * VIEW.height;
  if (state.screen === 'title') {
    startGame();
    return;
  }
  if (state.screen === 'over') {
    restart();
    return;
  }
  holdingE = true;
  const line = clickAt(state, x, y, sfx);
  if (line) showHint(line, 3);
});
window.addEventListener('pointerup', () => {
  holdingE = false;
});

/** Begin the shift from the title screen. */
function startGame() {
  state.screen = 'play';
  state.time = 0;
  state.left = 180;
  state.banner = { text: 'Lunch service starts!', t: 0 };
  sfx('start');
  announce('Lunch service started. Take an order from the board.');
}

/** Fresh shift, same seed family, back to the title screen. */
function restart() {
  const keepSeed = state.seed;
  state = createState(keepSeed + 1);
  resetPlayer(state);
  paused = false;
  hint = '';
  lastTickSecond = -1;
  announce('New shift. Press Enter to start.');
}

/** The frame loop: fixed-step rules, variable rendering. */
let last = performance.now();
let acc = 0;
const STEP = 1 / 60;

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const t = now / 1000;

  if (!paused && state.screen === 'play' && !shotName) {
    acc += dt;
    while (acc >= STEP) {
      acc -= STEP;
      tick(state, STEP);
      updatePlayer(state, STEP, keys, sfx);
      updateChop(state, STEP, holdingE, sfx);
    }
    // A tick each second while a ticket is nearly out, so time can be felt.
    const second = Math.floor(state.left);
    if (second !== lastTickSecond) {
      lastTickSecond = second;
      if (second <= 10 && second > 0) sfx('tick');
      if (second === 30) state.banner = { text: 'RUSH HOUR — hold on tight!', t: 0 };
    }
    if (hintUntil !== Infinity && t > hintUntil) hint = '';
  }

  const scale = canvas.width / VIEW.width;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  render(ctx, state, t, hint);
  requestAnimationFrame(frame);
}

// Report uncaught errors into the document title so a headless play-test
// can see them without opening devtools.
window.addEventListener('error', (e) => {
  document.title = `GAME ERROR: ${e.message}`;
});
requestAnimationFrame(frame);
