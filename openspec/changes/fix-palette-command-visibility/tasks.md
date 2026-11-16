# Tasks

## 1. Fix and verify

- [x] 1.1 Add `mode: "global"` to the keymap layer in `src/tui.tsx` and run
  `bun run build` so `dist/tui.js` matches the source.
- [x] 1.2 Load the rebuilt plugin in a scratch OpenCode config and verify the
  palette lists **Word completion: reload chat vocabulary** when searching for
  `reload`, and that running it shows the reload toast.
- [x] 1.3 Verify `ctrl+n`, `ctrl+p`, `tab` and `escape` still behave in the
  prompt: cycle, accept, and pass escape through when no suggestion shows.
- [x] 1.4 Add a `Fixed` entry under `[Unreleased]` in `CHANGELOG.md`.

## Workflow follow-up

- Add the archived change path to the bean frontmatter as `openspec-link`.
- Archive the change with `openspec archive fix-palette-command-visibility --yes`.
