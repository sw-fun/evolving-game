# Asks for X_eTaL-libraries

Library changes the games need: a function missing from a shared
library, a library of this repository (or of X_eTaL-games, whose
`lib/` is used here by pin) general enough to move to
X_eTaL-libraries, a library there that is too slow for a game's tick.
The most likely kind of ask. This repository does not change X_eTaL-libraries: each ask
is written here and taken to that repository, the game uses the
workaround noted or waits, and the workaround is removed when the ask
has landed in the commit this repository is pinned to.

Each entry: status (open, filed, landed, dropped), kind (feature, bug
or performance), what needs it, why, a minimal repro or example, and
the workaround in use. Details that do not fit a table row go in a
section below it.

| Status | Kind | Ask | Needed by | Workaround |
| ------ | ---- | --- | --------- | ---------- |
| open | performance | `Random`'s Philox words are slow in bulk: `seed r:s_ampleKeys ids` for 6000 identities takes 1.1 s at c7e812e on X_eTaL 8c49bd8 (about 180 microseconds a word). Repro: `"r:" u_se< "Random"` then `t_ally 1 r:s_ampleKeys o_\ 4 6000 r_eshape (r_ange 6000) c_at 18000 r_eshape 0`. A game draws a few numbers a tick, so nothing waits on this; terrain made from a seed (thousands of tiles at once) will | `lib/Rng` (world generation, later) | none needed yet; draws are made in one call a tick, not one call a number |

X_eTaL-manifolds' ask GL8 (seeded draws in `Random`) is answered for
this repository by `Random`'s Philox functions, which `lib/Rng` uses.
