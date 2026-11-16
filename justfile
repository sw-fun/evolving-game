# Evolving Game tasks. Recipes call scripts/*.sh, which hold the logic
# and work without just too. `just` alone lists the recipes.

set positional-arguments

# Python for the scripts comes from the repository's uv environment
# (.venv, made by `just venv`; uv only, never pip), first on the path.
export PATH := justfile_directory() + "/.venv/bin:" + env_var("PATH")

# List the recipes
default:
    @just --list

# Make the Python environment the scripts use (.venv, with uv; standard library only)
venv:
    uv venv .venv --python 3.12

# Get and build xetal at the known-good commit in XETAL_COMMIT (work/xetal, bin/xetal)
xetal:
    scripts/xetal.sh

# The known-good X_eTaL: XETAL_COMMIT and the binary's version
xetal-version:
    @cat XETAL_COMMIT
    @"$(scripts/build-xetal.sh)" --version | head -1

# Get and build xetal-x and the blender, digest and three extensions at EXTENSIONS_COMMIT (bin/xetal-x)
extensions:
    scripts/extensions.sh

# Evaluate an expression with the pinned xetal: just eval "'+ r_/ 1 2 3"
eval expr:
    @"$(scripts/build-xetal.sh)" eval -e "$1"

# The games
games:
    @scripts/games.sh

# Start a game sub-project from games/_template: just new-game walk "Walk"
new-game slug title:
    scripts/new-game.sh "$1" "$2"

# Run a game's program (default SLUG.xtl, a scripted game): just run walk
run slug file="":
    @scripts/run-game.sh "$1" ${2:+"$2"}

# Play a game at the terminal (its play.xtl): just play walk
play slug:
    @scripts/run-game.sh "$1" play.xtl

# Run a game's program as a notebook: each statement drawn, then its output
show slug file="":
    @scripts/run-game.sh --echo "$1" ${2:+"$2"}

# The X_eTaL REPL with the shared libraries importable ("g:" u_se< "Game")
repl:
    cd lib && XETAL_PATH="$(../scripts/libs.sh)" "$(../scripts/build-xetal.sh)" repl

# Test every game: expected outputs (with scripted events), test.sh
test:
    scripts/test-games.sh

# Test one game: just test-game walk
test-game slug:
    scripts/test-games.sh "$1"

# Rewrite one game's expected outputs from its programs (review the diff!)
bless slug:
    XETAL_BLESS=1 scripts/test-games.sh "$1"

# Test the shared libraries in lib/: types, lib/test.xtl, the examples
test-lib:
    scripts/test-lib.sh

# Rewrite the shared libraries' expected outputs (review the diff!)
bless-lib:
    XETAL_BLESS=1 scripts/test-lib.sh

# The pre-commit gate: pins, spelling, tooling, libraries, types, docs, goldens, markdown
gate:
    scripts/gate.sh
