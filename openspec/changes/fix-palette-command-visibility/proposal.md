# Proposal

## Why

The README promises a palette command, **Word completion: reload chat
vocabulary**, but it never appears in the command palette. The keymap layer in
`src/tui.tsx` declares no `mode`, so OpenCode exposes its key bindings and hides
its palette entries. A user who wants fresh vocabulary after a long session has
no way to trigger the reload.

Bean: `.beans/opencode-wordcomplete-wvem--show-the-vocabulary-reload-command-in-the-command.md`

## What Changes

- Declare the keymap layer as `mode: "global"` so the reload command is listed
  in the palette.
- Keep the existing keys working in the prompt: `ctrl+n`, `ctrl+p`, `tab` and
  `escape` behave as before, including escape passing through when no
  suggestion is shown.
- Rebuild `dist/` and add a changelog entry.

## Capabilities

### New Capabilities

- `tui-commands`: which commands the plugin registers and where OpenCode must
  expose them.

### Modified Capabilities

None.

## Impact

- `src/tui.tsx`: one property on the keymap layer.
- `dist/tui.js`: rebuilt from the source.
- `CHANGELOG.md`: a `Fixed` entry under `[Unreleased]`.
