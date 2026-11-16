#!/usr/bin/env bash
# The games: every games/<slug>/ with a game.toml, but the template
# (directories starting with _), in order of name.
#   scripts/games.sh            # list the slugs
# XETAL_GAMES_DIR overrides games/ (scripts/selftest-games.sh uses it).
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
base="${XETAL_GAMES_DIR:-$root/games}"
for d in "$base"/*/; do
  slug="$(basename "$d")"
  case "$slug" in _*) continue ;; esac
  [ -f "$d/game.toml" ] && echo "$slug"
done
exit 0
