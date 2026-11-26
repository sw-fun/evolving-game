# Evolving Game

(A working title.)

[![The walk: a walker on the bridge of an isometric battlefield, the castle wall and gate beyond](images/screencapture.png)](https://sw-fun.github.io/evolving-game/)

Play it in a browser: the
[live demo](https://sw-fun.github.io/evolving-game/) (the picture
above is a link to it).

Evolving Game is a family of small castle-siege games that share one
world and grow into one larger game: what would a tower defense, a
logic puzzle, a tactics game and an explorer look like if they were
all the same castle, written in an array language, where every tower
against every creep is one table?

It is written in
[X_eTaL](https://github.com/softwarewrighter/X_eTaL), the
eXperimental Extensible Typed Array Language, and meant to be played
in a browser: X_eTaL compiled to WebAssembly, the castle drawn in 3D
by a Three.js player through
[X_eTaL-extensions](https://github.com/softwarewrighter/X_eTaL-extensions).
The rules, the world, the pictures and even the descriptions of the
3D models are X_eTaL; nothing about the game is computed in another
language.

Each game is small and playable by itself. Each is also a level or a
mini-game of one campaign, with a world map, levels and quests, in
which what you do in one game changes the castle the others are
played in: a puzzle solved in the keep powers the towers a defense
level starts with; a wall lost in a siege is a ruin to explore later.

## The games

| Game | Kind | What is distinctive |
| ---- | ---- | ------------------- |
| Castle Defense | tower defense, resources | enemies can destroy walls, opening new invasion routes |
| Rune Keep | logic puzzle | rune networks work like logic circuits: gates, state, timing |
| Dragonfire Tactics | turn-based squad tactics | fire spreads, ice blocks, lightning chains, wind bends shots |
| Siege Automata | programmable defenses | you program the towers: by hand, by rules, or in X_eTaL |
| Siege Engineer | physics puzzle | topple a tower or break a wall's support with limited shots |
| The Shattered Kingdom | exploration | the same castle before, during and after the siege |
| Siege Commander | real-time strategy | attack or defend across several elevations |
| An idler (not named yet) | idle game | the castle earns while you play something else, or nothing |
| The castle's maze and dungeon | a maze seen from inside; a top-down rogue-like | the portcullis shuts behind you; the maze's exits are the ways into the other games, and a stair leads down to a dungeon of monsters and treasure |
| Worlds to walk and fly | exploration, side quests | places made from a seed: a siege in winter through deep snow, a medieval town of crooked streets, a bazaar and a shanty town, with smoke and banners |

The first to be built is Castle Defense, starting with one level,
Defend the Bridge: one map, one road, three towers, three enemies,
five waves.

## Status

Early, and schematic. The
[live demo](https://sw-fun.github.io/evolving-game/) opens on the map
of the castle and its country: sixteen places, each a game, a level or
a place, shown as you find them. Three are games you can play (Castle
Defense's three levels, and the battlefield on foot); the rest say
what they will be and can be called done, so the whole castle can be
gone round. One world is carried through: the gold kept at the bridge
is the next level's to spend, and a place won shows where it leads.
Winning brings experience; quests and achievements are awarded as you
earn them, and the hall of deeds shows them. What you have won is
kept in your browser between visits (New game forgets it).
Add `?debug` to the address to see and open every place.

Behind it: the shared libraries every game will use (seeded chance,
the event loop, the world and its maps, the protocol a game follows,
and the views), the first 3D pieces made by X_eTaL through Blender,
the page, and the tests. It does not look like much yet: flat colors
and boxes. [`docs/architecture.md`](docs/architecture.md) says what
exists and how it fits together; [`docs/plan.md`](docs/plan.md) has
the decisions, the open questions and what comes next.

## How it is made

- **Rules in X_eTaL.** A game is one rules library and its data
  (TOML): entities are rows of a matrix, components its columns, and
  a rule is one expression over all of them.
- **One world.** The castle is five zones (battlefield, outer walls,
  courtyard, inner keep, cliffs and tunnels) kept as arrays: a grid
  of tiles with heights, with larger terrain worked out from a seed.
- **Assets from X_eTaL.** Each tower, creature and tile is described
  in X_eTaL as parts and named clips (idle, walk, fire, hit); the
  program drives [Blender](https://www.blender.org) in batch and gets
  back a 3D model a piece, as the
  [tower defense pieces](https://softwarewrighter.github.io/X_eTaL-extensions/blender/td/)
  of X_eTaL-extensions were made.
- **Drawn twice from one state.** A flat picture (SVG) and a 3D
  scene, both written by the game; the page's player draws the scene
  and decides nothing, as in the
  [live procedural city](https://softwarewrighter.github.io/X_eTaL-extensions/three/live/).
- **Repeatable.** The same level, seed and events always give the
  same game, so a list of events is a replay, a test and a save.

## Prerequisites

- [Rust](https://rustup.rs) (stable, via rustup) and
  [`just`](https://github.com/casey/just) (`brew install just` or
  `cargo install just`): to build the pinned X_eTaL the games run on.
- For the browser: the WebAssembly target and
  [trunk](https://trunkrs.dev):
  `rustup target add wasm32-unknown-unknown`, then `brew install trunk`
  or `cargo install trunk`.
- For the scripts: [uv](https://docs.astral.sh/uv/) (the Python
  environment is made with `uv venv`).
- To make the 3D models (optional; not needed to play or to test):
  [Blender](https://www.blender.org) 5.1.
- For the browser test: Google Chrome and [Node.js](https://nodejs.org) 22 or newer.
- For the pre-commit gate (maintainers): `sw-checklist` and
  `sw-markdown-checker`.

## Quick Start

With [`just`](https://github.com/casey/just) installed (`just` alone
lists the tasks):

```bash
just venv                            # the scripts' Python (uv), once
just xetal                           # build the pinned X_eTaL (bin/xetal)
just eval "'+ r_/_2 2 3 r_eshape r_ange 6"   # try it: row sums, 6 15
just test-lib                        # the shared libraries: types, tests, examples
just new-game walk "Walk"            # start a game from games/_template
just gate                            # the pre-commit gate
```

The games run a known-good X_eTaL, recorded as one commit in
`XETAL_COMMIT`: `just xetal` clones X_eTaL into `work/xetal` (not
tracked), checks that commit out, builds it and links the binary as
`bin/xetal`, which every recipe uses (never a `xetal` on your `PATH`).
`GAMES_COMMIT`, `LIBRARIES_COMMIT` and `EXTENSIONS_COMMIT` pin
X_eTaL-games (its shared libraries), X_eTaL-libraries and
X_eTaL-extensions the same way, all four on one X_eTaL; `just extensions`
builds `bin/xetal-x`, the X_eTaL that loads the blender, digest and
three extensions (needed to make the 3D models, not to test).

One game runs so far, at the terminal: a walker follows the road over
the bridge to the castle gate ([`games/walk`](games/walk)). Playing it
also writes each moment as a picture, `work/draw/walk/play-N.svg`,
which a browser opens.

```bash
just run walk                        # the scripted walk
just play walk                       # play it: type tick 1, key space; Ctrl-D leaves
just run walk picture.xtl            # the scene and the SVG picture, as text
just test-game walk                  # check it against its expected output
```

The castle, which goes round them all:

```bash
just run castle                      # the venues, the map and a placeholder, scripted
just play castle                     # the castle at the terminal
```

And in a browser, in 3D:

```bash
just extensions                      # once: the pinned X_eTaL-extensions (its 3D player)
just web                             # build the page into web/dist
just serve                           # http://127.0.0.1:8480/ until Ctrl-C
just assets                          # make the 3D pieces with Blender (optional; they are tracked)
just music                           # encode the music from its WAVs with ffmpeg (optional; it is tracked)
just browser-test                    # the page tested in headless Chrome
just pages                           # the site as it is published, into pages/
```

The walker follows the road by itself; the space bar stops and starts
it, and a click on a tile makes the game say what the tile is. **Walk
it yourself** (or `?game=foot` on the address) puts you on the
battlefield on foot: W A S D walk, Shift runs, the arrow keys and the
mouse turn you; find the gate. **Castle Defense** (`?game=defense`)
is the first real game: 1, 2 and 3 choose a tower, a click on grass
builds it, the space bar sends the next wave of enemies up the road. Add `?flat` to the address for the flat
picture without 3D. The **Debug** button (or the key `` ` ``)
shows a panel of what is playing: the program, the mode, the place
and the profile, as the game says them, and the music set, the phrase
sounding (its step in the plan and its seconds) and any bridge.
It also tells whether the program is running or has stopped (and
why), the events given, the slowest event and the memory used, and
its **Save report** button saves all of that with every event since
the start and the save it started from, a file that plays the same
game again. A game that stops (an error, or the WebAssembly failing),
or that does not answer eight keys or clicks in a row, says so on the
stage. **Watch the walk** and **Walk it yourself** end when the walk
is done (they have no menu), and say so too. Esc then, or the key `~`
at any time, starts the castle again from its save, at its menu; the
progress kept.

## Documentation

- [`docs/plan.md`](docs/plan.md) -- the goal, what the project builds
  on, the decisions, how the games combine, the layout, the roadmap
  and the open questions.
- [`docs/architecture.md`](docs/architecture.md) -- what exists and how
  it fits together: the flow, the libraries, a game as a mode, the
  page, the assets, the tests.
- [`docs/look.md`](docs/look.md) -- what the game is to look like, how
  that is measured, and what has to be added to get there.
- [`docs/desktop.md`](docs/desktop.md) -- the design of the desktop
  version (installers for Linux, macOS and Windows; not built yet).
- [`docs/style.md`](docs/style.md) -- how the game's X_eTaL is
  written; [`lib/README.md`](lib/README.md) -- the shared libraries.
- [`docs/research.txt`](docs/research.txt) -- the design conversation
  the game ideas came from (archival, not normative).
- [`CLAUDE.md`](CLAUDE.md) (also `AGENTS.md`) -- the rules the code is
  written by and the agent workflow.

## Architecture

```
TOML data, events -> rules (a mode) -> state -> a view -> text, picture (SVG), scene -> the page
```

Shared X_eTaL libraries in `lib/` (seeded chance, the event loop, the
world, the mode protocol every game follows, views); one directory a
game under `games/`; the castle's maps in `world/`; the pieces'
descriptions and the pieces in `assets/`; the page in `web/`. X_eTaL,
X_eTaL-extensions, X_eTaL-games and X_eTaL-libraries are used at
pinned, known-good commits. See
[`docs/architecture.md`](docs/architecture.md).

## Development

Development is test-driven and tracked with agentrail sagas; see
[`CLAUDE.md`](CLAUDE.md) (also `AGENTS.md`) for the agent workflow and
rules.

```bash
agentrail status          # the active saga and its steps
agentrail next            # the current step and its context
agentrail plan            # the saga's plan
```

## Related Projects

- [X_eTaL](https://github.com/softwarewrighter/X_eTaL) -- the
  language: a terse, statically typed, functional array language in
  the APL tradition, implemented in Rust.
- [X_eTaL-games](https://github.com/softwarewrighter/X_eTaL-games) --
  small games written in X_eTaL, each teaching one array-programming
  lesson; its tower defense is where Castle Defense starts from
  ([live catalog](https://softwarewrighter.github.io/X_eTaL-games/)).
- [X_eTaL-extensions](https://github.com/softwarewrighter/X_eTaL-extensions)
  -- native and browser extensions for X_eTaL: Blender in batch,
  interactive 3D with Three.js, voxel worlds, sound.
- [snowflow_demo-fork](https://github.com/softwarewrighter/snowflow_demo-fork)
  -- an endless snowy world in the browser whose terrain and gameplay
  are X_eTaL.
- [avoxelgame-fork](https://github.com/softwarewrighter/avoxelgame-fork)
  -- reading notes on a voxel game written in Dyalog APL.

## Links

- Blog: [Software Wrighter Lab](https://software-wrighter-lab.github.io/)
- Discord: [Join the community](https://discord.com/invite/Ctzk5uHggZ)
- YouTube: [Software Wrighter](https://www.youtube.com/@SoftwareWrighter)

## Copyright

Copyright (c) 2026 Michael A Wright

## License

MIT. See [`LICENSE`](LICENSE) and [`COPYRIGHT`](COPYRIGHT).
