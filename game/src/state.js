// Sizzle & Serve — game state: the shift, the orders, the score.
// State is plain data. The rules in kitchen.js change it; the renderer only
// reads it; shots.js builds scripted copies of it for the screenshots.
import { INGREDIENTS, RECIPES, SHIFT_SECONDS, TUNING, MAX_ORDERS } from './config.js';

/** A finished ingredient is { key, state: 'raw' | 'chopped' | 'cooked' | 'ready' }. */
export function makeItem(key, state) {
  return { key, state: state || defaultState(key) };
}

/** The state an ingredient is in the moment it leaves the pantry. */
export function defaultState(key) {
  const prep = INGREDIENTS[key].prep;
  return prep === 'ready' ? 'ready' : 'raw';
}

/** Is this finished item one a recipe can use? (chopped or cooked or ready) */
export function isFinished(item) {
  return item.state === 'chopped' || item.state === 'cooked' || item.state === 'ready';
}

/** A fresh, empty state for a new shift. */
export function createState(seed) {
  return {
    seed: seed || 1,
    rngState: (seed || 1) >>> 0,
    screen: 'title', // title | play | over
    time: 0, // seconds into the shift
    left: SHIFT_SECONDS,
    coins: 0,
    served: 0,
    expired: 0,
    wrong: 0,
    combo: 0,
    bestCombo: 0,
    lives: 3,
    orders: [],
    nextOrderIn: TUNING.orderFirstAt,
    orderSeq: 0,
    player: { x: 480, y: 360, vx: 0, vy: 0, dir: 1, moving: false, hands: null, target: null, walkPhase: 0 },
    chop: { item: null, progress: 0 }, // one slot on the chopping board
    burners: [null, null], // each: { item, t } or null
    plate: { items: [], onCounter: true }, // the one plate in play
    plateReturnIn: 0, // seconds until a fresh empty plate appears
    particles: [],
    floats: [], // floating score texts
    shake: 0,
    flash: 0,
    rush: false,
    banner: null, // { text, t } centre-screen announcement
    servedFlash: 0,
    muted: false,
    overReason: '',
    stats: { bestServe: 0 },
  };
}

/** Deterministic RNG (mulberry32) so staged shots always look the same. */
export function rng(state) {
  let t = (state.rngState += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** How far through the shift we are, 0 at the start and 1 at the end. */
export function progress(state) {
  return Math.min(1, state.time / SHIFT_SECONDS);
}

/** Seconds between order spawns right now (faster as the shift goes on). */
export function spawnGap(state) {
  const p = progress(state);
  return TUNING.orderEveryStart + (TUNING.orderEveryEnd - TUNING.orderEveryStart) * p;
}

/** Seconds a new ticket lives right now (shorter as the shift goes on). */
export function orderLifetime(state) {
  const p = progress(state);
  return TUNING.orderTimeStart + (TUNING.orderTimeEnd - TUNING.orderTimeStart) * p;
}

/** Pick a recipe for a new ticket, weighted so early orders stay simple. */
export function pickRecipe(state) {
  const p = progress(state);
  const pool = RECIPES.filter((r) => r.items.length <= 2 + Math.floor(p * 3) + 1);
  return pool[Math.floor(rng(state) * pool.length)];
}

/** Add a new order ticket to the board. */
export function spawnOrder(state) {
  const recipe = pickRecipe(state);
  state.orderSeq += 1;
  state.orders.push({
    id: state.orderSeq,
    recipe,
    timeLeft: orderLifetime(state),
    total: orderLifetime(state),
    born: state.time,
  });
}

/** Does the plate's stack match this ticket's recipe exactly (order-free)? */
export function plateMatches(plateItems, recipe) {
  if (plateItems.length !== recipe.items.length) return false;
  const have = plateItems.map((i) => i.key).sort();
  const want = [...recipe.items].sort();
  return have.every((k, i) => k === want[i]);
}

/** The open ticket this plate would complete, or null. */
export function matchingOrder(state) {
  for (const order of state.orders) {
    if (plateMatches(state.plate.items, order.recipe)) return order;
  }
  return null;
}

/** Coins for serving this ticket now: price + time tip, times the combo bonus. */
export function serveValue(state, order) {
  const tip = Math.round(order.timeLeft * TUNING.tipPerSecond);
  const base = order.recipe.price + tip;
  const mult = 1 + 0.25 * state.combo;
  return Math.max(1, Math.round(base * mult));
}

/** Serve the plate at the window. Returns { ok, coins, order } for the caller. */
export function servePlate(state) {
  const order = matchingOrder(state);
  if (!order) return { ok: false, coins: 0, order: null };
  const coins = serveValue(state, order);
  state.coins += coins;
  state.served += 1;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.stats.bestServe = Math.max(state.stats.bestServe, coins);
  state.orders = state.orders.filter((o) => o.id !== order.id);
  state.plate.items = [];
  state.plate.onCounter = false;
  state.plateReturnIn = 1.2;
  state.servedFlash = 1;
  state.floats.push({ x: 792, y: 130, text: `+${coins} coins`, t: 0, color: '#f7c948' });
  return { ok: true, coins, order };
}

/** Advance the shift by dt seconds: clock, spawns, ticket timers, burners. */
export function tick(state, dt) {
  if (state.screen !== 'play') return;
  state.time += dt;
  state.left = Math.max(0, SHIFT_SECONDS - state.time);
  state.rush = state.left <= 30 && state.left > 0;

  // Order spawns, faster in the rush.
  state.nextOrderIn -= dt * (state.rush ? 1.6 : 1);
  if (state.nextOrderIn <= 0 && state.orders.length < MAX_ORDERS) {
    spawnOrder(state);
    state.nextOrderIn = spawnGap(state);
  } else if (state.nextOrderIn <= 0) {
    state.nextOrderIn = 2;
  }

  // Ticket countdowns; an expired ticket costs coins and breaks the combo.
  for (let i = state.orders.length - 1; i >= 0; i -= 1) {
    const order = state.orders[i];
    order.timeLeft -= dt;
    if (order.timeLeft <= 0) {
      state.orders.splice(i, 1);
      state.expired += 1;
      state.combo = 0;
      state.coins = Math.max(0, state.coins - TUNING.expirePenalty);
      state.shake = 0.45;
      state.floats.push({ x: 480, y: 120, text: 'Order expired! -5', t: 0, color: '#e8452c' });
      if (state.lives > 0) state.lives -= 1;
    }
  }

  // Burners cook; food left too long burns.
  for (let i = 0; i < state.burners.length; i += 1) {
    const slot = state.burners[i];
    if (!slot) continue;
    slot.t += dt;
    if (slot.item.state === 'raw' && slot.t >= TUNING.cookSeconds) {
      slot.item.state = 'cooked';
    }
    if (slot.t >= TUNING.burnAfter && slot.item.state !== 'burnt') {
      slot.item.state = 'burnt';
      state.floats.push({ x: 468 + i * 96, y: 108, text: 'Burnt!', t: 0, color: '#e8452c' });
    }
  }

  // Fresh plate returns to the plating counter after a serve — unless the
  // player is still carrying the old one, in which case the counter waits
  // for them to bring it back.
  if (!state.plate.onCounter && state.plateReturnIn > 0) {
    state.plateReturnIn -= dt;
    if (state.plateReturnIn <= 0 && !(state.player.hands && state.player.hands.key === 'plate')) {
      state.plate.onCounter = true;
    }
  }

  // Particles and floating texts age out.
  for (let i = state.particles.length - 1; i >= 0; i -= 1) {
    const p = state.particles[i];
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 60 * dt;
    if (p.t > p.life) state.particles.splice(i, 1);
  }
  for (let i = state.floats.length - 1; i >= 0; i -= 1) {
    const f = state.floats[i];
    f.t += dt;
    f.y -= 26 * dt;
    if (f.t > 1.4) state.floats.splice(i, 1);
  }
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt);
  if (state.flash > 0) state.flash = Math.max(0, state.flash - dt * 2);
  if (state.servedFlash > 0) state.servedFlash = Math.max(0, state.servedFlash - dt * 1.5);
  if (state.banner) {
    state.banner.t += dt;
    if (state.banner.t > 2.2) state.banner = null;
  }

  // End of shift, or out of lives.
  if (state.left <= 0 || state.lives <= 0) {
    state.screen = 'over';
    state.overReason = state.lives <= 0 ? 'The dinner rush beat you.' : 'Shift complete!';
  }
}

/** Rank for the end-of-shift screen, from coins served. */
export function rankFor(state) {
  const score = state.coins + state.served * 10;
  if (score >= 260) return 'S';
  if (score >= 200) return 'A';
  if (score >= 140) return 'B';
  if (score >= 80) return 'C';
  return 'D';
}

/** Burst of particles at a point, for chops, serves and throws. */
export function burst(state, x, y, color, n, speed) {
  for (let i = 0; i < n; i += 1) {
    const a = rng(state) * Math.PI * 2;
    const v = (speed || 90) * (0.4 + rng(state) * 0.8);
    state.particles.push({
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 40,
      t: 0,
      life: 0.5 + rng(state) * 0.4,
      color,
      r: 2 + rng(state) * 3,
    });
  }
}
