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
| F1 | 2026-11-21 | Starting a new game erased the player's profile. Confirmed in the code: the header's New game button removes the whole save from the browser, so every profile goes, not only the current game's progress. | triaged | 001 |
| F2 | 2026-11-24 | The fields are too dark: add lanterns, or light the area more. | triaged | 002 |
| F3 | 2026-11-21 | Detailed notes on the progression, the bridges, the city, the mazes, the dungeon and the treasury. Only a summary was forwarded. | new: needs the email's text | |
| F4 | 2026-11-22 | Gameplay and navigation issues. Only a summary was forwarded. | new: needs the email's text | |
| F5 | 2026-11-23 | Path colors; characters that move too fast; the restart buttons. Only a summary was forwarded. | new: needs the email's text | |
| F6 | 2026-11-23 | The music and map keys (M for the mini map, \ to mute) and the music's transitions. | fixed: M is the map in every game, \ mutes, [ ] the volume; bridges between music sets (D21, D23) | |
