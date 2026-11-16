#!/usr/bin/env bash
# Serve the built page (web/dist; scripts/web.sh builds it) on this
# repository's own port, 8480 (the sibling repositories use 8470 to 8475
# and 8490), until stopped with Ctrl-C. Never leave it running in the
# background (CLAUDE.md).
#   scripts/serve.sh [PORT]
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/venv.sh"
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
[ -f "$root/web/dist/index.html" ] || "$root/scripts/web.sh" >/dev/null
port="${1:-8480}"
echo "serving http://127.0.0.1:$port/ (Ctrl-C stops it)"
exec "$root/.venv/bin/python" -m http.server "$port" --bind 127.0.0.1 --directory "$root/web/dist"
