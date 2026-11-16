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

/// The build, in a line: the host it was built on, this repository's
/// commit and the time (UTC).
#[must_use]
pub fn build() -> String {
    format!(
        "{} {} {}",
        env!("BUILD_HOST"),
        env!("BUILD_SHA"),
        env!("BUILD_TIMESTAMP")
    )
}

/// The four pinned commits it was built from, a line each: a
/// repository's name and the commit.
#[must_use]
pub fn pins() -> String {
    format!(
        "X_eTaL {}\nX_eTaL-extensions {}\nX_eTaL-games {}\nX_eTaL-libraries {}",
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

/// One of those files as HTML: X_eTaL drawn as X_eTaL renders it
/// (names decorated, a span a token classed by its kind, `c-builtin`,
/// `c-userfunc`, `c-comment` ...), data as it is.
#[must_use]
pub fn rendered(path: &str) -> String {
    let src = text(path).unwrap_or_default();
    if !path.ends_with(".xtl") && !path.ends_with(".xtlm") {
        return escaped(src);
    }
    xetal_store::install(std::sync::Arc::new(crate::store::Session::default()));
    let mut out = String::new();
    for s in xetal_play::decorated(src) {
        let class = format!("{:?}", s.class).to_lowercase();
        out.push_str(&format!(
            "<span class=\"c-{class}\">{}</span>",
            escaped(&s.text)
        ));
    }
    out
}

/// Text made safe to put in HTML.
fn escaped(text: &str) -> String {
    text.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
}
