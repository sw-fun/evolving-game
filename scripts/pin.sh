# Sourced: pin SOURCE DIR COMMIT-FILE puts a clone of SOURCE in DIR
# (under the ignored work/) at the commit COMMIT-FILE names, and fails
# if the clone has been edited. A clone is never edited: move to another
# commit by changing its file (docs/plan.md D11). Progress to stderr.
pin() {
  local source="$1" clone="$2" commit
  commit="$(tr -d '[:space:]' < "$3")"
  if [ ! -d "$clone/.git" ]; then
    mkdir -p "$(dirname "$clone")"
    git clone --quiet "$source" "$clone" >&2
  fi
  if ! git -C "$clone" cat-file -e "$commit^{commit}" 2>/dev/null; then
    git -C "$clone" fetch --quiet origin >&2
  fi
  if [ "$(git -C "$clone" rev-parse HEAD)" != "$commit" ]; then
    git -C "$clone" checkout --quiet --detach "$commit" >&2
  fi
  if [ -n "$(git -C "$clone" status --porcelain)" ]; then
    echo "pin: $clone has local changes; never edit a clone" >&2
    return 1
  fi
}
