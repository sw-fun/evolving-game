#!/usr/bin/env bash
# Build xetal at the known-good commit (scripts/xetal.sh), quietly, and
# print the binary's path. Every script runs that binary, never one on
# PATH. XETAL_BIN, when set to a built binary, is used as it is (the gate
# builds once and exports it, so its parallel jobs never wait on cargo).
#   scripts/build-xetal.sh
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/venv.sh"
if [ -n "${XETAL_BIN:-}" ] && [ -x "$XETAL_BIN" ]; then echo "$XETAL_BIN"; exit 0; fi
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
"$root/scripts/xetal.sh" 2>/dev/null || "$root/scripts/xetal.sh"
echo "$root/bin/xetal"
