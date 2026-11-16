#!/usr/bin/env bash
# Build the site locally into the ignored pages/: the page (scripts/
# web.sh, a release build) as GitHub Pages will serve it. Nothing is
# built on GitHub. The page's footer names the commit it was built
# from, so build from a committed tree before publishing.
#   scripts/build-pages.sh
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dist="$("$root/scripts/web.sh")"
rm -rf "$root/pages"; mkdir -p "$root/pages"
cp -R "$dist"/. "$root/pages/"
# GitHub Pages: serve the files as they are.
touch "$root/pages/.nojekyll"
git -C "$root" rev-parse HEAD > "$root/pages/BUILT_FROM"
echo "pages: $(find "$root/pages" -type f | wc -l | tr -d ' ') files, $(du -sh "$root/pages" | cut -f1) (pages/)"
