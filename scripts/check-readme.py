#!/usr/bin/env python3
"""Check the user-facing documents against the repository: every `just
NAME` they show is a recipe of the justfile, every `scripts/NAME` they
show exists, and every relative link leads to a file. Run with
--self-test to check the checker.
    scripts/check-readme.py
"""
import pathlib
import re
import sys

root = pathlib.Path(__file__).resolve().parent.parent
DOCS = ["README.md", "lib/README.md", "assets/README.md", "docs/architecture.md"]


def recipes(justfile):
    return set(re.findall(r"^([a-z][a-z0-9-]*)(?:[ \t][^\n:]*)?:(?!=)", justfile, re.M))


def problems(name, text, known, exists):
    out = []
    for cmd in re.findall(r"^\s*just ([a-z][a-z0-9-]*)", text, re.M) + re.findall(r"`just ([a-z][a-z0-9-]*)[^`]*`", text):
        if cmd not in known:
            out.append(f"{name}: `just {cmd}` is not a recipe")
    for script in re.findall(r"(scripts/[A-Za-z0-9._-]+)", text):
        if not exists(script):
            out.append(f"{name}: {script} does not exist")
    base = pathlib.PurePosixPath(name).parent
    for link in re.findall(r"\]\(([^)#]+)(?:#[^)]*)?\)", text):
        if re.match(r"[a-z]+:", link):
            continue
        target = str(base / link)
        if not exists(target):
            out.append(f"{name}: the link {link} leads nowhere")
    return out


def self_test():
    known = recipes("gate:\n    x\nrun slug file=\"\":\n    y\nx := 1\n")
    assert known == {"gate", "run"}, known
    text = "```bash\njust gate\njust nope\n```\nsee `just run walk`, scripts/a.sh, [b](b.md), [w](https://x.y/)\n"
    got = problems("docs/t.md", text, known, lambda p: p == "scripts/a.sh")
    assert got == ["docs/t.md: `just nope` is not a recipe", "docs/t.md: the link b.md leads nowhere"], got
    print("check-readme: self-test ok")


def main():
    if "--self-test" in sys.argv:
        self_test()
        return 0
    known = recipes((root / "justfile").read_text())
    docs = DOCS + [str(p.relative_to(root)) for p in sorted(root.glob("games/*/README.md")) if not p.parent.name.startswith("_")]
    wrong = []
    for name in docs:
        wrong += problems(name, (root / name).read_text(), known, lambda p: (root / p).exists())
    for w in wrong:
        print(f"check-readme: {w}")
    if wrong:
        return 1
    print(f"check-readme: ok ({len(docs)} documents)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
