# How the game's X_eTaL is written

The house style for X_eTaL in this repository: the shared libraries in
`lib/`, each game's rules library, scripted game and played game, and
the asset descriptions in `assets/`. It is about X_eTaL at the
known-good commit (`XETAL_COMMIT`).

The base is X_eTaL-games' style guide, read at its pin
(`work/games/docs/style.md` after `just xetal`, or
[on GitHub](https://github.com/softwarewrighter/X_eTaL-games/blob/main/docs/style.md)):
arrays first, small named pieces, its idioms, its comment and type
conventions, its right-to-left traps. All of it applies here. This
document says only what this repository adds or does differently.

The aim is the same: a reader who knows a little X_eTaL sees the rules
of the game, stated as operations on whole arrays, in a few named
pieces.

## Arrays first, for a game that runs every tick

- A rule is stated for all the towers, all the creeps, all the tiles at
  once. Every tower against every creep is one table; what is in reach,
  what is hit and what dies are masks over it. A loop over entities
  (recursion that walks an index) is a sign the array form has not been
  found yet.
- A tick must be cheap: it runs twenty times a second in a browser
  (`docs/plan.md` D7). Prefer one table, one inner product or one
  selection over a chain of steps; when a rule is slow, measure it and
  say what was measured in a comment.
- Recursion is for what is sequential by nature: a fixed point (the
  road found by a flood), a search, the turns of a turn-based mode.

## Where things go

- `lib/<Name>.xtl`: what more than one game uses. A helper a second
  game needs moves here; it is never copied from one game to another.
- `lib/<Name>.xtlm`: a macro library, the way this repository extends
  the language (`docs/plan.md` D19). Where a game wants a form X_eTaL
  does not have, write a macro (X_eTaL-games' `Ecs.xtlm` is the model:
  `c_omponents<` writes a world's getters and setters from a list), do
  not ask for syntax. A macro's expansion is ordinary X_eTaL a reader
  can print with `xetal expand`.
- `games/<slug>/<Name>.xtl`: one game's rules, one library, named
  unlike the game (on a case-insensitive disk `Walk.xtl` is
  `walk.xtl`). It follows the mode protocol (`lib/Mode`, `docs/plan.md`,
  The seams) and holds definitions only.
- `games/<slug>/<slug>.xtl` and `play.xtl`: the scripted game and the
  played game. Programs: they import the rules and define no `l:`
  names.
- A library that has proved itself here and would serve other
  repositories is asked to move to X_eTaL-libraries
  (`docs/xetal-libraries-asks.md`), then used from there by pin.
- X_eTaL-games' shared libraries (`Ecs`, `Svg`, `State`, `Board`,
  `Text`, `Play`) are on `XETAL_PATH` after this repository's own, at
  `GAMES_COMMIT`. Import them; do not copy them.
- X_eTaL-libraries' libraries (`Random`, `Bits`, `Strings` ...) come
  after those, at `LIBRARIES_COMMIT`. Import them the same way.

## What a game may not do

These are the repository's rules (CLAUDE.md), restated for the code:

- No clock and no unseeded chance in rules: time arrives as `tick`
  events, chance comes from `lib/Rng` (from the second step of the
  first saga), so the same events give the same game.
- No SVG and no scene calls written by a game: a mode gives its view
  through `lib/View`.
- No number of the game in the code: towers, creeps, waves, maps and
  levels are TOML the program reads and checks. A bad file is a
  message naming the file and the field.
- No loop of its own: the shared loop hands a mode one event at a time.

## Names, types and comments

As in X_eTaL-games: exports are `l:`, private helpers `h:`; every
export has a `# ::` type comment equal to what X_eTaL infers (the
library's golden, `expected/<Name>.out`, lists the inferred types and
`scripts/check-types.py` compares) above a `##` documentation block
(`scripts/check-docs.py`); the shared libraries show `## >>` examples
with their output, which `scripts/test-lib.sh` runs.

- The game's name is written once, `g:name` in `lib/Game.xtl`
  (`docs/plan.md` D14). No other file spells it in code.
- State that is more than one array is a tuple, named in the
  parameters; many values of one kind stay arrays.
- Statuses, tile kinds and event kinds are named once as constants and
  compared by name.

## Tests

- A golden first: write `expected/<name>.out` (or the lines you expect
  in it) before the code, see it fail, then make it pass.
- `expected/<name>.in` is a list of events, one a line. It is the
  test's input, a replay and, for a level, the proof it can be won.
- A scripted game states what it guarantees with `a_ssert<`, bound so
  it prints nothing; a failed assertion writes to standard error, which
  fails the game's test.
- `just bless` only after reading the diff, and only for a change that
  was meant.
