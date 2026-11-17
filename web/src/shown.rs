//! Reading what a game has printed and shown.

use crate::store::Session;

impl Session {
    /// Everything the program has printed.
    #[must_use]
    pub fn printed(&self) -> String {
        let shown = self.shown.lock();
        shown.map_or_else(
            |_| String::new(),
            |s| String::from_utf8_lossy(&s.printed).into_owned(),
        )
    }

    /// The latest picture it showed (an SVG document), or nothing.
    #[must_use]
    pub fn picture(&self) -> String {
        let shown = self.shown.lock();
        shown.map_or_else(|_| String::new(), |s| s.picture.clone().unwrap_or_default())
    }

    /// How many pictures it has shown.
    #[must_use]
    pub fn pictures(&self) -> usize {
        self.shown.lock().map_or(0, |s| s.pictures)
    }

    /// A text the program has kept (its save), by name; empty for none.
    #[must_use]
    pub fn kept(&self, name: &str) -> String {
        let kept = self.kept.lock();
        kept.map_or_else(
            |_| String::new(),
            |k| k.get(name).cloned().unwrap_or_default(),
        )
    }
}
