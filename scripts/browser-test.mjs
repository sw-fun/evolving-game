#!/usr/bin/env node
// Test the built page (web/dist; run scripts/web.sh first) in headless
// Chrome, over the DevTools protocol with Node's own WebSocket (no
// packages): the page starts and says so; the scene is drawn in 3D by
// the board player (a canvas: terrain, water, light, the built tiles,
// the walker); ticks move the
// walker; a real click on the bridge reaches the program, which names
// the tile; a real space bar stops the walker; the flat picture alone
// (?flat) takes the same click; nothing is asked of another site; the
// page fits its window at three sizes; the footer is one line naming
// the build; Help says how to play in the game's words; About says what
// this is and names the four pins; the Sources dialog shows the game's own files as
// X_eTaL renders them, colored, in JuliaMono (the font is the one thing
// taken from another site, and only then). Then a
// screen capture of the walker on the bridge is written to
// images/screencapture.png.
//   scripts/browser-test.mjs [--no-capture] [--dir pages] [--url https://...] [--look NAME]
// --look NAME writes the capture to images/look/NAME.png instead (the
// look's before and after pictures, docs/look.md).
// --dir tests another built directory (pages/, as it will be served);
// --url a deployed site instead (no local server).
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { existsSync, mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : null; };
const dist = join(root, arg("--dir") || "web/dist");
const live = arg("--url") ? arg("--url").replace(/\/?$/, "/") : null;
if (!live && !existsSync(join(dist, "index.html"))) { console.error(`browser-test: no ${dist} (just web, or just pages)`); process.exit(1); }
const chrome = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const capture = !process.argv.includes("--no-capture") && !arg("--url");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const freePort = () => new Promise((r) => { const s = createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => r(p)); }); });
const webPort = await freePort(), cdpPort = await freePort();
// Served under a path, as GitHub Pages serves it: the site must not
// assume it is at the root.
const base = live || `http://127.0.0.1:${webPort}/evolving-game/`;
const served = mkdtempSync(join(tmpdir(), "evolving-game-site-"));
if (!live) (await import("node:fs")).symlinkSync(dist, join(served, "evolving-game"));
const server = live ? { kill() {} } : spawn(join(root, ".venv/bin/python"), ["-m", "http.server", String(webPort), "--bind", "127.0.0.1", "--directory", served], { stdio: "ignore" });
const profile = mkdtempSync(join(tmpdir(), "evolving-game-chrome-"));
const browser = spawn(chrome, ["--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--hide-scrollbars",
  `--remote-debugging-port=${cdpPort}`, `--user-data-dir=${profile}`, "--window-size=1280,800", "about:blank"], { stdio: "ignore" });
let failed = 0;
const done = async (code) => {
  server.kill();
  const exited = new Promise((r) => browser.once("exit", r));
  browser.kill();
  await exited;
  // Chrome may still be writing its profile as it goes: try again, and
  // a temporary directory left behind is not a failed test
  for (const dir of [profile, served]) {
    try { rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { /* left for the system to clear */ }
  }
  process.exit(code);
};
const check = (ok, what) => { console.log(`${ok ? "ok" : "FAIL"}: ${what}`); if (!ok) failed += 1; };

// The DevTools connection to the page.
let target = null;
for (let i = 0; i < 100 && !target; i++) {
  await sleep(100);
  try { target = (await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json()).find((t) => t.type === "page"); } catch { /* not up yet */ }
}
if (!target) { console.error("browser-test: Chrome did not start"); await done(1); }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let next = 0;
const waiting = new Map(), asked = [];
ws.addEventListener("message", (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && waiting.has(msg.id)) { waiting.get(msg.id)(msg.result || msg); waiting.delete(msg.id); }
  if (msg.method === "Network.requestWillBeSent") asked.push(msg.params.request.url);
});
const send = (method, params = {}) => new Promise((r) => { const id = ++next; waiting.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
const page = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.value;
const until = async (expression, ms = 20000) => {
  for (let t = 0; t < ms; t += 100) { if (await page(expression)) return true; await sleep(100); }
  return false;
};
const open = async (query) => {
  await send("Page.navigate", { url: base + query });
  const ready = await until("document.title.endsWith(': ready')");
  // the castle opens with its splash and then the front door: any key
  // goes on, and a profile "test" (made, or chosen if it is there) plays
  // as a defender (both checked once, below)
  if (ready && await page("!!document.querySelector('#flat svg#splash')")) await page("window.game.feed('key space'), 1");
  if (ready && await page("!!document.querySelector('#flat svg#front')")) await enter();
  return ready;
};
// Through the front door as the profile "debug" (which plays on the
// map of every venue), a Soldier, defending at Normal: made new, or
// chosen when the save has it.
const enter = async () => {
  const fresh = !(await page("document.querySelector('#flat svg').textContent")).includes("Debug: ");
  const keys = fresh ? ["enter", "d", "e", "b", "u", "g", "enter", "1", "5", "1", "1", "3"] : ["1", "1", "1", "3"];
  for (const k of keys) await page(`window.game.feed('key ${k}'), 1`);
};
const key = async (type, k, code, n) => send("Input.dispatchKeyEvent", { type, key: k, code, windowsVirtualKeyCode: n, nativeVirtualKeyCode: n });
// The caption the program wrote in its picture.
// (the picture's other words, labels over its pieces, are centered: text-anchor)
const caption = () => page("[...document.querySelectorAll('#flat svg text:not([text-anchor])')].map((x) => x.textContent).join(' ')");
// Where a point of the picture is in the window (the picture is fitted
// whole into the stage, about its middle).
const where = (x, y) => page(`(() => {
  const r = document.getElementById('stage').getBoundingClientRect();
  const [w, h] = document.querySelector('#flat svg').getAttribute('viewBox').split(' ').slice(2).map(Number);
  const fit = Math.min(r.width / w, r.height / h);
  return [r.left + r.width / 2 + (${x} - w / 2) * fit, r.top + r.height / 2 + (${y} - h / 2) * fit];
})()`);
const click = async (x, y) => {
  const [cx, cy] = await where(x, y);
  for (const type of ["mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x: cx, y: cy, button: "left", clickCount: 1 });
};
const space = async () => {
  for (const type of ["keyDown", "keyUp"]) await send("Input.dispatchKeyEvent", { type, key: " ", code: "Space", windowsVirtualKeyCode: 32, text: type === "keyDown" ? " " : undefined });
};

await send("Page.enable");
await send("Network.enable");

// 3D, the clock held: events are given here.
check(await open("?hold&game=walk&fresh"), "the page starts and says it is ready");
check((await page("document.title")) === "Evolving Game: Walk: ready", "its title is X_eTaL's (Evolving Game: Walk)");
check(await page("!!document.querySelector('#view canvas')"), "the board player made a canvas");
await sleep(300);
const count = await page("window.game.player().count()");
check(count && count.terrains === 2 && count.terrainTriangles > 1600 && count.water === 1 && count.beyond === 1 && count.lights === 3 && count.tiles === 22 && count.pieces === 1,
  `the scene is drawn: the ground and the band round it, ground beyond, the river, the light, 22 built tiles, the walker (${JSON.stringify(count)})`);
check(await until("window.game.player().count().models === 1", 8000), "the walker is its model (models/walker.glb), not a plain shape");
check((await caption()).startsWith("Row 20, column 4; 37 steps to walk, 0 walked. Space stops and starts"), "the walker starts at the entrance, and the program says how to play");
await page("window.game.feed('tick 1'), window.game.feed('tick 1'), 1");
check((await caption()).includes("5 walked"), "two seconds of ticks walk it five tiles");
await click(364, 221);
check((await caption()).includes("Pointing at row 10, column 7: bridge."), "a click on the bridge reaches the program, which names the tile");
await space();
check((await caption()).includes("Stopped."), "the space bar stops the walker");
check(await page("getComputedStyle(document.querySelector('#flat .flat')).display === 'none'"), "the flat board is hidden behind the 3D one");

// The footer, a line: whose it is, the license, the repository, the
// README, the build (host, commit, time).
const footer = await page("document.querySelector('footer').textContent.replace(/\\s+/g, ' ')");
check(/Copyright \(c\) 2026 Michael A Wright/.test(footer) && footer.includes("MIT License"), "the footer says whose it is and its license");
const links = await page("[...document.querySelectorAll('footer a')].map((a) => [a.textContent, a.href, a.target])");
check(links.length === 3 && links.every((l) => l[1].startsWith("https://github.com/sw-fun/evolving-game") && l[2] === "_blank"), `it links to the license, the repository and the README, as external links (${links.map((l) => l[0]).join(", ")})`);
check(/Build: \S+ [0-9a-f]{7} 20\d\d-\d\d-\d\dT/.test(footer), "it names the build: host, commit and time");
check(await page("document.querySelector('footer').getBoundingClientRect().height < 40"), "the footer is one line at this width");
// Help: how to play, in the game's own words; Escape closes it, and a
// key pressed while it is open is not the game's.
const said = await caption();
await page("document.getElementById('open-help').click(), 1");
check(await page("document.getElementById('help').open"), "the Help button opens a dialog");
const helped = await page("[...document.querySelectorAll('#help-text p')].map((p) => p.textContent)");
check(helped.length === 4 && helped[2].startsWith("Space: stop the walker"), `it says how to play, as the game says it (${helped.length} lines)`);
await space();
check((await caption()) === said, "the space bar is not the game's while a dialog is open");
await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
check(!(await page("document.getElementById('help').open")), "Escape closes it");
// About: what this is, who draws it, thanks, links, the pins.
await page("document.getElementById('open-about').click(), 1");
check(await page("document.getElementById('about').open"), "the About button opens a dialog");
const about = await page("document.getElementById('about').textContent.replace(/\\s+/g, ' ')");
check(["X_eTaL", "WebAssembly", "Three.js", "Blender", "JuliaMono", "decides nothing"].every((w) => about.includes(w)), "it says what runs here, what draws it and whose work it stands on");
for (const pin of ["XETAL", "EXTENSIONS", "GAMES", "LIBRARIES"]) {
  const sha = readFileSync(join(root, `${pin}_COMMIT`), "utf8").slice(0, 7);
  check(about.includes(sha), `it names the pin ${pin}_COMMIT (${sha})`);
}
check(await page("[...document.querySelectorAll('#about a')].every((a) => a.target === '_blank' && a.rel.includes('noopener'))"), "its links are external links");
check(await page("(() => { const d = document.getElementById('about'), r = d.getBoundingClientRect(), last = d.querySelector('.prose').lastElementChild.getBoundingClientRect(); return r.bottom <= innerHeight && r.bottom - last.bottom < 40; })()"), "it fits the window, and is as tall as what it says");
await page("document.getElementById('about').close(), 1");

// The sources: a dialog showing the game's own files, X_eTaL drawn as
// X_eTaL renders it (decorated, colored by token, in JuliaMono), the
// whole file.
const before = asked.length;
await page("document.getElementById('open-sources').click(), 1");
await sleep(200);
check(await page("document.getElementById('sources').open"), "the Sources button opens a dialog");
const names = await page("[...document.querySelectorAll('#files button')].map((b) => b.textContent)");
check(["play.xtl", "Walking.xtl", "Mode.xtl", "View.xtl", "bridge.toml"].every((n) => names.includes(n)), `it lists the game's files (${names.length})`);
const shown = () => page("document.getElementById('source').textContent");
const typed = readFileSync(join(root, "games/walk/play.xtl"), "utf8");
check((await shown()).split("\n").length === typed.split("\n").length, `play.xtl is shown first, every line of it (${typed.split("\n").length - 1})`);
check((await shown()).includes("u\u0332se<") && !(await shown()).includes("u_se<"), "as X_eTaL renders it: u_se< is drawn with its u underlined");
const colors = await page("['c-builtin', 'c-libfunc', 'c-string', 'c-doc'].map((c) => { const s = document.querySelector('#source .' + c); return s ? getComputedStyle(s).color : ''; })");
check(colors.every((c) => c) && new Set(colors).size === 4, `colored by the kind of token (${colors.join(" ")})`);
check((await page("getComputedStyle(document.getElementById('source')).fontFamily")).startsWith("JuliaMono"), "in JuliaMono");
check(await page("(() => { const s = document.getElementById('source'); return s.clientHeight > 300 && s.scrollHeight >= s.clientHeight; })()"), "the pane is tall enough to read a file in");
await page("[...document.querySelectorAll('#files button')].find((b) => b.textContent === 'bridge.toml').click(), 1");
check((await shown()) === readFileSync(join(root, "games/walk/bridge.toml"), "utf8"), "data (bridge.toml) is shown as it is");
if (!process.argv.includes("--offline")) check(await until("document.fonts.check('14px JuliaMono')", 15000), "the font arrives");
const font = "https://cdnjs.cloudflare.com/ajax/libs/juliamono/0.63.2/JuliaMono-Regular.woff2";
const outside = asked.slice(before).filter((u) => !u.startsWith(base) && !u.startsWith("data:"));
check(outside.every((u) => u === font), `the sources ask another site for the font only${outside.length ? "" : " (not asked yet)"}`);
await page("document.getElementById('sources').close(), 1");

// The page fits its window at three sizes: nothing scrolls.
for (const [w, h] of [[1280, 800], [800, 600], [420, 760]]) {
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await sleep(150);
  const fits = await page("document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight && document.getElementById('stage').clientHeight > 100");
  check(fits, `the page fits a window of ${w} by ${h}`);
}

// The walker on the bridge, for the README.
if (capture) {
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  await open("?hold&game=walk&fresh");
  await page("(() => { for (let i = 0; i < 212; i++) window.game.feed('tick 0.05'); return 1; })()");
  await sleep(600);
  const shot = await send("Page.captureScreenshot", { format: "png" });
  const to = arg("--look") ? `images/look/${arg("--look")}.png` : "images/screencapture.png";
  mkdirSync(join(root, dirname(to)), { recursive: true });
  writeFileSync(join(root, to), Buffer.from(shot.data, "base64"));
  check((await caption()).startsWith("Row 10, column 7"), "the capture shows the walker on the bridge (images/screencapture.png)");
}

// The castle: what the page starts with. The map shows the places found;
// a real click on a marker goes into its game; the Map button comes
// back; a place not built yet says what it will be and can be called
// done, which is then counted; ?debug shows every place.
check(await open("?hold&fresh"), "the page starts with the castle");
check((await page("document.title")) === "Evolving Game: The castle: ready", "its title is the castle's");
check((await caption()).startsWith("The castle and its country: 3 of 18 places known, 0 won. Gold 0, experience 0."), "the map shows three places to begin with, and your gold and experience");
await sleep(300);
check((await page("window.game.player().count().pieces")) === 3, "each a marker on the map");
check((await page("[...document.querySelectorAll('#flat svg text')].map((x) => x.textContent).join('|')")).includes("2 The battlefield on foot"), "with its number and name written over it");
await click(190, 195);
check((await caption()).includes("W A S D walk"), "a click on the far end of the second place's name goes into the battlefield on foot");
await page("document.getElementById('leave').click(), 1");
check((await caption()).startsWith("The castle and its country: 3 of 18"), "the Map button comes back to the map");
check(await open("?hold&debug&fresh"), "the page starts with ?debug");
check((await caption()).startsWith("The castle and its country: 18 of 18 places known"), "and every place is shown");
await page("window.game.feed('choose 1 7'), 1");
check((await caption()).startsWith("Siege Engineer (not built yet)."), "a place not built yet says what it will be");
check((await page("document.querySelectorAll('#flat svg text:not([text-anchor])').length")) === 3, "in three lines under the map");
await space();
check((await caption()).includes("1 won"), "called done, it is counted on the map");
check(/Gold 1, experience 2\./.test(await caption()), "and it brought a coin and some experience");
await page("window.game.feed('choose 1 17'), 1");
check((await caption()).startsWith("The hall of deeds. Experience 2, gold 1. Quests 0 of 5; achievements 0 of 6."), "the hall of deeds shows experience, gold, quests and achievements");
check((await caption()).includes("[ ] Hold the bridge in summer") && (await caption()).includes("? ? ?"), "quests to do are named, achievements not earned are hidden");
check(await page("document.querySelector('#flat svg').getBoundingClientRect().height > 0 && [...document.querySelectorAll('#flat svg text:not([text-anchor])')].every((x) => x.getBoundingClientRect().top > document.getElementById('stage').getBoundingClientRect().top)"), "all of it fits the picture");
if (capture) {
  await sleep(500);
  const hall = await send("Page.captureScreenshot", { format: "png" });
  mkdirSync(join(root, "images/look"), { recursive: true });
  writeFileSync(join(root, "images/look/hall.png"), Buffer.from(hall.data, "base64"));
}
await space();
check((await caption()).startsWith("The castle and its country"), "a key goes back to the map");

// The three games taken from X_eTaL-games, each entered from the map:
// they draw themselves, so the page shows their picture flat.
// The dungeon opens with a card of its painting first.
for (const [n, says, key, shot, art] of [[10, "Steps 0 | Facing", "w", "maze", ""], [13, "HP 12", "d", "dungeon", "art/block-damp-torches.jpg"], [14, "Find the way out (the teal door)", "w", "raycaster", ""]]) {
  check(await open("?hold&debug&fresh"), `the map opens for venue ${n}`);
  await page(`window.game.feed('choose 1 ${n}'), 1`);
  if (art) {
    check(await page(`(() => { const i = document.querySelector('#flat svg image'); return !!i && i.getAttribute('href') === '${art}'; })()`), `venue ${n} opens with a card of ${art}`);
    check(await page(`fetch('${art}').then((r) => r.ok)`), "which the page serves");
    if (capture) {
      await sleep(800);
      const img = await send("Page.captureScreenshot", { format: "png" });
      writeFileSync(join(root, `images/look/${shot}-card.png`), Buffer.from(img.data, "base64"));
    }
    await space();
  }
  check((await caption()).includes(says), `venue ${n} is a game, which says: ${says}`);
  check(await page("(() => { const r = document.querySelector('#flat svg').getBoundingClientRect(); return r.width > 300 && r.height > 200 && getComputedStyle(document.getElementById('flat')).display !== 'none'; })()"), "and its own picture is shown");
  check(await page("getComputedStyle(document.getElementById('view')).visibility === 'hidden'"), "alone, the 3D board hidden behind it");
  await page(`window.game.feed('key ${key}'), 1`);
  if (capture) {
    await sleep(300);
    const img = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(join(root, `images/look/${shot}.png`), Buffer.from(img.data, "base64"));
  }
  await page("document.getElementById('leave').click(), 1");
  check((await caption()).startsWith("The castle and its country"), "and the Map button leaves it");
  check(await page("getComputedStyle(document.getElementById('view')).visibility === 'visible'"), "and the map's 3D board is back");
}

// The city inside the gate: the village walked on foot. W held walks
// you up the way from the gate; a house stops you.
check(await open("?debug&fresh"), "the map opens for the city");
await page("window.game.feed('choose 1 18'), 1");
check((await caption()).startsWith("The city Inside the gate"), "the city opens with its card");
check(await page("document.querySelector('#flat svg image').getAttribute('href') === 'art/block-castle-keep.jpg'"), "the card shows the keep painting");
check(await page("fetch('art/block-castle-keep.jpg').then((r) => r.ok)"), "which the page serves");
if (capture) {
  await sleep(800);
  const img = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(root, "images/look/city-card.png"), Buffer.from(img.data, "base64"));
}
await space();
check(/^Row 2, column 10, facing \w+\./.test(await caption()) && (await caption()).includes("Find the way through the streets to the keep's door."), "space goes on into the city, deep in its maze, and it says what to find");
check((await page("window.game.player().count().pieces")) >= 0 && /tiles\('house'/.test(await page("document.querySelector('#flat svg metadata').textContent")), "its scene has the village's houses");
await page("window.game.feed('choose 2 87'), 1");
await sleep(900);
await page("window.game.feed('choose 3 87'), 1");
check(/^Row \d+, column \d+/.test(await caption()) && !(await caption()).startsWith("Row 2, column 10,"), "W held walks you on along the street you face");
if (capture) {
  await sleep(600);
  const img = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(root, "images/look/city.png"), Buffer.from(img.data, "base64"));
}
await page("document.getElementById('leave').click(), 1");

// The winter camp: tents and fires in the snow, walked on foot.
check(await open("?debug&fresh"), "the map opens for the camp");
await page("window.game.feed('choose 1 4'), 1");
check((await caption()).startsWith("Row 22, column 14, facing north."), "the winter camp is entered from the south");
check(/tiles\('tent'/.test(await page("document.querySelector('#flat svg metadata').textContent")) && /particles\('fire'/.test(await page("document.querySelector('#flat svg metadata').textContent")), "its scene has tents and fires");
await page("window.game.feed('choose 2 87'), 1");
await sleep(1500);
await page("window.game.feed('choose 3 87'), 1");
if (capture) {
  await sleep(600);
  const img = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(root, "images/look/camp.png"), Buffer.from(img.data, "base64"));
}
await page("document.getElementById('leave').click(), 1");

// The long bridge: a card with the bridge painting, then the walk.
check(await open("?debug&fresh"), "the map opens for the long bridge");
await page("window.game.feed('choose 1 9'), 1");
check((await caption()).startsWith("The long bridge The crossing"), "the long bridge opens with its card");
check(await page("(() => { const i = document.querySelector('#flat svg image'); return !!i && i.getAttribute('href') === 'art/block-bridge-far.jpg'; })()"), "the card shows the bridge painting");
check(await page("fetch('art/block-bridge-far.jpg').then((r) => r.ok && r.headers.get('content-type').startsWith('image/'))"), "which the page serves");
if (capture) {
  await sleep(800);
  const img = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(root, "images/look/bridge-card.png"), Buffer.from(img.data, "base64"));
}
await space();
check((await caption()).startsWith("Row 30, column 11, facing north."), "space goes on to the walk across");
await page("window.game.feed('choose 2 87'), 1");
await sleep(2500);
await page("window.game.feed('choose 3 87'), 1");
check(/^Row (1\d|2\d), column 11/.test(await caption()), "W held walks you onto the bridge");
if (capture) {
  await sleep(600);
  const img = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(root, "images/look/bridge-walk.png"), Buffer.from(img.data, "base64"));
}
await page("document.getElementById('leave').click(), 1");

// The treasury: coins come in with the clock; 1 buys a mint.
check(await open("?debug&fresh&hold"), "the map opens for the treasury");
await page("window.game.feed('choose 1 15'), window.game.feed('tick 6.0'), 1");
check(/^The treasury6coins/.test(await page("document.querySelector('#flat svg').textContent")), "six seconds bring six coins");
await page("window.game.feed('tick 6.0'), window.game.feed('key 1'), 1");
check(/1: Mint x1/.test(await page("document.querySelector('#flat svg').textContent")), "1 buys a mint");
check(/2: Counting house: opens with 5 of Mint \(4 more\)/.test(await page("document.querySelector('#flat svg').textContent")), "and the counting house says what opens it");
check(await page("document.querySelector('#flat svg image').getAttribute('href') === 'art/block-castle-treasury.jpg'"), "the treasury painting is behind it");
const struck = Number((await page("document.querySelector('#flat svg').textContent")).match(/^The treasury(\d+)coins/)[1]);
await page("window.game.feed('key c'), window.game.feed('key c'), 1");
check(Number((await page("document.querySelector('#flat svg').textContent")).match(/^The treasury(\d+)coins/)[1]) === struck + 2, "C strikes a coin by hand");
check(/Renown: none yet/.test(await page("document.querySelector('#flat svg').textContent")) && /Relics: none yet/.test(await page("document.querySelector('#flat svg').textContent")), "it says what renown and relics would do");
if (capture) {
  await sleep(300);
  const img = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(root, "images/look/treasury.png"), Buffer.from(img.data, "base64"));
}
await page("document.getElementById('leave').click(), 1");

// In the second maze a real arrow key, held, turns you; Escape leaves
// any game for the map.
check(await open("?debug&fresh"), "the map opens, its clock running");
await page("window.game.feed('choose 1 14'), 1");
const turnBefore = await page("document.querySelector('#flat svg').innerHTML.length + ':' + document.querySelector('#flat svg').innerHTML.slice(2000, 2600)");
await send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39, nativeVirtualKeyCode: 39 });
await sleep(700);
await send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39, nativeVirtualKeyCode: 39 });
await sleep(200);
const turnAfter = await page("document.querySelector('#flat svg').innerHTML.length + ':' + document.querySelector('#flat svg').innerHTML.slice(2000, 2600)");
check(turnBefore !== turnAfter, "the right arrow held turns you in the second maze (what the rays see changes)");
await send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
await sleep(200);
check((await caption()).startsWith("The castle and its country"), "Escape leaves the game for the map");

// The castle opens with its splash: the keep painting, the name, and
// how to begin; a click goes on to the map.
await send("Page.navigate", { url: base + "?fresh" });
check(await until("document.title.endsWith(': ready')"), "the castle loads");
check(await page("!!document.querySelector('#flat svg#splash image[href=\"art/block-castle-keep.jpg\"]')"), "it opens with its splash, over the keep painting");
check(/Evolving Game/.test(await page("document.querySelector('#flat svg').textContent")) && /press any key, to begin/.test(await page("document.querySelector('#flat svg').textContent")), "which says the game's name and how to begin");
if (capture) {
  await sleep(800);
  const img = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(root, "images/look/splash.png"), Buffer.from(img.data, "base64"));
}
await click(600, 400);
check((await caption()).startsWith("Who is playing?"), "a click goes on to the front door: who is playing");
const front = async (name) => {
  if (!capture) return;
  await sleep(300);
  const img = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(root, `images/look/front-${name}.png`), Buffer.from(img.data, "base64"));
};
await front("profiles");
check((await caption()).includes("New profile"), "with a new profile to make");
await page("window.game.feed('key enter'), 1");
check((await caption()).startsWith("A new profile"), "Enter on it asks for a name");
for (const k of ["a", "l", "d", "r", "x"]) await key("keyDown", k, `Key${k.toUpperCase()}`, k.toUpperCase().charCodeAt(0)), await key("keyUp", k, `Key${k.toUpperCase()}`, k.toUpperCase().charCodeAt(0));
await key("keyDown", "Backspace", "Backspace", 8); await key("keyUp", "Backspace", "Backspace", 8);
await key("keyDown", "a", "KeyA", 65); await key("keyUp", "a", "KeyA", 65);
check((await caption()).includes("Name: aldra_"), "a name is typed with real keys, Backspace erasing");
await front("name");
await key("keyDown", "Enter", "Enter", 13); await key("keyUp", "Enter", "Enter", 13);
check((await caption()).startsWith("Choose a calling"), "Enter goes on to the calling");
await front("calling");
await page("window.game.feed('key 5'), 1");
check((await caption()).startsWith("Aldra the Witch (they)"), "a Witch/Warlock is called by the title chosen");
await page("window.game.feed('key right'), window.game.feed('key down'), window.game.feed('key right'), 1");
check((await caption()).startsWith("Aldra the Witch (he)"), "Left and Right change the look: the build, the pronouns");
check(await page("!!document.querySelector('#flat svg g')"), "the character is drawn beside the look");
await front("look");
await page("window.game.feed('key 5'), 1");
check((await caption()).startsWith("Aldra the Witch (he) Level 1."), "Done goes home");
await front("home");
await page("window.game.feed('key 1'), 1");
check((await caption()).startsWith("Defend or attack?"), "Play asks for the side");
await front("side");
await page("window.game.feed('key 1'), 1");
check((await caption()).startsWith("How hard?"), "then how hard");
await front("difficulty");
await page("window.game.feed('key 3'), 1");
check((await caption()).startsWith("Defend the castle"), "and then the defender's road of levels");
check(await page("document.querySelector('#flat svg image').getAttribute('href') === 'art/block-castle-keep.jpg'"), "over the keep painting");
await front("road");
await page("window.game.feed('key enter'), 1");
check((await caption()).startsWith("Gold 100, lives 10, wave 0 of 5."), "Enter on the first level plays it: Castle Defense in summer");
await page("document.getElementById('leave').click(), 1");
check((await caption()).startsWith("Defend the castle"), "Map (Esc) leaves the level for the road");
await page("document.getElementById('leave').click(), 1");
check((await caption()).startsWith("Aldra the Witch (he) Level 1."), "and again goes back home");

// What is won is kept: a place called done is still won after the page
// is loaded again; New game forgets it.
await page("try { localStorage.clear(); } catch {} 1");
check(await open("?hold"), "the page starts, keeping what is won");
await page("window.game.feed('key d'), window.game.feed('choose 1 7'), 1");
await space();
check((await caption()).includes("1 won"), "a place is won");
check(await open("?hold"), "the page is loaded again");
check((await caption()).includes("1 won") && /experience 2\b/.test(await caption()), "and it is still won, with its experience");
await page("document.getElementById('forget').click(), 1");
await page("window.game.feed('key space'), 1");
await enter();
check((await caption()).includes("0 won") && /experience 0\b/.test(await caption()), "New game forgets it");
check(await open("?hold"), "and loaded again");
check((await caption()).includes("0 won"), "it stays forgotten");

// On foot: the second game, seen through an eye, walked with held keys.
const ticks = (n) => page(`(() => { for (let i = 0; i < ${n}; i++) window.game.feed('tick 0.05'); return 1; })()`);
check(await open("?hold&game=foot&fresh"), "the page starts on foot (?game=foot)");
check((await caption()).startsWith("Row 20, column 4, facing north."), "you stand at the entrance, facing north");
await sleep(300);
check((await page("window.game.player().count().eye")) === 1 || /eye\(/.test(await page("window.game.picture()")), "the scene is seen through an eye");
await key("keyDown", "w", "KeyW", 87);
await ticks(40);
check((await caption()).startsWith("Row 15, column 4"), "W held for two seconds walks five tiles north");
await key("keyUp", "w", "KeyW", 87);
await ticks(20);
check((await caption()).startsWith("Row 15, column 4"), "let go, you stand still");
await key("keyDown", "ArrowRight", "ArrowRight", 39);
await ticks(18);
await key("keyUp", "ArrowRight", "ArrowRight", 39);
check((await caption()).includes("facing east"), "the right arrow turns you to the east");
await page("document.getElementById('open-help').click(), 1");
check((await page("document.querySelector('#help-text').textContent")).includes("W A S D"), "Help is this game's own");
await page("document.getElementById('help').close(), 1");
check(await page("document.getElementById('pick-foot').classList.contains('on') && !document.getElementById('pick-watch').classList.contains('on')"), "the header shows which game is played");
await page("document.getElementById('pick-watch').click(), 1");
check((await caption()).startsWith("Row 20, column 4; 37 steps to walk"), "the other button goes back to watching the walk");

// Castle Defense: the third game, seen from behind the wall looking
// out (the map turned). A real click on grass beside the road builds
// the tower chosen; the space bar sends a wave; enemies
// come and the tower's shots pay.
check(await open("?hold&game=defense&fresh"), "the page starts Castle Defense (?game=defense)");
check((await page("document.title")) === "Evolving Game: Castle Defense: ready", "its title is the game's");
check((await caption()).startsWith("Gold 100, lives 10, wave 0 of 5. Building: archer (40 gold)."), "it starts with 100 gold and no wave sent");
await click(464, 203);
check((await caption()).startsWith("Gold 60,") && (await caption()).endsWith("Built."), "a click on open ground beside the road builds an archer tower for 40 gold");
check((await page("window.game.picture()")).includes("piece('archer', nums('7.5 5.5 "), "on the tile clicked (row 6, column 8 of the map seen from behind the wall), though the header has wrapped since the board was made");
await click(444, 193);
check((await caption()).endsWith("Towers stand on open ground."), `a click on the road builds nothing, and the game says why (${await caption()}; ${JSON.stringify(await page("window.game.said()"))})`);
await key("keyDown", "2", "Digit2", 50);
await key("keyUp", "2", "Digit2", 50);
check((await caption()).includes("Building: fire (70 gold)"), "the key 2 chooses the fire tower");
await space();
check((await caption()).includes("wave 1 of 5"), "the space bar sends the first wave");
await ticks(200);
check(/Gold (6[5-9]|[7-9]\d),/.test(await caption()), `the tower's shots pay (${(await caption()).slice(0, 30)})`);
await sleep(400);
const army = await page("window.game.player().count().pieces");
check(army >= 2, `the tower and the enemies on the road are drawn (${army} pieces)`);
if (capture) {
  await sleep(600);
  const shot = await send("Page.captureScreenshot", { format: "png" });
  mkdirSync(join(root, "images/look"), { recursive: true });
  writeFileSync(join(root, "images/look/defense.png"), Buffer.from(shot.data, "base64"));
}

// The flat picture alone.
check(await open("?flat&hold&game=walk&fresh"), "the flat page starts");
check(!(await page("!!document.querySelector('#view canvas')")), "no 3D is drawn there");
check((await page("document.querySelectorAll('#flat .flat polygon').length")) > 400, "the flat board is drawn");
await click(364, 221);
check((await caption()).includes("Pointing at row 10, column 7: bridge."), "a click on the flat picture names the tile too");

// The clock: left alone, the walk goes by itself and ends.
check(await open("?game=walk&fresh"), "the page starts with its clock");
check(await until("document.querySelector('#flat svg text').textContent.includes(' 3 walked')", 8000), "the clock's ticks walk the walker");

// Self-contained: every request was to the page's own address.
const foreign = asked.filter((u) => !u.startsWith(base) && !u.startsWith("data:") && !u.startsWith("blob:") && u !== "about:blank" && u !== font);
check(foreign.length === 0, `the game asks nothing of another site${foreign.length ? ": " + foreign.join(" ") : ""}`);
const missing = await page("document.getElementById('err').textContent");
check(!missing, `no error on the page${missing ? ": " + missing : ""}`);

console.log(failed ? `browser-test: ${failed} failed` : "browser-test: ok");
await done(failed ? 1 : 0);
