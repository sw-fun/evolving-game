# Castle Defense

Enemies come up the battlefield's road in waves, over the bridge, to
the castle gate. You build towers on the open ground to stop them, in the snow,
and you see it as a defender does: from behind the castle's wall, looking out
at the road (each level says `facing = ["out"]`). This is
its first level, Defend the Bridge: three towers, three enemies, five
waves.

## How it works

The rules are [`Defending.xtl`](Defending.xtl), a mode (see
[`lib/README.md`](../../lib/README.md), `Mode`). Everything is an
array: the towers built are the rows of one matrix, the level's
enemies the rows of another, and a tick is a few expressions over
them, whatever their number.

- **Every tower against every enemy is one table**: how far apart they
  are. A tower whose time between shots is up takes, of the enemies
  within its reach, the one furthest along the road.
- A shot does its damage less the enemy's armor, never less than 1. A
  fire tower's shot also hurts everything within its splash of the
  target; an ice tower's slows what it hits to half speed for a while.
- An enemy that falls pays its bounty in gold; one that reaches the
  gate costs a life and is gone.
- Won when every wave has been sent and seen off with lives left; lost
  when no life is left.
- Winning tells the world the bridge was held and keeps the gold;
  losing tells it the gate was breached.

## What you see

The towers and the enemies are models described in X_eTaL and made
through Blender ([`assets/`](../../assets)): the archer tower's wooden
deck, crossbow and green pennant, the fire tower's red band and
burning brazier, the ice tower's blue crystal; a hooded runner, a
brute in iron with a club, a shield bearer. A tower turns to where it
last shot and plays its fire clip; where a shot lands there is a
burst for a moment (dust for an arrow, fire, a splash for ice). Every
enemy of the level has its piece from the start, so a piece is always
the same enemy; one not on the road waits out of sight.

## Play it

```bash
just run defense        # the scripted game: builds refused, a level won, a level lost
just play defense       # play it at the terminal (type the events)
just test-game defense  # compare with the expected output
```

The events: `tick 0.05` lets time pass; `key 1`, `key 2`, `key 3`
choose the archer, fire or ice tower; `click X Y` builds the tower
chosen on the ground tile under that point of the picture (`choose R
C` on the tile of that row and column, which is what a script writes);
`key space` sends the next wave.

## Data

[`defend.toml`](defend.toml), the scenario: what you start with, the
waves (a letter an enemy), and a table each for the towers (cost,
range, damage, cooldown, splash, slow) and the enemies (hit points,
speed, armor, bounty, letter). The map and its road are the
battlefield's, [`world/battlefield.toml`](../../world/battlefield.toml).

## Workarounds

None.
