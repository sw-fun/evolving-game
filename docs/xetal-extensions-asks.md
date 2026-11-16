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

Still to ask when step 6 meets it: the extensions' page draws a board
but gives a running program no events (ticks, keys, clicks; its
`onPoint` hands a click to the page, not to X_eTaL). X_eTaL-games'
page does give its program events (`shared/microscope`).

## Notes for whoever files the first ask

- `xetal-x` here is built from the extensions' clone against the
  X_eTaL that repository is pinned to (its own `XETAL_COMMIT`), which
  is not always this repository's `XETAL_COMMIT`. A program that runs
  under `bin/xetal` and fails under `bin/xetal-x`, or the reverse, may
  be that difference: name both commits in the ask.
- `xetal-x --ext DIR` loads every extension in `DIR` and fails if one
  has no built library, so `scripts/extensions.sh` gives it a
  directory holding only the three built here.
