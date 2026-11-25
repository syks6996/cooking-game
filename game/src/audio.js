// Sizzle & Serve — synthesized sound, no audio files.
// Every sound is a small WebAudio patch (oscillator blips and filtered
// noise), built lazily on the first user gesture so the game stays silent
// until it is played. Nothing here loads over the network.
let ctx = null;
let muted = false;

/** The first gesture unlocks the audio context; call it from any input. */
export function unlockAudio() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch (_e) {
    ctx = null;
  }
}

export function setMuted(m) {
  muted = m;
}

/** A short oscillator blip: frequency, seconds, shape, gain. */
function blip(freq, dur, type, gain, when) {
  if (!ctx || muted) return;
  try {
    const t = ctx.currentTime + (when || 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain || 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  } catch (_e) {
    /* sound is decoration; a failure never stops the game */
  }
}

/** A burst of filtered noise, for chops, sizzles and trash. */
function noise(dur, freq, gain, when) {
  if (!ctx || muted) return;
  try {
    const t = ctx.currentTime + (when || 0);
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain || 0.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(ctx.destination);
    src.start(t);
  } catch (_e) {
    /* sound is decoration */
  }
}

/** Named sounds, one line each at the call site. */
export function sfx(name) {
  switch (name) {
    case 'pickup': blip(520, 0.08, 'triangle', 0.1); break;
    case 'place': blip(300, 0.09, 'triangle', 0.11); break;
    case 'chop': noise(0.07, 2400, 0.16); blip(180, 0.05, 'square', 0.05); break;
    case 'done': blip(660, 0.1, 'sine', 0.12); blip(880, 0.12, 'sine', 0.1, 0.08); break;
    case 'sizzle': noise(0.5, 5200, 0.07); break;
    case 'ding': blip(1174, 0.35, 'sine', 0.14); blip(1568, 0.4, 'sine', 0.09, 0.06); break;
    case 'coin': blip(988, 0.07, 'square', 0.06); blip(1319, 0.14, 'square', 0.06, 0.07); break;
    case 'error': blip(160, 0.22, 'sawtooth', 0.09); break;
    case 'trash': noise(0.18, 700, 0.1); break;
    case 'tick': blip(900, 0.04, 'square', 0.04); break;
    case 'start': blip(523, 0.1, 'triangle', 0.1); blip(659, 0.1, 'triangle', 0.1, 0.09); blip(784, 0.18, 'triangle', 0.12, 0.18); break;
    default: break;
  }
}
