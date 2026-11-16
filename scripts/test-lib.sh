#!/usr/bin/env bash
# Test the shared libraries in lib/: each library run alone prints its
# exports' types (lib/expected/<Name>.out), lib/test.xtl exercises every
# function (lib/expected/test.out, with test.in as the events), and each
# library's ## >> examples give the output written under them.
# XETAL_BLESS=1 rewrites the expected files (review the diff!).
#   scripts/test-lib.sh
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/venv.sh"
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
xetal="$("$root/scripts/build-xetal.sh")"
XETAL_PATH="$("$root/scripts/libs.sh")"; export XETAL_PATH
cd "$root/lib"
fail=0; tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
for f in *.xtl; do
  name="${f%.xtl}"; exp="expected/$name"
  input=/dev/null; [ -f "$exp.in" ] && input="$exp.in"
  "$xetal" run --seed 1 "$f" <"$input" >"$tmp/out" 2>"$tmp/err" || true
  if [ "${XETAL_BLESS:-}" = 1 ]; then cp "$tmp/out" "$exp.out"; echo "blessed: lib/$name"; continue; fi
  if [ -s "$tmp/err" ]; then echo "FAIL: lib/$name"; cat "$tmp/err"; fail=1
  elif [ ! -f "$exp.out" ]; then echo "FAIL: lib/$name: no $exp.out (XETAL_BLESS=1 to create)"; fail=1
  elif diff -u "$exp.out" "$tmp/out"; then echo "ok: lib/$name"
  else echo "FAIL: lib/$name"; fail=1; fi
done
for f in *.xtl; do
  case "$f" in [[:upper:]]*) ;; *) continue ;; esac   # the libraries, not test.xtl
  "$xetal" doc --test "$f" >"$tmp/doc" 2>&1 && echo "ok: lib/${f%.xtl} examples" \
    || { echo "FAIL: lib/${f%.xtl} examples"; cat "$tmp/doc"; fail=1; }
done
exit $fail
