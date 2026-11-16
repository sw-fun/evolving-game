# Shared libraries

X_eTaL libraries (`.xtl`) and macro libraries (`.xtlm`) the games
share, so no game copies a helper from another. A program imports one
under a short alias, `"g:" u_se< "Game"`; the scripts find them through
`XETAL_PATH` (`scripts/libs.sh`: this directory first, then
X_eTaL-games' `lib/` at the commit in `GAMES_COMMIT`, then every
library of X_eTaL-libraries at `LIBRARIES_COMMIT`).

| Library | What it gives |
| ------- | ------------- |
| `Game.xtl` | the game's name, written once (`g:name`), and a game's title under it (`g:t_itle`) |
| `Rng.xtl` | chance from a seed, the same everywhere: a word or a fraction for each count of a key `(seed, stream)` (`rg:w_ords`, `rg:u_nit`), a whole number from 1 to k (`rg:b_elow`), an order (`rg:o_rder`), the next counts (`rg:a_fter`). Over X_eTaL-libraries' `Random` (Philox); nothing is remembered, so a game saves only how many it has drawn |
| `Sim.xtl` | the event loop every game runs in: events as tuples (`sm:t_ick`, `sm:c_lick`, `sm:k_ey`, `sm:c_hoose`, `sm:end`, `sm:b_ad`), their lines written and read back (`sm:l_ine`, `sm:p_arse`), the host's next event with a bad line as an event (`sm:n_ext`), the clock in whole milliseconds (`sm:start`, `sm:a_dvance`), and the loop over a step function on the host's events (`sm:r_un`, `sm:t_race` with the event log) or on a script (`sm:r_eplay`) |

`sim-loop.xtl` is the loop as a game uses it, on the event script
`expected/sim-loop.in` (malformed lines included); the log it prints
replays the same game.

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
