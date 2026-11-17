#!/usr/bin/env bash
# Print the XETAL_PATH the games run with: this repository's lib/, each
# game's own directory (its rules library, which the castle imports), then
# X_eTaL-games' lib/ (Ecs, Svg, State, Board, Text, Play) from its clone
# in work/games at the commit in GAMES_COMMIT, then every library of
# X_eTaL-libraries (libs/<Name>/src: Random, Bits, Strings ...) from its
# clone in work/libraries at LIBRARIES_COMMIT (docs/plan.md D11). A name
# found earlier wins, so lib/ here comes first.
#   scripts/libs.sh
#   GAMES_SOURCE=../../softwarewrighter/X_eTaL-games scripts/libs.sh   # clone from a local checkout
#   LIBRARIES_SOURCE=../../softwarewrighter/X_eTaL-libraries scripts/libs.sh
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/pin.sh"
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
pin "${GAMES_SOURCE:-https://github.com/softwarewrighter/X_eTaL-games.git}" "$root/work/games" "$root/GAMES_COMMIT"
pin "${LIBRARIES_SOURCE:-https://github.com/softwarewrighter/X_eTaL-libraries.git}" "$root/work/libraries" "$root/LIBRARIES_COMMIT"
path="$root/lib"
# every game's rules library, for the program that plays them all
# (games/castle): a rules library's name is its own in the whole
# repository
for d in "$root"/games/*/; do case "$(basename "$d")" in _*) ;; *) path="$path:${d%/}" ;; esac; done
path="$path:$root/work/games/lib"
for d in "$root"/work/libraries/libs/*/src; do path="$path:$d"; done
echo "$path"
