---
# opencode-wordcomplete-jack
title: 03 Prove it with tests
status: todo
type: milestone
created_at: 2026-11-16T21:31:34Z
updated_at: 2026-11-16T21:31:34Z
---

Goal: change the plugin without fear, and make /mip:ship's gate meaningful.

There are no tests yet, so nix flake check fails by design. This milestone covers unit tests for the pure logic in src/words.ts (tokenize, matchPrefix, trailingPrefix, databasePath) and enough coverage of the TUI bindings to clear the gate of >=70% overall and >=80% on core code.

- [ ] bun test runs from a clean checkout
- [ ] coverage gate met: >=70% overall, >=80% on src/words.ts
- [ ] nix flake check passes
