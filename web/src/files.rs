//! What the page's program reads: X_eTaL libraries, the walk and its
//! data, gathered by build.rs under the paths X_eTaL asks for.

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
