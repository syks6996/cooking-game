// Sizzle & Serve — rendering: the kitchen, the food, the chef, the HUD.
// Everything is drawn with canvas primitives in one warm diner palette, so
// the game needs no image files and every frame is a real render of the code.
import { HUD_HEIGHT, INGREDIENTS, PALETTE, TUNING, VIEW } from './config.js';
import { BURNERS, PANTRY_SLOTS, STATIONS } from './kitchen.js';
import { matchingOrder, rankFor } from './state.js';

/** Rounded rectangle path, the workhorse of every panel and ticket. */
export function roundRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

/** Text with a soft shadow so it reads over busy art. */
function text(ctx, str, x, y, size, color, align, weight) {
  ctx.font = `${weight || '700'} ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(46,33,24,0.35)';
  ctx.fillText(str, x + 1.5, y + 1.5);
  ctx.fillStyle = color || PALETTE.ink;
  ctx.fillText(str, x, y);
}

/** One ingredient drawn as a small vector icon at (x, y), radius r. */
export function drawIngredient(ctx, key, x, y, r, state) {
  const ing = INGREDIENTS[key];
  ctx.save();
  ctx.translate(x, y);
  if (state === 'burnt') {
    ctx.fillStyle = '#1d1d1d';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.3);
    ctx.lineTo(r * 0.4, r * 0.4);
    ctx.moveTo(r * 0.5, -r * 0.4);
    ctx.lineTo(-r * 0.3, r * 0.5);
    ctx.stroke();
    ctx.restore();
    return;
  }
  switch (key) {
    case 'bun': {
      ctx.fillStyle = ing.color;
      ctx.beginPath();
      ctx.arc(0, r * 0.15, r, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = ing.dark;
      ctx.fillRect(-r, r * 0.1, r * 2, r * 0.22);
      ctx.fillStyle = '#fff3c4';
      for (const [sx, sy] of [[-0.4, -0.45], [0.1, -0.6], [0.5, -0.35]]) {
        ctx.beginPath();
        ctx.ellipse(sx * r, sy * r, r * 0.12, r * 0.07, 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'patty': {
      ctx.fillStyle = state === 'cooked' ? '#6b4423' : '#a9714b';
      roundRect(ctx, -r, -r * 0.55, r * 2, r * 1.1, r * 0.45);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1.5;
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(-r * 0.7, i * r * 0.3);
        ctx.lineTo(r * 0.7, i * r * 0.3);
        ctx.stroke();
      }
      break;
    }
    case 'cheese': {
      ctx.fillStyle = ing.color;
      ctx.beginPath();
      ctx.moveTo(-r, r * 0.7);
      ctx.lineTo(r, r * 0.7);
      ctx.lineTo(0, -r * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = ing.dark;
      for (const [hx, hy] of [[-0.25, 0.3], [0.3, 0.35], [0, -0.15]]) {
        ctx.beginPath();
        ctx.arc(hx * r, hy * r, r * 0.13, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'tomato': {
      if (state === 'chopped') {
        ctx.fillStyle = '#f2604a';
        ctx.beginPath();
        ctx.arc(-r * 0.35, 0, r * 0.55, 0, Math.PI * 2);
        ctx.arc(r * 0.4, r * 0.15, r * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd9d2';
        ctx.beginPath();
        ctx.arc(-r * 0.35, 0, r * 0.28, 0, Math.PI * 2);
        ctx.arc(r * 0.4, r * 0.15, r * 0.28, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = ing.color;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4e9a2e';
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.9);
        ctx.lineTo(-r * 0.35, -r * 0.45);
        ctx.lineTo(0, -r * 0.6);
        ctx.lineTo(r * 0.35, -r * 0.45);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case 'lettuce': {
      ctx.fillStyle = ing.color;
      for (let i = 0; i < 5; i += 1) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45, r * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#a5dd85';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'onion': {
      ctx.fillStyle = ing.color;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = ing.dark;
      ctx.lineWidth = 1.5;
      for (const rr of [0.6, 0.35]) {
        ctx.beginPath();
        ctx.arc(0, 0, r * rr, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
    case 'pasta': {
      ctx.strokeStyle = state === 'cooked' ? '#e8b93f' : ing.color;
      ctx.lineWidth = r * 0.28;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i < 3; i += 1) {
        const yy = -r * 0.5 + i * r * 0.5;
        ctx.moveTo(-r * 0.8, yy);
        ctx.bezierCurveTo(-r * 0.3, yy - r * 0.3, r * 0.3, yy + r * 0.3, r * 0.8, yy);
      }
      ctx.stroke();
      break;
    }
    case 'sauce': {
      ctx.fillStyle = ing.color;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(r * 0.8, -r * 0.2, r * 0.55, r * 0.5);
      ctx.quadraticCurveTo(0, r * 0.95, -r * 0.55, r * 0.5);
      ctx.quadraticCurveTo(-r * 0.8, -r * 0.2, 0, -r);
      ctx.fill();
      ctx.fillStyle = '#ff8a7a';
      ctx.beginPath();
      ctx.ellipse(-r * 0.2, -r * 0.2, r * 0.14, r * 0.22, -0.4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    default: break;
  }
  ctx.restore();
}

/** The dining area on the rug: two small tables with chairs and a seated
 * customer each, drawn with the same canvas primitives as the rest of the
 * room. Visual only — the chef still walks the floor freely, and the
 * bottom strip of the rug stays clear so the chef never hides a table. */
function drawDining(ctx) {
  // A second, lighter border so the rug reads as a rug, not a blank panel.
  ctx.strokeStyle = 'rgba(192,57,43,0.28)';
  ctx.lineWidth = 2;
  roundRect(ctx, 308, 308, 344, 134, 14);
  ctx.stroke();
  for (const [cx, shirt, hair] of [[380, '#4a7fa5', '#6b4423'], [560, '#7d9b6a', '#2e2118']]) {
    // Seated customer behind the table: shoulders, head, hair cap.
    ctx.fillStyle = shirt;
    roundRect(ctx, cx - 13, 320, 26, 14, 6);
    ctx.fill();
    ctx.fillStyle = '#f2c79b';
    ctx.beginPath();
    ctx.arc(cx, 313, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.arc(cx, 311, 9, Math.PI, 0);
    ctx.fill();
    // The table: wooden top, two plates with a bite on each.
    ctx.fillStyle = '#b0703c';
    roundRect(ctx, cx - 37, 330, 74, 40, 8);
    ctx.fill();
    ctx.strokeStyle = '#7a4a26';
    ctx.lineWidth = 2;
    ctx.stroke();
    for (const px of [cx - 16, cx + 16]) {
      ctx.fillStyle = '#fdf6e3';
      ctx.beginPath();
      ctx.ellipse(px, 350, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d9b878';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.fillStyle = '#e8452c';
    ctx.beginPath();
    ctx.arc(cx - 16, 349, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7ac74f';
    ctx.beginPath();
    ctx.arc(cx + 16, 349, 3, 0, Math.PI * 2);
    ctx.fill();
    // An empty chair on the near side, waiting for the next guest.
    ctx.fillStyle = '#8a5a33';
    roundRect(ctx, cx - 14, 378, 28, 12, 4);
    ctx.fill();
  }
}

/** The checkerboard kitchen floor and the wall band above the counters. */
function drawRoom(ctx) {
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, VIEW.width, HUD_HEIGHT + 4);
  ctx.fillStyle = PALETTE.wallTrim;
  ctx.fillRect(0, HUD_HEIGHT + 2, VIEW.width, 4);
  const tile = 48;
  for (let y = HUD_HEIGHT + 6; y < VIEW.height; y += tile) {
    for (let x = 0; x < VIEW.width; x += tile) {
      const odd = (Math.floor(x / tile) + Math.floor(y / tile)) % 2 === 0;
      ctx.fillStyle = odd ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(x, y, tile, tile);
    }
  }
  // Warm rug in the middle of the floor, where the chef runs.
  ctx.fillStyle = 'rgba(192,57,43,0.16)';
  roundRect(ctx, 300, 300, 360, 150, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(192,57,43,0.35)';
  ctx.lineWidth = 3;
  ctx.stroke();
  drawDining(ctx);
  // A crate of vegetables by the pantry and a potted herb by the window:
  // the corners of the floor are free, and bare floor reads as unfinished.
  ctx.fillStyle = '#a9714b';
  roundRect(ctx, 28, 200, 44, 34, 4);
  ctx.fill();
  ctx.strokeStyle = '#7a4a26';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#7ac74f';
  ctx.beginPath();
  ctx.arc(40, 198, 8, 0, Math.PI * 2);
  ctx.arc(58, 196, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8452c';
  ctx.beginPath();
  ctx.arc(50, 202, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b0703c';
  roundRect(ctx, 898, 196, 34, 30, 4);
  ctx.fill();
  ctx.fillStyle = '#4e9a2e';
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.ellipse(915 + Math.cos(a) * 8, 190 + Math.sin(a) * 8, 5, 9, a, 0, Math.PI * 2);
    ctx.fill();
  }
  // Pendant lamps hanging over the open floor, warm glow included.
  for (const lx of [300, 480, 660]) {
    ctx.strokeStyle = '#6e4525';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lx, 140);
    ctx.lineTo(lx, 164);
    ctx.stroke();
    ctx.fillStyle = 'rgba(247,201,72,0.28)';
    ctx.beginPath();
    ctx.arc(lx, 178, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f7c948';
    ctx.beginPath();
    ctx.moveTo(lx - 10, 168);
    ctx.lineTo(lx + 10, 168);
    ctx.lineTo(lx + 6, 178);
    ctx.lineTo(lx - 6, 178);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(lx, 178, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** One counter: wooden body, coloured top, name plate, and its contents. */
function drawCounter(ctx, station, state, t) {
  const { x, y, w, h } = station;
  ctx.fillStyle = PALETTE.counterSide;
  roundRect(ctx, x, y + 8, w, h, 8);
  ctx.fill();
  ctx.fillStyle = station.tint;
  roundRect(ctx, x, y, w, 14, 7);
  ctx.fill();
  ctx.fillStyle = PALETTE.counterEdge;
  ctx.fillRect(x, y + 12, w, 2);
  // The name rides on the counter's coloured top strip, so the counter body
  // stays free for what the station holds.
  text(ctx, station.name.toUpperCase(), x + w / 2, y + 7, 10, 'rgba(255,248,231,0.95)', 'center', '800');

  if (station.id === 'pantry') {
    for (const slot of PANTRY_SLOTS) {
      drawIngredient(ctx, slot.key, slot.x, slot.y, 10, 'raw');
    }
  }
  if (station.id === 'chop' && state.chop.item) {
    const item = state.chop.item;
    drawIngredient(ctx, item.key, 300, 112, 13, state.chop.progress >= 1 ? 'chopped' : 'raw');
    // Chopping progress ring around the board.
    ctx.strokeStyle = 'rgba(46,33,24,0.25)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(300, 112, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#f7c948';
    ctx.beginPath();
    ctx.arc(300, 112, 18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * state.chop.progress);
    ctx.stroke();
    // The knife, bobbing while someone chops.
    if (state.chop.progress > 0 && state.chop.progress < 1) {
      const bob = Math.sin(t * 22) * 4;
      ctx.save();
      ctx.translate(322, 96 + bob);
      ctx.rotate(0.5);
      ctx.fillStyle = '#dfe6ea';
      ctx.fillRect(-2, -14, 4, 16);
      ctx.fillStyle = '#2e2118';
      ctx.fillRect(-2, 2, 4, 8);
      ctx.restore();
    }
  }
  if (station.id === 'stove') {
    for (let i = 0; i < BURNERS.length; i += 1) {
      const b = BURNERS[i];
      const slot = state.burners[i];
      ctx.fillStyle = '#22262b';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3a4148';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r - 5, 0, Math.PI * 2);
      ctx.stroke();
      if (slot) {
        const done = Math.min(1, slot.t / TUNING.cookSeconds);
        const burnt = slot.item.state === 'burnt';
        // Heat glow under the pan, stronger as it cooks.
        ctx.fillStyle = burnt ? 'rgba(60,60,60,0.8)' : `rgba(232,120,40,${0.25 + done * 0.45})`;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r - 3, 0, Math.PI * 2);
        ctx.fill();
        drawIngredient(ctx, slot.item.key, b.x, b.y, 12, slot.item.state);
        // Cook ring: green while it is perfect, red once it burns.
        ctx.strokeStyle = burnt ? '#e8452c' : '#7ac74f';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, slot.t / TUNING.burnAfter));
        ctx.stroke();
        if (!burnt && slot.t > 4) {
          // Steam wisps rising off a nearly-ready pan.
          ctx.strokeStyle = 'rgba(255,255,255,0.7)';
          ctx.lineWidth = 2;
          const wob = Math.sin(t * 3 + i * 2) * 3;
          ctx.beginPath();
          ctx.moveTo(b.x - 6 + wob, b.y - 16);
          ctx.quadraticCurveTo(b.x - 10 + wob, b.y - 26, b.x - 4 + wob, b.y - 34);
          ctx.moveTo(b.x + 6 - wob, b.y - 16);
          ctx.quadraticCurveTo(b.x + 10 - wob, b.y - 26, b.x + 4 - wob, b.y - 34);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = '#9aa5ad';
        ctx.font = '700 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('EMPTY', b.x, b.y);
      }
    }
  }
  if (station.id === 'window') {
    // The pass: a warm shelf where finished plates wait to be collected.
    ctx.fillStyle = 'rgba(255,248,231,0.85)';
    roundRect(ctx, x + 12, y + 20, w - 24, 18, 6);
    ctx.fill();
    ctx.fillStyle = '#4a7fa5';
    ctx.font = '800 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★ SERVE HERE ★', x + w / 2, y + 29);
    if (state.servedFlash > 0) {
      // A brief gold glow on the pass shelf only, so the counter keeps
      // its own colour while the serve lands.
      ctx.fillStyle = `rgba(247,201,72,${state.servedFlash * 0.28})`;
      roundRect(ctx, x + 12, y + 20, w - 24, 18, 6);
      ctx.fill();
    }
  }
  if (station.id === 'plate') {
    // The plate sits just above the counter's top edge so the stack rises
    // clear of it — and of the name on the strip and the hint bar below.
    if (state.plate.onCounter) drawPlate(ctx, 480, 530, state.plate.items, 1.1);
    else {
      // The plate is on its way back: a dark pill so the note reads over
      // the light floor, the same treatment as the hint bar at the bottom.
      ctx.fillStyle = 'rgba(46,33,24,0.72)';
      roundRect(ctx, 412, 512, 136, 24, 12);
      ctx.fill();
      text(ctx, 'plate coming back…', 480, 524, 11, '#fff8e7', 'center', '700');
    }
  }
  if (station.id === 'bin') {
    ctx.fillStyle = '#5a5a5a';
    roundRect(ctx, x + 30, y + 14, 60, 26, 6);
    ctx.fill();
  }
}

/** The plate and everything stacked on it, drawn from the side. */
function drawPlate(ctx, x, y, items, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#e8ddc4';
  ctx.beginPath();
  ctx.ellipse(0, 4, 34, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.plate;
  ctx.beginPath();
  ctx.ellipse(0, 2, 30, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  let stackY = 0;
  let side = 1;
  for (const item of items) {
    // Each layer sits high enough to show, and alternates a few pixels
    // sideways so the stack reads as a stack, not one blob.
    stackY -= 14;
    side = -side;
    drawIngredient(ctx, item.key, side * 5, stackY, 13, item.state);
  }
  ctx.restore();
}

/** The chef: white hat, apron, walk bob, and whatever is carried overhead. */
function drawPlayer(ctx, state, t) {
  const p = state.player;
  const bob = p.moving ? Math.sin(p.walkPhase) * 2 : 0;
  ctx.save();
  ctx.translate(p.x, p.y + bob * 0.4);
  ctx.scale(1.18, 1.18);
  // Shadow.
  ctx.fillStyle = 'rgba(46,33,24,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 14, 15, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body and apron.
  ctx.fillStyle = '#e8452c';
  roundRect(ctx, -11, -6, 22, 20, 7);
  ctx.fill();
  ctx.fillStyle = '#fff8e7';
  roundRect(ctx, -8, -2, 16, 14, 5);
  ctx.fill();
  // Head and toque.
  ctx.fillStyle = '#f2c79b';
  ctx.beginPath();
  ctx.arc(0, -13, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-5, -21, 5, 0, Math.PI * 2);
  ctx.arc(0, -24, 6, 0, Math.PI * 2);
  ctx.arc(5, -21, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-8, -21, 16, 4);
  // Eyes look the way the chef faces.
  ctx.fillStyle = '#2e2118';
  ctx.beginPath();
  ctx.arc(p.dir * 2 - 3, -13, 1.4, 0, Math.PI * 2);
  ctx.arc(p.dir * 2 + 3, -13, 1.4, 0, Math.PI * 2);
  ctx.fill();
  // Carried item held high overhead.
  if (p.hands) {
    ctx.fillStyle = 'rgba(46,33,24,0.15)';
    ctx.beginPath();
    ctx.ellipse(0, -34, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    if (p.hands.key === 'plate') drawPlate(ctx, 0, -36, state.plate.items, 0.8);
    else drawIngredient(ctx, p.hands.key, 0, -36, 12, p.hands.state);
  }
  ctx.restore();
}

/** Particles (chop bits, coin sparkles) and floating score texts. */
function drawEffects(ctx, state) {
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of state.floats) {
    ctx.globalAlpha = Math.max(0, 1 - f.t / 1.4);
    text(ctx, f.text, f.x, f.y, 17, f.color, 'center', '800');
  }
  ctx.globalAlpha = 1;
}

/** The order board: one ticket per open order, with its countdown bar. */
function drawOrders(ctx, state, t) {
  // Four tickets must still clear the stats cluster on the right.
  const w = state.orders.length >= 4 ? 168 : 196;
  const gap = 10;
  for (let i = 0; i < state.orders.length; i += 1) {
    const order = state.orders[i];
    const x = 14 + i * (w + gap);
    const y = 8;
    const frac = Math.max(0, order.timeLeft / order.total);
    const urgent = order.timeLeft < 12;
    const pulse = urgent ? 0.5 + 0.5 * Math.sin(t * 8) : 0;
    ctx.save();
    if (urgent) ctx.translate(0, pulse * 1.5);
    ctx.fillStyle = urgent ? '#ffe1d6' : '#fff8e7';
    roundRect(ctx, x, y, w, 56, 9);
    ctx.fill();
    ctx.strokeStyle = urgent ? '#e8452c' : '#d9b878';
    ctx.lineWidth = urgent ? 2.5 : 1.5;
    ctx.stroke();
    text(ctx, `#${order.id} ${order.recipe.name}`, x + 10, y + 13, 12, PALETTE.ink, 'left', '800');
    // Mini ingredient icons for the recipe.
    order.recipe.items.forEach((key, j) => {
      drawIngredient(ctx, key, x + 18 + j * 26, y + 32, 10, 'ready');
    });
    text(ctx, `$${order.recipe.price}`, x + w - 10, y + 32, 12, '#8a5a33', 'right', '800');
    // Countdown bar.
    ctx.fillStyle = 'rgba(46,33,24,0.18)';
    roundRect(ctx, x + 10, y + 46, w - 20, 6, 3);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#7ac74f' : frac > 0.25 ? '#f7c948' : '#e8452c';
    roundRect(ctx, x + 10, y + 46, (w - 20) * frac, 6, 3);
    ctx.fill();
    text(ctx, `${Math.ceil(order.timeLeft)}s`, x + w - 10, y + 13, 11, urgent ? '#e8452c' : '#8a5a33', 'right', '800');
    ctx.restore();
  }
  if (state.orders.length === 0) {
    ctx.fillStyle = 'rgba(255,248,231,0.75)';
    roundRect(ctx, 14, 8, 196, 56, 9);
    ctx.fill();
    text(ctx, 'No orders yet —', 24, 28, 12, '#8a5a33', 'left', '700');
    text(ctx, 'the lunch crowd is coming!', 24, 46, 12, '#8a5a33', 'left', '700');
  }
}

/** Top-right cluster: coins, combo, shift clock and lives, kept apart. */
function drawStats(ctx, state, t) {
  const right = VIEW.width - 14;
  // Row 1: hearts, then the clock, then the coins — each in its own slot.
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = i < state.lives ? '#e8452c' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(right - 218 + i * 18, 22, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  const mm = Math.floor(state.left / 60);
  const ss = String(Math.floor(state.left % 60)).padStart(2, '0');
  const lowTime = state.left <= 30;
  text(ctx, `${mm}:${ss}`, right - 96, 22, 20, lowTime ? '#e8452c' : PALETTE.cream, 'right', '800');
  text(ctx, `🪙 ${state.coins}`, right, 22, 20, '#f7c948', 'right', '800');
  if (state.combo >= 2) {
    const pop = 1 + 0.08 * Math.sin(t * 6);
    ctx.save();
    ctx.translate(right, 44);
    ctx.scale(pop, pop);
    text(ctx, `COMBO x${state.combo}`, 0, 0, 14, '#e8452c', 'right', '800');
    ctx.restore();
  }
  // Shift progress bar under the clock.
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  roundRect(ctx, VIEW.width - 220, 40, 206, 5, 2.5);
  ctx.fill();
  ctx.fillStyle = '#f7c948';
  roundRect(ctx, VIEW.width - 220, 40, 206 * (1 - state.left / 180), 5, 2.5);
  ctx.fill();
}

/** Context hint at the bottom: what E does right now, and what is carried. */
function drawHint(ctx, state, hint) {
  const p = state.player;
  let line = hint || '';
  if (!line && p.hands) {
    line = p.hands.key === 'plate'
      ? 'Carrying the plate — take it to the Serving Window'
      : `Carrying: ${p.hands.state === 'raw' ? 'raw ' : ''}${p.hands.key}`;
  }
  if (!line) line = 'WASD / arrows to move · E to interact · click a station to walk there';
  ctx.fillStyle = 'rgba(46,33,24,0.72)';
  roundRect(ctx, 14, VIEW.height - 30, VIEW.width - 28, 22, 11);
  ctx.fill();
  text(ctx, line, VIEW.width / 2, VIEW.height - 19, 12, '#fff8e7', 'center', '600');
  if (state.rush) {
    text(ctx, '★ RUSH HOUR ★', VIEW.width / 2, HUD_HEIGHT + 92, 22, '#e8452c', 'center', '800');
  }
  if (state.banner) {
    ctx.globalAlpha = Math.max(0, 1 - state.banner.t / 2.2);
    text(ctx, state.banner.text, VIEW.width / 2, 200, 30, '#e8452c', 'center', '800');
    ctx.globalAlpha = 1;
  }
}

/** Title screen: the diner's name, the menu, the controls. */
function drawTitle(ctx, state, t) {
  ctx.fillStyle = 'rgba(46,33,24,0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#fff8e7';
  roundRect(ctx, 180, 90, 600, 380, 20);
  ctx.fill();
  ctx.strokeStyle = '#d9b878';
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, 'SIZZLE & SERVE', 480, 150, 44, '#e8452c', 'center', '800');
  text(ctx, '— Ember & Thyme Diner —', 480, 190, 16, '#8a5a33', 'center', '700');
  const menu = [
    'Take ingredients from the Pantry',
    'Chop them on the board · cook patties on the Stove',
    'Build each dish on the Plating Counter',
    'Serve it at the Window before the ticket runs out',
  ];
  menu.forEach((line, i) => text(ctx, line, 480, 232 + i * 26, 15, PALETTE.ink, 'center', '600'));
  text(ctx, 'WASD / arrows — move      E — interact      Click — walk & use', 480, 360, 13, '#8a5a33', 'center', '700');
  text(ctx, 'P — pause      M — mute      R — restart', 480, 384, 13, '#8a5a33', 'center', '700');
  const blink = 0.6 + 0.4 * Math.sin(t * 4);
  ctx.globalAlpha = blink;
  text(ctx, '▶  PRESS ENTER OR CLICK TO START  ◀', 480, 432, 18, '#e8452c', 'center', '800');
  ctx.globalAlpha = 1;
  // A tiny preview plate under the title card.
  drawPlate(ctx, 480, 500, [{ key: 'bun', state: 'ready' }, { key: 'patty', state: 'cooked' }, { key: 'lettuce', state: 'chopped' }, { key: 'tomato', state: 'chopped' }], 1);
}

/** End-of-shift screen: coins, dishes, best combo, rank, restart. */
function drawOver(ctx, state) {
  ctx.fillStyle = 'rgba(46,33,24,0.6)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#fff8e7';
  roundRect(ctx, 230, 100, 500, 360, 20);
  ctx.fill();
  ctx.strokeStyle = '#d9b878';
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, state.overReason || 'Shift complete!', 480, 150, 26, '#e8452c', 'center', '800');
  text(ctx, `RANK ${rankFor(state)}`, 480, 210, 44, '#f7c948', 'center', '800');
  const rows = [
    ['Coins earned', `${state.coins}`],
    ['Dishes served', `${state.served}`],
    ['Best combo', `x${state.bestCombo}`],
    ['Orders expired', `${state.expired}`],
    ['Wrong plates', `${state.wrong}`],
  ];
  rows.forEach(([label, value], i) => {
    text(ctx, label, 300, 258 + i * 30, 16, PALETTE.ink, 'left', '600');
    text(ctx, value, 660, 258 + i * 30, 16, PALETTE.ink, 'right', '800');
  });
  text(ctx, 'Press R or click to cook again', 480, 430, 15, '#8a5a33', 'center', '700');
}

/** The one entry point: draw the whole frame for this state. */
export function render(ctx, state, t, hint) {
  ctx.save();
  if (state.shake > 0) {
    const s = state.shake * 8;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }
  // Dark HUD band behind the order board.
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, 0, VIEW.width, HUD_HEIGHT);
  drawRoom(ctx);
  for (const station of STATIONS) drawCounter(ctx, station, state, t);
  drawPlayer(ctx, state, t);
  drawEffects(ctx, state);
  if (state.screen === 'play') {
    drawOrders(ctx, state, t);
    drawStats(ctx, state, t);
    drawHint(ctx, state, hint);
  }
  if (state.screen === 'title') drawTitle(ctx, state, t);
  if (state.screen === 'over') {
    drawOrders(ctx, state, t);
    drawStats(ctx, state, t);
    drawOver(ctx, state);
  }
  ctx.restore();
}
