//! The page's side of the game: what static/app.js calls.

mod sources;

use std::cell::RefCell;

use evolving_web::{Game, PROGRAM, PROGRAMS};
use wasm_bindgen::prelude::*;

thread_local! {
    static GAME: RefCell<Option<Game>> = const { RefCell::new(None) };
}

fn with<T: Default>(f: impl FnOnce(&mut Game) -> T) -> T {
    GAME.with(|g| g.borrow_mut().as_mut().map(f).unwrap_or_default())
}

/// Start a program from its beginning: one of the page's programs by
/// name, or the first when it is not one of them.
#[wasm_bindgen]
pub fn start(program: &str) {
    let known = PROGRAMS.iter().any(|(p, _, _)| *p == program);
    let program = if known { program } else { PROGRAM };
    GAME.with(|g| *g.borrow_mut() = Some(Game::start(program, 1)));
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
pub fn title(program: &str) -> String {
    evolving_web::title(program)
}

fn main() {}
