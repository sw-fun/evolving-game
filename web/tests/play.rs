//! The page's engine plays the walk as the command line does: the
//! events of games/walk/expected/play.in, fed a line at a time, print
//! exactly games/walk/expected/play.out.

use evolving_web::{Game, PROGRAM};

const EVENTS: &str = include_str!("../../games/walk/expected/play.in");
const EXPECTED: &str = include_str!("../../games/walk/expected/play.out");

#[test]
fn the_page_plays_the_walk_as_the_command_line_does() {
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
    let play = evolving_web::about::source("play.xtl");
    assert_eq!(play, include_str!("../../games/walk/play.xtl"));
    assert_eq!(evolving_web::about::source("nothing"), "");
}
