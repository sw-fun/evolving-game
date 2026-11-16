#!/usr/bin/env bash
# Build the page: the game's X_eTaL program as WebAssembly (web/, with
# trunk) and, beside it, the board player and Three.js of
# X_eTaL-extensions, copied from its clone at EXTENSIONS_COMMIT into the
# ignored web/ext (third-party files are never tracked), and the game's
# pieces (assets/pieces/*.glb) copied into the ignored web/models. The site is
# web/dist: self-contained, relative addresses only (docs/desktop.md).
#   scripts/web.sh            # a release build
#   scripts/web.sh --dev      # quicker to build, slower to run
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/pin.sh"
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
command -v trunk >/dev/null || { echo "web: trunk is not installed (README, Prerequisites)" >&2; exit 1; }
"$root/scripts/build-xetal.sh" >/dev/null
"$root/scripts/libs.sh" >/dev/null
ext="$root/work/extensions"
pin "${EXTENSIONS_SOURCE:-https://github.com/softwarewrighter/X_eTaL-extensions.git}" "$ext" "$root/EXTENSIONS_COMMIT"
from="$ext/extensions/three/web/static"
rm -rf "$root/web/ext"; mkdir -p "$root/web/ext/vendor"
cp "$from/board.js" "$root/web/ext/"
cp -R "$from/vendor/three" "$root/web/ext/vendor/"
# the pieces the board player loads by name (models/NAME.glb)
rm -rf "$root/web/models"; mkdir -p "$root/web/models"
cp "$root"/assets/pieces/*.glb "$root/web/models/"
mode=(--release); [ "${1:-}" = "--dev" ] && mode=()
(cd "$root/web" && trunk build ${mode[@]+"${mode[@]}"} --public-url ./ >&2)
echo "$root/web/dist"
