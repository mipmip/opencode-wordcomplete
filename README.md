# opencode-wordcomplete

Vim-style word completion for the OpenCode TUI prompt. Press `ctrl+n` on a partly
typed word and it suggests words from your own chat history, including the
prompts you wrote. `ctrl+p` walks back, `tab` accepts.

## How it works

The plugin reads the OpenCode SQLite database read-only at startup, collects
every word of three characters or more from your user prompts and the assistant
text replies, and keeps a vocabulary in memory with the newest occurrence of each
word. On every keypress it looks at the word under the cursor and offers the
matching words, newest first.

Nothing leaves your machine and the database is never written to.

## Install

Add the published package to `~/.config/opencode/cli.json`, pinned to a version:

```json
{
  "plugins": ["opencode-wordcomplete@0.1.0"]
}
```

The CLI resolves the package from the registry, so a separate install is not
required. If you prefer to own the installed copy, install it globally first:

```bash
npm install -g opencode-wordcomplete
```

Plugin options go in the object form:

```json
{
  "plugins": [
    {
      "package": "opencode-wordcomplete@0.1.0",
      "options": {}
    }
  ]
}
```

To run a local checkout instead, point at the directory:

```json
{
  "plugins": [
    {
      "package": "/home/you/gh.mipmip/opencode-wordcomplete",
      "options": {}
    }
  ]
}
```

Restart is not needed. The TUI reloads `cli.json` and starts the plugin.

## Keys

| Key      | Action                                     |
| -------- | ------------------------------------------ |
| `ctrl+n` | next completion                            |
| `ctrl+p` | previous completion                        |
| `tab`    | accept the shown completion                |
| `escape` | dismiss, or the host's own escape behaviour |

The suggestion line appears in the prompt footer, for example
`tab  completion  3/17`.

## Options

| Option          | Default  | Meaning                                     |
| --------------- | -------- | ------------------------------------------- |
| `enabled`       | `true`   | turn the plugin off without removing it      |
| `acceptKey`     | `tab`    | key that inserts the completion              |
| `nextKey`       | `ctrl+n` | key for the next candidate                   |
| `prevKey`       | `ctrl+p` | key for the previous candidate               |
| `minPrefix`     | `2`      | shortest prefix that triggers a suggestion   |
| `maxCandidates` | `50`     | how many matches are collected per prefix    |
| `debug`         | `false`  | append diagnostics to `/tmp/opencode-wordcomplete-diag.log` |

## Caveats

- OpenCode V2 has no API for reading or writing the prompt. The plugin uses the
  host editor through `renderer.currentFocusedEditor`, which is not part of the
  plugin API and may change between releases.
- Because of that, completion only works at the end of the prompt text.
- `ctrl+n` and `ctrl+p` are also the host bindings for the built-in `@` and `/`
  autocomplete. The plugin returns `false` when it has no candidates, so the
  built-in menu keeps working.
- `tab` is only taken while a completion is shown, so tab indentation is
  unavailable in that moment. Set `acceptKey` to `ctrl+y` for the old key.
- The vocabulary is loaded at startup. Use the palette command
  **Word completion: reload chat vocabulary** after a long session.

## Development

```bash
bun install
bun run build
bun run typecheck
bun test
bun run test:coverage
bun run check-pack
nix flake check
```

`check-pack` reads `npm pack --dry-run --json` and fails when the tarball holds
anything outside `dist/`, `README.md`, `CHANGELOG.md`, `LICENSE` and
`package.json`, or misses one of the entry files.

`dist/` is committed so the repository can be used as a plugin path straight
from a checkout.

### Release

```bash
scripts/release.sh 0.1.0
```

The script refuses a dirty working copy, a version that is not `x.y.z`, and a
version without a matching `## [x.y.z]` section in `CHANGELOG.md`. It then runs
`nix flake check`, sets the version, publishes to npm, commits the bump, moves
the `main` bookmark, and pushes `main` and the git tag.

Preview the steps without changing the tree:

```bash
scripts/release.sh --dry-run 0.1.0
```
