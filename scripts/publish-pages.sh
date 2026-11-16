#!/usr/bin/env bash
# Publish the built site: pages/ (scripts/build-pages.sh) becomes the
# only commit of the gh-pages branch (replaced each time, so built
# files never accumulate), and the pages workflow on main is started,
# which hands that branch unchanged to GitHub Pages (this repository
# deploys Pages from GitHub Actions); then waits for it. Refuses unless
# the work tree is clean, main is pushed and pages/ was built from this
# very commit, so the published site always matches a commit of main.
#   scripts/publish-pages.sh
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"
site="https://sw-fun.github.io/evolving-game/"
no() { echo "publish: $1" >&2; exit 1; }
[ -z "$(git status --porcelain)" ] || no "commit your changes first (the site must match a commit)"
head="$(git rev-parse HEAD)"
git fetch --quiet origin main
[ "$(git rev-parse origin/main)" = "$head" ] || no "push main first (origin/main is not this commit)"
[ -f pages/index.html ] || no "no pages/ (just pages first)"
[ "$(cat pages/BUILT_FROM 2>/dev/null)" = "$head" ] || no "pages/ was not built from this commit (just pages again)"
gh api repos/sw-fun/evolving-game/pages --jq .build_type 2>/dev/null | grep -qx workflow \
  || no "GitHub Pages is not enabled for GitHub Actions on sw-fun/evolving-game (Settings, Pages, Source: GitHub Actions)"
index="$(mktemp)"; rm -f "$index"; trap 'rm -f "$index"' EXIT
export GIT_INDEX_FILE="$index"
git --work-tree=pages add -A -f .
tree="$(git write-tree)"
unset GIT_INDEX_FILE
commit="$(git commit-tree "$tree" -m "pages: built from main $(git rev-parse --short HEAD) with X_eTaL $(cut -c1-7 XETAL_COMMIT)")"
git push --quiet --force origin "$commit:refs/heads/gh-pages"
before="$(gh run list --workflow pages.yml --limit 1 --json databaseId --jq '.[0].databaseId // 0')"
gh workflow run pages.yml --ref main
run="$before"
for _ in $(seq 30); do
  sleep 2
  run="$(gh run list --workflow pages.yml --limit 1 --json databaseId --jq '.[0].databaseId // 0')"
  [ "$run" != "$before" ] && break
done
[ "$run" != "$before" ] || no "the pages workflow did not start (gh run list --workflow pages.yml)"
gh run watch "$run" --exit-status >/dev/null || no "the pages workflow failed: gh run view $run --log-failed"
echo "published main $(git rev-parse --short HEAD) to $site"
