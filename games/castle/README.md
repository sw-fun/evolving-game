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

- **Experience, quests and achievements.** Winning brings experience
  (`resource.xp` in the world). [`castle.toml`](castle.toml) also lists
  the deeds: quests, known from the start, and achievements, hidden
  until earned; each is achieved when the names of the world it needs
  reach its least, and brings experience of its own
  ([`Deeds.xtl`](Deeds.xtl)). The program awards them after every game,
  the map says when there are new ones, and the hall of deeds
  ([`Ledger.xtl`](Ledger.xtl), `board`) shows them all.

- **Music.** Every place plays a set of looping phrases: calm at the
  splash, the front door, the roads, the treasury and the hall;
  explore on foot and in the maze; sinister in the dungeon and the
  ray maze; battle at the bridge ([`music.toml`](music.toml)). The
  order of a set's phrases is a plan the program works out from the
  file's rules and a seed ([`lib/Music.xtl`](../../lib/Music.xtl)):
  A, then the bed B two or three times, C, the turnaround D, and A
  again. The picture names it, and the page plays it, as loud as the
  world's `settings.music` (0 to 10; 6 when not set) and silent with
  `settings.mute`. The music is the user's own, encoded from WAVs
  into `assets/music` by `just music`.

- **Kept between visits.** In a browser the world (gold, experience,
  places won, deeds) is saved after every game and read back when the
  page is opened again; New game forgets it. At the command line
  nothing is kept, so a run is only what its events make it.

- **Three games taken from X_eTaL-games.** The gate maze
  ([`Warren.xtl`](Warren.xtl), `maze`), the dungeon
  ([`Depths.xtl`](Depths.xtl), `dungeon`) and the second maze
  ([`Passage.xtl`](Passage.xtl), `raycaster`) are that repository's
  maze, dungeon and raycaster, their rules libraries used as they are:
  each mode here enters one from the map, hands it the keys, and makes
  its way out an outcome (experience; the dungeon's gold comes out
  with you). Their data are `maze.toml`, `dungeon.toml` and
  `raycaster.toml` here.

- **The city.** Inside the gate, the village seen behind the wall is
  walked on foot (the walk's `Roaming`, the scenario
  `../walk/city.toml`): its houses make a maze; you start deep in it
  and find the way through the streets to the keep's door.

- **The winter camp.** The besiegers' tents and cook fires in the
  snow, walked on foot (the walk's `Roaming`, the scenario
  `../walk/camp.toml`) from the south to the palisade's gate.

- **Cards.** A walk whose scenario names a painting (`art`) opens with
  a card of it ([`Overture.xtl`](Overture.xtl), `card`): space goes
  on, B goes back. The long bridge opens with the bridge painting, the
  city with the keep.
- **The long bridge.** The walk across the bridge to the castle's gate
  (the scenario `../walk/crossing.toml`).

- **The treasury.** An idle game ([`Hoard.xtl`](Hoard.xtl), `idle`,
  [`treasury.toml`](treasury.toml)): coins come in by the second;
  1 2 3 4 buy a mint, a counting house, a merchant fleet and a royal
  bank, each opening when you own five of the one before; space or B
  carries the coins out as gold. C, or a click, strikes a coin by hand.
  Every deed in the hall of deeds is renown (the coins come faster), and
  relics found in the dungeon, the mazes and at the bridge each make one
  thing better: what things cost, the rate, what waits for you, or a
  strike. Places won elsewhere since your last visit leave coins
  waiting. Its picture lies over the treasury painting.
- **The war chest.** The attacker's idle game, the camp's counterpart
  of the treasury ([`Warchest.xtl`](Warchest.xtl), `chest`,
  [`warchest.toml`](warchest.toml)), the last place of the attack
  road: crowns come in by the second; 1 2 3 4 5 buy foragers, a
  raiding party, a siege workshop, a mercenary company and a war
  council (which doubles everything), each opening when you own enough
  of the one before; space or B carries the chest out as gold. R, or a
  click, raids by hand. Every deed raises a war banner (the crowns come
  faster), and trophies taken at the gate, in the dungeon and in the
  mazes each make one thing better. It is the treasury's game on its
  own file: the file names what it keeps in the world (`chest.*`, never
  the treasury's `idle.*`), its words, its painting and its hand key.
  The gold either one carries out is the world's `resource.gold`, the
  gold every other game spends (Castle Defense starts a level with
  it).

- **The level maps.** Each side has a road of levels
  ([`Roads.xtl`](Roads.xtl), `roads`, [`levels.toml`](levels.toml)):
  the castle's places in the order they are played, from a tutorial to
  the hard ones, drawn as a winding path of numbered circles over a
  painting (the keep for the defender, the bazaar for the attacker).
  The world's `session.side` says which (1 defends, 2 attacks). The
  first two are open; each next one opens when one of the two before it
  is won, so two are always open ahead. A done one has a check, an open
  one is gold, a locked one is gray and says what opens it, and an
  attacker's place with no attack version yet says so (the defender's
  is played). The arrows choose; enter, space, a level's number or a
  click on its circle goes there, if it is open, by setting
  `campaign.go`; B, backspace or Esc goes back.
  [`road-check.xtl`](road-check.xtl) plays both roads on scripts of
  events.
- **Portraits.** [`Portrait.xtl`](Portrait.xtl) draws a character
  standing, seen from the front, as SVG: `pt:s_vg` places the figure
  in a picture and `pt:c_ard` gives a whole 300 by 400 card. A calling
  (1 Soldier, 2 Merchant, 3 Spy, 4 Thief, 5 Witch or Warlock,
  6 Engineer, 7 Herald) adds what it carries and wears: a sword and a
  tabard, a coin purse and a fine hat, a hood and a half-mask, a
  dagger and a dark scarf, a staff and a pointed hat, a hammer and an
  apron, a horn and a banner. A build from 1 (masculine) to 7
  (feminine) changes the body by small steps: shoulders and jaw
  narrower, the waist shaped, the hair longer, the brows finer, a
  beard at 1 and 2 and stubble at 3. The cloak is in the color given.
  [`portrait-check.xtl`](portrait-check.xtl) prints a few cards;
  [`images/look/portraits.png`](../../images/look/portraits.png) shows
  every build of the soldier and the witch, and every calling.

[`Venues.xtl`](Venues.xtl) reads the venues for the others.

## Play it

```bash
just run castle        # the scripted tour of the venues, the map and a placeholder
just play castle       # the castle at the terminal (type the events)
just test-game castle  # compare with the expected output
```

A quest or an achievement is added as a venue is: a `[deed.NAME]` in
the file.

The events: `choose 1 N` goes to venue N from the map (a click on its
marker does the same); `key D` shows every place; in a place not built
yet `key space` calls it done and `key b` goes back; `choose 0 0`
leaves any game for the map. Each game's own events are its own.

## Data

[`castle.toml`](castle.toml): the venues. [`levels.toml`](levels.toml):
each side's road of levels, by the venues' ids. The games' scenarios are
their own (`../defense/level-1.toml`, `../walk/roam.toml` ...).

## Workarounds

None.
