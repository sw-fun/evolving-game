// The music: the page plays what the program's picture says, and
// decides nothing. A picture's metadata id="music" says what to play
// (lib/Music) and how loud (lib/Mode: the sound strip's level):
//   music('set', 'calm-A calm-B calm-80bpm-A ... explore-C ...')
//   bridge('release', 14.25, 2.25, 11.25)   (only when the set changes)
//   seconds('calm', 26.666667, 8)
//   seconds('calm-80bpm', 24.0, 8)
//   volume(0.6)
// The plan's phrases (music/VERSION-PHRASE.ogg; a version is a set or
// one of its tempos) play back to back, each for exactly the seconds
// its version's line gives (in that many bars), scheduled on the audio
// clock so they join without a gap, round and round. A new plan with
// a bridge changes fast: at the playing phrase's next bar line it
// fades out (0.75 s) while the bridge (music/bridge-NAME.ogg) starts,
// its lead-in swelling over the fade; at the bridge's handoff the new
// plan's first phrase comes in (a 0.3 s fade-in), the bridge's tail
// ringing under it. A new plan without one starts where the phrase
// playing ends. A new volume alone is a short ramp. Browsers let sound
// start only after a key or a click: the first one starts it. A phrase
// that cannot be fetched or decoded (a browser without Opus) is
// silence, and nothing is said.

const AHEAD = 2;    // seconds before a phrase ends that the next is scheduled
const FADE = 0.75;  // the fade out at a bridge
const FADE_IN = 0.3;

export function music() {
  let ctx = null, gain = null;
  let line = '';      // the last metadata seen
  let want = null;    // the plan it says
  let volume = 0;     // and how loud
  let now = null;     // the plan playing
  let index = 0;      // its next phrase
  let next = 0;       // when that phrase starts, on the audio clock
  let bridged = { name: '', at: 0 };  // the last bridge played, for tests
  const sounding = [];  // the phrases scheduled: { source, level, start, end, bar }
  const buffers = new Map();

  const parse = (text) => {
    const m = /music\('([^']*)', '([^']*)'\)/.exec(text);
    if (!m) return null;
    const seconds = {}, bars = {};
    for (const [, v, s, b] of text.matchAll(/seconds\('([^']*)', ([\d.]+)(?:, (\d+))?\)/g)) { seconds[v] = +s; bars[v] = +(b || 8); }
    const b = /bridge\('([^']*)', ([\d.]+), ([\d.]+), ([\d.]+)\)/.exec(text);
    const plan = m[2].split(' ');
    const version = (t) => t.replace(/-[^-]*$/, '');
    return {
      set: m[1], plan, key: `${m[1]} ${m[2]}`,
      length: plan.map((t) => seconds[version(t)] || 0),
      bar: plan.map((t) => (seconds[version(t)] || 0) / (bars[version(t)] || 8)),
      bridge: b && { name: b[1], seconds: +b[2], lead: +b[3], handoff: +b[4] },
    };
  };
  // A sound, fetched and decoded once (null until it is; false if it
  // cannot be).
  const load = (name) => {
    if (!buffers.has(name)) {
      buffers.set(name, null);
      fetch(`music/${name}.ogg`)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.status))))
        .then((b) => ctx.decodeAudioData(b))
        .then((sound) => buffers.set(name, sound), () => buffers.set(name, false));
    }
    return buffers.get(name);
  };
  // Play a sound from a time, for so long, through a level of its own;
  // a phrase is remembered so a bridge can fade it.
  const play = (sound, when, seconds, fadeIn, bar) => {
    const source = ctx.createBufferSource();
    source.buffer = sound;
    const level = ctx.createGain();
    if (fadeIn) { level.gain.setValueAtTime(0, when); level.gain.linearRampToValueAtTime(1, when + fadeIn); }
    source.connect(level);
    level.connect(gain);
    source.start(when, 0, seconds);
    if (bar) sounding.push({ source, level, start: when, end: when + seconds, bar });
  };
  // The fast change: the phrases playing fade out at the next bar line
  // (those not begun are stopped), the bridge starts there, and the new
  // plan's first phrase at its handoff.
  const cross = (plan, bridge, first, t) => {
    const playing = sounding.filter((s) => s.end > t);
    const current = playing.find((s) => s.start <= t) || playing[0];
    const at = current ? current.start + Math.ceil((t - current.start) / current.bar) * current.bar : t;
    for (const s of playing) {
      if (s.start >= at) { s.source.stop(at); continue; }
      s.level.gain.setValueAtTime(1, at);
      s.level.gain.linearRampToValueAtTime(0, at + FADE);
      s.source.stop(at + FADE + 0.05);
    }
    sounding.length = 0;
    play(bridge, at, bridge.duration, 0, 0);
    const seconds = Math.min(plan.length[0] || first.duration, first.duration);
    const start = at + plan.bridge.handoff;
    play(first, start, seconds, FADE_IN, plan.bar[0]);
    now = plan; index = 1 % plan.plan.length; next = start + seconds;
    bridged = { name: plan.bridge.name, at };
  };
  // Schedule the next phrase when the one playing is about to end; a
  // new plan with a bridge, as soon as its sounds are here.
  const tick = () => {
    if (!ctx || !want) return;
    if (!now && volume === 0) return; // silent: nothing to fetch yet
    const t = ctx.currentTime;
    if (now && now.key !== want.key && want.bridge) {
      const bridge = load(`bridge-${want.bridge.name}`), first = load(want.plan[0]);
      for (const p of new Set(want.plan.slice(1, 4))) load(p);
      if (bridge && first) return cross(want, bridge, first, t + 0.05);
      if (bridge !== false && first !== false) return; // not here yet
    }
    if (now && t < next - AHEAD) return;
    const plan = now && now.key === want.key ? now : want;
    const at = plan === now ? index : 0;
    for (const p of new Set(plan.plan.slice(at, at + 4))) load(p);
    const sound = load(plan.plan[at]);
    if (sound === false) return; // cannot be played: silence
    if (!sound) return;          // not here yet: the next tick
    now = plan;
    const when = Math.max(next, t + 0.05);
    const seconds = Math.min(plan.length[at] || sound.duration, sound.duration);
    for (let i = sounding.length - 1; i >= 0; i--) if (sounding[i].end < t) sounding.splice(i, 1);
    play(sound, when, seconds, 0, plan.bar[at] || seconds);
    next = when + seconds;
    index = (at + 1) % plan.plan.length;
  };
  setInterval(tick, 250);

  // Sound starts with the first key or click.
  const wake = () => {
    if (!ctx) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      ctx = new Context();
      gain = ctx.createGain();
      gain.gain.value = volume;
      gain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    tick();
  };
  for (const e of ['keydown', 'pointerdown']) window.addEventListener(e, wake, { capture: true });

  return {
    // The picture shown: its music lines, if they have changed.
    show(svg) {
      const text = (svg.match(/<metadata id="music">([\s\S]*?)<\/metadata>/) || ['', ''])[1];
      if (text === line) return;
      line = text;
      want = parse(text);
      volume = +((/volume\(([\d.]+)\)/.exec(text) || ['', '0'])[1]);
      if (gain) gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.1);
    },
    // For tests: the line, what is playing, and the last bridge played.
    state: () => ({ line, volume, playing: now ? now.set : '', index, running: !!ctx && ctx.state === 'running', bridge: bridged.name, bridgeAt: bridged.at, clock: ctx ? ctx.currentTime : 0 }),
  };
}
