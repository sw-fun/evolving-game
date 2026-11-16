#!/usr/bin/env bash
# The pre-commit gate: every check in parallel, each to its own log
# under work/gate/: the pins, spelling, the game tooling's self-test,
# the shared libraries (types, tests, examples), type comments, doc
# comments, every game's goldens (a job per game), markdown. Seconds.
# Needs neither Blender nor the extensions. Before every commit.
#   scripts/gate.sh
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/venv.sh"
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"
started=$SECONDS
XETAL_BIN="$(scripts/build-xetal.sh)"; export XETAL_BIN
scripts/libs.sh >/dev/null
logs="$root/work/gate"; rm -rf "$logs"; mkdir -p "$logs"

# ASCII-only markdown: the README and the documents we write (not
# CLAUDE.md, whose generated briefing is not ASCII: docs/agentrail-asks.md).
md=(README.md lib/README.md assets/README.md)
for f in docs/*.md games/*/README.md; do [ -e "$f" ] && md+=("$f"); done
markdown() { for f in "${md[@]}"; do sw-markdown-checker -f "$f" >/dev/null || { sw-markdown-checker -f "$f"; return 1; }; done; echo "markdown: ok (${#md[@]} files)"; }
names=(); pids=()
job() { names+=("$1"); ( t=$SECONDS; "${@:2}"; s=$?; echo "($1: $((SECONDS - t)) s)"; exit $s ) > "$logs/$1.log" 2>&1 & pids+=($!); }
job pins scripts/check-pins.sh
job spelling bash -c 'scripts/check-spelling.py --self-test && scripts/check-spelling.py'
job tooling scripts/selftest-games.sh
job libraries scripts/test-lib.sh
job types scripts/check-types.py
job docs scripts/check-docs.py
job markdown markdown
job web scripts/check-web.sh
job assets scripts/test-assets.sh
while IFS= read -r slug; do
  [ -n "$slug" ] && job "game-$slug" scripts/test-games.sh "$slug"
done < <(scripts/games.sh)
fail=0
for i in "${!pids[@]}"; do
  if wait "${pids[$i]}"; then echo "ok: ${names[$i]}"; else echo "FAIL: ${names[$i]} (work/gate/${names[$i]}.log)"; cat "$logs/${names[$i]}.log"; fail=1; fi
done
[ $fail = 0 ] || { echo "gate: FAILED"; exit 1; }
echo "gate: ok ($((SECONDS - started)) s)"
