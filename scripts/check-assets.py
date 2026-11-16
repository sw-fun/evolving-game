#!/usr/bin/env python3
"""Check the tracked pieces without Blender: every piece assets/Castle.xtl
names has its .glb and preview in assets/pieces, each file's SHA-256 is
the manifest's, no .glb is over the manifest's most-bytes (256 KB), a
.glb is a glTF 2 binary, and nothing else is in the directory.
    scripts/check-assets.py
"""
import hashlib
import pathlib
import sys
import tomllib

root = pathlib.Path(__file__).resolve().parent.parent
pieces = root / "assets" / "pieces"


def main():
    manifest = tomllib.loads((pieces / "manifest.toml").read_text())
    names = (root / "assets" / "expected" / "names.txt").read_text().split()
    wrong = []
    if sorted(manifest["pieces"]) != sorted(names):
        wrong.append(f"the manifest has {sorted(manifest['pieces'])}, Castle.xtl names {sorted(names)}")
    expected = {"manifest.toml"}
    for name, entry in manifest["pieces"].items():
        for key in ("glb", "preview"):
            path = pieces / entry[key]
            expected.add(entry[key])
            if not path.exists():
                wrong.append(f"{entry[key]} is missing")
            elif hashlib.sha256(path.read_bytes()).hexdigest() != entry[f"{key}-sha256"]:
                wrong.append(f"{entry[key]} is not the file the manifest hashed (just assets)")
        glb = pieces / entry["glb"]
        if glb.exists():
            data = glb.read_bytes()
            if len(data) > manifest["most-bytes"]:
                wrong.append(f"{entry['glb']} is {len(data)} bytes, over {manifest['most-bytes']}")
            if data[:4] != b"glTF" or int.from_bytes(data[4:8], "little") != 2:
                wrong.append(f"{entry['glb']} is not a glTF 2 binary")
    extra = sorted(p.name for p in pieces.iterdir() if p.name not in expected)
    if extra:
        wrong.append(f"not in the manifest: {extra}")
    for w in wrong:
        print(f"check-assets: {w}")
    if wrong:
        return 1
    print(f"check-assets: ok ({len(names)} pieces)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
