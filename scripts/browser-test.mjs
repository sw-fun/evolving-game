#!/usr/bin/env node
// Test the built page (web/dist; run scripts/web.sh first) in headless
// Chrome, over the DevTools protocol with Node's own WebSocket (no
// packages): the page starts and says so; the scene is drawn in 3D by
// the board player (a canvas, 400 tiles, the walker); ticks move the
// walker; a real click on the bridge reaches the program, which names
// the tile; a real space bar stops the walker; the flat picture alone
// (?flat) takes the same click; nothing is asked of another site; the
// page fits its window at three sizes; the footer names the build and
// the four pins; the sources pane shows the game's own files. Then a
// screen capture of the walker on the bridge is written to
// images/screencapture.png.
//   scripts/browser-test.mjs [--no-capture] [--dir pages] [--url https://...]
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
  rmSync(profile, { recursive: true, force: true });
  rmSync(served, { recursive: true, force: true });
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
  return until("document.title.endsWith(': ready')");
};
// The caption the program wrote in its picture.
const caption = () => page("document.querySelector('#flat svg text')?.textContent || ''");
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
check(await open("?hold"), "the page starts and says it is ready");
check((await page("document.title")) === "Evolving Game: Walk: ready", "its title is X_eTaL's (Evolving Game: Walk)");
check(await page("!!document.querySelector('#view canvas')"), "the board player made a canvas");
await sleep(300);
const count = await page("window.game.player().count()");
check(count && count.tiles === 400 && count.pieces === 1, `the scene is drawn: ${JSON.stringify(count)}`);
check((await caption()).startsWith("Row 20, column 4; 37 steps to walk, 0 walked. Space stops and starts"), "the walker starts at the entrance, and the program says how to play");
await page("window.game.feed('tick 1'), window.game.feed('tick 1'), 1");
check((await caption()).includes("5 walked"), "two seconds of ticks walk it five tiles");
await click(364, 221);
check((await caption()).includes("Pointing at row 10, column 7: bridge."), "a click on the bridge reaches the program, which names the tile");
await space();
check((await caption()).includes("Stopped."), "the space bar stops the walker");
check(await page("getComputedStyle(document.querySelector('#flat .flat')).display === 'none'"), "the flat board is hidden behind the 3D one");

// The footer: whose it is, the license, the repository, the build and
// the four pinned commits it was built from.
const footer = await page("document.querySelector('footer').textContent.replace(/\\s+/g, ' ')");
check(/Copyright \(c\) 2026 Michael A Wright/.test(footer) && footer.includes("MIT License"), "the footer says whose it is and its license");
check(await page("document.querySelector('footer a').href === 'https://github.com/sw-fun/evolving-game' && document.querySelector('footer a').target === '_blank'"), "it links to the repository, as an external link");
check(/build [0-9a-f]{7} on \S+ at 20\d\d-/.test(footer), "it names the build: commit, host and time");
for (const pin of ["XETAL", "EXTENSIONS", "GAMES", "LIBRARIES"]) {
  const sha = readFileSync(join(root, `${pin}_COMMIT`), "utf8").slice(0, 7);
  check(footer.includes(sha), `it names the pin ${pin}_COMMIT (${sha})`);
}
// The sources: the game's own files, shown as they are.
await page("document.getElementById('sources').open = true, 1");
await sleep(100);
const names = await page("[...document.querySelectorAll('#files button')].map((b) => b.textContent)");
check(["play.xtl", "Walking.xtl", "Mode.xtl", "View.xtl", "bridge.toml"].every((n) => names.includes(n)), `the sources pane lists the game's files (${names.length})`);
await page("[...document.querySelectorAll('#files button')].find((b) => b.textContent === 'play.xtl').click(), 1");
check((await page("document.getElementById('source').textContent")) === readFileSync(join(root, "games/walk/play.xtl"), "utf8"), "play.xtl is shown as it is in the repository");
await page("document.getElementById('sources').open = false, 1");

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
  await open("?hold");
  await page("(() => { for (let i = 0; i < 212; i++) window.game.feed('tick 0.05'); return 1; })()");
  await sleep(600);
  const shot = await send("Page.captureScreenshot", { format: "png" });
  mkdirSync(join(root, "images"), { recursive: true });
  writeFileSync(join(root, "images/screencapture.png"), Buffer.from(shot.data, "base64"));
  check((await caption()).startsWith("Row 10, column 7"), "the capture shows the walker on the bridge (images/screencapture.png)");
}

// The flat picture alone.
check(await open("?flat&hold"), "the flat page starts");
check(!(await page("!!document.querySelector('#view canvas')")), "no 3D is drawn there");
check((await page("document.querySelectorAll('#flat .flat polygon').length")) > 400, "the flat board is drawn");
await click(364, 221);
check((await caption()).includes("Pointing at row 10, column 7: bridge."), "a click on the flat picture names the tile too");

// The clock: left alone, the walk goes by itself and ends.
check(await open(""), "the page starts with its clock");
check(await until("document.querySelector('#flat svg text').textContent.includes(' 3 walked')", 8000), "the clock's ticks walk the walker");

// Self-contained: every request was to the page's own address.
const foreign = asked.filter((u) => !u.startsWith(base) && !u.startsWith("data:") && !u.startsWith("blob:") && u !== "about:blank");
check(foreign.length === 0, `nothing is asked of another site${foreign.length ? ": " + foreign.join(" ") : ""}`);
const missing = await page("document.getElementById('err').textContent");
check(!missing, `no error on the page${missing ? ": " + missing : ""}`);

console.log(failed ? `browser-test: ${failed} failed` : "browser-test: ok");
await done(failed ? 1 : 0);
