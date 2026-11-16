#!/usr/bin/env bash
# Check the page's Rust (web/): formatted, no clippy warning, its tests
# (the page's engine plays the walk as the command line does), and
# sw-checklist's limits. Part of the gate.
#   scripts/check-web.sh
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
"$root/scripts/build-xetal.sh" >/dev/null
"$root/scripts/libs.sh" >/dev/null
cd "$root/web"
cargo fmt --check
cargo clippy --quiet --all-targets -- -D warnings
cargo test --quiet
if command -v sw-checklist >/dev/null; then sw-checklist . ; fi
echo "check-web: ok"
