#!/usr/bin/env python3
"""Rewrite each library's `# ::` type comments from the type golden its
directory holds (expected/<Name>.out, written by a bless), so a comment
is never typed by hand. Run after XETAL_BLESS=1; review the diff.
    scripts/write-types.py [FILE.xtl ...]   (default: every library)
"""
import pathlib
import re
import sys

root = pathlib.Path(__file__).resolve().parent.parent


def libraries():
    for d in [root / "lib", *sorted((root / "games").glob("*/"))]:
        yield from (p for p in sorted(d.glob("*.xtl")) if p.name[0].isupper())


def rewrite(lib):
    golden = lib.parent / "expected" / (lib.stem + ".out")
    if not golden.exists():
        return 0
    types = dict(l.split(" : ", 1) for l in golden.read_text().splitlines() if " : " in l)
    lines, pending, changed = lib.read_text().split("\n"), None, 0
    for i, line in enumerate(lines):
        if line.startswith("# :: "):
            pending = i
        m = re.match(r"(l:[^ ]+) :=", line)
        if m and pending is not None:
            want = "# :: " + types.get(m.group(1), lines[pending][5:])
            changed += lines[pending] != want
            lines[pending], pending = want, None
    if changed:
        lib.write_text("\n".join(lines))
    return changed


if __name__ == "__main__":
    files = [pathlib.Path(a).resolve() for a in sys.argv[1:]] or list(libraries())
    for f in files:
        n = rewrite(f)
        if n:
            print(f"{f.relative_to(root)}: {n} type comment(s) rewritten")
