//! The page's side of the game: what static/app.js calls.

use std::cell::RefCell;

use evolving_web::{Game, PROGRAM};
use wasm_bindgen::prelude::*;

thread_local! {
    static GAME: RefCell<Option<Game>> = const { RefCell::new(None) };
}

fn with<T: Default>(f: impl FnOnce(&mut Game) -> T) -> T {
    GAME.with(|g| g.borrow_mut().as_mut().map(f).unwrap_or_default())
}

/// Start the game again from its beginning.
#[wasm_bindgen]
pub fn start() {
    GAME.with(|g| *g.borrow_mut() = Some(Game::start(PROGRAM, 1)));
}

/// Give the program an event's line; true once the program has ended.
#[wasm_bindgen]
pub fn feed(line: &str) -> bool {
    with(|g| {
        g.feed(line);
        g.over()
    })
}

/// The latest picture the program showed (SVG; its scene inside).
#[wasm_bindgen]
#[must_use]
pub fn picture() -> String {
    with(|g| g.session().picture())
}

/// Everything the program has printed, and the error it stopped on.
#[wasm_bindgen]
#[must_use]
pub fn printed() -> String {
    with(|g| format!("{}{}", g.session().printed(), g.error()))
}

/// The page's title, from X_eTaL.
#[wasm_bindgen]
#[must_use]
pub fn title() -> String {
    evolving_web::title()
}

fn main() {}
