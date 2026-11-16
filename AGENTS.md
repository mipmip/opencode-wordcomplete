# opencode-wordcomplete

Vim-style word completion for the OpenCode TUI prompt. Press `ctrl+n` on a partly
typed word and it suggests words from your own chat history, including the
prompts you wrote. `ctrl+p` walks back, `ctrl+y` accepts.

The plugin reads the OpenCode SQLite database read-only at startup, collects
every word of three characters or more from the user prompts and the assistant
text replies, and keeps a vocabulary in memory with the newest occurrence of each
word. On every keypress it looks at the word under the cursor and offers the
matching words, newest first. Nothing leaves the machine and the database is
never written to.

## Commands

| Command                                     | Purpose                                          |
| ------------------------------------------- | ------------------------------------------------ |
| `bun install`                               | install dependencies                             |
| `bun run build`                             | rebuild `dist/` from `src/`                      |
| `bun run typecheck`                         | typecheck without emitting                       |
| `bun test`                                  | run the unit tests                               |
| `bun run test:coverage`                     | run the tests and enforce the coverage gate      |
| `nix flake check`                           | build, tests and coverage gate, as `/mip:ship`   |
| `scripts/ship-change.sh <change> [subject]` | gate, archive the change, commit and push        |

`dist/` is committed so the checkout can be used as a plugin path directly.

## Beans

When I refer to issues like opencode-wordcomplete-rn3b checkout the task
in @.beans/opencode-wordcomplete-rn3b-*.md

In this project we will use these tasks as epics for making openspec proposals.

WHEN you create a proposal at a link to this task in the proposal.md.
WHEN a bean is used to create an proposal change the status to "in-progress"
WHEN a proposal is archived add the link to the archived proposal in the frontmatter of this task like this:

```
openspec-link: openspec/changes/archive/....
```

You are allowed to update these statuses in the task frontmatter:

- in-progress
- todo
- draft
- completed
- scrapped

When making changes you are allowed to update the date/time in `updated_at` in the task frontmatter

Besides updating status and openspec-link, you are NOT ALLOWED to modify the contents of the task file.
