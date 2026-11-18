//! Gathers what the page's program reads into one table: the shared
//! libraries, the siblings' libraries they import, the walk and its
//! data, each under the path X_eTaL asks the store for.

use std::fmt::Write as _;
use std::path::{Path, PathBuf};

/// The siblings' libraries the game imports, under the pinned clones.
const SIBLINGS: &[&str] = &[
    "work/games/lib/Text.xtl",
    "work/games/lib/Svg.xtl",
    "work/games/lib/Ecs.xtl",
    "work/games/lib/Ecs.xtlm",
    // the three games of X_eTaL-games the castle plays as modes
    "work/games/games/maze/Walls.xtl",
    "work/games/games/dungeon/Crawl.xtl",
    "work/games/games/raycaster/Rays.xtl",
    "work/libraries/libs/Strings/src/Strings.xtl",
    "work/libraries/libs/Random/src/Random.xtl",
    "work/libraries/libs/Bits/src/Bits.xtl",
];

/// Data files, as the walk (run from games/walk) names them.
const DATA: &[(&str, &str)] = &[
    ("bridge.toml", "games/walk/bridge.toml"),
    ("roam.toml", "games/walk/roam.toml"),
    ("defend.toml", "games/defense/defend.toml"),
    // the castle, run from games/castle: its own file, the scenarios it
    // names from there, and what those name in turn (each path as the
    // program asks for it)
    ("castle.toml", "games/castle/castle.toml"),
    ("maze.toml", "games/castle/maze.toml"),
    ("dungeon.toml", "games/castle/dungeon.toml"),
    ("raycaster.toml", "games/castle/raycaster.toml"),
    ("../../world/realm.toml", "world/realm.toml"),
    ("../defense/level-1.toml", "games/defense/level-1.toml"),
    ("../defense/defend.toml", "games/defense/defend.toml"),
    ("../defense/level-3.toml", "games/defense/level-3.toml"),
    ("../walk/roam.toml", "games/walk/roam.toml"),
    ("../walk/city.toml", "games/walk/city.toml"),
    ("../walk/camp.toml", "games/walk/camp.toml"),
    ("../walk/crossing.toml", "games/walk/crossing.toml"),
    ("../walk/../../world/crossing.toml", "world/crossing.toml"),
    ("../../world/crossing.toml", "world/crossing.toml"),
    ("../walk/../../world/camp.toml", "world/camp.toml"),
    ("../../world/camp.toml", "world/camp.toml"),
    ("../walk/../../world/city.toml", "world/city.toml"),
    ("../../world/city.toml", "world/city.toml"),
    ("../defense/../../world/zones.toml", "world/zones.toml"),
    (
        "../defense/../../world/battlefield.toml",
        "world/battlefield.toml",
    ),
    ("../walk/../../world/zones.toml", "world/zones.toml"),
    (
        "../walk/../../world/battlefield.toml",
        "world/battlefield.toml",
    ),
    ("../../world/zones.toml", "world/zones.toml"),
    ("../../world/battlefield.toml", "world/battlefield.toml"),
];

fn main() {
    let root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("..");
    let mut files: Vec<(String, PathBuf)> = Vec::new();
    // the walk's programs and rules, then the shared libraries (not
    // lib/'s own test programs, which no game imports)
    files.extend(sources(&root.join("games/walk")));
    // a second game's programs are kept under its name (its play.xtl is
    // not the walk's); its rules library is imported by name, as any
    for game in ["defense", "castle"] {
        for (name, path) in sources(&root.join("games").join(game)) {
            let library = name.starts_with(char::is_uppercase);
            let key = if library {
                name
            } else {
                format!("{game}/{name}")
            };
            files.push((key, path));
        }
    }
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
