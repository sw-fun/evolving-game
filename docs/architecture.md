# Architecture

What exists and how it fits together. The decisions behind it are in
[`plan.md`](plan.md); how the X_eTaL is written is in
[`style.md`](style.md).

## The flow

```
TOML data --+
            +--> a mode's rules --> state --> a view --+--> text (terminal, goldens)
events -----+        (X_eTaL)                (X_eTaL)  +--> picture (SVG, isometric)
                                                       +--> scene (calls for a 3D player)
```

Everything left of the last arrows is X_eTaL. A host (the command
line, the page) gives the program events and shows what it prints and
draws; it works out nothing about the game.

- **Data** is TOML, read and checked by X_eTaL: a map (`world/`), a
  scenario (`games/<slug>/*.toml`). A wrong file is a message naming
  the file and the field.
- **Events** are lines: `tick 0.05`, `key space`, `click 364 221`,
  `choose 1 3`. Time enters only as ticks, chance only from a seed, so
  the same events always give the same game: a list of events is a
  test, a replay and a save.
- **State** is a tuple of arrays, replaced by each event, never
  changed in place.
- **A view** says what is where: a map made ready to draw, and for
  each piece a model, a clip and eight numbers.

## The libraries (`lib/`)

| Library | Its part |
| ------- | -------- |
| `Game` | the game's name, in one place |
| `Rng` | chance from a seed: a draw is a function of (seed, stream) and a count; over X_eTaL-libraries' `Random` (Philox) |
| `Sim` | events as tuples, their lines written and read back, the host's next event (a bad line is an event, not a crash), a clock in whole milliseconds |
| `World` | maps as two matrices (kinds, heights) read from TOML and checked; the road found by a flood from the gate; zones |
| `Mode` | the protocol every game follows, the loop that plays any of them, the world state (names to whole numbers), outcomes, scenarios |
| `Sky` | the light of an hour of the day (sun, sky, haze) as numbers, the scene's `sun`, `sky` and `fog` calls, the flat picture's wash |
| `Terrain` | a map's ground as one smooth mesh (slopes, banks, the river's bed), the height under a point, the scene's `terrain` call |
| `View` | a view made into text, an isometric SVG picture (with the click's way back to a tile) and a scene; a stage of tiles or a smooth one |

Each library documents itself (`##` comments, with examples that are
run), and [`lib/README.md`](../lib/README.md) lists every function.
From the sibling repositories, by pin: X_eTaL-games' `Text`,
X_eTaL-libraries' `Strings` and `Random`.

## A game is a mode

One rules library (`games/<slug>/<Name>.xtl`) exporting eight names:

| Name | What it is |
| ---- | ---------- |
| `mode` | its name, as scenarios say it |
| `help` | how it is played, a few lines of text |
| `n_ew` | (scenario file, world state, seed) to a state |
| `s_tep` | a state and one event to the next state |
| `l_egal` | the event lines it takes now; others never reach `s_tep` |
| `s_tatus` | playing, won, lost or left |
| `v_iew` | what to show, as a view |
| `o_utcome` | (status, what it changed in the world, what it brings) |

A game has no loop: programs hand those functions to `md:p_lay` (the
host's events) or `md:r_eplay` (a script). X_eTaL is typed and each
game's state is its own, so a program that holds several games picks
one by the scenario's mode name; every outcome has one type, which is
what lets the games combine into one campaign. The world state, names
to whole numbers (`resource.gold`, `zone.battlefield.gate-open`), is
what one game leaves for another.

[`games/walk`](../games/walk) is the first mode: `Walking.xtl` (the
rules), `bridge.toml` (the scenario), `walk.xtl` (scripted),
`play.xtl` (played), `picture.xtl` (its scene and picture as text).

## The castle: the games as one

[`games/castle`](../games/castle) is the game the others are parts of.
Its file lists every venue (a game, a level, a place): the mode that
plays it and its scenario, its place on a small map of the whole
(`world/realm.toml`), what makes it known and what it needs. The map
is a mode (`Atlas`), a venue not built yet is one (`Sketch`), and one
program plays the map, then the venue chosen, then the map again, with
one world state carried through: that is what connects the games. Winning
brings experience, and deeds (quests and achievements, listed in the
same file as conditions on the world state) are awarded after every
game and shown in the hall of deeds (`Ledger`). The
loop's own command `choose 0 0` leaves any game for the map. In a
browser the world is kept between visits: the program writes it as a
text after every game and reads it when it starts (`[]N_PUT`,
`[]N_GET` of `castle.save`); the host holds that text and the page
stores it in the browser under one name (New game forgets it). At the
command line nothing is kept. Every
game's rules library is on the library path, each with a name of its
own in the repository.

## Shown three ways

`lib/View` makes of one view:

- **text**: the map's letters with the pieces on it and a caption;
- **the picture**: SVG, isometric, tiles and pieces drawn far to near;
  a click goes back to the tile whose top is under it, a raised tile
  hiding a lower one;
- **the scene**: calls, a line each, text that names no renderer:
  `view`, `camera` (no perspective, seeing what the picture draws),
  `tiles` (a kind a call; a built kind, bridge, wall or gate, with its
  model), `piece` (model, place, heading, clip, time, and where it
  will be, so a player moves it between ticks), and on a smooth stage
  `terrain` and `ground` (the ground as one mesh and its textures),
  `beyond` (ground to the horizon), `water`, and, lit, `sun`, `sky`
  and `fog`.

The scene travels inside the picture (`<metadata id="scene">`), and
what 3D replaces is in a group of class `flat`: a page that can draw
the scene does, one that cannot shows the picture.

## The page (`web/`)

The walk's `play.xtl`, the file the command line runs, as WebAssembly.

- `web/src` (Rust): the game's files gathered at build time under the
  paths X_eTaL asks for, a store, and the program started once and run
  from one wait for an event to the next (`xetal_play::Interactive`).
  Exports: start, feed a line, the picture, what was printed, the
  title, the footer's build facts, the sources.
- `web/static/app.js`: twenty ticks a second, keys and clicks as event
  lines; after each event, the scene to the board player
  (X_eTaL-extensions' `board.js`, Three.js, copied from its pinned
  clone at build time), or the flat picture where there is no WebGL.
- Four programs to choose between (the castle, which is what a page
  starts with, and three of its games alone), a Map button that
  leaves a game for the castle's map, and `?debug`, which shows every
  place on it, each with its own title and help; the
  board's place is measured again whenever it changes size; every key is given both as `key NAME` and as going down
  and up (`choose 2 CODE`, `choose 3 CODE`), and a locked pointer's
  movement as `move DX DY`: each game takes what it knows.
- Round the game: Start again; Help (the mode's own `help`, asked of
  the program); Sources (the game's files drawn by X_eTaL's own
  decorator, colored by token, in JuliaMono); About (what runs here,
  what draws it, thanks, links, the pins and the build); a one-line
  footer. With a dialog open the game is given no keys.

`just pages` builds the site; `just publish` pushes it as the
`gh-pages` branch and starts a workflow that deploys that branch
unchanged. Nothing is built on GitHub.

## Assets (`assets/`)

`Castle.xtl` describes each piece as Blender parts and named clips;
`castle-assets.xtl` has X_eTaL write the Python, runs Blender through
the blender extension, and hashes what was made into
`pieces/manifest.toml`. The `.glb` files (small) and previews are
tracked; Blender is needed only to make them again
([`assets/README.md`](../assets/README.md)).

## The pins

X_eTaL, X_eTaL-extensions, X_eTaL-games and X_eTaL-libraries are used
at the commits in `XETAL_COMMIT`, `EXTENSIONS_COMMIT`, `GAMES_COMMIT`
and `LIBRARIES_COMMIT`, cloned into the ignored `work/`; the four are
kept on one X_eTaL, and the gate checks it. What a sibling lacks is
written in an asks file (`docs/xetal-*-asks.md`) and taken there; it
is not fixed from here.

## Tests

| What | Where | Run by |
| ---- | ----- | ------ |
| every library function on small cases | `lib/test.xtl`, `lib/expected/test.out` (events in `test.in`) | the gate |
| each library's types and its documented examples | `lib/expected/<Name>.out`, the `## >>` lines | the gate |
| a game's programs against event scripts | `games/<slug>/expected/` | the gate |
| wrong maps and scenarios, a message each | `lib/fixtures/` | the gate |
| the pieces without Blender (the script's text, the files' hashes) | `assets/expected/`, `scripts/check-assets.py` | the gate |
| the page's engine plays as the command line does | `web/tests/play.rs` | the gate |
| the page in a browser (the scene, a click, a key, the footer, the sources, nothing asked of another site but the sources' font) | `scripts/browser-test.mjs` | `just browser-test`, before publishing |
| the pieces' clips, read back from the files | `assets/expected/clips.txt` | `just assets` |

A golden is rewritten only after its new output has been read
(`XETAL_BLESS=1`), and the commit says why.
