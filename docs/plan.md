# Evolving Game -- Implementation Plan

Source: `docs/research.txt` (an archival design conversation, not
normative) and the user's direction since. This document is the
roadmap; where it and the research disagree, this document governs
(the research proposes a Rust engine; the user chose X_eTaL, D4).

Development is driven by agentrail sagas: one active saga in
`.agentrail/`, finished or superseded sagas archived to
`.agentrail-archive/`. Each saga delivers one demonstrable milestone,
playable or runnable by the user. Every step is strict TDD (Red /
Green / Refactor) and ends with the gate (`just gate`) and a commit
before `agentrail complete`.

## The goal

A family of small castle-siege games written in X_eTaL that share one
world, one set of rules libraries and one set of generated assets,
built easiest first, each playable by itself, and each also a part of
one larger game: a campaign with a world map, levels, quests and
mini-games, where what the player does in one game changes the world
the others are played in.

So there are two products from the first day:

- **The games**, each a *mode*, released one at a time.
- **The campaign** (the combined game), which hosts every mode as a
  level or a mini-game on a zone of the shared world and keeps the
  world state between them.

The rule that makes the second possible: no game owns its own world,
event loop, save format, picture code or page. A game is a rules
library plus data; everything else is shared.

## What this builds on

The user's own repositories, read before planning; each is a model
for a part of this one and is used at a pinned commit, never copied
by hand and never edited from here.

| Repository | What it gives this project |
| ---------- | -------------------------- |
| `../../softwarewrighter/X_eTaL` | the language; the process this repository follows (agentrail, TDD, the gate); `docs/vendoring.md` (the `XETAL_COMMIT` pin and `scripts/xetal.sh`) |
| `../../softwarewrighter/X_eTaL-games` | how a game is written in X_eTaL: a rules library, a scripted game, `play.xtl` taking `[]E_VENT` ticks, clicks and keys, data from TOML, goldens under `expected/`, a page that shows only what X_eTaL draws; `lib/Ecs` (entities as rows, components as columns) and `lib/Svg`; and `games/tower-defense`, a working tower defense on an isometric board whose 3D scene is drawn by three.js from the game's own description |
| `../../softwarewrighter/X_eTaL-extensions`, `extensions/blender` | how assets are made: an X_eTaL program describes each piece as parts and named clips (`lib/Bpy.xtl`, `demos/Td.xtl`), drives Blender in batch, and gets back a `.glb` a piece with its clips, preview pictures, and a manifest of hashes (`demos/game-assets.xtl`, `demos/td-models.xtl`) |
| the same, `extensions/three` and `demos/NeonCity.xtl` | how a world is built and shown: a city worked out as arrays from a seed, written as a scene (one call a line, tables of numbers), and drawn in a browser by a Three.js player that decides nothing, with X_eTaL running as WebAssembly in the page; ride, fly or walk through it |
| the same, `extensions/scene` (the `voxels-*` demos) and `../../softwarewrighter/avoxelgame-fork` | a world as an array of cells: exposed faces by rotations, walking in the first person, digging and building, water and light as whole-array rules |
| `softwarewrighter/snowflow_demo-fork` | the ownership rule for a larger browser world: X_eTaL owns the procedural world and the gameplay, Rust owns platform access and nothing else; sources pinned; component workspaces for the Rust that is needed |

## The games, in build order

Ordered by complexity (lowest first) and by how much each one adds
for the games after it.

| #  | Game                  | Genre                              | Adds to the shared libraries                     |
| -- | --------------------- | ---------------------------------- | ------------------------------------------------ |
| 1  | Castle Defense        | tower defense, resources           | roads, towers against creeps as tables, shots, waves, gold |
| 2  | Rune Keep             | logic puzzle, mechanisms           | networks as matrices, logic, state machines, timing |
| 3  | Dragonfire Tactics    | turn-based squad tactics, elements | turns, squads, elemental terrain as cellular rules, an opponent |
| 4  | Siege Automata        | programmable defenses              | rules, then X_eTaL programs, driving towers and gates |
| 5  | Siege Engineer        | physics and engineering puzzle     | ballistics, structural damage, collapse          |
| 6  | The Shattered Kingdom | exploration and adventure          | walking the world in the first person, secrets, the world over time |
| 7  | Siege Commander       | real-time strategy                 | groups, formations, attacker and defender opponents |
| 8  | Idler (name open)     | idle game, background game         | time away as one long tick, earnings into the world state, a game running beside another |

Castle Defense is first because the research gives it a small, exact
first milestone (Defend the Bridge) and X_eTaL-games already has a
working tower defense to generalize from. Rune Keep is second because
it is the other low-complexity game and is unlike the first in every
way that matters (no clock, no combat), so the two together prove the
mode protocol before the campaign is built on it. The campaign shell
comes third, early on purpose: combining two real games is the test
of the design, and every later game then lands inside the campaign as
well as alone.

## Decisions

Recorded here as they are made. D1 to D5 and D15 to D17 come from
the user; D7, D8, D11, D13 and D18 were settled with the user on
2026-11-15 (the user's answers are noted in each); the rest are
defaults drawn from the repositories above.

- D1. Build the recommended games, the easier and proposed ones first.
- D2. The games must be combinable into one larger game with maps,
  levels, quests and mini-games.
- D3. The process is the X_eTaL one: agentrail sagas and steps, TDD,
  a gate.
- D4. The game is implemented in X_eTaL: the rules, the world and its
  generation, the pictures and scenes, the campaign, and the
  descriptions of the assets. Rust (and the vendored Three.js player)
  only host it: they load the program, hand it events, and show what
  it draws. Nothing about the game is computed outside X_eTaL; a page
  shows only what X_eTaL prints or draws.
- D5. Assets are made as X_eTaL-extensions makes them: X_eTaL programs
  describe every piece and its clips and drive Blender in batch; the
  world's larger shapes are worked out as arrays from a seed, as the
  neon city is.
- D6. Deterministic: the same scenario, seed and events give the same
  output, text for text. Time enters only as `tick` events, chance
  only through a seeded generator written in X_eTaL, so a list of
  events is a replay, a test and a save. The generator is `lib/Rng`
  over X_eTaL-libraries' `Random`: its Philox functions only
  (`s_ampleKeys`, `s_amples`), which use whole-number arithmetic and
  are counter-based (a draw is a function of seed, stream and count;
  the state to save is a count). Rules may not use `r_oll!`, `Random`'s
  `!` draws, `[]TS` or any other clock: their numbers are the host's.
  Time is kept in whole milliseconds (`lib/Sim`), never summed as
  fractions. A printed event log is itself a script (`sm:l_ine`,
  `sm:p_arse`), and a line that is no event is a `bad` event the game
  answers, never a crash (pinned by `lib/expected/test.out` and
  `sim-loop.out`).
- D7. The rules are 2D with height: a grid of tiles with elevation,
  kept as arrays. The picture is 3D: the same state described as a
  scene and drawn by the Three.js player with the pieces' models,
  first from a fixed isometric camera (which sees the board exactly
  as the flat SVG picture's linear map does, so clicks are turned
  back into tiles by its inverse), later ridden, flown or walked. The
  flat SVG picture always exists: it is the fallback, the terminal
  view and the golden. The player is Three.js, not a WebGPU renderer
  of our own (the user: whichever is less laggy): a board of some
  hundreds of instanced tiles and small animated models is far inside
  what Three.js draws at the display's rate, its glTF loading and
  clip playing exist and are tested in the sibling repositories, and
  what makes such a game lag is the rules, not the drawing. So the
  performance rules are these: X_eTaL runs at a fixed tick (20 a
  second to start, as tower defense does), never once a frame; the
  scene says where each piece is going (place, heading, clip, time)
  and the player moves and animates it between ticks at the display's
  rate; tiles and repeated pieces are instanced; a tick's X_eTaL time
  is measured and budgeted (Cross-cutting, Speed). The scene is text
  that names no renderer, so a WebGPU player can replace this one if
  measurements ever ask for it.
- D8. The world is one array-shaped castle of five zones
  (battlefield, outer walls, courtyard, inner keep, cliffs and
  tunnels). Authored maps are TOML; larger terrain and dressing are
  generated from a seed. Tiles with heights, not voxels (the user:
  whichever performs, scales and iterates better): a zone is a few
  small matrices, every rule is a 2D whole-array expression, maps are
  rows of text anyone can edit, and nothing is meshed. A zone that
  needs depth (tunnels, a wall breached cell by cell) adds layers to
  its own grid, as the voxel demos keep a chunk; the rest stay flat.
  As built (`lib/World`, `world/`): a map is a TOML file of two lists
  of rows, `tiles` (a letter a tile: `.` ground, `~` water, `=`
  bridge, `:` road, `#` wall, `^` cliff, `G` the one gate, `S` an
  entrance) and `heights` (a digit a tile, 0 to 9, in steps of half a
  tile's width), read into two matrices. A road is found, not drawn:
  the shortest way from an entrance to the gate over road, bridge,
  entrance and gate tiles, by a flood from the gate; a map with
  several entrances has a road for each, numbered in reading order
  (names for roads wait for a level that needs them). The battlefield
  is 20 by 20, as the research proposed: the river, the bridge and
  the castle wall each read as a full line across it, and the road of
  38 tiles has room to turn. `world/zones.toml` names the five zones
  and each one's map; only the battlefield's is drawn so far.
- D9. Data-driven: maps, zones, towers, units, waves, puzzles, levels
  and quests are TOML read by X_eTaL (`[]L_IST`, `[]T_ABLE`), checked
  when read, with messages naming the file and the field.
- D10. Headless first: every game runs at the command line with
  `bin/xetal`, scripted (`<slug>.xtl`) and played (`play.xtl`, events
  from stdin). Behavior is pinned by goldens under `expected/` with
  `.in` event scripts, as in X_eTaL-games.
- D11. X_eTaL and its sibling repositories are used at known-good
  commits recorded in tracked one-line files (`XETAL_COMMIT`,
  `EXTENSIONS_COMMIT`, `GAMES_COMMIT`, `LIBRARIES_COMMIT`), cloned
  into the ignored `work/` by scripts, moved only at a saga start or
  when an ask has landed, in a commit of their own with the goldens
  run again. The four are kept on one X_eTaL: a sibling is pinned
  only at a commit whose own `XETAL_COMMIT` is ours (the user,
  2026-11-15: bring the siblings forward first; all four moved to
  X_eTaL 8c49bd8 that day, and X_eTaL-libraries was added for its
  seeded `Random`).
- D12. What a sibling repository lacks is asked of it, not fixed from
  here, and a workaround is never hidden (status, kind, why, a minimal
  repro, the workaround). Three files, in the order of how likely the
  user expects each to be needed: `docs/xetal-libraries-asks.md` (a
  library change: most likely), `docs/xetal-extensions-asks.md` (an
  extension change: possible), `docs/xetal-asks.md` (a language
  change: unlikely). `docs/agentrail-asks.md` is the same for
  agentrail.
- D19. The language is extended with macro libraries (`.xtlm`), not
  by asking for syntax (the user, 2026-11-15): where a game wants a
  form X_eTaL does not have (a component list, a rule table, a mode's
  declaration), it is a macro in `lib/`, as X_eTaL-games' `Ecs.xtlm`
  is. A library or macro library starts here; when it is general
  enough to serve other repositories it moves to X_eTaL-libraries
  (asked in `docs/xetal-libraries-asks.md`) and is used from there by
  pin. A helper a second game needs moves from the game to `lib/`.
- D13. Generated pieces are tracked while they stay small (the user):
  a `.glb` of at most 256 KB and its preview picture are committed
  under `assets/pieces/` beside `manifest.toml` (every file's
  SHA-256), so a clone plays without Blender (the twelve tower
  defense pieces are 12 to 88 KB each, half a megabyte together). A
  larger file, and every video, stays out of git and is published
  with the site; the gate fails on a tracked asset over the limit or
  one whose hash is not the manifest's. Blender is needed only to
  make assets, never by the gate, which checks the script X_eTaL
  writes (text) and the hashes.
- D14. Evolving Game is a working title (the user); the repository is
  `sw-fun/evolving-game` on GitHub. The display name is one
  definition in one library, so a rename is a one-line change.
- D15. The product is a browser game: X_eTaL compiled to WebAssembly
  running in the page, through X_eTaL-extensions (the `three`
  extension's `th:s_how!` and its Three.js player, the extension
  bridge), as the live neon city does. This repository adds as little
  host code as it can; what the extensions' browser side lacks for a
  game (events in, models with clips, sound, storage) is an ask of
  X_eTaL-extensions (D12), not a host written here. The command line
  (D10) remains for tests, replays and balancing.
- D16. A desktop version will follow, designed now and built later
  (the user, 2026-11-15; `docs/desktop.md` is the design): the same
  page wrapped in a web view by Tauri, with installers for Linux,
  macOS and Windows (Saga 12). So from the first page on: the site is
  self-contained (nothing loaded from another site, works from local
  files and offline), saves go through one small storage interface,
  and nothing assumes a browser tab (window size, full screen, quit).
- D17. Shipped builds deter casual game hacks only (the user,
  2026-11-15; the source is public, so this is not secrecy): programs
  and data are packed rather than left as readable files, and saves
  and scores carry a check so an edited one is noticed. Both the
  published site and the desktop build are packed, unless a good
  reason not to appears. The packing
  is a build step over unchanged sources; the goldens run on the
  plain sources and again on the packed build.
- D18. The art reference is the castle siege picture the research
  was drawn from (the user: use the original and riff on it), kept
  as `docs/images/castle-siege.png`: the zones, the palette and the
  pieces' shapes are taken from it, in the chunky, flat-colored look
  the generated pieces have, not copied stroke for stroke.

## The seams that make the games one game

Designed in Saga 1 and proven in Sagas 2 to 4; every later saga must
keep them.

- **Mode.** A game is one X_eTaL rules library following one
  protocol, an extension of X_eTaL-games' (new, move, legal, status,
  view): start from a scenario, a world state and a seed; take one
  event (a tick, a click, a key, a command) and give the next state;
  say what is legal; report status; give its view; and at the end
  give an outcome. The shared loop owns events and time; the mode
  owns only its rules.
  As built (`lib/Mode`, `games/walk`): a mode's library exports
  `mode` (its name), `n_ew` ((scenario file, world state, seed) to a
  state), `s_tep` (state and one `lib/Sim` event to a state),
  `l_egal` (the event lines it takes now, a capital word for any
  value), `s_tatus` (0 playing, 1 won, 2 lost, 3 left), `v_iew` (text
  for now; a picture and a scene from Saga 1 step 5) and `o_utcome`
  ((status, changes, rewards)). The loop is `md:p_lay` (the host's
  events) or `md:r_eplay` (a script): an event that is not legal never
  reaches `s_tep`, the view is shown when it changes, and it stops
  when the status is not playing or the events end. X_eTaL is typed
  and states differ, so there is no table of modes at run time: a
  program imports a mode's library and hands its functions to the
  loop, and a program holding several picks by the scenario's `mode`
  name; every `o_utcome` has one type, so what comes back is the same
  whichever was played (pinned in `lib/test.xtl` with a puzzle that
  has no clock and a two-sided game of turns). A rules library is
  named unlike its game's program (`Walking.xtl` beside `walk.xtl`):
  the two names are one file on a disk that ignores case.
- **Scenario.** A TOML file naming a mode, a zone map, the mode's own
  tables (waves, puzzle wiring, squads) and the win and loss
  conditions. A level is a scenario; a mini-game is a small scenario.
- **World state.** What persists between scenarios, as arrays: the
  condition of every zone (walls standing or breached, mechanisms
  powered, towers built and how they are programmed), the player's
  inventory and resources, and the facts quests test. A mode reads
  the world state it is given and returns the changes it made.
  As built: whole numbers under names, `(names, values)`; the first
  part of a name says what it is (`zone.battlefield.gate-open`,
  `resource.gold`, `fact.keep-won`); a name never set is 0 and the
  empty world is valid. Changes are set, rewards are added
  (`md:a_fter`): changes however the scenario ended, rewards only
  when it was won.
- **Outcome.** Won, lost or left, plus the world-state changes and
  the rewards. The campaign applies it; a mode played alone discards
  it.
- **Campaign.** A graph of levels over the world map: which scenario
  each node runs, what unlocks it, and the quests (conditions over
  the world state and the event log) that span several levels.
- **View.** What a mode shows, in two forms from the same state: a
  picture (SVG text) and a scene (the player's calls: tiles, each
  piece's model, place, heading, clip and time, the camera). Modes
  give views through the shared library; hosts and players decide
  nothing.
  As built (`lib/View`): a mode's `v_iew` gives a view value, the
  stage (its map made ready to draw once) with a model name, a clip
  name and eight numbers a piece (place, heading, time into the clip,
  where it will be and in how many seconds) and a caption. The
  library makes three things of it: text (the terminal and the
  goldens), the flat picture (SVG, isometric, tiles and pieces far to
  near, a click turned back into the tile whose top is under it,
  raised tiles hiding lower ones) and the scene, calls a line each as
  X_eTaL-extensions writes scenes: `view`, `camera` (no perspective,
  30 degrees up along the board's diagonal, so it sees what the
  picture's map draws), `tiles` (every tile of a kind in one call, to
  be instanced) and `piece`. The scene travels as the picture's
  `<metadata id="scene">`, and what 3D replaces is in a group of class
  `flat`, as X_eTaL-games' tower defense does. The three
  extension's board player draws this vocabulary (asked for and
  landed on 2026-11-15, X_eTaL-extensions 4fd5d87): `th:p_age!` of
  the walk's scene is the battlefield in 3D, the walker a plain shape
  until its model exists.
- **Save.** The world state, the campaign position and, for a level
  in progress, the scenario, seed and events so far.

## Layout (planned)

```
XETAL_COMMIT EXTENSIONS_COMMIT GAMES_COMMIT LIBRARIES_COMMIT   the pins (D11)
lib/           shared X_eTaL libraries (.xtl) and macro libraries (.xtlm):
               Game, Sim, Rng, World, Mode, View, Campaign
games/<slug>/  one game: <Name>.xtl (rules), <slug>.xtl (scripted),
               play.xtl, *.toml (data and levels), expected/, README.md
world/         the castle: zones.toml and a TOML map a zone (tiles, heights)
campaign/      the combined game: its library, levels, quests, world map
assets/        X_eTaL describing the pieces and the castle; pieces/ (the
               small .glb files and previews) and manifest.toml
web/           the page: the extensions' WebAssembly evaluator and Three.js
               player, put together for this game (as little as can be)
scripts/       what the just recipes call
docs/          plan.md, style.md, architecture.md, desktop.md, the asks
               (xetal-asks.md, xetal-libraries-asks.md,
               xetal-extensions-asks.md, agentrail-asks.md)
work/ bin/     ignored: the clones, the built xetal, generated assets
pages/         ignored: the local build of the site
```

Any Rust follows the X_eTaL limits (functions of at most 25 lines, 5
functions per module, 5 modules per crate; sw-checklist enforces the
looser 50 / 7 / 7). X_eTaL follows `docs/style.md`, started in Saga 1
from X_eTaL-games' style guide.

## Saga 1 -- foundations  [ACTIVE]

Goal: the shared libraries exist and show something. A trivial `walk`
scenario plays at the command line from an event script, pinned by a
golden; the Defend the Bridge map is drawn flat (SVG) and as a 3D
scene; its first pieces are made by X_eTaL through Blender; the
browser shows the scene with those pieces from the isometric camera,
the tile under the pointer named, a unit walking the road; the live
demo is published; the gate is in place.

| #  | Step slug          | Delivers                                                   |
| -- | ------------------ | ---------------------------------------------------------- |
| 1  | workspace-scaffold | the pins and `scripts/xetal.sh` (`bin/xetal`), the extensions build (`xetal-x`), `justfile`, `scripts/gate.sh` (goldens, library tests, type check, markdown, spelling), `games/_template`, a first program with its golden, `docs/style.md`, `.gitignore`, the uv environment for scripts |
| 2  | sim-core           | `lib/Rng.xtl` (a seeded generator in X_eTaL), `lib/Sim.xtl` (the state as a tuple, the event loop over `[]E_VENT`, the event log), `lib/test.xtl`; goldens showing the same seed and events give the same output and another seed does not |
| 3  | world-map          | `lib/World.xtl`: tiles with kind and elevation, zones, maps and named roads read from TOML and checked with named errors, the road found by a flood; the 16 by 10 or 20 by 20 bridge-and-gate map; a text drawing of a map as a golden |
| 4  | mode-contract      | `lib/Mode.xtl`: the protocol, scenarios, world state, outcomes; `games/walk` (one unit follows the road to the gate); scripted and played from an event script; a replay golden; stub puzzle and turn-based modes proving the protocol fits them |
| 5  | view-and-iso       | `lib/View.xtl`: the isometric linear map and its inverse (click to tile, with elevation), the SVG picture, and the scene (the player's calls) from the same state; goldens of both texts for the bridge map with a walker |
| 6  | web-shell          | `web/`: the page running `games/walk/play.xtl` unmodified as WebAssembly, events from the page, the picture, and the Three.js player drawing the scene, each piece a plain shape until the models of step 8 exist; `just serve`; a browser test |
| 7  | pages              | `scripts/build-pages.sh`, the footer (copyright, license, repository, build host, commit and time, the pins), the live demo published and linked from the README; `images/screencapture.png` inline early in the README as a thumbnail that links to it |
| 8  | castle-assets      | `assets/Castle.xtl` on the blender extension's `Bpy.xtl`: the first pieces (ground, water, bridge, wall and gate tiles; a walker with idle and walk clips), `just assets` making each `.glb`, previews and `manifest.toml`; the written script and the clips read back as goldens; the page then draws the pieces, and the demo is published again |
| 9  | foundations-docs   | `docs/architecture.md`, README current with every command a golden, the saga retrospective in this file |

## Saga 2 -- defend-the-bridge (Castle Defense, first playable)

Goal: the research's first milestone, playable in the browser and at
the command line: one map, one road, three tower types (archer, fire,
ice), three enemy types, five waves.

Planned steps: generalize X_eTaL-games' `Defense.xtl` onto the shared
libraries as a mode (creeps on the road; towers against creeps and
shots against creeps as tables; gold, placing, upgrading; waves;
victory and defeat); the towers and enemies as data; their pieces
described in `assets/` with idle, fire, walk and hit clips; the
toolbar and wave display; many seeded games run headless to balance;
the level in the live demo; docs and retrospective.

## Saga 3 -- rune-keep (first puzzles)

Goal: a handful of puzzles in the inner keep: activate colored runes
in the right order and route magical energy between towers, gates and
portals without overloading a circuit.

Planned steps: the network as matrices (nodes, links, colors,
capacity); evaluation by ticks to a fixed point, so timing puzzles
work; gates and state; the puzzle data format and a solver used by
the tests to prove each shipped puzzle solvable; the pieces (runes,
conduits, portals, glowing); ten puzzles of rising difficulty; docs
and retrospective. The mode protocol is revised here if a game
without a clock strains it.

## Saga 4 -- campaign-shell (the combined game, first version)

Goal: one game containing the first two. A world map of the five
zones; a short campaign in which a Rune Keep puzzle powers the towers
that a Castle Defense level then starts with; a quest that spans
both; save and resume in the browser.

Planned steps: world state and its changes; the campaign and level
data; unlocking; quests as conditions over world state and events;
saves (the browser's storage; a file at the command line); the world
map screen, the castle seen whole; a mini-game entry (a small
scenario launched from inside a level); the first campaign; docs and
retrospective.

## Saga 5 -- castle-defense-2 (the distinctive mechanic)

Enemies destroy walls and open new invasion routes: wall cells with
hit points, the road found again by the flood whenever a wall falls,
repair between waves, siege engines and dragons (flying units that
ignore walls), the outer walls and courtyard zones, more levels in
the campaign.

## Saga 6 -- castle-world (the castle from a seed)

The whole castle and its surroundings worked out as arrays from a
seed, as the neon city is: terrain, cliffs, walls, towers and
dressing; the authored maps set into it; the camera riding and flying
over it between levels.

## Saga 7 -- dragonfire-tactics

Turn-based squads on the grid: turns and action points, heroes,
mages, archers and dragons, elemental terrain as cellular rules (fire
spreads, ice blocks movement, lightning chains, wind bends
projectiles), an opponent, tactics levels in the campaign.

## Saga 8 -- siege-automata

Programmable defenses in three control modes: manual, rule-based
(conditions and actions chosen in the interface, kept as tables) and
programmed in X_eTaL itself (a tower's behavior as a function over
the table of creeps in reach). Programs are world state, so a defense
programmed here is the one a Castle Defense level runs. Challenge
levels scored against identical seeded waves.

## Saga 9 -- siege-engineer

Catapults, trebuchets and ballistae: ballistics for every shot at
once (angle, counterweight, projectile type), structures with
supports, damage and collapse, limited-ammunition puzzles, and siege
engines in the other modes using the same rules.

## Saga 10 -- shattered-kingdom

The castle walked in the first person: all five zones, tunnels and
secrets, artifacts and portals, digging, and the same world before,
during and after the siege, the zones as the earlier games left them.

## Saga 11 -- siege-commander

Real-time strategy, attacker or defender: selection and orders,
groups and formations, elevation affecting sight, range and movement,
capturing bridges, breaching walls, opponents for both sides.

## Saga 12 -- desktop (installers for Linux, macOS and Windows)

The browser game wrapped in a web view as a desktop application
(Tauri, D16; the design is `docs/desktop.md`):
the packed build of D17 (programs and data in one packed bundle, the
save check), saves in the user's data directory through the storage
interface, window and full-screen behavior, an installer a system
built by a workflow, signing and notarization where a system asks for
it, and the goldens and the browser test run against the packed
build. Runs after several iterations of the games (the user,
2026-11-15), not before.

## Idler (asked for by the user, 2026-11-15; not in the research)

An idle game: the castle earns while you do something else, or
nothing. It may be a mode of its own (a level you sit in), a side
quest, a game that runs in the background while another mode is
played, or several of these: to be decided with the user (Open
questions). What the seams already give it:

- Time enters only as tick events (D6), so time away is one long
  tick: the idler's rules are asked what an hour did, in one step, as
  a whole-array expression over its producers, not by replaying
  72000 ticks. Its `s_tep` must give the same state for one tick of
  an hour as for an hour of ticks (a golden).
- What it earns is the world state (`resource.gold` and its kin), so
  the other games spend it and their outcomes feed it.
- What it needs that nothing has yet: the campaign giving a second
  mode the events (or only the ticks) while the first is played, and
  the page saying how long it was closed (an event, never the clock
  read by rules).

Where it goes in the order is open; it is small, and it would give
the campaign shell (Saga 4) something to do between levels.

## Later

- Two players comparing defense programs against identical waves.
- Sound and music (the audio extension: samples computed in X_eTaL).
- Videos of the games made with the blender extension's `Video.xtl`.
- A level editor in the browser.

## Cross-cutting (insert as steps when due)

- Speed: a timing of every game's scripted run, tracked, failing when
  one slows by more than a set fraction.
- Accessibility: keyboard play, colors that do not rely on hue alone,
  text size.
- Touch input and a phone layout for the live demo.
- A nightly run of every golden and a long balance simulation.

## Open questions (for the user)

Answered on 2026-11-15 and recorded above: the title (D14), the
repository (D14), the order (Castle Defense first), the player (D7),
tiles not voxels (D8), X_eTaL-games' libraries by pin for now with a
move to the libraries repository later (D11, D12), tracked pieces
(D13), the art reference (D18), Tauri (D16), the desktop saga later,
after several iterations of the games (Saga 12), and both the site
and the desktop build packed (D17).

Still open:

1. The art reference file: `docs/images/castle-siege.png` is not in
   the repository yet; the user is to add it (Saga 1 step 8 reads it).
2. The Idler (see its section): a mode of its own, a side quest, a
   game in the background of the others, or several of these; what
   it earns and what spends it; its name; and where it comes in the
   order.

Settled since: the repository exists and is public, and GitHub Pages
is enabled on it, deploying from GitHub Actions (the user,
2026-11-15).
