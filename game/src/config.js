// Sizzle & Serve — configuration: recipes, ingredients, tuning, palette.
// Every number the game balances on lives here, so the kitchen can be
// retuned without touching the rules, the movement or the drawing.
export const VIEW = { width: 960, height: 600 };
export const HUD_HEIGHT = 72;
export const SHIFT_SECONDS = 180;
export const RUSH_AT = 30; // last N seconds of the shift are rush hour
export const MAX_ORDERS = 4;
export const START_LIVES = 3;

/** Ingredient catalogue. `prep` says what turns a raw item into a usable one. */
export const INGREDIENTS = {
  bun: { name: 'Bun', color: '#e8b96a', dark: '#c98f3d', prep: 'ready', key: 'bun' },
  patty: { name: 'Patty', color: '#8a5a33', dark: '#5f3a1e', prep: 'cook', key: 'patty' },
  cheese: { name: 'Cheese', color: '#f7c948', dark: '#d9a41f', prep: 'ready', key: 'cheese' },
  tomato: { name: 'Tomato', color: '#e8452c', dark: '#b02a17', prep: 'chop', key: 'tomato' },
  lettuce: { name: 'Lettuce', color: '#7ac74f', dark: '#4e9a2e', prep: 'chop', key: 'lettuce' },
  onion: { name: 'Onion', color: '#f2e8f5', dark: '#b79ac2', prep: 'chop', key: 'onion' },
  pasta: { name: 'Pasta', color: '#f2d06b', dark: '#c9a13b', prep: 'cook', key: 'pasta' },
  sauce: { name: 'Sauce', color: '#c0392b', dark: '#8e2418', prep: 'ready', key: 'sauce' },
};

/** A recipe is a list of finished ingredient keys; the plate must match exactly. */
export const RECIPES = [
  { id: 'classic', name: 'Classic Burger', price: 14, items: ['bun', 'patty', 'lettuce', 'tomato'] },
  { id: 'cheese', name: 'Cheese Burger', price: 16, items: ['bun', 'patty', 'cheese', 'tomato'] },
  { id: 'garden', name: 'Garden Salad', price: 12, items: ['lettuce', 'tomato', 'onion'] },
  { id: 'marinara', name: 'Pasta Marinara', price: 15, items: ['pasta', 'sauce'] },
  { id: 'double', name: 'Double Stack', price: 22, items: ['bun', 'patty', 'patty', 'cheese', 'lettuce'] },
];

/** Tuning for the shift: orders arrive faster and live shorter as it goes on. */
export const TUNING = {
  orderFirstAt: 2, // seconds into the shift when the first ticket appears
  orderEveryStart: 16, // spawn gap at the start of the shift
  orderEveryEnd: 8, // spawn gap by the end of the shift
  orderTimeStart: 75, // seconds a ticket lives at the start
  orderTimeEnd: 45, // seconds a ticket lives by the end
  chopSeconds: 1.4, // hold-to-chop time
  cookSeconds: 7, // patty / pasta on the stove
  burnAfter: 11, // seconds on the stove before food burns
  tipPerSecond: 0.2, // bonus coins per second left on the ticket
  expirePenalty: 5, // coins lost when a ticket expires
  wrongPenalty: 3, // coins lost when a wrong plate is served
  playerSpeed: 230,
  playerRadius: 16,
};

/** Warm diner palette, one place for every colour the renderer uses. */
export const PALETTE = {
  floorA: '#e9cd96',
  floorB: '#dfbd7d',
  wall: '#f6e7c8',
  wallTrim: '#d9b878',
  counterTop: '#b07a45',
  counterSide: '#8a5a33',
  counterEdge: '#6e4525',
  pantry: '#7d9b6a',
  chop: '#c98f5f',
  stove: '#5b6770',
  window: '#4a7fa5',
  plate: '#fdf6e3',
  bin: '#7a7a7a',
  ink: '#2e2118',
  cream: '#fff8e7',
  gold: '#f7c948',
  red: '#e8452c',
  green: '#7ac74f',
  hud: '#2e2118',
};
