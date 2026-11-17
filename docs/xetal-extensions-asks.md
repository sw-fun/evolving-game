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
| landed | feature | Tiles from models: the board player's `tiles(kind, color, nums)` draws every tile as its own column of that color, so the tile pieces a game makes (`assets/pieces/ground.glb`, `bridge.glb`, `wall.glb`, `gate.glb`: a bridge with rails, a wall with merlons) are never drawn. Wanted: a tile kind that names a model (`models/KIND.glb`) is drawn by instancing that model at each tile's place, the column kept where there is no model (landed by X_eTaL-extensions 2d8516e, 2026-11-16: `tiles(kind, color, nums(.., 4), model)`, a row `x z y base`, the model's origin at `base` on a column up to it; a row of six turns it; in use from the pin c82a07c) | every game's board; the look (docs/plan.md, The look) | none now |
| open | feature | Weather that falls: the board player's particles are emitters at a place (smoke, dust, splash, fire, embers); snow and rain fall everywhere you look. Wanted: kinds `snow` and `rain` for `particles(kind, place, rate, wind, seed)`, where the place is the middle of what it falls over and the fall is kept round the picture (round the eye, under an `eye`; over the view, under the board's camera), from well above the ground down to it, drifting with the wind; rate is flakes or drops a second over a 20 by 20 tile field. `lib/View`'s winter stage writes `particles('snow', nums('10.0 10.0 8.0', 3)[0], 320, nums('0.3 0.1', 2)[0], 1)` (in `games/defense`'s and the on-foot scenes); later, a flash for lightning (a `flash(strength, seconds)` call) | weather (docs/plan.md, Weather): the siege in winter | the player warns of an unknown kind and draws the rest, so the scene is published with the call and no snow falls yet; the ground, the sky and the haze are snow's already |
| open | bug | A scene with a call the board player does not know is not drawn at all: each line is run as code with only the known names (`new Function(...names, line)`), so `sun(...)` before the light module exists is a ReferenceError and the whole `show` stops, the board staying as it was. A game cannot then write a scene for a newer player and have an older one draw the rest. Wanted: an unknown call is skipped (and counted, so a test can see it), every other line drawn. Repro: `th:s_how!` of `tests/board.xtl`'s scene with the line `sun(nums('0 1 0', 3)[0], '#ffffff', 1.0)` added | every new scene call (the look) | scenarios that would write the new calls are kept out of the published page: the walk's `evening.toml` (lit) and `vw:s_mooth` (terrain) are tested here and not shown |
| landed | feature | The look, light (`docs/look.md`): the board player draws flat-shaded, with no shadows. Wanted, as calls (`lib/Sky` writes them; `games/walk/expected/picture.out` ends with a lit scene): `sun(direction, color, strength)`, the direction a unit vector to the sun, casting shadows (pieces and terrain cast and take them), `sky(top, horizon, strength)` as sky light, `fog(color, density)` with distance, ambient occlusion and tone mapping (the city player's AgX) on by default for a board | every scene | none: the board as it is |
| landed | feature | The look, terrain: `terrain(name, nums(corners, 3), ints(triangles, 3), nums(colors, 3))`, a mesh the program worked out (smooth ground from the map's heights), lit and shadowed, and `ground(name, textureA, textureB, nums(blend, 1))` for its material; `ints(text, k)` beside `nums` | the board and the winter camp | the columns |
| landed | feature | The look, materials: a piece's `.glb` drawn with the materials it carries (base color, roughness and normal textures), not recolored; and in `Bpy.xtl`, a way to give a part a procedural texture (stone courses, wood grain, cloth weave, grass) and bake it into the exported file, with bevels on boxes | every piece | flat colors |
| landed | feature | The look, water: `water(nums(corners, 3), ints(triangles, 3), flow, color)`: a surface that moves along its flow and reflects the sky, foam where it meets other geometry | the river | a blue column a tile |
| landed | feature | The look, particles: `particles(kind, place, rate, wind, seed)` with kinds smoke, dust, splash, fire and embers; emitted from the scene's time so a scene shown again does not restart them | fires, pots, feet, the river | none |
| landed | feature | The look, figures and cloth in `Bpy.xtl`: an armature with skinned parts and clips keyed on its bones (a person, a horse, a crow's wings); a cloth part simulated in Blender and baked to keys (a banner, a tent flap), exported in the `.glb` | the walker, the cart, crows, banners, tents | rigid parts in groups, as now |
| landed | feature | The look, a camera that walks: `eye(place, heading and pitch, lens)` in place of `camera` gives a perspective view from where you stand; and the city player's walk and fly controls offered for a board's scene, their keys and pointer given to the page as events (the program moves you; the player only looks) | the winter camp, every world | the isometric camera |
| landed | feature | A page shell for a game: the extensions' pages run a program once to its end (`xetal-ext-shell`'s `run`), and the board player hands a click to the page (`onPoint`), not to X_eTaL. A game needs its program kept running and given events: started once (`xetal_play::Interactive`), fed a line an event (`tick 0.05`, `key space`, `click X Y`), run to its next wait, and the picture it showed (`[]S_HOW`; its `<metadata id="scene">` is the board's calls) handed to the board player, with the flat picture where there is no WebGL. X_eTaL-games' `shared/microscope` does the feeding for its own page | every game's page | this repository's `web/` does it: about 200 lines of Rust (`web/src`: a store of the game's files, the running program, five exported functions) and `web/static/app.js` (the clock, keys, clicks, the scene to `board.js`). No rule or number of a game is in either |

All seven asks of the look and the page shell landed in
X_eTaL-extensions on 2026-11-16 (light 5650fb6, terrain d164a43, water
d6f8e14, particles 4ab87a7, the eye ac678c9, a game's page 6086ef6,
Bpy's textures, armatures and cloth 2400ad2), in use from the pin
b7f82ee. Differences from what was asked, taken as they are: a
terrain's and a water's triangles are counted from 1; `beyond(y,
texture, color, rectangle)` is new (ground to the horizon); the page
shell is `game.js` and a Rust macro, which `web/` here does not use
yet (its own host stays until a step moves it over).

## Notes for whoever files the first ask

- `xetal-x` here is built from the extensions' clone against the
  X_eTaL that repository is pinned to (its own `XETAL_COMMIT`), which
  is not always this repository's `XETAL_COMMIT`. A program that runs
  under `bin/xetal` and fails under `bin/xetal-x`, or the reverse, may
  be that difference: name both commits in the ask.
- `xetal-x --ext DIR` loads every extension in `DIR` and fails if one
  has no built library, so `scripts/extensions.sh` gives it a
  directory holding only the three built here.
