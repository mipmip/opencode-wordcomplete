# Changelog

All notable changes to this project are documented here.

## [Unreleased]

### Added

- Vim-style word completion for the OpenCode TUI prompt: `ctrl+n` and `ctrl+p`
  cycle candidates taken from your own chat history.
- Vocabulary loaded once at startup from the OpenCode SQLite database, read-only.
- Palette command **Word completion: reload chat vocabulary**.

### Changed

- Completions are accepted with `tab` instead of `ctrl+y`; set `acceptKey` to
  restore the old key.

### Fixed

- The vocabulary reload command now appears in the command palette.
