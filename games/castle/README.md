# The castle

Every game, level and place of Evolving Game, and the way from one to
the next. This is the game the others are parts of.

## How it works

- **Venues are data.** [`castle.toml`](castle.toml) lists every place:
  its title, the mode that plays it and its scenario, where it is on
  the map, the venue whose winning makes it known, what it needs of
  the world, and what it is about. A game is added by adding a venue.
- **The map is a mode** ([`Atlas.xtl`](Atlas.xtl), `map`), over a small
  map of the castle and its country
  ([`world/realm.toml`](../../world/realm.toml)). You see the places
  you have found; an open one is gone to by a click (or its number);
  a locked one says what it needs. D shows and opens every place.
- **A place not built yet** is still there
  ([`Sketch.xtl`](Sketch.xtl), `placeholder`): it says what it will
  be, and can be called done, with a real outcome. Building its game
  later is changing its kind and scenario in the file.
- **One program goes round them** ([`play.xtl`](play.xtl)): the map,
  then the venue chosen, then the map again, with one world state
  carried through. What you win in one game is there in the next: the
  gold kept at the bridge is the next level's to spend; a bridge held
  opens the crossing; a place won shows where it leads.

[`Venues.xtl`](Venues.xtl) reads the list for all three.

## Play it

```bash
just run castle        # the scripted tour of the venues, the map and a placeholder
just play castle       # the castle at the terminal (type the events)
just test-game castle  # compare with the expected output
```

The events: `choose 1 N` goes to venue N from the map (a click on its
marker does the same); `key D` shows every place; in a place not built
yet `key space` calls it done and `key b` goes back; `choose 0 0`
leaves any game for the map. Each game's own events are its own.

## Data

[`castle.toml`](castle.toml): the venues. The games' scenarios are
their own (`../defense/level-1.toml`, `../walk/roam.toml` ...).

## Workarounds

None.
