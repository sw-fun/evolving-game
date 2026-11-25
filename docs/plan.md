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
  macOS and Windows (Saga 13). So from the first page on: the site is
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
- D20. Castle Defense has an attacker's side, its own mode `attack`
  (`games/defense/Attacking.xtl`), beside the defender's `defense`
  (the user's "every game has both sides", 2026-11-18). The attacker
  sends creeps (1 2 3 choose runner, brute or shield bearer; space,
  or a click on the drawn buttons, sends one) out of the siege cart,
  paying each one's `cost` (a seventh enemy field) from a purse that
  is the world's gold but never less than the level's `start = ["gold
  N"]`. The defender is scripted, deterministically: the level's
  `defender` list says each tower, its tile and the second it stands.
  Won when the level's `win = ["through N"]` creeps reach the gate
  (the bridge stormed, the purse's rest kept as the world's gold, 10
  experience and 5 a creep through); lost when the purse cannot pay
  for the cheapest creep and none is left to come or on the road
  (the world is not changed). The attacker's levels say no `facing`:
  the map as drawn, seen from the camp toward the castle. Its two
  levels (`attack-1.toml`, `attack-2.toml`, venues `bridge-attack-1`
  and `-2`) follow the camp on the attack road, each proven won and
  lost by `expected/attack.in`. For now `Attacking.xtl` repeats
  `Defending.xtl`'s small readers and its tower rule (`h:t_able`,
  `h:n_umber`, `h:o_nRoad`, `h:o_ut`, `h:s_hoot`, the last with the
  towers not yet standing left out), because `Defending.xtl` was
  being changed at the same time; the shared part is to move to a
  `lib/` library both use, in a step of its own.
- D21. Music (the user, 2026-11-21): the user's own looping game
  music (music-pipe-rs, MIT, Michael A Wright): four sets (calm,
  explore, sinister, battle), each of four phrases A (establish), B
  (the bed), C (develop), D (turnaround), every phrase a seamless
  loop in D that ends on Asus, every A starting on D, so any set may
  follow any phrase at a phrase's end; each set also comes in two
  other tempos (the same music rendered from MIDI slower and faster).
  The 48 phrases are committed encoded as Ogg Opus at 64 kb/s
  (`assets/music/`, about 10 MB, the user's decision; never the
  WAVs), made by `just music` from the WAVs with ffmpeg and checked by
  the gate against `assets/music/SHA256SUMS` without ffmpeg. X_eTaL
  decides the music (`lib/Music.xtl`, `games/castle/music.toml`):
  which set plays at each kind of place, and a plan of phrases from
  rules and a seed through `lib/Rng`: rounds of A to D, A, C and D
  once in a row and B at most twice, no phrase more than 3 times in
  any 8 (the user, 2026-11-22: "not certain tracks too many times in
  a row"); after a round of the home set, by weight, a round of a
  companion set (calm visits explore; battle explore or sinister ...)
  or the home set in another tempo; at least 96 phrases (about forty
  minutes) before it repeats. The battle's brass figure (two chord
  stabs, the user's "honk honk") is in battle-A and, softer, battle-C
  (found in the MIDI): a battle round plays C at most once and
  seldom, and companion rounds thin out A; the picture carries it in its
  metadata id="music" with the loudness (`volume(v)`). The loudness
  is the sound every mode's loop keeps (`lib/Mode`, the user: a
  strip of icons on every view): it starts from the world's
  `settings.music` (0 to 10, default 6) and `settings.mute`; every
  picture shows it in a strip in a corner (speaker, quieter,
  the level, louder), and a click on those icons or the keys \, [
  and ] change it before the mode sees the event (a mode that names
  the key itself, the maze's M, or is being typed into, "key TEXT",
  keeps the keys; the icons always work); what changed comes back
  with the mode's outcome and is kept in the world. A settings screen
  and the strip are one sound, at once (the user, 2026-11-22: a
  change in Settings must be heard at once): after a key or a
  click the loop reads the mode's outcome, and when what it names for
  settings.music and settings.mute has changed, that is the sound
  (the front door's outcome names its Settings rows even before it is
  won); a strip change is told to a mode that takes "choose 4 LEVEL"
  and "choose 5 MUTE", so Settings' rows show it. The
  page only plays the line: the plan's phrases back to back on the
  audio clock, each trimmed to the line's seconds, round and round;
  a new plan at the end of the phrase playing, from its A; but a fast
  change through a bridge when the set changes (the user,
  2026-11-24: leaving a battle, the battle music went on for many
  seconds; "its loop should cross fade to the short transition piece
  and then cross fade to the next start of loop"). Bridges are
  music-pipe-rs's short pieces (release, to-victory, fall,
  call-to-arms into a battle, riddle into a walk or a maze; each
  quotes a public-domain tune, `docs/music-credits.md`):
  `music.toml` says each one's seconds, lead-in and handoff and which
  links which sets; X_eTaL names the bridge in the lines
  (`bridge('release', 14.25, 2.25, 11.25)`) when the place's set
  differs from the set of the place left (`play.xtl` keeps
  music.came and music.ended from a venue's end until the next place
  is chosen); after a battle won the plan's first round is the
  victory set, after one lost defeat (after-won-SET, after-lost-SET).
  The page fades the phrase playing out (0.75 s) at its next bar line
  (`seconds('battle', 26.666667, 16)`: 16 bars), starts the bridge
  there, its lead-in swelling over the fade, and the new plan's A at
  the handoff (0.3 s fade-in), the bridge's tail ringing under it. Known
  risk: Safari's Opus decoding (older versions cannot); an `.m4a`
  (AAC) copy as a fallback is a later option. Sound on the page is
  an ask of X_eTaL-extensions (D15; `docs/xetal-extensions-asks.md`):
  this repository's `web/static/music.js` plays it until then.

- D22. Settings during play pause the game and resume it (the user,
  2026-11-22: "opening settings during gameplay should allow resuming
  when settings are exited (options: return to playing; exit to start
  menu)"; "going into settings disrupts the play and exiting settings
  causes the level to restart"). Every game has a settings panel,
  `lib/Mode`'s loop's own, like the sound strip: the strip's gear (or
  the key ,) opens it over the mode's picture; while it is open the
  mode is given no event at all, ticks included, so the game stands
  still; its rows are the music's volume and on or muted (the loop's
  sound, heard at once and kept as the strip's is), then "Resume
  playing" (the same state, nothing restarted; also the gear, the key
  , or Esc) and "Exit to start menu" (the game left as "choose 0 0"
  leaves it, and the castle goes on to the profile's home on the front
  door, not the road; the loop says so with menu.go 1). The sound's
  keys are [ (quieter), ] (louder) and the backslash (mute), and , the
  panel; M is always a game's map (the user, 2026-11-22: M toggles the
  maze's mini map, not the music).
## The seams that make the games one game

- D23. A debug panel on the page (the user, 2026-11-24: "a toggleable
  debug mode that shows current status like which game, which mode,
  which music piece name and segment"). The page's own diagnostic, like
  the header's milliseconds a tick and frames a second, never part of a
  game's picture: the Debug button or the key ` shows it, off unless
  asked for, kept in the browser. What it says of the game comes from
  X_eTaL, a line status('MODE', 'PLACE', 'PROFILE') in each picture's
  music metadata (the castle's play.xtl puts it beside the music it
  names); what it says of the music is the page's player: the phrase
  sounding, its step in the plan, how far into it, and any bridge. It
  decides nothing and shows no rule.

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
  The page (`web/`, Saga 1 step 6): the walk's `play.xtl`, the same
  file the command line runs, as WebAssembly; the page gives it
  `tick 0.05` twenty times a second, keys and clicks as event lines,
  and after each event hands the scene in its picture to the board
  player, or shows the flat picture where there is no WebGL (`?flat`).
  Measured in headless Chrome (software rendering) on the 20 by 20
  battlefield: about 9 ms of X_eTaL a tick, of the 50 ms a tick has;
  most of it is writing the picture's 56 KB of SVG, which a later step
  can skip when the 3D view is the one shown. A real browser's frame
  rate is to be read from the page's corner when the user tries it.
  The live demo (step 7), https://sw-fun.github.io/evolving-game/:
  `just pages` builds the site into the ignored `pages/` and
  `scripts/browser-test.mjs --dir pages` tests it served under a path;
  `just publish` pushes it as the only commit of `gh-pages` and starts
  `.github/workflows/pages.yml`, which deploys that branch unchanged
  (the repository's Pages source is GitHub Actions; nothing is built
  on GitHub; the actions are pinned to full commits);
  `scripts/browser-test.mjs --url` tests the deployed site. The footer
  names the build (commit, host, time) and the four pins; a Sources dialog
  shows the game's files as X_eTaL renders them (decorated, colored by
  the kind of token, in JuliaMono from a CDN as the X_eTaL live demos
  do: the user, 2026-11-15, after the first version showed them as
  typed, in one color, in a pane squeezed to four lines), plain until
  the packed build of D17.
  The pieces (step 8): `assets/Castle.xtl` describes a walker (idle
  and walk clips) and five tiles (ground, water, bridge, wall, gate)
  as Blender parts; `just assets` has X_eTaL write the bpy script,
  runs Blender through the blender extension, and copies each `.glb`
  (2 to 54 KB) with its preview and `manifest.toml` (SHA-256s) into
  `assets/pieces`. The gate needs no Blender: the script's text is a
  golden (`assets/expected/pieces.out`), and the tracked files must
  match the manifest (`scripts/check-assets.py`); the clips read back
  from the files are a golden checked when the pieces are made. The
  colors are the board's, chosen without the art reference (the user
  said to go on, 2026-11-16), all in one place in `Castle.xtl`. The
  page draws the walker's model; the tiles are still the player's own
  columns, which take a color and no model (an ask).
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

## Saga 1 -- foundations  [DONE]

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

### Retrospective (2026-11-16)

Delivered, in nine steps over two days: the tooling and the gate; the
libraries `Rng`, `Sim`, `World`, `Mode` and `View`; the first mode,
`games/walk`, played at the command line and in a browser from the
same file; the battlefield map; the walk drawn as text, as an
isometric picture and as a 3D scene; six pieces made by X_eTaL through
Blender; the live demo, https://sw-fun.github.io/evolving-game/,
published and tested where it is served; `docs/architecture.md`.

What went well:

- Goldens as the specification. Each library's behavior was pinned
  as it was written; the same event script tests the command line,
  the page's engine (`web/tests/play.rs`) and the browser.
- Asking the siblings. The board player was asked for and landed in
  X_eTaL-extensions the same day; the four repositories were brought
  onto one X_eTaL in an evening. Nothing of a sibling was copied or
  worked around in secret.
- One program everywhere: `play.xtl` runs unmodified at the terminal
  and in the page, and the host has no rule of the game in it.

What to change:

- Look before building. A seeded generator was written before the
  sibling repositories were searched for one; the search found two,
  and a version conflict. Search the X_eTaL repositories first.
- Look at what is published. The first sources pane showed four
  lines of raw text; its test checked the text, not what a person
  sees. A page's test includes a screenshot that is looked at.
- X_eTaL's rules cost time until learned: Int and Float do not mix; a
  name with an underscore is a function and a plain one a value; a
  left operand comes before quoted function operands; a long
  expression continues only inside parentheses; a rules library is
  named unlike its program. They are in `docs/style.md` now.
- The steps were reordered once (the page before the pieces) and the
  plan's order was right the second time: show something first.
- The look was nobody's step. The user asked when the game would look
  better, and no saga answered; the next one does.

Asks raised: X_eTaL-extensions, a board player (landed), a page shell
for a game (open; `web/` here does it), tiles from models (open);
X_eTaL-libraries, Philox in bulk is slow (open; nothing waits on it);
agentrail, em dashes in its generated briefing (open). None of the
language.

## Saga 2 -- the-look  [CLOSED EARLY, 2026-11-16]

Closed by the user's decision: "start Castle Defense now, do the look
work as needed". Done: the targets (`docs/look.md`), terrain,
materials, light, the page's Help, About and footer, the look
switched on (lit, shadowed, smooth ground, water, ground to the
horizon), and a camera that walks (the battlefield on foot, W A S D
and the mouse; the user tried the mouse on real hardware and it
works). X_eTaL-extensions landed every ask in a day. Not done, and
carried into the sagas that need them: particles (arrows, fire,
smoke: Castle Defense), figures with rigs (its enemies), cloth
(banners), the river and wall past the map's edge, the winter camp
and the town as worlds, `docs/games.md` (the games' designs), and
sending a scene's unchanging lines once (a tick's picture is 120 KB).
What it taught: ask the sibling early and build this side first (the
asks landed faster than the steps that wanted them); look at every
page before publishing; never chain a publish behind a pipe.

The steps as planned (the first six, and the seventh in part, were
done):


The user, 2026-11-16: "go on to step 9, then start The look". Goal
(see The look, and A showcase): the scene there is stops looking like
boxes. Measured on two test scenes, the board (the bridge and the
walk) and one small world to walk through, by the frame rate on a
middling laptop, the size of the site, and captures the user compares
with what was asked for: less toy, more real; textures, light,
particles; and a town's life (smoke, cloth, carts, crows).

Most steps need the player (X_eTaL-extensions) or the asset library
(Bpy.xtl) to grow: each such step writes its ask first, with the
scene call it wants and a scene to test it on, and builds here what
can be built without it (the X_eTaL that writes the call, its
goldens, the flat picture's version).

| #  | Step slug     | Delivers |
| -- | ------------- | -------- |
| 1  | look-targets  | `docs/look.md`: the look wanted in the user's words and pictures, the two test scenes, the budgets (frames a second, bytes), the scene calls to add and who draws each; the asks written; a capture of each scene as it is now, to compare against |
| 2  | terrain       | the map's heights as one smooth ground (a mesh worked out in X_eTaL: slopes, banks, the river's bed), the tiles still the rules' grid; a `terrain` call; the flat picture unchanged |
| 3  | materials     | stone, wood, grass, cloth and water as textures made in Blender from X_eTaL's descriptions and carried by the pieces; walls, the gate and the bridge as built things, drawn (tiles from models); the size limit of a piece revisited |
| 4  | light         | a sun with shadows, sky light, ambient occlusion, tone mapping, fog with distance; `sun`, `sky`, `fog` calls; a time of day in the scenario |
| 5  | water         | a river that moves and reflects, foam at the banks and the bridge |
| 6  | particles     | a `particles` call: smoke from fires, grills and pots, dust at feet, splashes; described by the program, drawn by the player |
| 7  | cloth         | banners that wave and tent flaps that move, by a clip or by the player |
| 8  | figures       | a walker with proportions, a rig and a walk with weight; a horse and cart that ambles; crows that fly over (paths worked out in X_eTaL, as the neon city's cars are) |
| 9  | world-view    | a mode with a camera that walks or flies, and one small world from a seed to try it on (a street of the town, or the snow before the walls); `lib/View`'s world scene |
| 10 | look-docs     | the captures side by side with step 1's, the measures, the live demo, the retrospective, the next saga confirmed |

## Saga 3 -- defend-the-bridge (Castle Defense, first playable)  [ACTIVE]

| #  | Step slug       | Delivers |
| -- | --------------- | -------- |
| 1  | defense-rules   | `games/defense`: the mode `defense` (`Defending.xtl`) on the shared libraries: enemies walk the battlefield's road in waves, towers built on grass shoot the enemy furthest along in range (towers against enemies as one table), damage, armor, splash and slow, gold and lives, won and lost; towers, enemies and waves as data; scripted goldens (a level won, a level lost) |
| 2  | defense-view    | its view: enemies and towers as pieces on the lit battlefield, shots, a caption with gold, lives and the wave; choosing a tower and building by key and click; the page's third game; published |
| 3  | defense-pieces  | the three towers and three enemies as models made through Blender (textures; rigs where the walk needs them), arrows and fire as particles |
| 4  | defense-balance | many seeded games played headless; the five waves tuned; the level proven winnable by a golden and losable by neglect |
| 5  | defense-polish  | what playing it shows is missing: upgrades or selling, a wave preview, sound if the audio extension allows, the river and wall past the edge |
| 6  | defense-docs    | README, architecture, `docs/games.md` begun with this game as built, the retrospective |


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

## Saga 4 -- rune-keep (first puzzles)

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

## Saga 5 -- campaign-shell (the combined game, first version)

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

## Saga 6 -- castle-defense-2 (the distinctive mechanic)

Enemies destroy walls and open new invasion routes: wall cells with
hit points, the road found again by the flood whenever a wall falls,
repair between waves, siege engines and dragons (flying units that
ignore walls), the outer walls and courtyard zones, more levels in
the campaign.

## Saga 7 -- castle-world (the castle from a seed)

The whole castle and its surroundings worked out as arrays from a
seed, as the neon city is: terrain, cliffs, walls, towers and
dressing; the authored maps set into it; the camera riding and flying
over it between levels.

## Saga 8 -- dragonfire-tactics

Turn-based squads on the grid: turns and action points, heroes,
mages, archers and dragons, elemental terrain as cellular rules (fire
spreads, ice blocks movement, lightning chains, wind bends
projectiles), an opponent, tactics levels in the campaign.

## Saga 9 -- siege-automata

Programmable defenses in three control modes: manual, rule-based
(conditions and actions chosen in the interface, kept as tables) and
programmed in X_eTaL itself (a tower's behavior as a function over
the table of creeps in reach). Programs are world state, so a defense
programmed here is the one a Castle Defense level runs. Challenge
levels scored against identical seeded waves.

## Saga 10 -- siege-engineer

Catapults, trebuchets and ballistae: ballistics for every shot at
once (angle, counterweight, projectile type), structures with
supports, damage and collapse, limited-ammunition puzzles, and siege
engines in the other modes using the same rules.

## Saga 11 -- shattered-kingdom

The castle walked in the first person: all five zones, tunnels and
secrets, artifacts and portals, digging, and the same world before,
during and after the siege, the zones as the earlier games left them.

## Saga 12 -- siege-commander

Real-time strategy, attacker or defender: selection and orders,
groups and formations, elevation affecting sight, range and movement,
capturing bridges, breaching walls, opponents for both sides.

## Saga 13 -- desktop (installers for Linux, macOS and Windows)

The browser game wrapped in a web view as a desktop application
(Tauri, D16; the design is `docs/desktop.md`):
the packed build of D17 (programs and data in one packed bundle, the
save check), saves in the user's data directory through the storage
interface, window and full-screen behavior, an installer a system
built by a workflow, signing and notarization where a system asks for
it, and the goldens and the browser test run against the packed
build. Runs after several iterations of the games (the user,
2026-11-15), not before.

## The look (asked for by the user, 2026-11-16; proposed as the next saga)

The user, of the first live demo: "when will the quality of the game
be improved? better graphics? less sims-like, more realistic, better
textures, particle systems". Nothing in the sagas below does that:
they build games on the look Saga 1 ends with, which is the sibling
repositories' (flat colors, boxes, no light to speak of). The honest
answer is a saga of its own, and the proposal is to run it next,
before Saga 3, on the one scene there is (the bridge and the walk), so
every game after it is built on the better look and not repainted
later. What it would hold, each a step with its own measure:

- **Art direction first.** The reference picture (D18), or a few
  pictures of the look wanted, and one sentence of it. Without it
  "realistic" has no test.
- **Ground that is not boxes.** The map's heights as one smooth
  terrain (a mesh worked out in X_eTaL from the height matrix, slopes
  and banks, a river bed), the tiles still the rules' grid; walls and
  cliffs as built masonry and rock, not columns.
- **Materials.** Textures made in Blender from X_eTaL's descriptions
  (stone, wood, grass, cloth: procedural, baked into the `.glb`),
  with roughness and normals, so pieces are lit as surfaces. The
  256 KB limit a piece has (D13) goes up, or textures are shared
  files; a size budget for the whole site is set and tested.
- **Light.** A sun with shadows, sky light, ambient occlusion, tone
  mapping, fog with distance; a time of day in the scene.
- **Water.** A surface that moves and reflects, foam at the banks and
  the bridge's piers.
- **Particles.** A `particles` call in the scene (dust at feet,
  splashes, torch fire and smoke, later arrows' trails and impacts),
  described by the program, drawn by the player.
- **Figures.** People with proportions, a rig and clips made in
  Blender (walk cycles with weight), not five boxes.
- **A camera that can come down.** The isometric view stays the
  board; a nearer, perspective view shows the work.

Most of this is the player's (X_eTaL-extensions' board player: asks,
`docs/xetal-extensions-asks.md`) and the asset library's (Bpy.xtl:
bevels, textures, baking, rigs), with the scene vocabulary growing in
`lib/View`; the rules do not change, and the flat picture stays. The
measures: the frame rate on a middling laptop, the site's size, and a
capture the user compares with the reference. Open: whether it runs
next, and how far "realistic" goes (Open questions).

## A showcase: worlds to walk and fly (the user, 2026-11-16)

The user: the game is a showcase. It needs aspects, modes, games
within games, side quests and mini-games, and some of them are to be
like the procedural snow world (snowflow_demo-fork) and the neon city
(X_eTaL-extensions' three extension): worlds made from a seed that
are flown or walked through, with those demos' kind of interface,
dressed for the castle. The user's examples:

- **A siege in winter.** Trudging through snow toward the castle: the
  snow world's endless field, footprints pressed into it and their
  sound, with the walls ahead, the camp, the weather.
- **A medieval city from a seed.** The neon city's method (lots worked
  out as arrays, each building's size and skin a hash of its number
  and the seed, so another seed is another city) turned to a walled
  town: narrow crooked streets, a bazaar, a shanty town against the
  wall. Not modern: no neon, no ads, no billboards.
- **Life in it.** Smoke from fires, grills and boiling pots; banners
  waving, tent flaps moving; and, where the neon city has cars and
  flying cars, horse-drawn carts ambling by and crows flying overhead
  (the user, 2026-11-16).

What this changes in the plan, and what it does not:

- There are two kinds of view, and a mode says which it gives. The
  **board** (the isometric battlefield: tower defense, puzzles,
  tactics) and the **world** (a first-person or flying camera in a
  place made from a seed: the winter approach, the town, later The
  Shattered Kingdom's castle). Both are scenes X_eTaL writes and a
  player draws; `lib/View` grows a world scene beside its board
  scene, in the vocabulary the city already has (`boxes`, `model`,
  `fleet`, `lamps`, `fog`, `steam`, `fly`) plus what the castle
  needs: smoke, cloth that moves, terrain from heights, snow that
  takes a footprint.
- A world is still a mode (`lib/Mode`): its state is the seed, where
  you are and what you have found; its events are ticks, keys and the
  pointer; its outcome is what you found or reached (a side quest
  done, a way into the castle seen). So a walk through the bazaar is
  a mini-game of the campaign like any other, and what a board game
  changes (a wall breached, a gate opened) is there to be walked up
  to.
- The generators are arrays, as the siblings' are, and the same
  castle underlies both views: the town outside the walls and the
  battlefield are one map at two scales.
- It leans on the same work as The look (terrain, materials, light,
  smoke and other particles, a camera that comes down), so that saga
  comes first and should be planned with these worlds as its targets,
  not only the board.
- Where the siblings' code is general (the snow field, the city's
  lots, the walk and fly controls), it is used by pin and asked for,
  not copied (D11, D12): asks of X_eTaL-extensions and of
  snowflow_demo-fork's libraries.

Proposed order, for the user to change: The look, with the board and
one small world as its two test scenes; then Castle Defense's first
level; then the winter approach and the town as worlds of their own,
before the larger games. The Shattered Kingdom (game 6) becomes the
sum of these worlds, not a late start from nothing.

## Inside the castle: the maze and the dungeon (the user, 2026-11-16)

The user wants two games of X_eTaL-games reused and made the castle's:
its Maze (a maze seen from inside, `games/maze`, `Walls.xtl`, with a
mini map; and its Raycaster, `Rays.xtl`, the same idea with smooth
movement) and its Dungeon (a top-down rogue-like, `games/dungeon`,
`Crawl.xtl`: monsters that come after you, potions, gold, a way out).
The user's design:

- **You enter the castle and the portcullis shuts behind you.** You
  cannot go back. You are in a maze, seen through your own eyes, with
  a mini map of what you have seen.
- **The maze is how you get to the games.** Its exits lead to the
  next games; finding one starts it.
- **One exit goes down a stair.** At the bottom is a door; through it
  the game changes to the dungeon, seen from above. You fight
  monsters for treasure and look for the way out, which leads to the
  next game (one of this plan's).

How it fits:

- **The maze is the campaign's map.** The plan had a campaign shell
  as a graph of levels (Saga 5); the user's maze is that graph as a
  place: a node is a room or an exit, an edge a passage, and which
  exits are open is the world state (a game won opens the next). So
  Saga 5 becomes the maze, and the abstract world map is not built.
- **Both are modes** (`lib/Mode`), each with an outcome. The maze's
  outcome names the exit taken, which the campaign turns into the
  next scenario; the dungeon's is treasure (the world's
  `resource.gold` and what it buys in the other games), what was
  killed, and the exit found.
- **Two views that exist.** The maze is a world seen through an eye
  (`lib/View`'s eye, as the battlefield on foot is), its walls and
  floor a scene the 3D player draws, with stone from the pieces'
  textures and torches for light and smoke; the mini map is the
  mode's flat picture, shown in a corner. The dungeon is a board seen
  from straight above (a `camera` call looking down), or the flat
  picture alone.
- **Reuse, by pin and by ask** (D11, D12, the user: reuse, do not
  rewrite): `Walls.xtl` (the maze carved from a seed, what is seen
  from a place), `Rays.xtl` and `Crawl.xtl` (on X_eTaL-games'
  `lib/Ecs`) are that repository's rules libraries, each written for
  its own page and protocol (`n_ew`, `m_ove`, `l_egal`, `s_tatus`,
  `v_iew`). A mode here wraps one: this game's events in, its state
  kept, its view given as a `lib/View` view. Where a library's shape
  does not allow that (it draws its own picture, reads its own TOML
  from its own directory, rolls with `r_oll!`), that is an ask of
  X_eTaL-games (`docs/xetal-games-asks.md`, to be started), not a
  copy edited here.
- **What is new for the castle**: the portcullis and the stair as
  scenes; exits that are doors into other modes; the dungeon's
  monsters and treasure as castle things (rats, guards' ghosts, the
  armory); what treasure buys.

Order, proposed: after Castle Defense's first level, the maze with
two exits (back out to the battlefield games, and down to the
dungeon), then the dungeon, then the other games as exits are added.
That makes the castle one place to walk into as soon as there are two
games, which is what the user asked the showcase to be.

## Weather, and the bridge between games (the user, 2026-11-17)

**Weather.** The user: "consider adding weather effects, like snow
first, lightning later, rain, clouds, fog". It is the sky's idea
again (`lib/Sky`: a scenario says an hour, X_eTaL works the light out,
the scene carries it): a scenario says its weather, and a library
works out what falls (particles: snow, rain), what lies (the terrain's
second texture: snow), what the sky and the haze are, and, for a
storm, when the lightning strikes (from the seed, so a replay storms
the same). Order: snow (which the siege in winter needs), then rain,
cloud and fog, then lightning. Weather that is only seen first;
weather that changes a game's rules (snow slows, rain puts out fire,
fog shortens a tower's reach) is a rule of that game, added after.

**The bridge.** The user's picture, `block-bridge-far.jpg`: a long
mossy bridge of stone blocks over a chasm of waterfalls under a storm,
its far end small in the distance; asked: how can it be the bridging
part between the sub-games? Three uses, cheapest first: the scene a
game shows when it ends and the next begins (what was won, where you
go), drawn by the program in its own picture; the same bridge as a
short walk through an eye, the far end the next game, mist and
lightning round it; and the art reference the plan has lacked (D18):
weathered stone, moss, storm light, deep haze. It also says where the
castle stands: across a chasm, and Defend the Bridge is fought on a
bridge like this, not a plank over a stream. The picture is the user's to publish (2026-11-17) and is
`docs/images/block-bridge-far.jpg`: the art reference (D18) until the
first one named there is added.

## Levels, three walkers' views, and landmarks (the user, 2026-11-17)

**Castle Defense needs levels**: "some with grass, some with snow,
some with violent thunderstorms". A level is a scenario (data): its
waves, its start, its hour and its weather; the map may be the same
battlefield or another. So: a list of levels in the game's data, the
played program going from one won to the next and carrying the gold
kept (the world state: the first real link between two plays), and
the weather each needs: grass (done), snow (done but for the flakes),
then rain and a storm with lightning (not done: a darker sky, rain as
particles, a flash and a clap timed from the seed).

**The bridge art** is not in the game yet (the user asked where it is
used): it is the reference picture in `docs/images/`. Its first use
is the scene between two levels or two games (what was won, where you
go next); see Weather, and the bridge between games.

**Three games of X_eTaL-games are to be reused**, not two: the Dungeon
(top-down), the Maze (stepped, a drawn view from inside) and the
Raycaster (smooth, walls cast as columns). "The two mazes look
different (and should remain distinct)": each keeps its own way of
seeing, and each is a mode in the series of connected games.

**Landmarks in both mazes**, so that a place can be known again:
torches of different kinds and states on some walls (bright, dim,
extinguished, missing: an empty bracket), and others that stay where
they are in each room or section: paintings, cobwebs. They belong to
the maze's data (which wall of which cell has what, made from the
seed with the maze, and kept), are drawn by each maze's own view, are
on the mini map only once seen, and can matter to play later (a torch
lit or put out is a state; a dark section is harder; a painting can
be a clue). In X_eTaL-games' libraries a wall is a wall: landmarks are
an ask of that repository (a wall's decoration as data its views
draw), and the castle's modes supply the decorations.

Order, proposed: Castle Defense's levels next (they need only what
exists, plus rain and lightning); then the series: the gate, the
first maze with its landmarks, the stair down to the dungeon, the
second maze beyond it; the bridge scene between each.

## The castle as one game: venues, a map, and what is made from a seed (the user, 2026-11-17)

The user: "maybe we need schematic placeholders for a more well
connected game that has clear ways to navigate from sub-game to
sub-game. We can flesh out graphics and effects later. Suggest an
uber map (possibly hidden or gradually revealed, of all the
parts/venues/games). We need an overall, extensible plan/framework to
start with all the game types mentioned in the planning so far and a
way/place to add more." And then: "level-set, the maps/mazes etc
should be procedurally generated from a seed. The TD game needs a
large village and/or castle buildings behind the gate visible during
play, with waving flags. Once you get through the gate we need the
medieval version of the neon city to navigate through to find
entrances to other mini games."

The framework (`games/castle`, Saga 3's castle-map step):

- **Venues are data.** `games/castle/castle.toml` lists every game,
  level and place: its title, the mode that plays it and its scenario,
  where it is on the realm's map, the venue whose winning makes it
  known, what it needs of the world state, and what it is about. A
  game is added by adding a venue.
- **A placeholder mode** stands for every venue not built: it says
  what the place will be and can be completed, with a real outcome,
  so the whole castle can be gone round, and tested, before its games
  exist. Building a game is changing a venue's kind and scenario.
- **The map is a mode** over a small map of the castle and its
  country (`world/realm.toml`): venues appear as they become known;
  one that is open is entered by a click; a locked one says what it
  needs.
- **One program** shows the map, plays the venue chosen, applies its
  outcome to the world state and comes back. That is the link: the
  gold kept at the bridge is the next level's to spend; a bridge held
  opens the crossing.

- **Experience, quests, achievements, and a board** (the user,
  2026-11-17: "in addition to gold during TD game, we need some
  overall score, like XP, and or quests completed (or both)";
  "achievements (and a board showing unlocked/achieved
  achievements)"). Winning brings experience (`resource.xp`: 10 a
  wave and 2 a life left at the bridge, 15 for the gate on foot, 2
  for a placeholder). Deeds are data beside the venues: quests, known
  from the start, and achievements, hidden until earned; each a
  condition on the world's names and an experience of its own. The
  program awards them after every game; the map shows gold and
  experience and says when deeds are new; the hall of deeds, a venue
  known from the start, shows them all.

- **The village behind the wall** (the user, 2026-11-17: "there is
  nothing past the wall/gate. There should be a sprawling village
  around castle buildings, towers, a keep ... the neon-city
  equivalent"; "the village needs to be the same on the main screen
  (main menu) same seed"). `lib/Village` lays a village out from a
  seed, a width and a depth alone, about the gate (houses, halls and
  market stalls along winding streets, watch towers, a keep), so one
  line in a scenario (`village = ["seed 7", "wide 34", "deep 20"]`)
  is one village behind every map: the castle's map and the
  battlefield show the same one. It is scenery so far (models stood
  many times, chimney smoke). Still to do: snow on its roofs, flags
  that wave, walking its streets.
- **The siege cart** (the user, 2026-11-17: "the creeps appear out of
  thin air. Better: have a siege engine (a cart with sides?) that
  they emerge from"): a war wagon stands at the start of the road in
  Castle Defense, its open end and ramp toward the road.
- **Ways between the games, proposed** (the user asked how one gets
  to the city, the rogue-like and the two mazes; not yet decided by
  the user): the gate reached on foot opens onto the same village at
  street level, whose doors and stalls are the games' entrances; the
  gatehouse door is the first maze (the portcullis drops); a stair
  down from the maze is the dungeon; an exit from the dungeon is the
  second maze. The map stays as the overview and the debug jump.

- **Breadth before polish** (the user, 2026-11-17: "pick a path that
  reveals more parts of the game, even if each is not
  polished/finished"; then, of the order below, "go on in that
  order"): the gate maze, the dungeon and the second maze (X_eTaL-games'
  maze, dungeon and raycaster, used as they are through a mode each:
  `Warren`, `Depths`, `Passage`); the city inside the gate; the winter
  camp; the long bridge; the treasury (the Idler); Rune Keep; then the
  four new games. The three taken games draw themselves (lib/View
  `vw:d_rawn`: a picture shown as it is, flat), look as their
  originals do, take their chance from the program's seed (not
  lib/Rng), and have no landmarks yet; their generated levels are not
  yet proven completable by a golden here (rule 9; owed).

- **The city inside the gate, first version**: the village of the same
  seed stood on a map of its own (`world/city.toml`; the scenario's
  village says `south 22`), walked with the on-foot game from the
  gate to the keep's door; houses, halls, towers and the keep stop you
  (`vg:b_locked`), stalls do not. On the castle's map it comes after
  the long bridge and before the gate maze. Owed: doors and stalls as
  the entrances of the games, carts, crows, people, a caption of its
  own; the tick there costs more than the budget.

- **The winter camp, first version**: `lib/Camp` lays a camp out from
  a seed (cook fires either side of the road, a ring of tents about
  each, a banner by each, the cart), on `world/camp.toml`, in snow,
  late in the day; walked with the on-foot game from the south to the
  palisade's gate; tents and fires stop you. Owed: banners and tent
  flaps that wave (a piece's clip needs the time each tick, which
  scenery lines do not carry), crows, people, falling snow (the
  extensions ask).

- **The long bridge, first version**: a card first (`Overture`, the
  mode `card`: the bridge painting, `docs/images/block-bridge-far.jpg`,
  the user's own, served to the page as `art/`), then the walk across
  a long bridge over the river (`world/crossing.toml`, late in the
  day) to the castle's gate. Owed: the chasm and cliffs of the
  painting, the storm (rain, lightning), and the painting used again
  between other games.

- **The treasury (the Idler), first version**: `Hoard` (the mode
  `idle`, `games/castle/treasury.toml`): coins by the second, mints
  that make them faster (each dearer), carried out as gold; the mints
  are kept in the world. "While you play elsewhere" is counted in
  places won since the last visit (time enters only as ticks, D6), not
  in hours away.
- **The treasury as an idle game** (the user, 2026-11-18, asking what
  else from Cookie Clicker could be had, then "y, go" to the order
  proposed): a ladder of things to buy (mint, counting house, merchant
  fleet, royal bank, each opening at five of the one before), coins
  struck by hand, renown (every deed makes the coins come faster),
  relics found in the other games (each better at one thing: cost,
  rate, the coins waiting, a strike). Still to come, in that order:
  upgrades and a golden coin (chance from the seed, lib/Rng), then
  prestige (give up the treasury for a lasting multiplier). All of it
  is data in `games/castle/treasury.toml`.
- **The war chest, the attacker's idle game** (the menus decision
  below: "the attacker gets a war chest of its own"): `Warchest` (the
  mode `chest`, `games/castle/warchest.toml`) is Hoard's game on a file
  of its own, not a copy: `Hoard` now reads from its file what it
  keeps in the world (`keep`: `idle` for the treasury, `chest` for the
  war chest), its painting, the word for what comes in, the hand
  action's key and the words its picture says, so the two never share
  a world name. The chest's ladder is foragers, raiding party, siege
  workshop, mercenary company and war council (doubles; opens at three
  companies); R raids by hand; deeds raise war banners; trophies come
  from the gate walked, the dungeon and the two mazes. Its outcome
  marks the places won so far seen (`chest.seen`) itself, so the
  castle's program needs only its dispatch line. Gold reaches the
  other games the one way every mode's does: both idle games' outcomes
  bring `resource.gold`, `md:a_fter` adds it to the world, and Castle
  Defense starts a level with the world's gold (a golden: 7 + 10 + 10
  = 27). It is the attack road's last place (`levels.toml`), where the
  treasury stood with its attack version coming.
- **The look wanted, a second reference** (the user, 2026-11-17: "for
  example of the kind of improved graphics I want the game to have"):
  a painted bazaar below a castle (`docs/images/block-castle-bazaar.jpg`;
  the user's images are text-to-image work of the user's own, 2026-11-18). What it
  asks for, against what the game draws now: a tall castle of many
  spires on a rocky crag, mountains and forest beyond, mist and sun
  rays; a street of tents and awnings in many colors, hanging rugs,
  lanterns, sacks and pots; crowds of robed people, camels and
  donkeys; banners on every tower.

- **The paintings in the game** (the user, 2026-11-18: add the keep
  and the treasury paintings "to images used in this game (or to be
  turned into 3D models or procedural views)"): `docs/images` now
  holds the bridge, the keep and the treasury (`docs/look.md`, The
  paintings). A walk's scenario may name one (`art`): the castle shows
  it on a card before the walk (the bridge before the crossing, the
  keep before the city), and the treasury's picture lies over its
  painting. Each is also the brief for the models and generated views
  that should come to look like it.

- **Menus, characters and sides** (the user, 2026-11-18, asking for a
  revamp of the main menu, then "yes to all" to the proposal):
  - The flow: a splash screen; profiles (each named, each its own
    save; a new name typed in the game); a character for the profile;
    home; the side for the session (defend or attack) and the
    difficulty (novice, easy, normal, hard, impossible; novice cannot
    lose; harder brings more XP); a level map; a menu bar always there
    (home, hall of deeds, settings, help, leave).
    As built (games/castle/Menu.xtl, pinned by front-check and
    road-check): the bar is drawn by X_eTaL along the top of every
    front-door screen and of the road of levels; its keys are H, D, S,
    ? and Q (letters the page gives; while a name is typed they are
    the name's, and the bar is clicked). Help is an overlay closed by
    the next key or click. The road leaves through the outcome
    (`menu.go`: 2 the hall, 3 settings, 4 the profiles), which the
    castle's program follows; it opens the front door at a profile's
    settings by `front.home.NAME` 2. Settings is a list: default
    difficulty, pronouns, title, cloak, the music's volume
    (`settings.music`, 0 to 10, 6 when never set) and mute
    (`settings.mute`, 0 or 1), both in the front door's outcome so
    the profile keeps them; the music player reads those two names.
    The page passes the key ? through (web/static/app.js).
  - Callings: Soldier, Merchant, Spy, Thief, Witch/Warlock (the title
    the player's choice: Witch, Warlock or Mage), Engineer and Herald.
    Each gives a small bonus on each side, as data. Any calling plays
    either side.
  - A build on a seven-step slider from masculine to feminine, and
    pronouns chosen apart from it (he, she, they).
  - Two level maps, one road a side, numbered in order (the
    defender's out from the keep, the attacker's in from the camp),
    tutorial and easy levels open; the numbered map of venues stays as
    the novice and debug overview.
  - Every game has both sides: Castle Defense (towers, seen from
    behind the wall looking out; or creeps and waves against a
    scripted defender, seen from the camp toward the castle), the
    mazes, the dungeon, the walks, and the idle games: the treasury is
    the defender's; the attacker gets a war chest of its own. Gold
    from either is spent in the other games.
  - The city becomes a maze of its houses: you start at a house and
    find the way to the keep; the wall you came through stands behind
    you.
  The defender's view is the map turned half round (a scenario's
  `facing = ["out"]`, lib/World `w:t_urned`): the same camera then
  looks from behind the wall out at the road, and the flat picture,
  clicks and the 3D view agree; the village stands on the far side of
  a turned map's gate. Castle Defense's three levels face out.
  The city is a maze of its houses (lib/Village: a sidewinder maze
  carved from the seed, houses on its closed blocks, stalls along the
  wall's street, towers at the corners, the keep in a square at the
  north); the same village stands behind the wall everywhere. You
  start at the street farthest from the keep's door, facing the way
  on; the wall with its gap is the city map's south edge; a solver
  golden proves the keep reachable (53 steps for seed 7).
  The steps, in order: defender-camera, city-maze, front-door,
  character, home-and-sides, level-maps, attack-defense,
  sides-everywhere, attacker-idle.

- **Difficulty and callings in the games** (the user's menus,
  2026-11-18; built 2026-11-21): a game's effects are data. Castle
  Defense's scenarios name `games/defense/effects.toml`: a row a
  difficulty and a row a calling, each the starting gold's
  multiplier, lives added, and the multipliers of the towers' costs
  and damage and of the enemies' hit points; the difficulty's row and
  the calling's are combined (multipliers multiplied, lives added; a
  level never starts with fewer than 1 life). The difficulty is the
  world's `session.level` (none chosen: Normal), the calling
  `character.calling` (none: no bonus), so the scripted goldens with
  an empty world are unchanged. Novice's "cannot lose" is 90 lives
  more and enemies at half strength. The other games take their
  effects the same way as each gets both sides.

- **The dungeon's painting** (the user, 2026-11-21: "use
  block-damp-torches.jpg for a splash screen before a dungeon level.
  We want this kind of look on some of the maze walls"): the dungeon's
  scenario (`games/castle/undercroft.toml`) names it, so the castle
  shows it on a card before the dungeon, as before the walks. The
  maze walls' look is a later look step (`docs/look.md`, The
  paintings).

- **The approach, from the tower** (the user, 2026-11-22, with the
  painting `docs/images/block-view-from-tower.jpg`: "try to construct
  areas of the game based on what is seen in this image. The images
  show possible areas along the way for an attacker to approach and
  key things to defend"). The painting looks out from the castle's
  battlements at sunset over the country an attacker crosses. Its
  areas, in the order an attacker meets them, each with what the
  attacker does there, what the defender holds, and the venue it is:
  1. The forest edge. The attacker comes out of the trees, unseen
     until the open fields; the defender watches from the tower. The
     start of the road through the fields (new, built: its south
     edge).
  2. The winding road through the fields. The attacker marches the
     road; the field walls (hedges) funnel it through their gaps; the
     defender can ambush at the gaps. New, built as a walk: "The road
     through the fields" (`games/walk/fields.toml`, the zone `fields`,
     `world/fields.toml`), on the attack road early (after On foot);
     its card is the painting. A Castle Defense level on the same road
     can follow.
  3. The hill fort. An outlying fort with four towers on a rise
     commanding the road: the attacker must take it or be shot at
     passing; the defender holds its gate. New, built as a Castle
     Defense level: "The hill fort" (`games/defense/hill-fort.toml`,
     the zone `hill-fort`, `world/hill-fort.toml`; the road winds to
     and fro up the hill, facing out), on the defend road after the
     three bridges.
  4. The town gate tower. The round gate tower with a conical roof:
     the attacker breaks in at the gate; the defender holds the
     gateway. The gate maze (the portcullis shuts behind you).
  5. The town's streets. A walled town of half-timbered houses, its
     main street busy: the attacker fights house by house; the
     defender barricades the streets. The city (its maze of houses)
     and the town (a placeholder).
  6. The river bridge to the far town. The river winds through the
     valley to a bridge, a second town and its church beyond: the
     attacker must cross; the defender holds the bridge. The bridge
     levels (Defend the Bridge) and the long bridge.
  7. The castle's wall-walk and keep, where the painting is seen
     from: the defender's last stand; the attacker storms the
     battlements to the keep. The keep (the city ends at its door); the
     wall-walk is new (the zone `outer-walls`, no map yet).
  The two new areas are data on the existing modes (no mode code):
  two maps, two scenarios, two venues appended to `castle.toml` and
  an entry on each road. They are proven by goldens: `castle.xtl`
  walks the road through the fields to the town gate by held keys (W
  along each stretch, an arrow 0.9 seconds a quarter turn at each
  bend); `defense.xtl` wins the hill fort with a written order of
  building and loses it with nothing built. Rough edges left: winning
  the hill fort sets `fact.bridge-held` and losing it
  `zone.battlefield.gate-breached` (Defending's outcome names the
  battlefield's); the forest, hedges, fort and town are drawn as the
  map's tiles and a village from a seed, not yet as the painting shows
  them.

What the user's second message adds, each a later step on this
framework, none blocking it:

- **Made from a seed.** Maps, mazes and level sets are generated, not
  drawn by hand: a venue's scenario gives a seed (from the campaign's
  seed and the venue's number), and a generator in X_eTaL makes the
  map (a battlefield's river, road and ground; a maze; a dungeon; a
  town), checked as a hand-drawn one is, with goldens for known
  seeds. The hand-drawn battlefield stays as a fixture and a
  fallback. Castle Defense's levels become a set generated from one
  seed.
- **Something behind the gate.** During Castle Defense the castle is
  there to defend: the village and the castle's buildings behind the
  wall, their flags waving (cloth: X_eTaL-extensions' Bpy has it).
  They are scenery of the battlefield's zone, generated like the
  town.
- **Inside the gate, a city to walk.** The medieval neon city (see A
  showcase): once through the gate you navigate its streets on foot
  to find the entrances to the mini-games. So the venues inside the
  walls are doors in that city, and the schematic map is how you
  travel until the city exists, and a map you carry after.

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
the campaign shell (Saga 5) something to do between levels.

## Characters who talk: a model in the browser (the user, 2026-11-24)

The user: "Jeva or Laya-like in-browser model to implement NCPs during
the game, like a bridge troll." Non-player characters met along the way
(a troll who keeps a bridge, a gate guard, a merchant in the city), who
talk with the player in their own words, from a small language model
run in the page (WebGPU or WASM), with nothing sent to a server. Which
models "Jeva or Laya-like" means is to be confirmed with the user (Open
questions); the seams below hold for any of them.

- Talks are dialog trees (the user, 2026-11-24: "the interactions
  with NPCs should be inspired by the classic game Monkey Island. The
  NPC says something, the player has a choice of answers, the NPC
  responds based on the choice"). The mechanic, not that game's
  characters, jokes or lines: a node is what the character says and the
  answers the player may choose (by key or click); each answer leads to
  the character's reply and the next node, and may change the world (a
  toll paid, a clue learned, the way opened or barred). Trees are TOML,
  checked by X_eTaL, one mode (a talk) the castle's venues and walks can
  open; every tree is proven to have a way through by a golden. With the
  model, the character's words are said its own way, in character, but
  the answers and where they lead stay the tree's.
- The model writes words, never rules. What a character can do (let you
  pass, ask a toll, fight, give a clue) is a mode's rules in X_eTaL, and
  data (the character's name, nature, what it wants, what it knows, its
  choices) is TOML, as every other content (rules 1 and 8). The model is
  asked for a reply and for which of the character's listed choices it
  means; X_eTaL checks the choice against the list and decides.
- Deterministic (D6): what the model said enters as an event (a line
  such as "said TEXT" and "chose N"), like a tick or a key, so a game is
  replayed, tested and golden from its events alone; goldens give the
  replies in the event script and never run a model.
- Without the model (not downloaded yet, no WebGPU, the terminal, a
  golden) every character has written lines and a menu of answers, so
  every encounter can be played and won without it (rule 9).
- The host side (loading the model, asking it, giving back its reply as
  events) is the page's, as little as can be, asked of X_eTaL-extensions
  as an extension of its own (an ask in docs/xetal-extensions-asks.md).
- The model's weights are third-party and large (hundreds of MB): never
  committed (rule 12); fetched by the page from their publisher's host
  with their license and checksum named, and kept in the browser's
  cache, only when the player turns talking characters on (Settings).
- First: the bridge troll, at a bridge venue, who asks a riddle or a
  toll before you cross; written lines first, the model second.

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
after several iterations of the games (Saga 13), and both the site
and the desktop build packed (D17).

Still open:

1. The art reference file: `docs/images/castle-siege.png` is not in
   the repository yet; the user is to add it (Saga 1 step 8 reads it).
2. The Idler (see its section): a mode of its own, a side quest, a
   game in the background of the others, or several of these; what
   it earns and what spends it; its name; and where it comes in the
   order.

3. The look (Saga 2, running): what "realistic" is to mean here; a
   reference picture, or a few, decides it (step 1 works from the
   user's words until there is one).

8. The castle as one game (see its section): the venues' list and
   order as first drawn (`games/castle/castle.toml`); whether the
   schematic map stays once the city inside the gate can be walked.
7. Levels, the three reused games and landmarks (see their section):
   the proposed order; whether a level's map changes or only its
   waves and weather.
6. Weather and the bridge (see their section): snow first or the
   bridge between games first; whether the bridge picture may be
   published in the repository; whether the castle moves across a
   chasm.
5. Inside the castle (see its section): the maze as the campaign's
   map in place of Saga 5's world map; whether the maze is X_eTaL-games'
   stepped Maze or its smooth Raycaster (the battlefield on foot
   already walks smoothly, so the proposal is smooth); what treasure
   buys.
4. The showcase's worlds (see A showcase): the proposed order (The
   look, Castle Defense's first level, then the winter approach and
   the medieval town); which world is first.

9. Talking characters (see Characters who talk): which in-browser model
   "Jeva or Laya-like" means, how large a download is acceptable, and
   whether the first troll waits for the model or comes first with
   written lines.

Settled since: the repository exists and is public, and GitHub Pages
is enabled on it, deploying from GitHub Actions (the user,
2026-11-15).
