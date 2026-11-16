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
