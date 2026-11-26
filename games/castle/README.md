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
  splash, the front door, the roads, the treasury, the hall and a talk;
  explore on foot and in the maze; sinister in the dungeon and the
  ray maze; battle at the bridge ([`music.toml`](music.toml)). The
  order of the phrases is a plan the program works out from the
  file's rules and a seed ([`lib/Music.xtl`](../../lib/Music.xtl)):
  rounds of A, the bed B once or twice, C, the turnaround D; no phrase
  too often in a row; now and then a round of a companion set or of
  the set in a slower or faster tempo; about forty minutes before it
  plays again. Leaving a place for one of another set, the music
  changes fast: a short bridge piece at the next bar line (release
  after a battle left, to-victory after one won and then a round of
  victory, fall after one lost and then defeat; call-to-arms into a
  battle, riddle into a walk or a maze), and the new set's
  first phrase at its end ([`../../docs/music-credits.md`](../../docs/music-credits.md)
  names the tunes they quote). Where no bridge fits (into the
  dungeon or the ray maze, back from a walk or a maze) the phrase
  playing fades out at its next bar line and the new set's first
  phrase comes in at once. The picture names it, and the page plays it, as loud as the
  world's `settings.music` (0 to 10; 6 when not set) and silent with
  `settings.mute`. Every picture has a sound strip in a corner (the
  top right; the bottom right of a screen with its own menu): a click
  on the speaker, or \, mutes and unmutes; the minus and plus, or [
  and ], make it quieter and louder; the level is kept in the world
  when the game ends. The front door's Settings rows (Music volume,
  Music on or muted) are the same sound, heard at once
  ([`sound-check.xtl`](sound-check.xtl)). The music is the user's
  own, encoded from WAVs
  into `assets/music` by `just music`.

- **Settings without leaving.** In every game the strip's gear (or
  the key ,) opens a settings panel and pauses the game as it stands:
  the music's volume and on or muted, then Resume playing (the gear,
  , or Esc too), or Exit to start menu (the profile's home on the
  front door) ([`pause-check.xtl`](pause-check.xtl)).

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
- **The road through the fields.** The attacker's approach, as the
  painting from the tower shows it: out of the forest and along the
  winding road between the fields and their walls to the town's gate
  (the scenario `../walk/fields.toml`, its map
  [`world/fields.toml`](../../world/fields.toml)). The field walls stop
  you; the road goes through their gaps. It opens with the painting
  from the tower.
- **The hill fort.** A level of Castle Defense on the outlying fort's
  hill: the road winds to and fro up the hill to the fort's gate (the
  scenario `../defense/hill-fort.toml`, its map
  [`world/hill-fort.toml`](../../world/hill-fort.toml)).
- **The bridge troll.** A talk ([`Talk.xtl`](Talk.xtl), `talk`,
  [`troll.toml`](troll.toml)) with Grubb, who keeps the long bridge
  and wants ten gold, or the answer to his riddle, before you cross.
  He says something; you choose an answer by its number, by Up and
  Down and Enter, or by a click; he replies, and the talk goes on.
  Pay him, answer his riddle, haggle, or flatter him; insult him or
  run for it and you end up in the river; or walk away. Some answers
  depend on the world: paying is one only with the gold for it, and
  some are only there once you have learned something earlier in the
  talk. What you pay or learn is kept in the world
  (`resource.gold`, `fact.troll-name`, `fact.troll-riddle`), and so is
  the way: `fact.troll-way` 1 when he lets you over, -1 when he
  throws you off. Won, the place is done and brings experience. A talk
  is a dialog tree in TOML: nodes (the character's lines and 2 to 4
  answers) and answers (your words, the reply, the next node or an
  end, and what they do); a file that is wrong, such as an answer
  leading to a node there is not, is a message naming the file and
  the field. [`talk-check.xtl`](talk-check.xtl) walks every ending;
  [`images/look/troll.png`](../../images/look/troll.png) shows the talk.

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
- **The front door.** Before the castle ([`Front.xtl`](Front.xtl),
  `front`, [`front.toml`](front.toml)): who is playing (a profile, or
  a new one with a typed name), the character (a calling, a build,
  pronouns, a title for a Witch/Warlock, a cloak), the profile's home
  (play, the hall of deeds, the treasury, settings, another profile),
  then the side and how hard. Up and Down choose a line, Left and
  Right change it, Enter, space, a click or its number takes it,
  Backspace goes back. Settings is a list: the default difficulty,
  pronouns, title, cloak, the music's volume (0 to 10, 6 at first,
  kept as `settings.music`; Left and Right stop at the ends, taking
  the line goes round) and mute (`settings.mute`, 1 when muted).
  [`front-check.xtl`](front-check.xtl) plays it on
  scripts of events.
- **The menu bar.** Along the top of every front-door screen and the
  road of levels ([`Menu.xtl`](Menu.xtl)): Home (H), Hall of deeds
  (D), Settings (S), Help (?) and Leave (Q), each a button to click or
  a key, in small letters or capitals. Help shows the screen's help
  over it until the next key or click; Leave goes back to the
  profiles. Hall is grayed out where no profile is chosen (the
  profiles, a new name being typed). While a name is typed the letters are the name's: click
  the bar (or ? for help). From the road, the bar leaves saying where
  to (`menu.go`: 2 the hall, 3 settings, 4 the profiles), and the
  castle's program goes there.
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
leaves any game for the map. On the front door and the road of
levels, `key h`, `key d`, `key s`, `key ?` and `key q` are the menu
bar's (or a click on it). Each game's own events are its own.

## Data

[`castle.toml`](castle.toml): the venues. [`levels.toml`](levels.toml):
each side's road of levels, by the venues' ids. The games' scenarios are
their own (`../defense/level-1.toml`, `../walk/roam.toml` ...).

## Workarounds

None.
