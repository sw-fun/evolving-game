//! Gathers what the page's program reads into one table: the shared
//! libraries, the siblings' libraries they import, the walk and its
//! data, each under the path X_eTaL asks the store for.

use std::fmt::Write as _;
use std::path::{Path, PathBuf};

/// The siblings' libraries the game imports, under the pinned clones.
const SIBLINGS: &[&str] = &[
    "work/games/lib/Text.xtl",
    "work/libraries/libs/Strings/src/Strings.xtl",
    "work/libraries/libs/Random/src/Random.xtl",
    "work/libraries/libs/Bits/src/Bits.xtl",
];

/// Data files, as the walk (run from games/walk) names them.
const DATA: &[(&str, &str)] = &[
    ("bridge.toml", "games/walk/bridge.toml"),
    ("../../world/zones.toml", "world/zones.toml"),
    ("../../world/battlefield.toml", "world/battlefield.toml"),
];

fn main() {
    let root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("..");
    let mut files: Vec<(String, PathBuf)> = Vec::new();
    for dir in ["lib", "games/walk"] {
        files.extend(sources(&root.join(dir)));
    }
    files.extend(SIBLINGS.iter().map(|p| named(&root.join(p))));
    files.extend(DATA.iter().map(|(k, p)| ((*k).to_string(), root.join(p))));
    write(&files);
}

/// A file under its own name.
fn named(path: &Path) -> (String, PathBuf) {
    let name = path.file_name().unwrap_or_default().to_string_lossy();
    (name.into_owned(), path.to_path_buf())
}

/// The .xtl and .xtlm files of a directory, in order of name.
fn sources(dir: &Path) -> Vec<(String, PathBuf)> {
    println!("cargo:rerun-if-changed={}", dir.display());
    let mut found: Vec<PathBuf> = std::fs::read_dir(dir)
        .map(|d| d.flatten().map(|e| e.path()).collect())
        .unwrap_or_default();
    found.retain(|p| p.extension().is_some_and(|e| e == "xtl" || e == "xtlm"));
    found.sort();
    found.iter().map(|p| named(p)).collect()
}

/// The table, as Rust: `FILES: &[(&str, &str)]`.
fn write(files: &[(String, PathBuf)]) {
    let mut text = String::from("pub const FILES: &[(&str, &str)] = &[\n");
    for (key, path) in files {
        println!("cargo:rerun-if-changed={}", path.display());
        let _ = writeln!(text, "    ({key:?}, include_str!({:?})),", path.display());
    }
    text.push_str("];\n");
    let out = PathBuf::from(std::env::var("OUT_DIR").unwrap_or_default());
    std::fs::write(out.join("files.rs"), text).expect("the build directory is writable");
}
