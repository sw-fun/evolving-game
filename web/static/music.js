// The music: the page plays what the program's picture says, and
// decides nothing. A picture's metadata id="music" is a line of
// lib/Music:
//   music('set', volume, seconds, 'A A B B B C D ...')
// The plan's phrases (music/SET-PHRASE.ogg) play back to back, each
// for exactly the seconds the line gives, scheduled on the audio clock
// so they join without a gap, round and round. A new plan (another
// set, or the set's next plan) starts where the phrase playing ends,
// from its first phrase. A new volume alone is a short ramp. Browsers
// let sound start only after a key or a click: the first one starts it.
// A phrase that cannot be fetched or decoded (a browser without Opus)
// is silence, and nothing is said.

const AHEAD = 2; // seconds before a phrase ends that the next is scheduled

export function music() {
  let ctx = null, gain = null;
  let line = '';      // the last line seen
  let want = null;    // the plan it says
  let now = null;     // the plan playing
  let index = 0;      // its next phrase
  let next = 0;       // when that phrase starts, on the audio clock
  const buffers = new Map();

  const parse = (text) => {
    const m = /music\('([^']*)', ([\d.]+), ([\d.]+), '([^']*)'\)/.exec(text);
    return m && { set: m[1], volume: +m[2], seconds: +m[3], plan: m[4].split(' '), key: `${m[1]} ${m[4]}` };
  };
  // A phrase's sound, fetched and decoded once (null if it cannot be).
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
  // Schedule the next phrase when the one playing is about to end.
  const tick = () => {
    if (!ctx || !want) return;
    if (!now && want.volume === 0) return; // silent: nothing to fetch yet
    const t = ctx.currentTime;
    if (now && t < next - AHEAD) return;
    const plan = now && now.key === want.key ? now : want;
    const at = plan === now ? index : 0;
    for (const p of new Set(plan.plan)) load(`${plan.set}-${p}`);
    const sound = load(`${plan.set}-${plan.plan[at]}`);
    if (sound === false) return; // cannot be played: silence
    if (!sound) return;          // not here yet: the next tick
    if (plan !== now) { now = plan; }
    const when = Math.max(next, t + 0.05);
    const source = ctx.createBufferSource();
    source.buffer = sound;
    source.connect(gain);
    const seconds = Math.min(plan.seconds, sound.duration);
    source.start(when, 0, seconds);
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
      gain.gain.value = want ? want.volume : 0;
      gain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    tick();
  };
  for (const e of ['keydown', 'pointerdown']) window.addEventListener(e, wake, { capture: true });

  return {
    // The picture shown: its music line, if it has changed.
    show(svg) {
      const text = (svg.match(/<metadata id="music">([\s\S]*?)<\/metadata>/) || ['', ''])[1];
      if (text === line) return;
      line = text;
      want = parse(text);
      if (gain) gain.gain.setTargetAtTime(want ? want.volume : 0, ctx.currentTime, 0.1);
    },
    // For tests: the line, and what is playing.
    state: () => ({ line, playing: now ? now.set : '', index, running: !!ctx && ctx.state === 'running' }),
  };
}
