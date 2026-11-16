#!/usr/bin/env bash
# Get xetal-x, the X_eTaL host that loads native extensions, and the
# extensions this repository uses (blender, digest, three): clone
# X_eTaL-extensions into work/extensions (ignored) at the commit in
# EXTENSIONS_COMMIT, let it build the X_eTaL it is pinned to (its own
# XETAL_COMMIT, in its own work/), build those packages, and symlink
# bin/xetal-x (a wrapper giving it those extensions). Needed only to make assets (just assets) and for the
# page; the gate does not need it. Prints the extensions' directory.
#   scripts/extensions.sh
#   EXTENSIONS_SOURCE=../../softwarewrighter/X_eTaL-extensions scripts/extensions.sh
# XETAL_SOURCE, when set, is where the clone gets its X_eTaL from too.
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/pin.sh"
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
clone="$root/work/extensions"
pin "${EXTENSIONS_SOURCE:-https://github.com/softwarewrighter/X_eTaL-extensions.git}" "$clone" "$root/EXTENSIONS_COMMIT"
# The clone's own scripts want its own uv environment (ignored there).
[ -x "$clone/.venv/bin/python3" ] || (cd "$clone" && scripts/venv.sh >&2)
(cd "$clone" && PATH="$clone/.venv/bin:$PATH" scripts/xetal.sh >&2)
(cd "$clone" && cargo build --quiet -p xetal-x -p xetal-ext-blender -p xetal-ext-digest -p xetal-ext-three >&2)
# xetal-x loads every extension in the directory it is given and looks
# for their libraries beside its own binary, so: a directory of only the
# extensions built here, and bin/xetal-x a wrapper that runs the binary
# where it was built, with that directory.
ext="$root/work/ext"; mkdir -p "$ext" "$root/bin"
for e in blender digest three; do ln -sfn "../extensions/extensions/$e" "$ext/$e"; done
rm -f "$root/bin/xetal-x"
printf '#!/bin/sh\nexec "%s" --ext "%s" "$@"\n' "$clone/target/debug/xetal-x" "$ext" > "$root/bin/xetal-x"
chmod +x "$root/bin/xetal-x"
echo "$ext"
