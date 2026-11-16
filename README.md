# opencode-wordcomplete

Vim-style word completion for the OpenCode TUI prompt. Press `ctrl+n` on a partly
typed word and it suggests words from your own chat history, including the
prompts you wrote. `ctrl+p` walks back, `ctrl+y` accepts.

## How it works

The plugin reads the OpenCode SQLite database read-only at startup, collects
every word of three characters or more from your user prompts and the assistant
text replies, and keeps a vocabulary in memory with the newest occurrence of each
word. On every keypress it looks at the word under the cursor and offers the
matching words, newest first.

Nothing leaves your machine and the database is never written to.

## Install

Add the built package to `~/.config/opencode/cli.json`:

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
| `ctrl+y` | accept the shown completion                 |
| `escape` | dismiss, or the host's own escape behaviour |

The suggestion line appears in the prompt footer, for example
`ctrl+y  completion  3/17`.

## Options

| Option          | Default  | Meaning                                     |
| --------------- | -------- | ------------------------------------------- |
| `enabled`       | `true`   | turn the plugin off without removing it      |
| `acceptKey`     | `ctrl+y` | key that inserts the completion              |
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
- The vocabulary is loaded at startup. Use the palette command
  **Word completion: reload chat vocabulary** after a long session.

## Development

```bash
bun install
bun run build
bun run typecheck
```

`dist/` is committed so the repository can be used as a plugin path straight
from a checkout.
