// Sizzle & Serve — staged screenshot scenes behind ?shot=cover|chop|rush|serve.
// Each scene builds a real game state (real orders, real plate, real timers)
// and places the chef mid-action, so the frame is what a good shift really
// looks like — the same seed always gives the same frame.
import { RECIPES } from './config.js';
import { burst, createState, makeItem } from './state.js';

/** Find a recipe by id. */
function recipe(id) {
  return RECIPES.find((r) => r.id === id);
}

/** An order ticket for the board, with a chosen recipe and time left. */
function ticket(id, recipeId, timeLeft, total) {
  return { id, recipe: recipe(recipeId), timeLeft, total, born: 0 };
}

/**
 * Set `state` to the named scene and return the screen to draw over it.
 * Unknown names stage the cover. Every scene runs the real render path.
 */
export function stageShot(name, state) {
  const s = state;
  s.screen = 'play';
  s.time = 66;
  s.left = 114;
  s.coins = 86;
  s.served = 5;
  s.combo = 2;
  s.bestCombo = 3;
  s.lives = 3;
  s.rush = false;
  s.banner = null;
  s.particles = [];
  s.floats = [];
  s.chop.item = null;
  s.chop.progress = 0;
  s.burners = [null, null];
  s.plate.items = [];
  s.plate.onCounter = true;

  if (name === 'chop') {
    s.orders = [
      ticket(1, 'garden', 52, 75),
      ticket(2, 'classic', 38, 75),
    ];
    s.chop.item = makeItem('tomato', 'raw');
    s.chop.progress = 0.62;
    s.player.x = 300;
    s.player.y = 168;
    s.player.dir = 1;
    s.player.hands = null;
    burst(s, 300, 108, '#e8452c', 8, 70);
    return { screen: 'play', hint: 'Chopping Tomato — hold E' };
  }

  if (name === 'rush') {
    s.time = 158;
    s.left = 22;
    s.coins = 214;
    s.served = 12;
    s.combo = 4;
    s.bestCombo = 5;
    s.rush = true;
    s.orders = [
      ticket(3, 'double', 14, 45),
      ticket(4, 'cheese', 9, 45),
      ticket(5, 'marinara', 22, 45),
      ticket(6, 'garden', 31, 45),
    ];
    s.plate.items = [
      makeItem('bun', 'ready'),
      makeItem('patty', 'cooked'),
      makeItem('cheese', 'ready'),
      makeItem('tomato', 'chopped'),
    ];
    s.plate.onCounter = false;
    s.player.x = 740;
    s.player.y = 165;
    s.player.dir = 1;
    s.player.hands = { key: 'plate', state: 'ready' };
    s.burners[0] = { item: makeItem('patty', 'cooked'), t: 7.5 };
    burst(s, 792, 130, '#f7c948', 10, 90);
    return { screen: 'play', hint: 'RUSH HOUR — serve that plate!' };
  }

  if (name === 'serve') {
    s.orders = [
      ticket(2, 'marinara', 41, 75),
      ticket(3, 'garden', 58, 75),
    ];
    s.plate.items = [];
    s.plate.onCounter = false;
    s.plateReturnIn = 0.8;
    s.player.x = 792;
    s.player.y = 165;
    s.player.dir = 1;
    s.player.hands = null;
    s.servedFlash = 1;
    s.floats.push({ x: 792, y: 130, text: '+24 coins', t: 0.2, color: '#f7c948' });
    burst(s, 792, 130, '#f7c948', 18, 130);
    return { screen: 'play', hint: 'Served Cheese Burger! +24' };
  }

  // Cover: the fullest frame — three tickets, a dish mid-assembly, a pan on.
  s.orders = [
    ticket(1, 'classic', 47, 75),
    ticket(2, 'cheese', 63, 75),
    ticket(3, 'marinara', 28, 75),
  ];
  s.plate.items = [
    makeItem('bun', 'ready'),
    makeItem('patty', 'cooked'),
    makeItem('lettuce', 'chopped'),
  ];
  s.plate.onCounter = true;
  s.burners[0] = { item: makeItem('patty', 'cooked'), t: 7.5 };
  // The chef stands by the plating counter, chopped tomato overhead, about
  // to finish the Classic Burger — chef, plate and hint in one glance.
  s.player.x = 430;
  s.player.y = 440;
  s.player.dir = 1;
  s.player.hands = makeItem('tomato', 'chopped');
  s.player.moving = false;
  return { screen: 'play', hint: 'Add the tomato, then serve the Classic Burger' };
}

/** A fresh state staged for the named shot, ready to render. */
export function stateForShot(name, seed) {
  const state = createState(seed || 1);
  const staged = stageShot(name, state);
  return { state, hint: staged.hint };
}
