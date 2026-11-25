// Sizzle & Serve — kitchen layout and station rules.
// The kitchen is a room with counters on the north and south walls. A station
// is a rectangle the player cannot walk through, with a front edge the player
// stands at to work it. Every rule about what a station does lives here.
import { HUD_HEIGHT, INGREDIENTS, TUNING } from './config.js';

export const STATIONS = [
  { id: 'pantry', name: 'Pantry', x: 24, y: HUD_HEIGHT + 8, w: 168, h: 52, tint: '#7d9b6a', hint: 'Take an ingredient' },
  { id: 'chop', name: 'Chopping Board', x: 216, y: HUD_HEIGHT + 8, w: 168, h: 52, tint: '#c98f5f', hint: 'Hold to chop' },
  { id: 'stove', name: 'Stove', x: 408, y: HUD_HEIGHT + 8, w: 216, h: 52, tint: '#5b6770', hint: 'Cook it, watch the ring' },
  { id: 'window', name: 'Serving Window', x: 648, y: HUD_HEIGHT + 8, w: 288, h: 52, tint: '#4a7fa5', hint: 'Serve a finished plate' },
  { id: 'plate', name: 'Plating Counter', x: 300, y: 600 - 60, w: 360, h: 52, tint: '#b07a45', hint: 'Build the dish here' },
  { id: 'bin', name: 'Bin', x: 24, y: 600 - 60, w: 120, h: 52, tint: '#7a7a7a', hint: 'Throw it away' },
];

/** The two stove burners, centred on the stove counter. */
export const BURNERS = [
  { x: 468, y: HUD_HEIGHT + 34, r: 24 },
  { x: 564, y: HUD_HEIGHT + 34, r: 24 },
];

/** Pantry shelf slots: where each ingredient sits on the pantry counter. */
export const PANTRY_SLOTS = Object.keys(INGREDIENTS).map((key, i) => ({
  key,
  x: 44 + i * 20,
  y: HUD_HEIGHT + 34,
}));

/** Point-in-rectangle test, used for clicks and for standing checks. */
export function inside(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

/** The station whose front the player is close enough to work, or null. */
export function stationNear(player) {
  const reach = 52;
  let best = null;
  let bestD = Infinity;
  for (const s of STATIONS) {
    const cx = Math.max(s.x, Math.min(player.x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(player.y, s.y + s.h));
    const d = Math.hypot(player.x - cx, player.y - cy);
    if (d < reach && d < bestD) {
      best = s;
      bestD = d;
    }
  }
  return best;
}

/** The burner the player is close enough to use, or null. */
export function burnerNear(player) {
  for (let i = 0; i < BURNERS.length; i += 1) {
    if (Math.hypot(player.x - BURNERS[i].x, player.y - BURNERS[i].y) < 58) return i;
  }
  return null;
}

/** The pantry ingredient under a click, or null. */
export function pantryPick(x, y) {
  for (const slot of PANTRY_SLOTS) {
    if (Math.hypot(x - slot.x, y - slot.y) < 14) return slot.key;
  }
  return null;
}

/** Resolve a circle (the player) against every counter so it slides along them. */
export function collide(px, py, r) {
  let x = px;
  let y = py;
  for (const s of STATIONS) {
    const nx = Math.max(s.x - r, Math.min(x, s.x + s.w + r));
    const ny = Math.max(s.y - r, Math.min(y, s.y + s.h + r));
    const dx = x - nx;
    const dy = y - ny;
    const d2 = dx * dx + dy * dy;
    if (d2 < r * r && d2 > 0.0001) {
      const d = Math.sqrt(d2);
      x = nx + (dx / d) * r;
      y = ny + (dy / d) * r;
    } else if (d2 <= 0.0001) {
      // Centre inside the rectangle: push out along the smallest overlap.
      const left = x - (s.x - r);
      const right = s.x + s.w + r - x;
      const top = y - (s.y - r);
      const bottom = s.y + s.h + r - y;
      const m = Math.min(left, right, top, bottom);
      if (m === left) x = s.x - r;
      else if (m === right) x = s.x + s.w + r;
      else if (m === top) y = s.y - r;
      else y = s.y + s.h + r;
    }
  }
  x = Math.max(r + 4, Math.min(960 - r - 4, x));
  y = Math.max(HUD_HEIGHT + r + 4, Math.min(600 - r - 4, y));
  return { x, y };
}
