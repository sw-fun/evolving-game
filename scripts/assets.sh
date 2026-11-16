#!/usr/bin/env bash
# Make the castle's pieces (Blender needed): X_eTaL writes the bpy
# script (assets/Castle.xtl), xetal-x runs Blender through the blender
# extension into the ignored work/assets, and each .glb of at most
# 256 KB with its preview, and manifest.toml, are copied into the
# tracked assets/pieces (docs/plan.md D13). The clips read back from the
# files must be assets/expected/clips.txt (XETAL_BLESS=1 rewrites it).
#   scripts/assets.sh
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"
[ -x bin/xetal-x ] || { echo "assets: no bin/xetal-x (just extensions)" >&2; exit 1; }
rm -rf work/assets; mkdir -p work/assets
XETAL_PATH="$root/assets:$(scripts/libs.sh)" bin/xetal-x assets/castle-assets.xtl > work/assets/run.txt 2>&1 \
  || { cat work/assets/run.txt >&2; echo "assets: the run failed" >&2; exit 1; }
grep -qx "exit 0" work/assets/run.txt && grep -qx "errors 0" work/assets/run.txt \
  || { cat work/assets/run.txt >&2; echo "assets: Blender reported errors" >&2; exit 1; }
if [ "${XETAL_BLESS:-}" = 1 ]; then cp work/assets/pieces/clips.txt assets/expected/clips.txt; fi
diff -u assets/expected/clips.txt work/assets/pieces/clips.txt \
  || { echo "assets: the clips are not assets/expected/clips.txt (XETAL_BLESS=1 after reviewing)" >&2; exit 1; }
mkdir -p assets/pieces; rm -f assets/pieces/*.glb assets/pieces/*.png
for glb in work/assets/pieces/*.glb; do
  name="$(basename "$glb" .glb)"
  size="$(wc -c < "$glb" | tr -d ' ')"
  if [ "$size" -gt 262144 ]; then echo "assets: $name.glb is $size bytes, over 256 KB: not tracked"; continue; fi
  cp "$glb" "work/assets/pieces/$name.png" assets/pieces/
done
cp work/assets/pieces/manifest.toml assets/pieces/manifest.toml
echo "assets: $(ls assets/pieces/*.glb | wc -l | tr -d ' ') pieces in assets/pieces ($(du -sh assets/pieces | cut -f1))"
