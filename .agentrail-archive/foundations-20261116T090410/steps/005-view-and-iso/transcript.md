# Transcript: step 005-view-and-iso

- session: `aa799d6f-a24d-4191-96c1-990260eb212d`
- log lines: 1810–2055 (246 lines)
- log sha256: `20dffc09d50b4aaed88faff17120a10fb46531f324477c8a88df55c7ad5f7349` (the log's first 2055 lines)
- commits: 349093761a976822d34b685bb98e22262bab2978
- tokens: 56 input, 33661 output, 7317038 cache read, 59754 cache write

Prompts and replies only. Tool calls, tool results, thinking and metadata are
omitted; the full log is kept outside the repository (`agentrail sessions path`).

---

**Assistant** · 2026-11-16T06:17:57.456Z

Step 4 (mode-contract) is done and pushed; the gate passes. There is now something to play, at the terminal only.

## Try it
```bash
just play walk     # type: tick 1 <Enter>, key space <Enter>; Ctrl-D leaves
just run walk      # the scripted version
```
A walker (`@`) comes in at the bottom of the battlefield and follows the road over the bridge to the gate. `tick 1` lets a second pass and `key space` stops or starts the walker. The map reprints whenever the walker moves. It is won at the gate (296 ticks at 20 a second) and lost if 30 seconds pass first.

## What was built
- **`lib/Mode.xtl`:** the protocol every game follows, and the single loop that plays any of them from live events or from a script. An event the game does not list as legal never reaches its rules.
- **World state and outcomes:** the world is whole numbers under names (`resource.gold`, `zone.battlefield.gate-open`). A game returns what it changed and what it brings; changes apply however it ended, rewards only on a win.
- **`games/walk`:** the first game on the protocol. Winning opens the gate and brings 5 gold; boots already in the world make the walker faster (212 ticks instead of 296).
- **Two stub games in the tests:** a lights puzzle with no clock and a two-sided take-the-last-stone game, each run through the same loop and picked by the scenario's mode name.

## Things you might trip over
- **Choosing a mode by name is done in the program, not from a table.** X_eTaL is typed and each game's state differs, so a program holding several modes branches on the scenario's mode name. The campaign will need one such branch per game.
- **The rules library is `Walking.xtl`, not `Walk.xtl`.** On macOS `Walk.xtl` and `walk.xtl` are the same file, and I overwrote one with the other before renaming.

Next is step 5 (view-and-iso): the flat SVG picture and the 3D scene from the same state. Browser play follows in steps 6 and 7.

---

**User** · 2026-11-16T06:17:57.749Z

how can I try it now?

---

**Assistant** · 2026-11-16T06:18:02.487Z

From the repository root, in a terminal:

```bash
cd /Users/mike/github/sw-fun/evolving-game
just play walk
```

The map prints and it waits for you. Type a line and press Enter:

- `tick 1` lets one second pass; the walker `@` moves 2.5 tiles along the road.
- `tick 0.2` is a smaller step, about half a tile.
- `key space` stops the walker, and the same again restarts it.
- Ctrl-D leaves.

About fifteen `tick 1` lines get the walker to the gate, and it then prints "The walk was won." with the gold. If 30 seconds pass first (for example, stop it and keep ticking), it is lost.

If you'd rather watch than type, either of these works:

```bash
just run walk                                   # scripted: short walk, full walk, a loss, a faster walk
yes "tick 0.2" | head -80 | just play walk      # a whole walk, played for you
```

If `just play walk` complains that `bin/xetal` is missing, run `just xetal` once first. It is already built on this machine, so it should not be needed.

It is text only for now. The picture and the browser version come in the next three steps.

---

**User** · 2026-11-16T06:23:09.998Z

go on to step 5 view-and-iso

---

**Assistant** · 2026-11-16T06:25:33.476Z

Step 5 is begun; I'm reading how the two existing 3D players (the extensions' Three.js player and tower defense's scene view) describe a scene, to decide which form `lib/View` writes.

Reading is done and the design is settled: one view value from a mode, turned by `lib/View` into a text drawing, an isometric SVG picture, and a scene for the 3D player. Writing the library now.

The walk now produces its scene and picture; fixing the "on the bridge" moment in the new picture golden, then goldens, docs (including the Idler in the plan) and the commit.

Docs are nearly done; updating the plan's open questions (the Idler's shape, and two stale items), then the gate, commit and push.
