// Sizzle & Serve — the chef: movement, carrying and what E does.
// The player holds one thing at a time (an ingredient or the plate). Every
// station answers the same verb — interact — and the station decides what
// that means for what the player is holding.
import { INGREDIENTS, TUNING } from './config.js';
import { BURNERS, burnerNear, collide, pantryPick, stationNear } from './kitchen.js';
import { burst, isFinished, makeItem, servePlate } from './state.js';

/** Start a new shift with the chef by the plating counter. */
export function resetPlayer(state) {
  state.player.x = 480;
  state.player.y = 380;
  state.player.hands = null;
  state.player.target = null;
  state.player.moving = false;
}

/**
 * One interaction at the station the player is standing by. `sfx` is a
 * function that plays a named sound; the game passes its own sound board.
 * Returns a short hint for the HUD, or '' when nothing happened.
 */
export function interact(state, sfx) {
  const station = stationNear(state.player);
  if (!station) return '';
  const hands = state.player.hands;

  if (station.id === 'pantry') {
    if (hands) return 'Hands full — serve or bin it first';
    return 'Click an ingredient on the shelf';
  }

  if (station.id === 'chop') {
    if (state.chop.item) return 'Chopping board is busy';
    if (!hands || hands.key === 'plate') return 'Bring something to chop';
    if (INGREDIENTS[hands.key].prep !== 'chop') return `${INGREDIENTS[hands.key].name} needs no chopping`;
    state.chop.item = hands;
    state.chop.progress = 0;
    state.player.hands = null;
    sfx('place');
    return `Chopping ${INGREDIENTS[hands.key].name} — hold E`;
  }

  if (station.id === 'stove') {
    const burner = burnerNear(state.player);
    if (burner === null) return 'Step up to a burner';
    const slot = state.burners[burner];
    if (slot) {
      if (hands) return 'Hands full — take the pan later';
      state.player.hands = slot.item;
      state.burners[burner] = null;
      sfx('pickup');
      return `Took the ${INGREDIENTS[slot.item.key].name}`;
    }
    if (!hands || hands.key === 'plate') return 'Bring a patty or pasta to cook';
    if (INGREDIENTS[hands.key].prep !== 'cook') return `${INGREDIENTS[hands.key].name} needs no cooking`;
    state.burners[burner] = { item: hands, t: 0 };
    state.player.hands = null;
    sfx('sizzle');
    return `Cooking ${INGREDIENTS[hands.key].name} — watch the ring`;
  }

  if (station.id === 'plate') {
    // Carrying the empty plate back always works, even while the counter
    // is still waiting for its fresh plate — otherwise the player could
    // never put it down.
    if (hands && hands.key === 'plate') {
      state.plate.onCounter = true;
      state.player.hands = null;
      sfx('place');
      return 'Plate back on the counter';
    }
    if (!state.plate.onCounter) return 'The plate is coming back…';
    if (hands) {
      if (!isFinished(hands)) return 'Finish it first — chop or cook it';
      if (hands.state === 'burnt') return 'That is burnt — bin it';
      state.plate.items.push(hands);
      state.player.hands = null;
      burst(state, 480, 520, '#f7c948', 6, 60);
      sfx('place');
      return `Added ${INGREDIENTS[hands.key].name} to the plate`;
    }
    state.player.hands = { key: 'plate', state: 'ready' };
    state.plate.onCounter = false;
    sfx('pickup');
    return 'Carrying the plate — to the window!';
  }

  if (station.id === 'window') {
    if (!hands || hands.key !== 'plate') return 'Bring a finished plate here';
    const result = servePlate(state);
    if (!result.ok) {
      state.coins = Math.max(0, state.coins - TUNING.wrongPenalty);
      state.wrong += 1;
      state.combo = 0;
      state.shake = 0.4;
      sfx('error');
      return 'No order wants this plate — check the tickets';
    }
    burst(state, 792, 130, '#f7c948', 18, 130);
    sfx('ding');
    sfx('coin');
    return `Served ${result.order.recipe.name}! +${result.coins} — take the plate back`;
  }

  if (station.id === 'bin') {
    if (!hands) return 'Nothing to throw away';
    if (hands.key === 'plate') {
      state.plate.items = [];
      state.plate.onCounter = true;
      state.player.hands = null;
      sfx('place');
      return 'Plate emptied, fresh start';
    }
    burst(state, 84, 520, '#9a9a9a', 8, 70);
    state.player.hands = null;
    sfx('trash');
    return 'Binned';
  }

  return '';
}

/** Take an ingredient straight from the pantry shelf (mouse click). */
export function takeFromPantry(state, key, sfx) {
  if (state.player.hands) return 'Hands full';
  state.player.hands = makeItem(key);
  sfx('pickup');
  return `Took ${INGREDIENTS[key].name}`;
}

/** Hold-to-chop: while the player holds E by the board, the chop progresses. */
export function updateChop(state, dt, holding, sfx) {
  if (!state.chop.item) return;
  if (!holding) return;
  const before = state.chop.progress;
  state.chop.progress += dt / TUNING.chopSeconds;
  if (Math.floor(state.chop.progress * 6) !== Math.floor(before * 6)) {
    burst(state, 300, 108, INGREDIENTS[state.chop.item.key].color, 3, 50);
    sfx('chop');
  }
  if (state.chop.progress >= 1) {
    const item = state.chop.item;
    item.state = 'chopped';
    state.chop.item = null;
    state.chop.progress = 0;
    state.player.hands = item;
    burst(state, 300, 108, '#7ac74f', 10, 80);
    sfx('done');
  }
}

/**
 * Move the chef for one frame. `keys` holds the pressed movement keys,
 * `target` is a click-to-move point (or null). Returns nothing; the player
 * object is updated in place, sliding along the counters.
 */
export function updatePlayer(state, dt, keys, sfx) {
  const p = state.player;
  let mx = 0;
  let my = 0;
  if (keys.has('ArrowLeft') || keys.has('KeyA')) mx -= 1;
  if (keys.has('ArrowRight') || keys.has('KeyD')) mx += 1;
  if (keys.has('ArrowUp') || keys.has('KeyW')) my -= 1;
  if (keys.has('ArrowDown') || keys.has('KeyS')) my += 1;

  if (mx === 0 && my === 0 && p.target) {
    const dx = p.target.x - p.x;
    const dy = p.target.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d < 8) {
      p.target = null;
      if (p.targetAction) {
        const action = p.targetAction;
        p.targetAction = null;
        action();
      }
    } else {
      mx = dx / d;
      my = dy / d;
    }
  }

  const len = Math.hypot(mx, my);
  if (len > 0) {
    const nx = mx / len;
    const ny = my / len;
    const step = TUNING.playerSpeed * dt;
    const pos = collide(p.x + nx * step, p.y + ny * step, TUNING.playerRadius);
    p.x = pos.x;
    p.y = pos.y;
    p.dir = nx < 0 ? -1 : nx > 0 ? 1 : p.dir;
    p.moving = true;
    p.walkPhase += dt * 11;
  } else {
    p.moving = false;
  }

  // Stepping onto a burner with a finished pan in hand does nothing by
  // itself; the player presses E. Clicking a station walks there, then acts.
  void sfx;
}

/** Click handling: pantry picks, station walk-to, or plain floor walking. */
export function clickAt(state, x, y, sfx) {
  if (state.screen !== 'play') return '';
  const pick = pantryPick(x, y);
  const station = (() => {
    for (const s of [{ id: 'pantry', x: 24, y: 80, w: 168, h: 52 }]) {
      if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return s;
    }
    return null;
  })();
  if (pick) {
    const near = stationNear(state.player);
    if (!near || near.id !== 'pantry') {
      state.player.target = { x: 108, y: 160 };
      state.player.targetAction = () => takeFromPantry(state, pick, sfx);
      return `Going for ${INGREDIENTS[pick].name}`;
    }
    return takeFromPantry(state, pick, sfx);
  }
  void station;
  // Click a station: walk to its front, then interact on arrival.
  const all = [
    { id: 'pantry', x: 24, y: 80, w: 168, h: 52 },
    { id: 'chop', x: 216, y: 80, w: 168, h: 52 },
    { id: 'stove', x: 408, y: 80, w: 216, h: 52 },
    { id: 'window', x: 648, y: 80, w: 288, h: 52 },
    { id: 'plate', x: 300, y: 540, w: 360, h: 52 },
    { id: 'bin', x: 24, y: 540, w: 120, h: 52 },
  ];
  for (const s of all) {
    if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) {
      const cy = s.y < 300 ? s.y + s.h + 26 : s.y - 26;
      state.player.target = { x: s.x + s.w / 2, y: cy };
      state.player.targetAction = () => interact(state, sfx);
      return `Heading to the ${s.id}`;
    }
  }
  state.player.target = { x, y };
  state.player.targetAction = null;
  return '';
}
