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
    ("roam.toml", "games/walk/roam.toml"),
    ("../../world/zones.toml", "world/zones.toml"),
    ("../../world/battlefield.toml", "world/battlefield.toml"),
];

fn main() {
    let root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("..");
    let mut files: Vec<(String, PathBuf)> = Vec::new();
    // the walk's programs and rules, then the shared libraries (not
    // lib/'s own test programs, which no game imports)
    files.extend(sources(&root.join("games/walk")));
    let shared = sources(&root.join("lib"));
    files.extend(
        shared
            .into_iter()
            .filter(|(name, _)| name.starts_with(char::is_uppercase)),
    );
    files.extend(SIBLINGS.iter().map(|p| named(&root.join(p))));
    files.extend(DATA.iter().map(|(k, p)| ((*k).to_string(), root.join(p))));
    write(&files);
    provenance(&root);
}

/// The build's facts for the page's footer: this repository's commit,
/// the host and the time, and the four pins.
fn provenance(root: &Path) {
    let said = |cmd: &str, args: &[&str]| {
        let out = std::process::Command::new(cmd).args(args).output().ok();
        let text = out.map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string());
        text.filter(|s| !s.is_empty())
            .unwrap_or_else(|| "unknown".into())
    };
    println!(
        "cargo:rustc-env=BUILD_SHA={}",
        said("git", &["rev-parse", "--short", "HEAD"])
    );
    println!("cargo:rustc-env=BUILD_HOST={}", said("hostname", &["-s"]));
    println!(
        "cargo:rustc-env=BUILD_TIMESTAMP={}",
        said("date", &["-u", "+%Y-%m-%dT%H:%MZ"])
    );
    for pin in ["XETAL", "EXTENSIONS", "GAMES", "LIBRARIES"] {
        let file = root.join(format!("{pin}_COMMIT"));
        let sha: String = std::fs::read_to_string(&file)
            .unwrap_or_default()
            .trim()
            .chars()
            .take(7)
            .collect();
        println!("cargo:rustc-env={pin}_SHA={sha}");
        println!("cargo:rerun-if-changed={}", file.display());
    }
    println!(
        "cargo:rerun-if-changed={}",
        root.join(".git/HEAD").display()
    );
    println!(
        "cargo:rerun-if-changed={}",
        root.join(".git/refs/heads/main").display()
    );
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
