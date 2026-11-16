//! The page's side of the footer's build facts and of showing the
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

/// The footer's build facts (HTML spans).
#[wasm_bindgen]
#[must_use]
pub fn build() -> String {
    evolving_web::about::build()
}
