# Asks for X_eTaL (the language)

Language features the games need that X_eTaL does not have, and bugs
in it the games uncovered. These are expected to be rare: where a
game wants a form the language lacks, the first answer is a macro
library here (`lib/<Name>.xtlm`, `docs/plan.md` D19), and an ask is
for what a macro cannot do. This repository does not change X_eTaL: each ask
is written here and taken to that repository, the game uses the
workaround noted or waits, and the workaround is removed when the ask
has landed in the commit this repository is pinned to.

Each entry: status (open, filed, landed, dropped), kind (feature, bug
or performance), what needs it, why, a minimal repro or example, and
the workaround in use. Details that do not fit a table row go in a
section below it.

| Status | Kind | Ask | Needed by | Workaround |
| ------ | ---- | --- | --------- | ---------- |
| open | performance | A built-in join of boxed texts (raze), and cheaper copying of long texts | every view's picture (`lib/View`), each tick | join in pairs (`t:j_oin`); keep the joins few and the long texts copied as few times as can be |

### A built-in join of boxed texts, and cheaper text copying

Every tick, `lib/View` writes the whole picture: an SVG of about 200
KB whose scene (the ground, about 100 KB) and flat tiles (about 100
KB) were worked out once, in the stage, but must be copied into the
new text. At the pin, copying a text costs about 10 ns a character
(a 200 000-character `c_at` takes 2 ms), and with no built-in join,
`t:j_oin` joins texts in pairs, copying everything once a level: 600
texts of 170 characters take 11 ms. Before the workaround a walk's
tick (the fields, the city) spent most of its 35 to 60 ms joining the
tiles' texts and concatenating the picture; most venues on foot in
the page now take 15 to 35 ms a tick, still mostly copying.

Repro (at the command line, `[]TS` for the time):

```
"t:" u_se< "Text"
texts := 600 r_eshape e_nclose 170 r_eshape "<polygon points=\"1 2 3\"/>"
big := 100000 r_eshape "abcdefgh"
t_ally t:j_oin texts          # about 11 ms
t_ally big c_at big           # about 2 ms
```

Wanted: a built-in join (raze) that copies each character once, as
upstream's own ask for raze (fast paths for array idioms, G10) would
give, and texts copied at memory speed.

Workaround in use (`lib/View`): the stage keeps the flat tiles joined
a band at a time (one text a diagonal of the board, where a piece can
come between them), so a tick joins about 50 texts, not about 600;
the picture and the scene are concatenated in a balanced order, so
each long text is copied about twice, not once for every short text
in front of it; and a scene's pieces are stood on the terrain in one
call, not two.
