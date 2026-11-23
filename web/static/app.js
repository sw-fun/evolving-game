// The page round the game. The game is an X_eTaL program running as
// WebAssembly; this file gives it events and shows what it draws, and
// decides nothing about the game:
//   - twenty times a second, the line "tick 0.05"; a key, "key NAME";
//     a click on the board, "click X Y" in the picture's own units;
//     for a game that holds keys, each key as it goes down and comes
//     up, "choose 2 CODE" and "choose 3 CODE" (the key's number), and
//     how far a locked pointer went since the last tick, "move DX DY".
//     Every game is given all of these; each takes what it knows
//   - which of the page's programs to play: the header's two buttons
//     (the castle first; ?game=walk, ?game=foot or ?game=defense
//     starts with one of its games alone); the Map button gives the
//     loop's own command to leave a game ("choose 0 0"); ?debug gives
//     the castle's map the key D once, which shows every place
//   - after each event, the picture the program showed (SVG). Its
//     metadata is the scene, which the board player of X_eTaL-extensions
//     (ext/board.js, Three.js) draws; the picture's own drawing of the
//     board (class "flat") is hidden then, and is all there is to see
//     where there is no WebGL
//   - what the program printed, in a pane that opens when it ends
//   - the music the picture names (its metadata id="music"), played
//     by music.js as the program says
// What the castle keeps between visits (its world: gold, experience,
// places won, deeds) is a text the program writes; the page stores it
// in the browser, under one name, and gives it back when the program
// starts. New game forgets it. ?fresh neither reads nor stores it.
// ?flat shows the flat picture only. ?sources, ?help and ?about open
// those dialogs. ?hold
// stops the clock (for tests: events are then given by window.game.feed).
import { board } from '../ext/board.js';
import { music } from './music.js';

const TICK = 0.05;
const q = new URLSearchParams(location.search);
// The testing switches (?debug, ?fresh, ?hold) act on this load only:
// they are taken off the address, so a reload starts the game as usual.
{
  const kept = new URLSearchParams(q);
  ['debug', 'fresh', 'hold'].forEach((k) => kept.delete(k));
  const s = kept.toString();
  if (s !== q.toString()) history.replaceState(null, '', location.pathname + (s ? `?${s}` : '') + location.hash);
}
const el = (id) => document.getElementById(id);
const view = el('view'), flat = el('flat'), stat = el('stat');
let wasm = null, player = null, timer = 0, cost = 0, frames = '', eyed = false;
let program = { walk: 'play.xtl', foot: 'explore.xtl', defense: 'defense/play.xtl' }[q.get('game')] || 'castle/play.xtl';
const held = new Set(), look = [0, 0];
const tunes = music();
// the browser's store for the one text the game keeps
const KEPT = 'evolving-game/castle.save';
const store = q.has('fresh') ? null : (() => { try { return window.localStorage; } catch { return null; } })();
let lastKept = '';
// the events given to the program, but the clock's (for tests to read)
const said = [];

// Can this browser draw 3D?
const solid = !q.has('flat') && (() => {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
})();
document.body.classList.toggle('solid', solid);

// The scene a picture carries, or nothing.
const sceneOf = (svg) => (svg.match(/<metadata id="scene">([\s\S]*?)<\/metadata>/) || ['', ''])[1];

// Show what the program last drew, and what it has printed.
function draw() {
  const svg = wasm.picture();
  flat.innerHTML = svg;
  tunes.show(svg);
  const calls = sceneOf(svg);
  // a scene seen through an eye is one the pointer can look round in
  eyed = /^eye\(/m.test(calls);
  // a picture with no scene is one a game drew itself: shown alone
  document.body.classList.toggle('drawn', !calls);
  if (solid && calls) {
    if (player) player.show(calls);
    else player = board(view, calls, { models: './models/', keep: q.has('hold'), onPoint: point, onFrame: (f) => { frames = `${f.rate.toFixed(0)} frames a second`; } });
  }
  const printed = el('printed');
  printed.textContent = wasm.printed();
  printed.scrollTop = printed.scrollHeight;
  stat.textContent = `X_eTaL ${cost.toFixed(1)} ms a tick  ${frames}`;
}

// Give the program an event; when it has ended, stop the clock.
function feed(line, quiet = false) {
  if (!wasm) return;
  if (!line.startsWith('tick ')) said.push(line);
  const before = performance.now();
  const over = wasm.feed(line);
  if (line.startsWith('tick ')) cost = cost ? cost * 0.9 + (performance.now() - before) * 0.1 : performance.now() - before;
  keep();
  if (quiet && !over) return;
  draw();
  if (over) { clearInterval(timer); timer = 0; el('log').open = true; document.body.classList.add('over'); }
}

// Store what the program has kept, when it has changed.
function keep() {
  if (!store) return;
  const kept = wasm.kept();
  if (kept === lastKept) return;
  lastKept = kept;
  try { store.setItem(KEPT, kept); } catch { /* a full or closed store: the game goes on unsaved */ }
}

// A click on the 3D board comes in the picture's units already.
function point(x, y) { feed(`click ${x.toFixed(1)} ${y.toFixed(1)}`); }

// A click on the flat picture: the same units, through the SVG's own map.
// (in 3D, only a picture a game draws itself, and the sound strip every
// picture has: the board takes the rest)
flat.parentElement.addEventListener('click', (e) => {
  if (solid && !document.body.classList.contains('drawn') && !e.target.closest?.('.sound')) return;
  const svg = flat.querySelector('svg');
  if (!svg) return;
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
  point(p.x, p.y);
});

// The board's place can change size without the window changing (the
// header wrapping onto a second line, a pane opening): the player
// measures on the window's resize, so it is told. Otherwise a click
// would be read against the size the board had before.
new ResizeObserver(() => window.dispatchEvent(new Event('resize'))).observe(el('stage'));

// Keys the game may be given; none is a browser's or a system's.
const NAMES = { ' ': 'space', ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', Enter: 'enter', Backspace: 'backspace', '[': '[', ']': ']', ',': ',', '\\': '\\' };
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || talking()) return;
  // Escape leaves any game for the map (the loop's own command)
  if (e.key === 'Escape') { e.preventDefault(); feed('choose 0 0'); return; }
  const name = NAMES[e.key] || (/^[a-z0-9?]$/i.test(e.key) ? e.key.toLowerCase() : '');
  if (!name && e.key !== 'Shift') return;
  e.preventDefault();
  if (name) feed(`key ${name}`, true);
  held.add(e.keyCode);
  feed(`choose 2 ${e.keyCode}`);
});
// A key coming up, for a game that holds keys; and every held key let
// go when the window loses the keyboard, so nothing stays held.
const release = (code) => { if (held.delete(code)) feed(`choose 3 ${code}`); };
window.addEventListener('keyup', (e) => release(e.keyCode));
window.addEventListener('blur', () => [...held].forEach(release));
// Looking round: in a scene seen through an eye, a click takes the
// pointer (Esc gives it back) and its movement is told to the game.
el('stage').addEventListener('click', (e) => { if (eyed && solid && !document.pointerLockElement && !e.target.closest?.('.sound')) el('stage').requestPointerLock?.(); });
document.addEventListener('mousemove', (e) => {
  if (document.pointerLockElement !== el('stage')) return;
  look[0] += e.movementX;
  look[1] += e.movementY;
});
// The clock: what the pointer did since the last tick, then the tick.
function tick() {
  if (document.hidden) return;
  if (look[0] || look[1]) { feed(`move ${look[0]} ${look[1]}`, true); look[0] = 0; look[1] = 0; }
  feed(`tick ${TICK}`);
}

// Start the program from its beginning, and the clock.
function start() {
  clearInterval(timer);
  document.body.classList.remove('over');
  el('log').open = false;
  held.clear();
  if (document.pointerLockElement) document.exitPointerLock();
  for (const b of document.querySelectorAll('.pick button')) b.classList.toggle('on', b.dataset.program === program);
  lastKept = (store && store.getItem(KEPT)) || '';
  wasm.start(program, lastKept);
  named();
  // ?debug goes past the splash and shows every place at once
  // ?debug goes past the splash and the front door (a profile "debug",
  // played as a defender) and shows every place at once
  if (q.has('debug') && program === 'castle/play.xtl') { for (const k of ['space', 'enter', 'd', 'e', 'b', 'u', 'g', 'enter', '1', '5', '1', '1', '3', 'd']) wasm.feed(`key ${k}`); }
  draw();
  if (!q.has('hold')) timer = setInterval(tick, TICK * 1000);
}
el('again').addEventListener('click', (e) => { e.currentTarget.blur(); start(); });
el('forget').addEventListener('click', (e) => { e.currentTarget.blur(); if (store) store.removeItem(KEPT); start(); });
el('leave').addEventListener('click', (e) => { e.currentTarget.blur(); feed('choose 0 0'); });
for (const b of document.querySelectorAll('.pick button')) b.addEventListener('click', () => { b.blur(); program = b.dataset.program; start(); });

// The game's sources in a dialog: each file drawn by X_eTaL itself
// (decorated, a span a token), colored by the page's stylesheet, in
// JuliaMono. The font is the one thing the page takes from another
// site (a CDN, as the X_eTaL live demos do; nothing is redistributed),
// and only when the sources are first opened: the game itself asks
// nothing of anyone, and without the font the sources are drawn in the
// machine's own monospace.
const FONT = 'https://cdnjs.cloudflare.com/ajax/libs/juliamono/0.63.2/JuliaMono-Regular.woff2';
function font() {
  if (document.getElementById('juliamono')) return;
  const style = document.createElement('style');
  style.id = 'juliamono';
  style.textContent = `@font-face { font-family: JuliaMono; src: url("${FONT}") format("woff2"); font-weight: 400; font-style: normal; font-display: swap; }`;
  document.head.append(style);
}
function sources() {
  const files = el('files'), source = el('source');
  font();
  if (!files.children.length) {
    for (const name of wasm.sources().split('\n')) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = name;
      b.addEventListener('click', () => {
        for (const o of files.children) o.classList.toggle('on', o === b);
        source.innerHTML = wasm.rendered(name);
        source.scrollTop = 0;
      });
      files.append(b);
    }
    // the game's own program first
    ([...files.children].find((b) => b.textContent === 'play.xtl') || files.firstChild).click();
  }
  el('sources').showModal();
}
el('open-sources').addEventListener('click', (e) => { e.currentTarget.blur(); sources(); });

// Help: how to play, as the game says it (the mode's help), a
// paragraph a line. About: what this is; its build facts are the
// page's own.
function help() {
  const into = el('help-text');
  into.replaceChildren(...wasm.help(program).split('\n').map((line) => Object.assign(document.createElement('p'), { textContent: line })));
  el('help').showModal();
}
el('open-help').addEventListener('click', (e) => { e.currentTarget.blur(); help(); });
el('open-about').addEventListener('click', (e) => { e.currentTarget.blur(); el('about').showModal(); });
// With a dialog open the game is not given keys (Escape closes it).
const talking = () => !!document.querySelector('dialog[open]');

// The page's title is the game's, said by X_eTaL for the program played.
function named() {
  const title = wasm.title(program);
  el('title').textContent = title;
  el('about-title').textContent = title;
  document.title = `${title}: ready`;
}
const ready = () => {
  wasm = window.wasmBindings;
  el('build').textContent = `Build: ${wasm.build()}`;
  el('about-build').textContent = wasm.build();
  el('pins').textContent = wasm.pins().split('\n').join(', ');
  window.game = { feed, start, said: () => said.slice(-20), program: () => program, picture: () => wasm.picture(), printed: () => wasm.printed(), player: () => player, music: () => tunes.state() };
  start();
  if (q.has('sources')) sources();
  if (q.has('help')) help();
  if (q.has('about')) el('about').showModal();
};
if (window.wasmBindings) ready(); else window.addEventListener('TrunkApplicationStarted', ready, { once: true });
window.addEventListener('error', (e) => { el('err').textContent = String(e.message || e); });
