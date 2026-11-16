//! The game's files (X_eTaL libraries, the walk and its data, gathered
//! by build.rs under the paths X_eTaL asks for), which the page can
//! show as its sources, and what the footer says of the build.

include!(concat!(env!("OUT_DIR"), "/files.rs"));

/// The text of a file, by the path X_eTaL asks for.
#[must_use]
pub fn text(path: &str) -> Option<&'static str> {
    FILES.iter().find(|(k, _)| *k == path).map(|(_, t)| *t)
}

/// The paths, in order: the sources a page may show.
#[must_use]
pub fn paths() -> Vec<&'static str> {
    FILES.iter().map(|(k, _)| *k).collect()
}

/// Where the game's source is.
pub const REPOSITORY: &str = "https://github.com/sw-fun/evolving-game";

/// The build's facts as HTML spans: this repository's commit, the host
/// and the time it was built, and the four pinned commits it was built
/// from.
#[must_use]
pub fn build() -> String {
    format!(
        "<span>build {} on {} at {}</span><span>X_eTaL {}</span>\
         <span>X_eTaL-extensions {}</span><span>X_eTaL-games {}</span>\
         <span>X_eTaL-libraries {}</span>",
        env!("BUILD_SHA"),
        env!("BUILD_HOST"),
        env!("BUILD_TIMESTAMP"),
        env!("XETAL_SHA"),
        env!("EXTENSIONS_SHA"),
        env!("GAMES_SHA"),
        env!("LIBRARIES_SHA"),
    )
}

/// The names of the files the game is made of, a line each: its
/// program, rules, libraries and data, as the page can show them.
#[must_use]
pub fn sources() -> String {
    paths().join("\n")
}

/// One of those files, as it is.
#[must_use]
pub fn source(path: &str) -> String {
    text(path).unwrap_or_default().to_string()
}
