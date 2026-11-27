# Feedback

What players and testers reported, one item an entry, and what was
done about it. Reports arrive as emails the user forwards; an entry
says what was reported in our words and never who reported it (no
names, no addresses). The maintenance saga (`lanes/maintenance`, plan
D25) has a step for each item to fix.

Status: new (logged, not triaged), triaged (a step exists), fixed (the
commit), won't fix (why), duplicate (of which).

| Item | Reported | What | Status | Step |
|------|----------|------|--------|------|
| F1 | 2026-11-21 | Starting a new game erased the player's profile. New game, clicked by accident while looking for the hall of deeds, erased the profile and its progress and asked for a new profile, where a way back to the main menu was expected. Confirmed in the code: the header's New game button removes the whole save from the browser, so every profile goes, not only the current game's progress. | triaged | 001 |
| F2 | 2026-11-24 | The fields are too dark: add lanterns, or light the area more. | triaged | 002 |
| F3 | 2026-11-21 | Detailed notes on the progression, the bridges, the city, the mazes, the dungeon and the treasury. | split into F7 to F18 (the email's text) | |
| F4 | 2026-11-22 | Gameplay and navigation issues. | split into F19 to F21 (the email's text) | |
| F5 | 2026-11-23 | Path colors; characters that move too fast; the restart buttons. Only a summary was forwarded. | new: needs the email's text | |
| F6 | 2026-11-23 | The music and map keys (M for the mini map, \ to mute) and the music's transitions. | fixed: M is the map in every game, \ mutes, [ ] the volume; bridges between music sets (D21, D23) | |
| F7 | 2026-11-21 | Praise: the look is professional; the order of the places suits the progression; attack and defend both there. | no action | |
| F8 | 2026-11-21 | The bridges' approaches could branch: more than one path to the bridge. | triaged | 008 |
| F9 | 2026-11-21 | The storm bridge is hard to see: the path approaching the bridge is lost in the low visibility (summer and snow are fine). | triaged | 003 |
| F10 | 2026-11-21 | The gate maze seems made as you play, always as long as it can be. Confirmed in the code: X_eTaL-games' maze puts the way out at the open block farthest from the start, so every maze is its longest walk. | triaged | 006 |
| F11 | 2026-11-21 | The city needs a map, or a key for a view from above. | fixed: the city's mini map (M) | |
| F12 | 2026-11-21 | In the city, walking against the white buildings goes into them: a door and a window show inside, with none outside; walking near the buildings is awkward. Keep the walker off the walls. | triaged | 004 |
| F13 | 2026-11-21 | The city could have buildings of more colors, with doors and windows. | triaged | 007 |
| F14 | 2026-11-21 | The gate maze: monsters, gold or gear at the ends of dead ends. | triaged | 010 |
| F15 | 2026-11-21 | The gate maze: a light that grows as you near the way out (asked for as a strobe; a steady glow or slow pulse instead, no flashing, for players sensitive to it). | triaged | 009 |
| F16 | 2026-11-21 | The second maze: something chasing you to the exit; its look is too busy (like a screen saver). | triaged | 012 |
| F17 | 2026-11-21 | The dungeon: more items as letters (armor, health kits, revives), won there and used when attacking the tower. | triaged | 011 |
| F18 | 2026-11-21 | The treasury gives more gold than playing the games; its rates (or multipliers) need balancing against the battles. | triaged | 005 |
| F19 | 2026-11-22 | Everything must be done in order before the treasury or the war chest can be reached. Partly so in the data: the treasury is reached from the dungeon (and needs gold); the war chest is reached from the camp. Whether they should open earlier is a design choice. | question for the user | |
| F20 | 2026-11-22 | Attacking on foot (the winter camp, the battlefield on foot) you can walk off the path straight to the gate or the bridge; this will matter once defense towers stand along it. | triaged | 014 |
| F21 | 2026-11-22 | The long bridge has no mouse support. | triaged | 013 |
