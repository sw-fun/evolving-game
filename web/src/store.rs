//! The store a game runs on in a page: its files (read only), what it
//! printed, and the latest picture it showed.

use std::io::Write;
use std::sync::{Arc, Mutex};

use xetal_store::Store;

use crate::files;

/// What the program has printed and shown.
#[derive(Default)]
pub struct Shown {
    pub printed: Vec<u8>,
    pub picture: Option<String>,
    pub pictures: usize,
}

/// The files, and where output goes.
#[derive(Default)]
pub struct Session {
    pub shown: Mutex<Shown>,
}

impl Store for Session {
    fn get(&self, path: &str) -> Result<String, String> {
        files::text(path)
            .map(str::to_string)
            .ok_or_else(|| format!("{path}: no such file"))
    }

    fn put(&self, _path: &str, _text: &str) -> Result<(), String> {
        Err("the page keeps no files".into())
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
