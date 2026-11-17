# defend-the-bridge

Saga 3 of Evolving Game (docs/plan.md): Castle Defense's first level,
playable in the browser and at the command line: the battlefield's one
road, three towers (archer, fire, ice), three enemies, five waves. The
user, 2026-11-16: "start Castle Defense now, do the look work as
needed".

Read first: CLAUDE.md, docs/plan.md (decisions, the seams, Saga 3),
docs/architecture.md, docs/style.md, docs/look.md.

How the work goes:
- The game is a mode (lib/Mode): one rules library, data in TOML, no
  loop, view or page of its own. Array-style: every tower against every
  enemy is one table, not a loop.
- Deterministic: time only as ticks, chance only through lib/Rng.
- Goldens first; a level shipped is proven winnable by a golden.
- The page decides nothing; look at every page before publishing;
  just publish runs the browser test.
- The look is done as the game needs it (models, particles, rigs);
  what X_eTaL-extensions lacks is an ask written first.
- A file may not differ from another in the same directory only by
  case (the disk does not tell them apart).

## Steps

1. defense-rules -- games/defense: the mode, its data, scripted goldens.
2. defense-view -- pieces, shots, caption, building by key and click;
   the page's third game; published.
3. defense-pieces -- towers and enemies as models; arrows and fire.
4. defense-balance -- seeded games, the waves tuned, winnable and
   losable by goldens.
5. defense-polish -- what playing shows is missing.
6. defense-docs -- docs, docs/games.md begun, the retrospective.
