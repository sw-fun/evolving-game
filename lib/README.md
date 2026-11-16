# Shared libraries

X_eTaL libraries (`.xtl`) and macro libraries (`.xtlm`) the games
share, so no game copies a helper from another. A program imports one
under a short alias, `"g:" u_se< "Game"`; the scripts find them through
`XETAL_PATH` (`scripts/libs.sh`: this directory first, then
X_eTaL-games' `lib/` at the commit in `GAMES_COMMIT`).

| Library | What it gives |
| ------- | ------------- |
| `Game.xtl` | the game's name, written once (`g:name`), and a game's title under it (`g:t_itle`) |

From X_eTaL-games, by pin (see
[its `lib/README.md`](https://github.com/softwarewrighter/X_eTaL-games/blob/main/lib/README.md)):
`Ecs` (an entity-component system as arrays, with its macro library),
`Svg` (pictures as SVG text and the clicks on them), `State`, `Board`,
`Text`, `Play`.

`test.xtl` exercises every function on small cases;
`scripts/test-lib.sh` (`just test-lib`, in the gate) checks it, each
library's exported types and each `## >>` example against `expected/`.
[`docs/style.md`](../docs/style.md) says when a helper belongs here:
as soon as a second game needs it.
