# Design

## Decision: one layer in global mode

Adding `mode: "global"` to the existing keymap layer is the smallest change that
makes the palette entry visible. A layer in another mode contributes bindings
but not palette commands, which is why the command was unreachable.

The alternative, a second global layer that only holds the reload command,
would duplicate the command definition and split one behaviour across two
layers. It buys nothing because none of the commands act when they have no
candidates: `step` returns when the candidate list is empty, `accept` returns
when no suggestion is shown, and `dismiss` returns `false` so escape reaches the
host.

## Risks

- Global mode widens where the bindings apply. The three step and accept
  commands return early without a suggestion, and escape passes through, so
  other dialogs and inputs are unaffected.
- The palette entry depends on the host's global-mode command collection. That
  is the documented behaviour of `context.keymap.layer`.
