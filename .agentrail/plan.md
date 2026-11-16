# foundations

Saga 1 of Evolving Game (docs/plan.md): the shared X_eTaL libraries
every game is a mode of, the first assets, and the first thing to
look at in a browser.

Goal: a trivial `walk` scenario plays at the command line from an
event script, pinned by a golden; the Defend the Bridge map is drawn
flat (SVG) and as a 3D scene; its first pieces are made by X_eTaL
through Blender; the browser (X_eTaL as WebAssembly, through
X_eTaL-extensions) shows the scene with those pieces from the
isometric camera, a unit walking the road; the live demo is
published; the gate is in place.

Read first: CLAUDE.md (rules), docs/plan.md (decisions D1 to D18, the
seams, the layout, What this builds on). docs/research.txt is
background, not normative (it proposes Rust; the user chose X_eTaL).

Models, read at their pinned commits, never edited from here:
- ../../softwarewrighter/X_eTaL: docs/vendoring.md, docs/reference.md.
- ../../softwarewrighter/X_eTaL-games: games/tower-defense
  (Defense.xtl, play.xtl, td.toml, web/), lib/ (Ecs, Svg, State),
  docs/style.md, scripts/, shared/microscope/scene.js.
- ../../softwarewrighter/X_eTaL-extensions: extensions/blender
  (lib/Bpy.xtl, demos/Td.xtl, game-assets.xtl, NeonCity.xtl),
  extensions/three (lib/Three.xtl, web/, the live city), docs/bridge.md.
- softwarewrighter/snowflow_demo-fork: docs/architecture.md (X_eTaL
  owns world and gameplay, Rust only platform access).

Decided (docs/plan.md):
- The game is X_eTaL: rules, world, pictures and scenes, campaign,
  asset descriptions. Hosts and players decide nothing; a page shows
  only what X_eTaL prints or draws.
- A browser WASM game through X_eTaL-extensions; as little host code
  here as can be; what is missing is an ask (docs/xetal-asks.md), not
  a host written here. The command line is for tests and replays.
- Deterministic: time only as tick events, chance only from a seeded
  generator in X_eTaL; an event script is a replay, a test and a save.
- Rules 2D with height (tiles with elevation, as arrays); the picture
  3D (a scene drawn by the Three.js player, isometric camera first),
  with the flat SVG picture always there as fallback and golden.
- Data is TOML read and checked by X_eTaL.
- Assets are described in X_eTaL and made through Blender (Bpy.xtl);
  small generated pieces (a .glb of at most 256 KB) and their
  manifest are tracked; Blender is never needed by the gate. The look
  riffs on docs/images/castle-siege.png.
- The player is Three.js; X_eTaL runs at a fixed tick, never once a
  frame; tiles with heights, not voxels.
- The page is built ready for the desktop wrap (docs/desktop.md).
- The repository is sw-fun/evolving-game on GitHub.
- Every game is a Mode over a Scenario and a WorldState, ending in an
  Outcome, so the games combine into one campaign later. This saga
  defines those seams with a minimal walk mode.
- X_eTaL, the extensions and the games repository at pinned commits
  (XETAL_COMMIT, EXTENSIONS_COMMIT, GAMES_COMMIT), cloned into work/.

Rules: strict TDD, goldens are the spec, a bad input is a message
never a crash, docs ASCII-only, American spellings, gate before
commit, commit .agentrail with the work.

## Steps

1. workspace-scaffold -- the pins, scripts/xetal.sh, bin/xetal and
   xetal-x, justfile, gate, games/_template, a first golden,
   docs/style.md, .gitignore.
2. sim-core -- lib/Rng.xtl, lib/Sim.xtl (state, the event loop over
   []E_VENT, the event log), lib/test.xtl; determinism goldens.
3. world-map -- lib/World.xtl: tiles, elevation, zones, maps and
   roads from TOML with named errors, the road by a flood, the bridge
   map, a text drawing as a golden.
4. mode-contract -- lib/Mode.xtl: protocol, scenario, world state,
   outcome; games/walk; replay golden; stub puzzle and turn modes.
5. view-and-iso -- lib/View.xtl: the isometric map and its inverse,
   the SVG picture and the scene from one state; goldens of both.
6. castle-assets -- assets/Castle.xtl on Bpy.xtl: first tiles and a
   walker with clips; just assets; manifest; script and clips goldens.
7. web-shell -- web/: games/walk/play.xtl as WebAssembly in the page,
   the Three.js player drawing the scene with the pieces; just serve;
   a browser test.
8. pages -- scripts/build-pages.sh, the footer with build info and
   pins, the live demo published and linked from the README.
9. foundations-docs -- docs/architecture.md, README current, the
   retrospective in docs/plan.md.
