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
// starts. Starting over is the game's own (a profile's home: Start
// over), never the page's. ?fresh neither reads nor stores it.
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
// the WebAssembly's memory, for the debug panel, when its start is seen
let wasmMemory = null;
let program = { walk: 'play.xtl', foot: 'explore.xtl', defense: 'defense/play.xtl' }[q.get('game')] || 'castle/play.xtl';
const held = new Set(), look = [0, 0];
const tunes = music();
// the browser's store for the one text the game keeps
const KEPT = 'evolving-game/castle.save';
const store = q.has('fresh') ? null : (() => { try { return window.localStorage; } catch { return null; } })();
let lastKept = '';
// the events given to the program, but the clock's (for tests to read)
const said = [];
// The watchdog's notes: every event given since the program started
// (a run of the same tick as one entry, with its count), what the save
// was then, how long the program took, and what stopped it. A program
// that stops (an error, or a trap in the WebAssembly) or no longer
// answers keys is told on the stage, with a way back: the save is
// played again from its start.
const WATCH = { log: [], kept: '', started: 0, events: 0, ticks: 0, last: '', lastAt: 0, slowest: 0, slowLine: '', fault: '', unanswered: 0, broken: false };
const REPORT = 'evolving-game/last-report';

// Can this browser draw 3D?
const solid = !q.has('flat') && (() => {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
})();
document.body.classList.toggle('solid', solid);

// The scene a picture carries, or nothing.
const sceneOf = (svg) => (svg.match(/<metadata id="scene">([\s\S]*?)<\/metadata>/) || ['', ''])[1];

let shown = '';
// Show what the program last drew, and what it has printed.
function draw() {
  const svg = wasm.picture();
  // only when it changed: a picture swapped under a pressed button eats
  // the click (the press and the release land on different elements)
  if (svg !== shown) { flat.innerHTML = svg; shown = svg; WATCH.unanswered = 0; if (!WATCH.fault) banner.hidden = true; }
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
  if (!wasm || WATCH.broken) return;
  const ticked = line.startsWith('tick ');
  if (!ticked) said.push(line);
  logged(line);
  const before = performance.now();
  let over;
  try { over = wasm.feed(line); } catch (e) { stopped(`the WebAssembly stopped: ${safe(() => wasm.stopped()) || e.message || e}`, line); return; }
  const took = performance.now() - before;
  if (ticked) cost = cost ? cost * 0.9 + took * 0.1 : took;
  if (took > WATCH.slowest) { WATCH.slowest = took; WATCH.slowLine = line; }
  keep();
  if (quiet && !over) return;
  draw();
  if (over) { clearInterval(timer); timer = 0; el('log').open = true; document.body.classList.add('over'); ended(line); }
}

// What a call gives, or nothing when it throws (a stopped WebAssembly).
function safe(f) { try { return f(); } catch { return ''; } }

// An event into the watchdog's log.
function logged(line) {
  const ticked = line.startsWith('tick ');
  if (ticked) WATCH.ticks += 1; else { WATCH.events += 1; WATCH.last = line; WATCH.lastAt = performance.now(); }
  const end = WATCH.log[WATCH.log.length - 1];
  if (ticked && end && end[0] === line) end[1] += 1; else WATCH.log.push([line, 1]);
  if (WATCH.log.length > 50000) WATCH.log.splice(0, 10000);
}

// The program has ended: the walk's own programs end when the walk is
// done (they have no menu), the castle's only on an error. Either way
// the stage says so, and Esc goes to the castle's menu.
function ended(line) {
  const error = safe(() => wasm.stopped());
  if (error) { stopped(`the program stopped on an error: ${error}`, line); return; }
  WATCH.fault = `ended (after "${line}")`;
  stuck('This game is over: it has no menu of its own.', 'Esc or ~ goes to the castle\'s menu (your progress is kept).');
}

// The program has stopped: say so on the stage, keep the report (it
// outlives a reload), and stop the clock.
function stopped(why, line) {
  WATCH.fault = `${why} (after "${line}")`;
  WATCH.broken = !why.startsWith('the program stopped on an error');
  clearInterval(timer); timer = 0;
  stuck(`The game stopped: ${WATCH.fault}.`, 'Esc or ~ starts the castle again from your save (your progress is kept). Save report keeps what happened, for a bug report.');
  try { localStorage.setItem(REPORT, report()); } catch { /* too big or no store: only the panel has it */ }
}

// The banner on the stage, with the way back; nothing hides it.
const banner = document.createElement('div');
banner.id = 'stuck';
banner.hidden = true;
el('stage').appendChild(banner);
function stuck(what, how = 'Esc or ~ starts the castle again from your save (your progress is kept).') {
  banner.replaceChildren(
    Object.assign(document.createElement('p'), { textContent: what }),
    Object.assign(document.createElement('p'), { textContent: how }),
  );
  const again = Object.assign(document.createElement('button'), { type: 'button', textContent: 'To the castle (~)' });
  again.addEventListener('click', (e) => { e.currentTarget.blur(); recover(); });
  const save = Object.assign(document.createElement('button'), { type: 'button', textContent: 'Save report' });
  save.addEventListener('click', (e) => { e.currentTarget.blur(); download(); });
  banner.append(again, save);
  banner.hidden = false;
}

// Back to playing: the castle started again from the save, at its
// menu; when the WebAssembly itself is broken (it trapped), the page
// loaded again, which keeps the save too.
function recover() {
  if (WATCH.fault && !WATCH.fault.startsWith('ended')) { try { localStorage.setItem(REPORT, report()); } catch { /* only the panel has it */ } }
  WATCH.broken = false;
  program = 'castle/play.xtl';
  try { start(); } catch { location.reload(); }
}

// What happened, as a text: the panel, the stop, what was printed, the
// save the program started from and every event since (a tick a line,
// as at the command line: the same events give the same game).
function report() {
  const events = WATCH.log.flatMap(([line, n]) => Array(n).fill(line));
  return [
    'Evolving Game: a debug report',
    `when     ${new Date().toISOString()}`,
    `page     ${location.href}`,
    `browser  ${navigator.userAgent}`,
    `build    ${safe(() => wasm.build())}`,
    debugText(),
    '--- printed (the end)', safe(() => wasm.printed()).slice(-4000),
    '--- the save it started from', WATCH.kept,
    `--- the events since (${events.length})`, ...events, '',
  ].join('\n');
}
function download() {
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([report()], { type: 'text/plain' })), download: 'evolving-game-report.txt' });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
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
function pictured(e) {
  answered('click');
  const svg = flat.querySelector('svg');
  if (!svg) return;
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
  point(p.x, p.y);
}
flat.parentElement.addEventListener('click', (e) => {
  if (e.target.closest?.('.sound')) return;
  if (solid && !document.body.classList.contains('drawn')) return;
  pictured(e);
});
// The sound strip is taken on the press: the picture is drawn again every
// tick, and a click whose press and release land on two drawings of it is
// never a click at all.
flat.parentElement.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || !e.target.closest?.('.sound')) return;
  e.preventDefault();
  pictured(e);
});

// The board's place can change size without the window changing (the
// header wrapping onto a second line, a pane opening): the player
// measures on the window's resize, so it is told. Otherwise a click
// would be read against the size the board had before.
new ResizeObserver(() => window.dispatchEvent(new Event('resize'))).observe(el('stage'));

// The debug panel: what the program says it is playing (the status line
// in its picture's music metadata: the mode, the place, the profile) and
// what the music player is sounding. Off unless asked for; remembered.
const DEBUG = 'evolving-game/debug-panel';
let debugOn = false;
const debugBox = document.createElement('pre');
debugBox.id = 'debug';
debugBox.hidden = true;
el('stage').appendChild(debugBox);
function debugText() {
  const meta = (flat.querySelector('svg metadata#music') || {}).textContent || '';
  const [, kind = '', place = '', who = ''] = /status\('([^']*)', '([^']*)', '([^']*)'\)/.exec(meta) || [];
  const m = tunes.state();
  const p = m.phrase;
  const bridge = /bridge\('([^']*)'/.exec(meta);
  return [
    `program  ${program}`,
    `mode     ${kind || '-'}`,
    `place    ${place || '-'}`,
    `profile  ${who || '-'}`,
    `music    ${(/music\('([^']*)'/.exec(meta) || ['', '-'])[1]}${m.running ? '' : ' (waits for a key or click)'}`,
    `phrase   ${p ? `${p.name}  ${p.step} of ${p.steps}  ${p.into.toFixed(1)} of ${p.seconds.toFixed(1)} s` : '-'}`,
    `bridge   ${bridge ? bridge[1] : '-'}${m.bridge && m.bridgeAt > (m.clock - 20) ? `  (played ${(m.clock - m.bridgeAt).toFixed(1)} s ago)` : ''}`,
    `volume   ${m.volume}`,
    `engine   ${WATCH.fault ? `stopped: ${WATCH.fault}` : 'running'}`,
    `events   ${WATCH.events} keys and clicks, ${WATCH.ticks} ticks${WATCH.last ? `; last "${WATCH.last}" ${((performance.now() - WATCH.lastAt) / 1000).toFixed(1)} s ago` : ''}`,
    `unheard  ${WATCH.unanswered} keys or clicks in a row that changed nothing`,
    `tick     ${cost.toFixed(1)} ms; slowest event ${WATCH.slowest.toFixed(0)} ms ("${WATCH.slowLine}")`,
    `clock    ${timer ? 'running' : 'stopped'}${document.hidden ? ', page hidden' : ''}; up ${((performance.now() - WATCH.started) / 1000).toFixed(0)} s`,
    `memory   wasm ${wasmMemory ? (wasmMemory.buffer.byteLength / 1048576).toFixed(0) : '-'} MB${performance.memory ? `, js ${(performance.memory.usedJSHeapSize / 1048576).toFixed(0)} MB` : ''}`,
    `earlier  ${(() => { try { return (/engine   stopped: (.*)/.exec(localStorage.getItem(REPORT) || '') || ['', '-'])[1]; } catch { return '-'; } })()}`,
  ].join('\n');
}
function debugPanel(on) {
  debugOn = on;
  debugBox.hidden = !on;
  debugTools.hidden = !on;
  el('open-debug').classList.toggle('on', on);
  try { localStorage.setItem(DEBUG, on ? '1' : ''); } catch { /* no store: not kept */ }
  if (on) debugBox.textContent = debugText();
}
// The panel's buttons: the report, saved as a file.
const debugTools = Object.assign(document.createElement('div'), { id: 'debug-tools', hidden: true });
const saveReport = Object.assign(document.createElement('button'), { type: 'button', textContent: 'Save report' });
saveReport.addEventListener('click', (e) => { e.currentTarget.blur(); download(); });
debugTools.append(saveReport);
el('stage').appendChild(debugTools);
setInterval(() => { if (debugOn) debugBox.textContent = debugText(); }, 250);
el('open-debug').addEventListener('click', (e) => { e.currentTarget.blur(); debugPanel(!debugOn); });
try { if (localStorage.getItem(DEBUG)) debugPanel(true); } catch { /* no store */ }

// Keys the game may be given; none is a browser's or a system's.
const NAMES = { ' ': 'space', ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', Enter: 'enter', Backspace: 'backspace', '[': '[', ']': ']', ',': ',', '\\': '\\' };
window.addEventListener('keydown', (e) => {
  // ~ always starts the game again from its save: the page's own key,
  // answered however stuck the game is
  if (e.key === '~' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); recover(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || talking()) return;
  // a stopped game: Esc is the way back
  if (e.key === 'Escape' && (WATCH.broken || document.body.classList.contains('over'))) { e.preventDefault(); recover(); return; }
  answered(e.key);
  // ` shows or hides the debug panel (the page's own: never the game's)
  if (e.key === '`') { e.preventDefault(); debugPanel(!debugOn); return; }
  // Escape leaves any game for the map (the loop's own command)
  if (e.key === 'Escape') { e.preventDefault(); feed('choose 0 0'); return; }
  const name = NAMES[e.key] || (/^[a-z0-9?]$/i.test(e.key) ? e.key.toLowerCase() : '');
  if (!name && e.key !== 'Shift') return;
  e.preventDefault();
  if (name) feed(`key ${name}`, true);
  held.add(e.keyCode);
  feed(`choose 2 ${e.keyCode}`);
});
// Keys the game does not answer: the picture unchanged after eight
// keys or clicks in a row (a menu answers every key it knows) is told
// on the stage. Counted before the key is given; draw() clears it.
function answered(key) {
  if (key === 'Shift' || key === '`') return;
  WATCH.unanswered += 1;
  if (WATCH.unanswered >= 9 && banner.hidden) stuck(`The game has not answered the last ${WATCH.unanswered - 1} keys or clicks (last "${WATCH.last}"). Stuck?`);
}

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
  banner.hidden = true;
  Object.assign(WATCH, { log: [], started: performance.now(), events: 0, ticks: 0, last: '', slowest: 0, slowLine: '', fault: '', unanswered: 0, broken: false });
  if (document.pointerLockElement) document.exitPointerLock();
  for (const b of document.querySelectorAll('.pick button')) b.classList.toggle('on', b.dataset.program === program);
  lastKept = (store && store.getItem(KEPT)) || '';
  WATCH.kept = lastKept;
  wasm.start(program, lastKept);
  named();
  // ?debug goes past the splash and shows every place at once
  // ?debug goes past the splash and the front door (a profile "debug",
  // played as a defender) and shows every place at once
  if (q.has('debug') && program === 'castle/play.xtl') { for (const k of ['space', 'enter', 'd', 'e', 'b', 'u', 'g', 'enter', '1', '5', '1', '1', '3', 'd']) { logged(`key ${k}`); wasm.feed(`key ${k}`); } }
  draw();
  if (!q.has('hold')) timer = setInterval(tick, TICK * 1000);
}
el('again').addEventListener('click', (e) => { e.currentTarget.blur(); start(); });
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
  window.game = { feed, start, said: () => said.slice(-20), program: () => program, picture: () => wasm.picture(), printed: () => wasm.printed(), player: () => player, music: () => tunes.state(), debug: () => (debugOn ? debugBox.textContent : ''), recover, report, stuck: () => (banner.hidden ? '' : banner.textContent) };
  start();
  if (q.has('sources')) sources();
  if (q.has('help')) help();
  if (q.has('about')) el('about').showModal();
};
if (window.wasmBindings) ready(); else window.addEventListener('TrunkApplicationStarted', (e) => { wasmMemory = e.detail?.wasm?.memory || null; ready(); }, { once: true });
window.addEventListener('error', (e) => { el('err').textContent = String(e.message || e); });
