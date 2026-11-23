# Shared libraries

X_eTaL libraries (`.xtl`) and macro libraries (`.xtlm`) the games
share, so no game copies a helper from another. A program imports one
under a short alias, `"g:" u_se< "Game"`; the scripts find them through
`XETAL_PATH` (`scripts/libs.sh`: this directory first, then
X_eTaL-games' `lib/` at the commit in `GAMES_COMMIT`, then every
library of X_eTaL-libraries at `LIBRARIES_COMMIT`).

| Library | What it gives |
| ------- | ------------- |
| `Camp.xtl` | the besiegers' camp from a seed: cook fires either side of the road, a ring of tents about each, a banner by each, a cart (`cp:l_ayout`), the tiles they stand on (`cp:b_locked`), and its scene lines with flames and smoke (`cp:c_alls`) |
| `Game.xtl` | the game's name, written once (`g:name`), and a game's title under it (`g:t_itle`) |
| `Rng.xtl` | chance from a seed, the same everywhere: a word or a fraction for each count of a key `(seed, stream)` (`rg:w_ords`, `rg:u_nit`), a whole number from 1 to k (`rg:b_elow`), an order (`rg:o_rder`), the next counts (`rg:a_fter`). Over X_eTaL-libraries' `Random` (Philox); nothing is remembered, so a game saves only how many it has drawn |
| `Sim.xtl` | the event loop every game runs in: events as tuples (`sm:t_ick`, `sm:c_lick`, `sm:k_ey`, `sm:c_hoose`, `sm:end`, `sm:b_ad`), their lines written and read back (`sm:l_ine`, `sm:p_arse`), the host's next event with a bad line as an event (`sm:n_ext`), the clock in whole milliseconds (`sm:start`, `sm:a_dvance`), and the loop over a step function on the host's events (`sm:r_un`, `sm:t_race` with the event log) or on a script (`sm:r_eplay`) |
| `World.xtl` | the castle's ground as arrays: a map read from TOML and checked (`w:r_ead`; `w:p_roblem` gives the message for a wrong one, naming the file and the field), its tiles' kinds and elevations as matrices (`w:t_iles`, `w:h_eights`, `w:kinds`, `w:letters`), places (`w:p_laces`, `w:g_ate`, `w:e_ntrances`), the steps to the gate by a flood and the road from each entrance (`w:s_teps`, `w:r_oad`), text drawings (`w:d_raw`, `w:d_rawRoad`, `w:d_rawHeights`), and the zones and their maps (`w:z_ones`, `w:z_oneTitle`, `w:z_oneFile`, `w:z_oneMap`, `w:z_oneProblems`) |
| `Mode.xtl` | the protocol every game follows and the loop that plays it: statuses (`md:playing`, `md:won`, `md:lost`, `md:left`), the world state as names to whole numbers (`md:nothing`, `md:g_et`, `md:s_et`, `md:a_dd`, `md:m_erge`, `md:g_ain`, `md:l_ines`; `md:t_ext` and `md:f_rom` turn one to a text and back, to save it), an outcome applied to it (`md:a_fter`), a scenario's fields, rules, zone map and problems (`md:f_ield`, `md:l_ist`, `md:n_umber`, `md:r_ule`, `md:z_ones`, `md:m_ap`, `md:p_roblem`), legal events (`md:a_llows`), and the loop on the host's events or a script (`md:p_lay`, `md:r_eplay`, `md:r_esult`) |
| `Music.xtl` | the music director: the set that plays at a kind of place (`mu:f_or`), a plan of a set's looping phrases from a music file's rules (least and most repeats, the weights of what follows) and a seed (`mu:p_lan`, `mu:n_umbers`), the loudness from the world's settings (`mu:v_olume`), the line a page plays (`mu:l_ine`), a view carrying it (`mu:s_cored`; a model that begins with `~`), and `md:p_lay` with every picture carrying it (`mu:p_lay`). `music-plan.xtl` shows the castle's (`expected/music-plan.out`) |
| `Village.xtl` | the village behind the castle's wall, from a seed: lots along winding streets about the gate, each a house, a hall, a stall, a watch tower or the keep (`vg:l_ots`), where they stand behind a map (`vg:b_ehind`), and its scene lines with chimney smoke (`vg:c_alls`); the same seed is the same village behind every map |
| `View.xtl` | what a mode shows, three ways from one value: a map made ready to draw once (`vw:s_tage`), a view of it with pieces and a caption (`vw:e_mpty`, `vw:o_ne`, `vw:c_aption`), the drawing in text (`vw:t_ext`), the flat isometric picture as SVG (`vw:p_icture`), the scene for a 3D player (`vw:s_cene`), the picture's map and its inverse (`vw:t_o`, `vw:b_ack`), a view of many pieces (`vw:m_any`; a model that begins with `*` is a burst of particles and one that begins with `#` a label written over the picture), a view with one more piece (`vw:w_ith`; the piece `eye` is where you look from: the scene is then seen through it, in perspective), the tile under a click, raised tiles hiding lower ones (`vw:t_ile`), and the order tiles are drawn in (`vw:f_arToNear`) |
| `Sky.xtl` | the light of an hour of the day as numbers: the sun's height and the day's light (`sk:e_levation`, `sk:d_aylight`), the whole light (`sk:a_t`: the direction to the sun, its color and strength, the sky's two colors, the haze), the scene's `sun`, `sky` and `fog` calls (`sk:c_alls`), the flat picture's wash (`sk:t_int`), a color as a page writes it (`sk:h_ex`). `sk:s_now` is a light under falling snow. `vw:l_it` lights a stage with it; a scenario's `time` says the hour and its `weather` the snow, and `md:s_tage` builds the stage every mode uses from them (`vw:w_inter` is the smooth stage under snow) |
| `Terrain.xtl` | a map's ground as one smooth surface: the ground under every tile and at every corner (`tr:g_round`, `tr:c_orners`), the mesh (`tr:m_esh`: corners, triangles facing up, a color a corner), the height under a point and where a piece stands (`tr:h_eight`, `tr:s_tand`), and the scene's `terrain` call (`tr:c_all`) |

`vw:s_mooth` is `vw:s_tage` with that surface as the scene's ground;
`ground-surface.xtl` shows the battlefield's (its output is the golden
`expected/ground-surface.out`).

A mode is a library exporting `mode`, `help`, `n_ew`, `s_tep`, `l_egal`,
`s_tatus`, `v_iew` and `o_utcome` (the head of `Mode.xtl` says what
each is); [`games/walk`](../games/walk) is the first, and `test.xtl`
holds two stubs, a puzzle with no clock and a game of turns.

The maps are in [`world/`](../world): `zones.toml` (the five zones)
and a file a map (`battlefield.toml`, where Defend the Bridge is
played). `fixtures/` holds small maps for the tests, one for each way a
map can be wrong.

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
