//! The page's engine plays the walk as the command line does: the
//! events of games/walk/expected/play.in, fed a line at a time, print
//! exactly games/walk/expected/play.out.

use evolving_web::{Game, PROGRAM};

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
    assert_eq!(evolving_web::title(), "Evolving Game: Walk");
}

#[test]
fn the_footer_names_the_build_and_the_four_pins() {
    let build = evolving_web::about::build();
    for pin in ["XETAL", "EXTENSIONS", "GAMES", "LIBRARIES"] {
        let file = format!("{}/../{pin}_COMMIT", env!("CARGO_MANIFEST_DIR"));
        let sha: String = std::fs::read_to_string(file)
            .unwrap()
            .chars()
            .take(7)
            .collect();
        assert!(build.contains(&sha), "{pin} {sha} in {build}");
    }
    assert!(build.starts_with("<span>build "));
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
