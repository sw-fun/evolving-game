//! The store a game runs on in a page: its files (read only), what it
//! printed, and the latest picture it showed.

use std::collections::BTreeMap;
use std::io::Write;
use std::sync::{Arc, Mutex};

use xetal_store::Store;

use crate::about as files;

/// What the program has printed and shown.
#[derive(Default)]
pub struct Shown {
    pub printed: Vec<u8>,
    pub picture: Option<String>,
    pub pictures: usize,
}

/// The files, where output goes, and the texts the program keeps (its
/// saves): given back to it when it asks, and to the page to store.
#[derive(Default)]
pub struct Session {
    pub shown: Mutex<Shown>,
    pub kept: Mutex<BTreeMap<String, String>>,
}

impl Store for Session {
    fn get(&self, path: &str) -> Result<String, String> {
        let kept = self.kept.lock().ok().and_then(|k| k.get(path).cloned());
        kept.or_else(|| files::text(path).map(str::to_string))
            .ok_or_else(|| format!("{path}: no such file"))
    }

    fn put(&self, path: &str, text: &str) -> Result<(), String> {
        if let Ok(mut k) = self.kept.lock() {
            k.insert(path.to_string(), text.to_string());
        }
        Ok(())
    }

    fn line(&self) -> Result<String, String> {
        Err("no more input".into())
    }

    fn show(&self, svg: &str) -> Result<(), String> {
        if let Ok(mut s) = self.shown.lock() {
            s.picture = Some(svg.to_string());
            s.pictures += 1;
        }
        Ok(())
    }
}

/// The program's standard output, kept in the session.
pub struct Out(pub Arc<Session>);

impl Write for Out {
    fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
        if let Ok(mut s) = self.0.shown.lock() {
            s.printed.extend_from_slice(buf);
        }
        Ok(buf.len())
    }

    fn flush(&mut self) -> std::io::Result<()> {
        Ok(())
    }
}
