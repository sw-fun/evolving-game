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

## Play it

```bash
just run walk          # the scripted game: scripts of events, shown
just play walk         # play it at the terminal
just run walk picture.xtl   # the scene and the picture at two moments, as text
just test-game walk    # compare with the expected output
```

The walk is shown three ways from one description (`lib/View`): the
text drawing in the terminal, a flat isometric picture (SVG), and a
scene for a 3D view. `just play walk` writes the picture of each moment
to `work/draw/walk/play-N.svg` (open one in a browser).

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
