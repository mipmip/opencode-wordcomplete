---
# opencode-wordcomplete-qec1
title: 02 Make completions accurate and fast
status: todo
type: milestone
created_at: 2026-11-16T21:31:28Z
updated_at: 2026-11-16T21:31:28Z
---

Goal: the word shown is the one the user wanted, and the vocabulary is fresh.

The plugin reads every user prompt and assistant reply from the OpenCode SQLite database at startup. This milestone is about what gets suggested, in which order, and how the vocabulary stays current during a long session without slowing the prompt down.

- [ ] matchPrefix ranking behaves as documented (newest first, then most used)
- [ ] vocabulary can be reloaded without restarting the TUI
- [ ] completion never blocks typing on a slow or large database
