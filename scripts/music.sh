#!/usr/bin/env bash
# Make the castle's music: each phrase WAV of the user's game music
# (music-pipe-rs, MIT; MUSIC_SOURCE, its work/game-music by default),
# every set in its base tempo and its other tempos, encoded as Ogg Opus
# at 64 kb/s into assets/music/VERSION-PHRASE.ogg, and
# assets/music/SHA256SUMS (every file's hash and size), which the gate
# checks (scripts/check-music.sh, never needing ffmpeg). The WAVs are
# never tracked. The versions are scripts/music-versions.txt, as
# games/castle/music.toml names them. Needs ffmpeg with libopus.
#   scripts/music.sh
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
from="${MUSIC_SOURCE:-$HOME/github/softwarewrighter/music-pipe-rs/work/game-music}"
command -v ffmpeg >/dev/null || { echo "music: ffmpeg is not installed" >&2; exit 1; }
out="$root/assets/music"
mkdir -p "$out"
rm -f "$out"/*.ogg
while read -r version; do
  for phrase in A B C D; do
    wav="$from/$version-$phrase.wav"
    [ -f "$wav" ] || { echo "music: $wav is missing (MUSIC_SOURCE)" >&2; exit 1; }
    ffmpeg -nostdin -loglevel error -y -i "$wav" -map_metadata -1 -fflags +bitexact -flags:a +bitexact -c:a libopus -b:a 64k "$out/$version-$phrase.ogg"
  done
done < "$root/scripts/music-versions.txt"
(cd "$out" && for f in *.ogg; do printf '%s  %s  %s\n' "$(shasum -a 256 "$f" | cut -d' ' -f1)" "$(wc -c < "$f" | tr -d ' ')" "$f"; done) > "$out/SHA256SUMS"
echo "music: $(ls "$out"/*.ogg | wc -l | tr -d ' ') phrases, $(du -sh "$out" | cut -f1) ($out)"
