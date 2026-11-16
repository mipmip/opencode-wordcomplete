---
# opencode-wordcomplete-wvem
title: Show the vocabulary reload command in the command palette
status: in-progress
type: bug
created_at: 2026-11-17T14:07:23Z
updated_at: 2026-11-17T14:07:23Z
parent: opencode-wordcomplete-pf1g
---

The command Word completion: reload chat vocabulary never appears in the command palette. The keymap layer in src/tui.tsx sets no mode, so only its key bindings work and palette commands stay hidden. Adding mode: "global" makes the palette entry appear; tab, ctrl+n, ctrl+p and escape keep working in the prompt (verified against a patched build in a scratch OpenCode config).
