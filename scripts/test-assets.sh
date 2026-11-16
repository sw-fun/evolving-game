#!/usr/bin/env bash
# Test the assets without Blender: the bpy script assets/Castle.xtl
# writes is assets/expected/pieces.out (run with the pinned xetal and
# the blender extension's Bpy.xtl, read from its clone at
# EXTENSIONS_COMMIT; nothing of the extension is built), Castle.xtl's
# types are expected/Castle.out, and the tracked pieces match their
# manifest (scripts/check-assets.py). XETAL_BLESS=1 rewrites the goldens.
#   scripts/test-assets.sh
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/venv.sh"
. "$(dirname "${BASH_SOURCE[0]}")/pin.sh"
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
xetal="$("$root/scripts/build-xetal.sh")"
pin "${EXTENSIONS_SOURCE:-https://github.com/softwarewrighter/X_eTaL-extensions.git}" "$root/work/extensions" "$root/EXTENSIONS_COMMIT"
XETAL_PATH="$root/assets:$root/work/extensions/extensions/blender/lib:$("$root/scripts/libs.sh")"; export XETAL_PATH
cd "$root/assets"
fail=0; tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
for f in Castle pieces; do
  "$xetal" run --seed 1 "$f.xtl" > "$tmp/out" 2> "$tmp/err" || true
  if [ "${XETAL_BLESS:-}" = 1 ]; then cp "$tmp/out" "expected/$f.out"; echo "blessed: assets/$f"; continue; fi
  if [ -s "$tmp/err" ]; then echo "FAIL: assets/$f"; cat "$tmp/err"; fail=1
  elif diff -u "expected/$f.out" "$tmp/out" > "$tmp/diff"; then echo "ok: assets/$f"
  else echo "FAIL: assets/$f"; head -40 "$tmp/diff"; fail=1; fi
done
head -1 expected/pieces.out > "$tmp/names"
if [ "${XETAL_BLESS:-}" = 1 ]; then cp "$tmp/names" expected/names.txt; fi
diff -q "$tmp/names" expected/names.txt >/dev/null || { echo "FAIL: assets/expected/names.txt is not the first line of pieces.out"; fail=1; }
"$root/scripts/check-assets.py" || fail=1
exit $fail
