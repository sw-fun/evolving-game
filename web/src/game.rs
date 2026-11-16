//! A game running in the page: the X_eTaL program started once and run
//! to where it waits for an event; each event fed to it goes on from
//! there. The host decides nothing: it hands lines in and takes what
//! the program printed and drew.

use std::sync::Arc;

use xetal_play::{Interactive, Step};

use crate::store::{Out, Session};

/// Transitions a slice: a slice ends where the program waits, so this
/// only bounds a runaway loop between two waits.
const SLICE: usize = 50_000_000;

/// The running program and what it has shown.
pub struct Game {
    run: Option<Interactive>,
    session: Arc<Session>,
    error: String,
}

impl Game {
    /// Start a program (a path among the files) and run it to its
    /// first wait.
    #[must_use]
    pub fn start(program: &str, seed: u64) -> Game {
        let session = Arc::new(Session::default());
        xetal_store::install(session.clone());
        let src = crate::files::text(program).unwrap_or_default();
        let (run, error) = match Interactive::start(src, seed, Box::new(Out(session.clone()))) {
            Ok(run) => (Some(run), String::new()),
            Err(r) => (None, r.err.trim().to_string()),
        };
        let mut game = Game {
            run,
            session,
            error,
        };
        game.go();
        game
    }

    /// An event's line for the waiting program, and its run to the
    /// next wait. Nothing once the program has ended.
    pub fn feed(&mut self, line: &str) {
        if let Some(run) = self.run.as_mut() {
            run.feed(line.to_string());
            self.go();
        }
    }

    /// Run until the program waits, ends or stops on an error.
    fn go(&mut self) {
        xetal_store::install(self.session.clone());
        while let Some(run) = self.run.as_mut() {
            match run.step(SLICE) {
                Step::Running => {}
                Step::Done(r) => {
                    self.error = r.err.trim().to_string();
                    self.run = None;
                }
                _ => break,
            }
        }
    }

    /// Has the program ended?
    #[must_use]
    pub fn over(&self) -> bool {
        self.run.is_none()
    }

    /// The error it stopped on, or nothing.
    #[must_use]
    pub fn error(&self) -> &str {
        &self.error
    }

    /// What it has printed and shown.
    #[must_use]
    pub fn session(&self) -> &Session {
        &self.session
    }
}
