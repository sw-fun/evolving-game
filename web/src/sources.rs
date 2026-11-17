//! The page's side of the footer, the About and Help dialogs and the
//! game's sources.

use wasm_bindgen::prelude::*;

/// The names of the game's files, a line each.
#[wasm_bindgen]
#[must_use]
pub fn sources() -> String {
    evolving_web::about::sources()
}

/// One of the game's files as HTML: X_eTaL as X_eTaL renders it.
#[wasm_bindgen]
#[must_use]
pub fn rendered(path: &str) -> String {
    evolving_web::about::rendered(path)
}

/// The build, in a line: host, commit, time.
#[wasm_bindgen]
#[must_use]
pub fn build() -> String {
    evolving_web::about::build()
}

/// The four pinned commits, a line each.
#[wasm_bindgen]
#[must_use]
pub fn pins() -> String {
    evolving_web::about::pins()
}

/// How the game is played, said by the game.
#[wasm_bindgen]
#[must_use]
pub fn help(program: &str) -> String {
    evolving_web::help(program)
}

/// The page's title, from X_eTaL.
#[wasm_bindgen]
#[must_use]
pub fn title(program: &str) -> String {
    evolving_web::title(program)
}
