//! The page's side of the footer's build facts and of showing the
//! game's sources.

use wasm_bindgen::prelude::*;

/// The names of the game's files, a line each.
#[wasm_bindgen]
#[must_use]
pub fn sources() -> String {
    evolving_web::about::sources()
}

/// One of the game's files, as it is.
#[wasm_bindgen]
#[must_use]
pub fn source(path: &str) -> String {
    evolving_web::about::source(path)
}

/// The footer's build facts (HTML spans).
#[wasm_bindgen]
#[must_use]
pub fn build() -> String {
    evolving_web::about::build()
}
