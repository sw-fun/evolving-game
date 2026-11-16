#!/usr/bin/env bash
# Get xetal (X_eTaL's docs/vendoring.md): clone X_eTaL into work/xetal
# (ignored), check out the known-good commit in XETAL_COMMIT, build the
# release binary, and symlink bin/xetal to it. Safe to run again: with
# nothing to do it only confirms the build. Progress goes to stderr.
#   scripts/xetal.sh
#   XETAL_SOURCE=../../softwarewrighter/X_eTaL scripts/xetal.sh   # clone from a local checkout
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/venv.sh"
. "$(dirname "${BASH_SOURCE[0]}")/pin.sh"
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
clone="$root/work/xetal"
pin "${XETAL_SOURCE:-https://github.com/softwarewrighter/X_eTaL.git}" "$clone" "$root/XETAL_COMMIT"
(cd "$clone/components/cli" && cargo build --quiet --release -p xetal-cli >&2)
mkdir -p "$root/bin"
ln -sfn "../work/xetal/target/release/xetal" "$root/bin/xetal"
"$root/bin/xetal" --version | grep Commit >&2
