# Assets

The game's 3D pieces, described in X_eTaL and made by Blender.

- [`Castle.xtl`](Castle.xtl): each piece as parts (boxes, spheres) and
  named clips, written as the Python Blender runs
  (X_eTaL-extensions' `Bpy.xtl`). The colors are at its top.
- [`skins.py`](skins.py): how Blender bakes a texture (courses of
  stone, boards) and lays it over a part; `Castle.xtl` says which
  textures there are and which part wears which.
- [`castle-assets.xtl`](castle-assets.xtl): runs Blender on that
  script and hashes what it made into the manifest.
- [`pieces.xtl`](pieces.xtl): the same script printed, for the test
  that needs no Blender.
- [`pieces/`](pieces): what was made, tracked: a `.glb` a piece (at
  most 256 KB), its preview, and `manifest.toml` with every file's
  SHA-256.

| Piece | Clips |
| ----- | ----- |
| `walker` | `idle` (2 s), `walk` (1 s) |
| `ground`, `water`, `bridge`, `wall`, `gate` | none |

```bash
just extensions        # once: the blender and digest extensions
just assets            # make the pieces again (needs Blender 5.1)
scripts/test-assets.sh # check them without Blender (in the gate)
```

After changing `Castle.xtl`: `just assets`, look at the previews in
`pieces/`, then `XETAL_BLESS=1 scripts/test-assets.sh` and review the
diff of `expected/pieces.out`.
