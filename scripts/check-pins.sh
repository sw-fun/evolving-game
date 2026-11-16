#!/usr/bin/env bash
# Check the pins: each *_COMMIT file holds one full commit; the pinned
# X_eTaL builds, answers and reports the commit in XETAL_COMMIT; the
# X_eTaL-games and X_eTaL-libraries clones (on XETAL_PATH) are at
# GAMES_COMMIT and LIBRARIES_COMMIT and
# unedited. The extensions' clone is checked only when it is there
# (scripts/extensions.sh makes it; the gate does not need it).
#   scripts/check-pins.sh
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/venv.sh"
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
for f in XETAL_COMMIT EXTENSIONS_COMMIT GAMES_COMMIT LIBRARIES_COMMIT; do
  grep -Eqx '[0-9a-f]{40}' "$root/$f" || { echo "check-pins: $f is not one full commit" >&2; exit 1; }
done
xetal="$("$root/scripts/build-xetal.sh")"
sha="$(cut -c1-7 "$root/XETAL_COMMIT")"
got="$("$xetal" eval -e "'+ r_/_2 2 3 r_eshape r_ange 6")"
[ "$got" = "6 15" ] || { echo "check-pins: eval gave '$got', expected '6 15'" >&2; exit 1; }
"$xetal" --version | grep -q "$sha" || { echo "check-pins: xetal --version does not name $sha" >&2; exit 1; }
"$root/scripts/libs.sh" >/dev/null
at() { [ "$(git -C "$1" rev-parse HEAD)" = "$(tr -d '[:space:]' < "$2")" ] && [ -z "$(git -C "$1" status --porcelain)" ] \
  || { echo "check-pins: $1 is not at $(basename "$2"), or was edited" >&2; exit 1; }; }
at "$root/work/xetal" "$root/XETAL_COMMIT"
at "$root/work/games" "$root/GAMES_COMMIT"
at "$root/work/libraries" "$root/LIBRARIES_COMMIT"
[ ! -d "$root/work/extensions/.git" ] || at "$root/work/extensions" "$root/EXTENSIONS_COMMIT"
# One X_eTaL (D11): each sibling at its pin is itself pinned to ours.
for c in games libraries extensions; do
  f="$root/work/$c/XETAL_COMMIT"
  [ ! -f "$f" ] || cmp -s "$f" "$root/XETAL_COMMIT" \
    || { echo "check-pins: work/$c is pinned to X_eTaL $(cut -c1-7 "$f"), not $sha" >&2; exit 1; }
done
echo "check-pins: ok (X_eTaL $sha)"
