# The look

What the game is to look like, how that is measured, and what has to
be added to get there. Written at the start of Saga 2
(`docs/plan.md`); each of its steps works from this and corrects it.

## What was asked for

The user's words (2026-11-16), of the first live demo:

> when will the quality of the game be improved? better graphics? less
> sims-like, more realistic, better textures, particle systems...

and of the game as a showcase:

> some of these need to be like the procedural snow world and neon
> city (and similar interfaces for the castle themed parts. Maybe a
> castle siege in winter trudging through snow. Maybe a neon-city
> inspired medieval city with narrow crooked streets, a bazaar, a
> shanty town, other "fly-through/walk-through" procedural "city" but
> not modern, no neon, no ads, no billboards, just castle-theme
> appropriate graphics. Maybe smoke from fires, grills, boiling pots,
> maybe waving banners, tent flaps, etc.

> in neon city there are cars and flying cars, in castle city there
> can be horse-drawn carts ambling by, and crows flying overhead

Read as: surfaces that look like what they are (stone that is stone,
not a gray box); light that comes from somewhere and casts shadows;
ground that is ground, not a grid of columns; things that move
without being told to (smoke, cloth, water, birds); people and
animals with weight. Not a toy diorama.

Assumed, because the art reference (`docs/images/castle-siege.png`,
D18) is not in the repository: a late-medieval northern castle; muted
natural colors (gray stone, weathered wood, dull green, snow), warm
only at fires and banners; overcast or low winter sun. **A picture, or
a few, from the user would replace these assumptions**; nothing below
waits for it.

## The two test scenes

Every step is tried on both, and its captures are kept in
`images/look/`.

1. **The board.** The battlefield as it is played: the river, the
   bridge, the wall and gate, the walker on the road, from the
   isometric camera. Now: `images/look/board-before.png`.
2. **The winter camp.** One small world to walk through: the
   besiegers' camp in snow before the walls, on the same battlefield
   map seen from the ground. Tents with flaps, cook fires and a pot
   with smoke, banners, a supply cart and horse ambling up the road,
   crows over the field, the castle wall ahead, footprints in the
   snow behind you. It holds every one of the user's examples in a
   place a few dozen meters across, and it is the first part of the
   siege in winter. The town (crooked streets, a bazaar, a shanty
   town) is the next world, after this saga: it needs a generator of
   buildings, which this one does not.

## Budgets

To be confirmed or changed by the first measurements (steps 2 to 4);
a step that breaks one says so and why.

| Measure | Budget | Now |
| ------- | ------ | --- |
| Frames a second, a laptop with integrated graphics, 1280 by 800 | 60, never under 40 | not measured on real hardware (the page shows it, top right) |
| X_eTaL a tick (20 ticks a second) | 10 ms, never over 25 | about 9 ms in headless Chrome, most of it writing the flat picture |
| The site, first load | 6 MB | 2.4 MB |
| The site, all of it | 20 MB | 2.4 MB |
| A piece's `.glb`, without textures | 256 KB (D13) | 2 to 54 KB |
| Textures, all of them, tracked | 8 MB, shared between pieces, none over 1 MB | none |

## What has to be added

The scene is text, a call a line, that names no renderer
(`docs/architecture.md`); the look is new calls. For each: the call
`lib/View` will write, who draws it, and what the flat picture does.

| Part | Call (an example line) | Drawn by | The flat picture |
| ---- | ---------------------- | -------- | ---------------- |
| Terrain | `terrain('ground', nums('x z y ...', 3), ints('a b c ...', 3), nums('r g b ...', 3))`: corners, triangles, a color a corner | the board player (ask) | unchanged: the tiles |
| Tiles from models | `tiles('wall', '#9aa0aa', nums(...), 'wall')`: a fourth argument, the model | the board player (ask, open) | unchanged |
| Materials | none: carried by each `.glb` (base color, roughness, normal maps) | Blender bakes them (`Bpy.xtl`: ask); the board player draws glTF materials as they are (ask) | the piece's flat color |
| Terrain's material | `ground('ground', 'grass', 'snow', nums('w ...', 1))`: two named textures and a blend a corner | the board player (ask) | unchanged |
| Light | `sun(nums('dx dy dz', 3)[0], '#fff1dd', 2.5)`, `sky('#9fb4c8', '#5e6b78', 0.8)`, `fog('#aab4bd', 0.012)` | the board player (ask: shadows, ambient occlusion, tone mapping, fog) | a tint over the picture |
| Water | `water(nums('x z y ...', 3), ints(...), nums('fx fz', 2)[0], '#3f6f8f')`: a surface and its flow | the board player (ask) | the water tiles, as now |
| Particles | `particles('smoke', nums('x z y', 3)[0], 12, nums('wx wz', 2)[0], 7)`: kind, place, a second, wind, a seed | the board player (ask) | a small mark at the place |
| Cloth | `piece('banner', ..., 'wave', t, ...)`: a clip, as any piece; the wind's direction in `sun`'s companion `wind(nums('wx wz', 2)[0], 0.6)` | Blender makes the clip (`Bpy.xtl`: ask, cloth baked to keys) | the piece, still |
| Figures | `piece('walker' ...)` as now; a rigged model | Blender (`Bpy.xtl`: ask, armatures and skinned clips) | as now |
| Carts and crows | `piece('cart' ...)`, `piece('crow' ...)`: their paths worked out in X_eTaL, as the neon city's cars are | nothing new | as any piece |
| A camera that walks | `eye(nums('x z y', 3)[0], nums('hx hz pitch', 3)[0], 60)` in place of `camera`: where you stand, the way you look, the lens | the board player (ask: perspective, and the walk and fly controls its city player has) | a mark where you stand, on the board's picture |

## As built

- **Terrain** (step 2): `lib/Terrain` works the surface out as arrays.
  A tile is four triangles round its middle; the middle is at the
  tile's own elevation (so pieces stand where the rules say) and a
  corner at the mean of the land round it (so steps become slopes);
  water and bridges have the river's bed as their ground, 0.3 under
  the water; walls and gates stand on the ground beside them. The
  battlefield's mesh is 841 corners and 1600 triangles, 42 KB as a
  call. `vw:s_mooth` makes a stage whose scene is that `terrain` call
  with tiles only for the water and the built kinds, on which pieces
  stand on the surface and a click is turned back into a tile by
  asking the surface itself (to a third of a tile). The walk still
  uses `vw:s_tage`: the player does not draw `terrain` yet (the ask),
  and a scene with a call it does not know would not be drawn at all.
- **Built tiles from their models** (the ask landed 2026-11-16): the
  scene's bridge, wall and gate tiles name their models, and the live
  demo draws the wall with its merlons, the gate and the bridge with
  its rails.

- **Materials** (step 3): five textures described in X_eTaL
  (`assets/Castle.xtl`: dressed stone in courses, darker stone, deck
  boards, timber, door planks; each a kind, three colors, a size and
  a roughness) and baked by Blender from its own nodes
  (`assets/skins.py`) into a color picture and a normal picture, 256
  pixels and a meter square, laid over each part's faces at the
  world's scale, so a wall's stones are the size of a gate post's.
  The wall, gate and bridge wear them; the `.glb` carries them
  (131 to 192 KB each, inside D13's 256 KB, which stays and is
  enforced by `scripts/check-assets.py`); the player draws them with
  no change. Baking takes Blender about ten seconds for all of them.
  Not done here, waiting on asks: the ground's own texture (terrain),
  bevels, and light that shows the surfaces' relief (they read pale
  and flat under the player's two plain lights).

- **Light** (step 4), the X_eTaL side: `lib/Sky` works an hour of the
  day out into a light: the direction to the sun (east at 6, south
  and 35 degrees up at noon, west at 18; the moon by night), its
  color (warm when low) and strength, the sky's colors overhead and
  at the horizon, the haze. `vw:l_it` puts its three calls at the
  head of a stage's scene and washes the flat picture with the sky's
  color as the hour darkens. A scenario says its hour (`time`);
  `games/walk/evening.toml` is the walk at a quarter past five, and
  its scene and picture are goldens. **Not drawn yet**: the player
  has no light module (the ask), and stops on a call it does not know
  (a second ask), so the published walk says no time. The frame rate
  before and after is to be measured when shadows are drawn; before,
  on real hardware, it is what the page's corner shows.

- **Switched on** (2026-11-16, when X_eTaL-extensions landed its
  light, terrain, water and `beyond`): the walk's stage is the smooth
  one and its scenario says an hour (14.5). The scene is the terrain
  under grass, worn to dirt on the road (`tr:w_orn`), a band of
  ground 24 tiles wide round the map (`tr:a_round`) and ground to the
  horizon (`beyond`), so the board no longer floats; the river as a
  water surface that flows and foams (`tr:w_ater`); the sun, the sky
  and a haze, with shadows; and tiles only for the wall, gate and
  bridge. Before and after: `images/look/board-before.png`,
  `images/look/board-lit.png`.
  Known, and next: the river stops at the map's edge (a dry ditch
  goes on through the band); the wall does too; the walker is small
  and still boxes; a tick's picture is now 120 KB (the scene twice the
  size, written every tick), 18 ms an event at the command line where
  it was 11: the scene's unchanging lines should be sent once.

- **A camera that walks** (the world-view step, begun): a view may
  hold the piece `eye` (`vw:w_ith`): where you stand, the way you look,
  a pitch. The scene then has an `eye` call after its `camera`, and
  the player draws it in perspective; the flat picture and the text
  mark where you stand. The mode `roam` (`games/walk/Roaming.xtl`) is
  the battlefield on foot: held keys come as `choose 2 CODE` and
  `choose 3 CODE`, the pointer as `move DX DY`, and the game decides
  what each key does. The page offers both games, sends every game
  both forms of a key, and takes the pointer when a scene has an eye.
  Still to do for this step: the winter camp as the world to walk (it
  needs tents, fires and figures), and a real pointer, which has only
  been tried with made-up events.

- **Snow** (2026-11-17, the first weather): a scenario says
  `weather = ["snow 0.8"]`. `md:s_tage` builds every mode's stage from
  its scenario's time and weather. Under snow (`vw:w_inter`) the
  terrain is white, trodden brown along the roads, under the player's
  snow texture, round the map and to the horizon; the river runs
  dark; `sk:s_now` dims and pales the sun, grays the sky and whitens
  the haze; the flat picture is whitened. Castle Defense and the
  battlefield on foot are in snow; the watched walk stays green.
  Falling snow is written (`particles('snow', ...)`) and is an ask:
  the player has no falling kind yet, warns, and draws the rest.
  Snow changes no rule yet. Captures: `images/look/snow-defense.png`,
  `images/look/snow-foot.png`. The reference picture is now
  `docs/images/block-bridge-far.jpg`.

## What exists to build on

- **The board player** (`board.js`, X_eTaL-extensions): the four calls
  of today, flat-shaded columns, pieces from `.glb` with clips, moved
  between ticks. No shadows, textures of its own, fog or particles.
- **The city player** (`player.js`, the same extension): a
  perspective camera that rides a flight, flies or walks; a sky dome;
  fog; steam as flat sheets; lamps; a fleet of models moved along
  paths (the cars); bloom; tone mapping (AgX); surfaces with
  roughness. No shadows. Its walking, its fog and its fleet are what
  the winter camp needs; they are to be asked into the board player,
  or the two players made one.
- **The snow world** (snowflow_demo-fork): terrain generated by
  X_eTaL libraries, footprints pressed into snow, a cached sun shadow
  map, procedural material detail, sound, on a renderer of its own in
  Rust (WebGPU) fed typed arrays, not scene text. Its methods (the
  terrain's functions, deformable snow, its shadow map) are the model
  for steps 2, 4 and 9; its renderer is not this game's (D7: the
  Three.js player), unless measurements say otherwise at step 9.
- **Bpy.xtl**: boxes, cylinders, cones, spheres, lathes, meshes from
  arrays, groups, keyed clips, flat colors with emission. No
  textures, bevels, armatures or cloth.

## The asks

Written in `docs/xetal-extensions-asks.md` with this document as
their reference. In the order the steps need them: terrain and
`tiles` from models (step 2 and 3), glTF materials drawn as they are
and textures from Bpy (3), light (4), water (5), particles (6), cloth
and armatures from Bpy (7 and 8), the walking camera (9).

## Open

- The reference picture.
- One player or two: the board player grown to walk, or the city
  player grown to draw a board (an ask's answer, not this
  repository's choice).
- Whether textures are tracked here or made at build time
  (`just assets` needs Blender; the gate must not).

## The paintings

Five paintings of the user's say what the game should look like. All
five are in the repository (`docs/images`): the user made them with
text-to-image tools and they are the user's own to publish. The page
shows four of them as they are. Each is also a brief for models and
generated views, so the game's own drawing comes to look like it.

- `block-bridge-far.jpg`, the long bridge: shown on the card before the
  crossing. Wanted in 3D: a high arched stone bridge over a chasm, cliffs
  and falls either side, a storm with lightning over it.
- `block-castle-keep.jpg`, the keep: shown on the card before the city.
  Wanted in 3D: a tall square keep of dark stone on a crag, its
  battlements on corbels, round turrets with conical roofs, lit narrow
  windows, ivy, a torn banner, dusk under heavy clouds, mist in the
  trees below.
- `block-castle-treasury.jpg`, the treasury: behind the idle game's
  picture. Wanted as a generated room: a vaulted hall of pale stone on
  pillars, stained glass and shafts of light, heaps of coins that grow
  with the coffers, chests, crowns and cups, suits of armor, shields
  and tapestries on the walls.
- `block-damp-torches.jpg`, the dungeon: shown on the card before the
  dungeon. Wanted on the walls of some of the mazes (the gate maze,
  the maze seen from inside, the dungeon): rough dark stone blocks
  with moss, round arches on squat pillars, torches in iron brackets
  with warm flickering light and smoke, cobwebs hung between the
  pillars, wet flagstones that catch the torchlight, chains and
  rubble on the floor, mist down the far corridor.
- `block-castle-bazaar.jpg`, the bazaar below a castle: what the city
  should become. Not shown in the game yet. Wanted: a
  street of tents and awnings in many colors, hanging rugs, lanterns,
  sacks and pots, crowds, animals, banners on every tower, mountains
  and forest beyond, mist and sun rays.
