# Walk

One walker comes in at the bottom of the battlefield and follows the
road over the bridge to the castle gate. It is the smallest game there
can be here: it exists to be the first mode, the thing every later game
is shaped like.

## How it works

The rules are [`Walking.xtl`](Walking.xtl), a mode (see
[`lib/README.md`](../../lib/README.md), `Mode`). The state is the map
as text, the road's places as a matrix, and a vector of numbers: the
speed, the time limit, the time passed and the time walked. Where the
walker is, is not kept: it is the speed times the time walked, counted
along the road, so the same events always put it on the same tile.

- A tick's time passes, and is walked unless the walker is stopped.
- The space bar stops it and starts it again.
- Won when it reaches the gate; lost when the scenario's seconds run
  out first.
- A won walk opens the battlefield's gate in the world and brings the
  scenario's gold; boots in the world make the walker faster.

The road is not in the scenario: it is found on the zone's map, from
its entrance to its gate (`lib/World`).

## On foot

A second mode on the same battlefield, [`Roaming.xtl`](Roaming.xtl)
(the mode `roam`, the scenario [`roam.toml`](roam.toml)): you walk it
yourself and look through your own eyes. W A S D walk, Shift runs, the
arrow keys (or Q and E) and the mouse turn you; walls, water and
cliffs stop you, and standing in the gate wins. Keys are held, so its
events are a key going down and coming up (`choose 2 87`, `choose 3
87` for W) and the pointer's movement (`move 40 0`); which key does
what is the game's to say, not a page's. `roam.xtl` is it scripted and
`explore.xtl` played.

The same mode walks other places, each a scenario naming its zone:
[`fields.toml`](fields.toml) is the road through the fields, out of
the forest along a winding road whose field walls stop you, to a
town's gate ([`world/fields.toml`](../../world/fields.toml)); the
castle's `castle.xtl` walks it to the gate. [`city.toml`](city.toml)
is the city inside the gate, a maze of streets between the village's
houses, walked from deep in it to the keep's door.

M shows a mini map and M again hides it: at the picture's top left,
the tiles you may walk on (the streets, in the city), the gate or
door you are looking for, and you on them, a dot with a line the way
you face. It is drawn by `lib/View` (`vw:m_ini`), over the 3D view
too; `roam.xtl` shows it in the city.

## Play it

```bash
just run walk          # the scripted game: scripts of events, shown
just play walk         # play it at the terminal
just run walk roam.xtl      # the battlefield on foot, scripted
just run walk picture.xtl   # the scene and the picture at two moments, as text
just test-game walk    # compare with the expected output
```

The walk is shown three ways from one description (`lib/View`): the
text drawing in the terminal, a flat isometric picture (SVG), and a
scene for a 3D view. `just play walk` writes the picture of each moment
to `work/draw/walk/play-N.svg` (open one in a browser).

In a browser (`just web`, then `just serve`) the same `play.xtl` runs
as WebAssembly: the page's clock, keys and clicks are its events, and
the scene is drawn in 3D. A click on a tile makes the walk say what
the tile is.

At the terminal the events are lines you type, then Enter: `tick 1`
lets a second pass, `key space` stops or starts the walker, and the end
of input (Ctrl-D) leaves. The map is printed whenever the walker has
moved; `@` is the walker.

```
tick 1
tick 1
key space
```

## Data

[`bridge.toml`](bridge.toml), the scenario: the mode (`walk`), the
zone it is played on, the walker's speed in tiles a second, the
seconds before it is lost and the gold for winning. The map is the
battlefield's, [`world/battlefield.toml`](../../world/battlefield.toml).

## Workarounds

None.
