//! Evolving Game in a browser. The game is an X_eTaL program (the
//! walk's play.xtl, the same file the command line runs); this crate
//! runs it as WebAssembly, gives it the page's events as the lines the
//! command line reads (`tick 0.05`, `key space`, `click 364 221`), and
//! hands the page what it printed and the picture it showed. No rule,
//! number or picture of the game is worked out here.

pub mod about;
pub mod game;
pub mod shown;
pub mod store;

pub use game::Game;

/// The program the page plays: the walk, as the command line plays it.
pub const PROGRAM: &str = "play.xtl";

/// The rules library the program plays: where its help is.
pub const RULES: &str = "Walking";

/// How the game is played, said by the game (the mode's `help`).
#[must_use]
pub fn help() -> String {
    xetal_store::install(std::sync::Arc::new(store::Session::default()));
    let run = xetal_play::run(&format!("\"m:\" u_se< \"{RULES}\"\nm:help\n"), 1);
    run.out.trim().to_string()
}

/// The page's title, said by X_eTaL (lib/Game.xtl): the game's name
/// before the walk's.
#[must_use]
pub fn title() -> String {
    xetal_store::install(std::sync::Arc::new(store::Session::default()));
    let run = xetal_play::run("\"g:\" u_se< \"Game\"\ng:t_itle \"Walk\"\n", 1);
    run.out.trim().to_string()
}
