# Desktop version -- design

Designed now so the browser game is built ready for it; implemented
in Saga 12 (`docs/plan.md`, decisions D16 and D17). Nothing here
exists yet.

## What it is

The browser game, unchanged, in a window of its own: an application
installed on Linux, macOS and Windows that opens the same page from
files inside itself, with no server, no network and no browser
chrome. The game is still X_eTaL running as WebAssembly, drawn by the
same Three.js player. There is one game and two ways to open it.

## The wrapper: Tauri

Tauri (version 2) wraps a web page in the system's own web view and
builds installers. Chosen (the user, 2026-11-15, "for now") because:

- it is Rust, like the rest of the toolchain, and its shell is a few
  dozen lines;
- it ships no browser: the installer is the page plus a small binary
  (a few megabytes), where an Electron build carries a browser of
  over a hundred;
- it builds what each system installs: `.deb`, `.rpm` and AppImage on
  Linux, a `.app` in a `.dmg` on macOS, an `.msi` or NSIS setup on
  Windows;
- it serves the page's files from inside the binary through its own
  protocol, so nothing lies on disk as loose readable files.

| System | Web view | To check first |
| ------ | -------- | -------------- |
| macOS | WKWebView (WebKit) | WebGL2 and WebAssembly are present; the page is tested in Safari already |
| Windows | WebView2 (Chromium) | present on Windows 11; the installer fetches or carries it for Windows 10 |
| Linux | WebKitGTK | the risk: its WebGL is slower and varies by driver; measure the frame time of a full board early, and fall back to the flat SVG picture where WebGL is missing |

The first step of Saga 12 is that measurement, on all three, with the
Defend the Bridge level. If WebKitGTK cannot hold the frame rate, the
alternatives, in order: lower the scene's cost on that system (fewer
lights, no bloom), ship the Linux build on a bundled Chromium (the
Chromium Embedded Framework), or offer Linux the browser version only.

## What the browser game must do from the first page on

These are rules for Saga 1 step 7 (web-shell) and after, so the wrap
is cheap later.

1. **Self-contained.** Every file the page needs is in the built
   site: no font, script, model or picture from another site. The
   site works from a local directory and offline. (The browser test
   runs with the network off.)
2. **Relative addresses only.** The site runs under any path:
   `/evolving-game/` on GitHub Pages, the root in the desktop
   application.
3. **One storage interface.** Saves, settings and scores go through
   one small interface of three operations (read a named text, write
   one, list the names). In the browser it is the browser's storage;
   on the desktop it is files in the user's data directory. The game
   (X_eTaL) sees only the interface, as `[]` system names or an
   extension's functions; which, is an ask of X_eTaL-extensions.
4. **No tab assumptions.** The page lays itself out for any window
   size and for full screen; it never opens a new tab or window for
   part of the game; links to other sites (the repository, the blog)
   are marked external, and the desktop shell opens them in the
   system's browser.
5. **Keys that do not collide.** No game key uses a browser shortcut
   or a system one (Ctrl/Cmd with W, Q, R, T, N; F5, F11, F12); Escape
   closes a dialog, never the game.
6. **Quit is safe at any moment.** A level in progress is its
   scenario, seed and events so far (plan, Save), written as it goes,
   so closing the window loses nothing.
7. **Sound waits for a click**, as browsers require; the desktop
   build follows the same path, so there is one.

## The desktop shell

`desktop/` (a Rust crate of its own, added in Saga 12): the Tauri
application and its configuration. It does four things and knows
nothing about the game:

- opens one window on the packed site (a remembered size and place;
  F11 or the system's key for full screen);
- implements the storage interface over files in the user's data
  directory (`~/.local/share/evolving-game`, `~/Library/Application
  Support/evolving-game`, `%APPDATA%\evolving-game`);
- opens external links in the system's browser;
- reports its version, commit and the three pins in an About dialog
  (the page's footer, as a dialog).

No game rule, number or picture is computed in the shell (plan D4).
The web view is given nothing but the site: no access to the file
system, the shell or the network beyond what the four items need
(Tauri's capabilities, set to the minimum).

## Deterring casual hacks (D17)

The source is public, so this hides nothing from someone who reads
the repository. It is meant to stop the casual cases: opening the
installed files in an editor and changing a tower's cost, or editing
a save to have more gold.

- **Packed programs and data.** The build gathers the X_eTaL
  libraries, the games' programs and every TOML file into one bundle,
  compressed and scrambled with a key fixed in the build, and the
  page's loader reads programs and data only from that bundle. No
  `.xtl` or `.toml` lies readable in the installed application or in
  the published site's files. If X_eTaL can load a program in a
  compiled form (its Core, already type-checked), the bundle holds
  that instead of source, which also starts faster; this is an ask of
  X_eTaL (D12).
- **The loader and the player** (the WebAssembly evaluator, the
  JavaScript glue, the Three.js player) are built in release mode and
  minified, as they would be anyway. No further obfuscation of them:
  none of the game is in them.
- **Checked saves and scores.** A save carries a check value (an HMAC
  of its contents under a key in the build). A save whose check fails
  is not loaded as a save: the game says it was changed and offers to
  start the level again. A save is also a replay (scenario, seed,
  events), so a claimed result can be checked by running it; a score
  that its replay does not produce is not shown.
- **What is not attempted.** Hiding the key from someone who
  disassembles the build; stopping a debugger; anything server-side.
  If scores are ever compared between players, they are verified by
  replay on the receiving side, not trusted.

Rules for the packing, so it cannot change the game:

1. It is a build step over unchanged sources: the same programs and
   data, plain in a development build, packed in a release build.
2. The goldens run on the plain sources at every commit and on the
   packed build before every release: the same event scripts, the
   same output.
3. A development build (`just serve`) stays plain, so the page still
   shows its own sources when a game's page offers them.

## Installers and releases

- Built by a GitHub Actions workflow on each system's own runner (a
  macOS application cannot be built on Linux), from a version tag,
  attached to the GitHub release; never built on a push to main.
- macOS: signed with a Developer ID and notarized, or Gatekeeper
  refuses the application; this needs the user's Apple developer
  account, and until then the `.dmg` is unsigned with the steps to
  open it written beside it.
- Windows: an unsigned setup shows a SmartScreen warning; a code
  signing certificate removes it. Decided with the user at the saga.
- Linux: AppImage for any distribution, `.deb` and `.rpm` beside it.
- Updates: none automatic at first; the About dialog links to the
  releases page. Tauri's updater (signed update files) is a later
  step if wanted.
- The version is one number in one place, the same in the page's
  footer, the About dialog and the installers' names.

## Tests

- The goldens against the packed build (above).
- The browser test of the site, network off, at three window sizes.
- On each system, from the workflow: the application starts, the page
  reports ready, one scripted level is played through the storage
  interface (a save written, the application closed and opened, the
  save read), and a tampered save is refused.
- The frame-time measurement on each system's web view, recorded with
  the release.

## Open

- When Saga 12 runs (plan, Open questions).
- Signing: which certificates the user has or wants.
- Whether the published site is packed too, or only the desktop
  build (the design above packs both; a plain site shows its sources
  more easily).
