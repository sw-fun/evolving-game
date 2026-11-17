//! The page's engine plays the walk as the command line does: the
//! events of games/walk/expected/play.in, fed a line at a time, print
//! exactly games/walk/expected/play.out.

use evolving_web::Game;

/// The walk watched: the page's oldest program.
const PROGRAM: &str = "play.xtl";

const EVENTS: &str = include_str!("../../games/walk/expected/play.in");
const EXPECTED: &str = include_str!("../../games/walk/expected/play.out");

/// The store is one for the process: tests that install one take turns.
static TURN: std::sync::Mutex<()> = std::sync::Mutex::new(());

#[test]
fn the_page_plays_the_walk_as_the_command_line_does() {
    let _turn = TURN
        .lock()
        .unwrap_or_else(std::sync::PoisonError::into_inner);
    let mut game = Game::start(PROGRAM, 1);
    assert_eq!(game.error(), "");
    for line in EVENTS.lines() {
        if game.over() {
            break;
        }
        game.feed(line);
    }
    assert!(game.over(), "the walk ends before its events do");
    assert_eq!(game.error(), "");
    assert_eq!(game.session().printed(), EXPECTED);
    assert!(
        game.session()
            .picture()
            .contains("<metadata id=\"scene\">view(")
    );
    assert!(game.session().pictures() > 60, "a picture an event");
    // The store is one for the process, so the title is asked here,
    // after the game, not in a test of its own running beside it.
    assert_eq!(evolving_web::title(PROGRAM), "Evolving Game: Walk");
    assert_eq!(
        evolving_web::title("defense/play.xtl"),
        "Evolving Game: Castle Defense"
    );
    // How to play is the game's to say (the mode's help).
    let help = evolving_web::help(PROGRAM);
    assert_eq!(help.lines().count(), 4, "{help}");
    assert!(help.contains("Space: stop the walker"), "{help}");
    assert!(evolving_web::help("explore.xtl").contains("W A S D"));
    assert_eq!(evolving_web::help("nothing.xtl"), "");
}

const ON_FOOT: &str = include_str!("../../games/walk/expected/explore.in");
const ON_FOOT_EXPECTED: &str = include_str!("../../games/walk/expected/explore.out");

#[test]
fn the_page_walks_the_battlefield_as_the_command_line_does() {
    let _turn = TURN
        .lock()
        .unwrap_or_else(std::sync::PoisonError::into_inner);
    let mut game = Game::start("explore.xtl", 1);
    assert_eq!(game.error(), "");
    for line in ON_FOOT.lines() {
        if game.over() {
            break;
        }
        game.feed(line);
    }
    assert!(game.over(), "the gate is reached before the events end");
    assert_eq!(game.session().printed(), ON_FOOT_EXPECTED);
    assert!(
        game.session().picture().contains("\neye(nums("),
        "seen through an eye"
    );
}

#[test]
fn the_build_and_the_four_pins_are_named() {
    let pins = evolving_web::about::pins();
    for pin in ["XETAL", "EXTENSIONS", "GAMES", "LIBRARIES"] {
        let file = format!("{}/../{pin}_COMMIT", env!("CARGO_MANIFEST_DIR"));
        let sha: String = std::fs::read_to_string(file)
            .unwrap()
            .chars()
            .take(7)
            .collect();
        assert!(
            pins.lines().any(|l| l.ends_with(&sha)),
            "{pin} {sha} in {pins}"
        );
    }
    assert_eq!(pins.lines().count(), 4);
    assert_eq!(evolving_web::about::build().split(' ').count(), 3);
}

#[test]
fn the_sources_are_the_games_own() {
    let names = evolving_web::about::sources();
    for name in ["play.xtl", "Walking.xtl", "Mode.xtl", "bridge.toml"] {
        assert!(names.lines().any(|l| l == name), "{name} in {names}");
    }
    assert_eq!(evolving_web::about::rendered("nothing"), "");
    // Data is shown as it is.
    let data = evolving_web::about::rendered("bridge.toml");
    assert_eq!(data, include_str!("../../games/walk/bridge.toml"));
}

/// The text of some HTML, its tags taken out and its entities read.
fn plain(html: &str) -> String {
    let mut out = String::new();
    let mut inside = false;
    for c in html.chars() {
        match c {
            '<' => inside = true,
            '>' => inside = false,
            _ if !inside => out.push(c),
            _ => {}
        }
    }
    out.replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&amp;", "&")
}

#[test]
fn x_etal_is_shown_as_x_etal_renders_it() {
    let _turn = TURN
        .lock()
        .unwrap_or_else(std::sync::PoisonError::into_inner);
    let html = evolving_web::about::rendered("Game.xtl");
    // Colored by the kind of token: a comment, a library's function, a
    // built-in, a string.
    for class in ["c-doc", "c-libfunc", "c-builtin", "c-string"] {
        assert!(
            html.contains(&format!("<span class=\"{class}\">")),
            "{class} in {html}"
        );
    }
    // Rendered, not as typed: c_at is drawn with its first letter
    // underlined, so the typed underscore is gone; and the whole file
    // is there, from its first line to its last.
    let shown = plain(&html);
    assert!(!shown.contains("c_at"), "decorated: {shown}");
    assert!(
        shown
            .lines()
            .next()
            .unwrap_or_default()
            .contains("Game: the game's name, said once.")
    );
    assert!(shown.trim_end().ends_with('}'));
    assert_eq!(
        shown.lines().count(),
        include_str!("../../lib/Game.xtl").lines().count()
    );
}

const DEFENSE: &str = include_str!("../../games/defense/expected/play.in");
const DEFENSE_EXPECTED: &str = include_str!("../../games/defense/expected/play.out");

#[test]
fn the_page_plays_castle_defense_as_the_command_line_does() {
    let _turn = TURN
        .lock()
        .unwrap_or_else(std::sync::PoisonError::into_inner);
    let mut game = Game::start("defense/play.xtl", 1);
    assert_eq!(game.error(), "");
    for line in DEFENSE.lines() {
        game.feed(line);
    }
    // The command line then reaches the end of its input, which ends
    // the game: the page is told so.
    game.feed("end");
    assert!(game.over());
    assert_eq!(game.error(), "");
    assert_eq!(game.session().printed(), DEFENSE_EXPECTED);
    assert!(game.session().picture().contains("piece('archer'"));
    assert!(evolving_web::help("defense/play.xtl").contains("Space: send the next wave"));
}

const CASTLE: &str = include_str!("../../games/castle/expected/play.in");
const CASTLE_EXPECTED: &str = include_str!("../../games/castle/expected/play.out");

#[test]
fn the_page_goes_round_the_castle_as_the_command_line_does() {
    let _turn = TURN
        .lock()
        .unwrap_or_else(std::sync::PoisonError::into_inner);
    assert_eq!(
        evolving_web::PROGRAM,
        "castle/play.xtl",
        "the castle is what a page starts with"
    );
    let mut game = Game::start(evolving_web::PROGRAM, 1);
    assert_eq!(game.error(), "");
    for line in CASTLE.lines() {
        game.feed(line);
    }
    game.feed("end");
    assert!(game.over());
    assert_eq!(game.error(), "");
    assert_eq!(game.session().printed(), CASTLE_EXPECTED);
    assert_eq!(
        evolving_web::title(evolving_web::PROGRAM),
        "Evolving Game: The castle"
    );
}
