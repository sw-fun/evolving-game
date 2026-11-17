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

/// The programs the page can play, each with the rules library its help
/// is in and the name of its game: the walk watched, the battlefield on
/// foot, and Castle Defense. The first is the one a page starts with.
pub const PROGRAMS: &[(&str, &str, &str)] = &[
    ("play.xtl", "Walking", "Walk"),
    ("explore.xtl", "Roaming", "On foot"),
    ("defense/play.xtl", "Defending", "Castle Defense"),
];

/// The program the page starts with.
pub const PROGRAM: &str = PROGRAMS[0].0;

/// How a program's game is played, said by the game (its mode's
/// `help`); nothing for a program the page does not have.
#[must_use]
pub fn help(program: &str) -> String {
    let Some((_, rules, _)) = PROGRAMS.iter().find(|(p, _, _)| *p == program) else {
        return String::new();
    };
    xetal_store::install(std::sync::Arc::new(store::Session::default()));
    let run = xetal_play::run(&format!("\"m:\" u_se< \"{rules}\"\nm:help\n"), 1);
    run.out.trim().to_string()
}

/// The page's title for a program, said by X_eTaL (lib/Game.xtl): the
/// game's name before the program's.
#[must_use]
pub fn title(program: &str) -> String {
    let found = PROGRAMS.iter().find(|(p, _, _)| *p == program);
    let name = found.map_or(PROGRAMS[0].2, |(_, _, name)| name);
    xetal_store::install(std::sync::Arc::new(store::Session::default()));
    let run = xetal_play::run(&format!("\"g:\" u_se< \"Game\"\ng:t_itle \"{name}\"\n"), 1);
    run.out.trim().to_string()
}
