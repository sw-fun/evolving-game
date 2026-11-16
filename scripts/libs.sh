#!/usr/bin/env bash
# Print the XETAL_PATH the games run with: this repository's lib/, then
# X_eTaL-games' lib/ (Ecs, Svg, State, Board, Text, Play) from its clone
# in work/games at the commit in GAMES_COMMIT (docs/plan.md D11).
#   scripts/libs.sh
#   GAMES_SOURCE=../../softwarewrighter/X_eTaL-games scripts/libs.sh   # clone from a local checkout
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/pin.sh"
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
pin "${GAMES_SOURCE:-https://github.com/softwarewrighter/X_eTaL-games.git}" "$root/work/games" "$root/GAMES_COMMIT"
echo "$root/lib:$root/work/games/lib"
