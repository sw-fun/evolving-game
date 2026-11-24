#!/usr/bin/env bash
# Check the tracked music without ffmpeg: every phrase of every version
# (scripts/music-versions.txt, A B C D) is assets/music/VERSION-PHRASE.ogg
# and every bridge (scripts/music-bridges.txt) bridge-NAME.ogg, each file's
# SHA-256 and size are those in assets/music/SHA256SUMS (scripts/
# music.sh writes both), no file is there that the sums do not list,
# and no WAV is.
#   scripts/check-music.sh
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dir="$root/assets/music"
sums="$dir/SHA256SUMS"
fail=0
[ -f "$sums" ] || { echo "check-music: assets/music/SHA256SUMS is missing (just music)"; exit 1; }
while read -r set; do
  for phrase in A B C D; do
    grep -q "  $set-$phrase.ogg\$" "$sums" || { echo "check-music: $set-$phrase.ogg is not in SHA256SUMS"; fail=1; }
  done
done < "$root/scripts/music-versions.txt"
while read -r bridge; do
  grep -q "  bridge-$bridge.ogg\$" "$sums" || { echo "check-music: bridge-$bridge.ogg is not in SHA256SUMS"; fail=1; }
done < "$root/scripts/music-bridges.txt"
while read -r hash size name; do
  f="$dir/$name"
  if [ ! -f "$f" ]; then echo "check-music: $name is missing (just music)"; fail=1; continue; fi
  [ "$(wc -c < "$f" | tr -d ' ')" = "$size" ] || { echo "check-music: $name is not $size bytes"; fail=1; }
  [ "$(shasum -a 256 "$f" | cut -d' ' -f1)" = "$hash" ] || { echo "check-music: $name is not the file SHA256SUMS hashed"; fail=1; }
done < "$sums"
for f in "$dir"/*; do
  name="$(basename "$f")"
  [ "$name" = SHA256SUMS ] && continue
  grep -q "  $name\$" "$sums" || { echo "check-music: $name is not in SHA256SUMS (only the encoded phrases belong here)"; fail=1; }
done
[ $fail = 0 ] && echo "check-music: ok ($(wc -l < "$sums" | tr -d ' ') phrases)"
exit $fail
