//! The page's side of the footer, the About and Help dialogs and the
//! game's sources; and, for the debug panel, what stopped the program.

use std::cell::RefCell;

use wasm_bindgen::prelude::*;

thread_local! {
    /// The last panic's message (kept by the hook `start` sets).
    pub static FAULT: RefCell<String> = const { RefCell::new(String::new()) };
}

/// What stopped the program: the last panic's message, else the error
/// it ended on, else nothing (still running, or ended well).
#[wasm_bindgen]
#[must_use]
pub fn stopped() -> String {
    let fault = FAULT.with(|f| f.try_borrow().map(|f| f.clone()).unwrap_or_default());
    if fault.is_empty() {
        crate::with(|g| g.error().to_string())
    } else {
        fault
    }
}

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
