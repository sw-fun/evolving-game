# Asks for X_eTaL-extensions

Extension changes the games need: what the browser side lacks for a
game (events in, models with clips, sound, storage), what the blender
extension lacks for the pieces, what the three extension's player
lacks for the scene. This repository does not change X_eTaL-extensions: each ask
is written here and taken to that repository, the game uses the
workaround noted or waits, and the workaround is removed when the ask
has landed in the commit this repository is pinned to.

Each entry: status (open, filed, landed, dropped), kind (feature, bug
or performance), what needs it, why, a minimal repro or example, and
the workaround in use. Details that do not fit a table row go in a
section below it.

| Status | Kind | Ask | Needed by | Workaround |
| ------ | ---- | --- | --------- | ---------- |
| landed | feature | A board player for the three extension: its player (`web/static/player.js`) draws the city film's calls (`stage`, `boxes`, `fleet`, `fly` ...) with a flying perspective camera. A game board needs a few more calls, drawn the same way (text that names no renderer): `view(w, h, background)`, `camera(target, direction, scale)` without perspective, `tiles(kind, color, nums(x z y ..., 3))` instanced, and `piece(model, nums(x z y hx hz, 5)[0], clip, t, nums(x z y, 3)[0], dt)`: a `.glb` by name, its clip at a time, moved to the second place over dt seconds between the program's ticks. `lib/View.xtl` writes these (`games/walk/expected/picture.out` has two whole scenes) (landed by X_eTaL-extensions 4fd5d87, 2026-11-15, the day it was asked: `web/static/board.js` draws the four calls, a piece a plain shape until its `models/NAME.glb` has come, a scene shown again changing the board in place, a click given to the page's `onPoint`; in use from the pin d14222c) | every game's 3D view, from Saga 1 step 6 | none was needed |
| open | feature | Tiles from models: the board player's `tiles(kind, color, nums)` draws every tile as its own column of that color, so the tile pieces a game makes (`assets/pieces/ground.glb`, `bridge.glb`, `wall.glb`, `gate.glb`: a bridge with rails, a wall with merlons) are never drawn. Wanted: a tile kind that names a model (`models/KIND.glb`) is drawn by instancing that model at each tile's place, the column kept where there is no model | every game's board; the look (docs/plan.md, The look) | the columns as they are; the tile pieces are made, tracked and tested, and wait |
| open | feature | The look, light (`docs/look.md`): the board player draws flat-shaded, with no shadows. Wanted, as calls: `sun(direction, color, strength)` casting shadows (pieces and terrain cast and take them), `sky(top, horizon, strength)` as sky light, `fog(color, density)` with distance, ambient occlusion and tone mapping (the city player's AgX) on by default for a board | every scene | none: the board as it is |
| open | feature | The look, terrain: `terrain(name, nums(corners, 3), ints(triangles, 3), nums(colors, 3))`, a mesh the program worked out (smooth ground from the map's heights), lit and shadowed, and `ground(name, textureA, textureB, nums(blend, 1))` for its material; `ints(text, k)` beside `nums` | the board and the winter camp | the columns |
| open | feature | The look, materials: a piece's `.glb` drawn with the materials it carries (base color, roughness and normal textures), not recolored; and in `Bpy.xtl`, a way to give a part a procedural texture (stone courses, wood grain, cloth weave, grass) and bake it into the exported file, with bevels on boxes | every piece | flat colors |
| open | feature | The look, water: `water(nums(corners, 3), ints(triangles, 3), flow, color)`: a surface that moves along its flow and reflects the sky, foam where it meets other geometry | the river | a blue column a tile |
| open | feature | The look, particles: `particles(kind, place, rate, wind, seed)` with kinds smoke, dust, splash, fire and embers; emitted from the scene's time so a scene shown again does not restart them | fires, pots, feet, the river | none |
| open | feature | The look, figures and cloth in `Bpy.xtl`: an armature with skinned parts and clips keyed on its bones (a person, a horse, a crow's wings); a cloth part simulated in Blender and baked to keys (a banner, a tent flap), exported in the `.glb` | the walker, the cart, crows, banners, tents | rigid parts in groups, as now |
| open | feature | The look, a camera that walks: `eye(place, heading and pitch, lens)` in place of `camera` gives a perspective view from where you stand; and the city player's walk and fly controls offered for a board's scene, their keys and pointer given to the page as events (the program moves you; the player only looks) | the winter camp, every world | the isometric camera |
| open | feature | A page shell for a game: the extensions' pages run a program once to its end (`xetal-ext-shell`'s `run`), and the board player hands a click to the page (`onPoint`), not to X_eTaL. A game needs its program kept running and given events: started once (`xetal_play::Interactive`), fed a line an event (`tick 0.05`, `key space`, `click X Y`), run to its next wait, and the picture it showed (`[]S_HOW`; its `<metadata id="scene">` is the board's calls) handed to the board player, with the flat picture where there is no WebGL. X_eTaL-games' `shared/microscope` does the feeding for its own page | every game's page | this repository's `web/` does it: about 200 lines of Rust (`web/src`: a store of the game's files, the running program, five exported functions) and `web/static/app.js` (the clock, keys, clicks, the scene to `board.js`). No rule or number of a game is in either |

## Notes for whoever files the first ask

- `xetal-x` here is built from the extensions' clone against the
  X_eTaL that repository is pinned to (its own `XETAL_COMMIT`), which
  is not always this repository's `XETAL_COMMIT`. A program that runs
  under `bin/xetal` and fails under `bin/xetal-x`, or the reverse, may
  be that difference: name both commits in the ask.
- `xetal-x --ext DIR` loads every extension in `DIR` and fails if one
  has no built library, so `scripts/extensions.sh` gives it a
  directory holding only the three built here.
