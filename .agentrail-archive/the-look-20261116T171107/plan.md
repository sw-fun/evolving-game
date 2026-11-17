# the-look

Saga 2 of Evolving Game (docs/plan.md: Saga 2, The look, A showcase).
The user, 2026-11-16, of the first live demo: "when will the quality
of the game be improved? better graphics? less sims-like, more
realistic, better textures, particle systems"; and the game is a
showcase with worlds to walk and fly through, like the snow world and
the neon city but of a castle: a siege in winter, a medieval town
(crooked streets, a bazaar, a shanty town; no neon, ads or
billboards), smoke from fires, grills and pots, waving banners, tent
flaps, horse-drawn carts ambling by, crows overhead.

Goal: the scene there is stops looking like boxes. Two test scenes:
the board (the battlefield, the bridge, the walk) and one small world
to walk through. Measured by the frame rate on a middling laptop, the
size of the site, and captures the user compares with what was asked.

Read first: CLAUDE.md, docs/plan.md (decisions, The look, A showcase,
Saga 2), docs/architecture.md, docs/style.md, docs/look.md once step
1 has written it.

How the work goes:
- The game is X_eTaL; the scene is text that names no renderer; a
  host decides nothing. New things to draw are new scene calls that
  lib/View writes and a player draws.
- The player is X_eTaL-extensions' board player (and its city player
  for worlds); the asset library is its Bpy.xtl. What they lack is an
  ask (docs/xetal-extensions-asks.md) written first, with the call
  wanted and a scene to test it on. Build here what does not wait:
  the X_eTaL that writes the call, its goldens, the flat picture.
  Move EXTENSIONS_COMMIT in a commit of its own when an ask lands.
- The rules do not change; the flat SVG picture always exists; every
  golden still passes or changes on purpose.
- A page change is looked at: the browser test, and a screenshot read
  before publishing. X_eTaL source on a page is shown rendered,
  colored, in JuliaMono.
- Search the sibling repositories before writing something general.
- TDD, the gate before every commit, .agentrail committed with the
  work; publish (just pages, just publish) when the live demo changes.

## Steps

1. look-targets -- docs/look.md: the look in the user's words, the two
   test scenes, budgets, the scene calls to add and who draws each;
   the asks; a capture of each scene as it is now.
2. terrain -- the heights as one smooth ground worked out in X_eTaL;
   a terrain call; the tiles still the rules' grid.
3. materials -- textures made in Blender from X_eTaL's descriptions;
   walls, gate and bridge as built things, drawn; the size limit.
4. light -- sun and shadows, sky light, ambient occlusion, tone
   mapping, fog; a time of day in the scenario.
5. water -- a river that moves and reflects; foam.
6. particles -- smoke, dust, splashes: a particles call.
7. cloth -- banners and tent flaps that move.
8. figures -- a walker with proportions and weight; a horse and cart;
   crows.
9. world-view -- a mode whose camera walks or flies; one small world
   from a seed.
10. look-docs -- captures side by side, the measures, the live demo,
    the retrospective.
