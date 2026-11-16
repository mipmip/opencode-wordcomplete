# Design

## Context

See `proposal.md` for motivation. Current state that shapes the approach:

- `dist/` is committed and built by esbuild from `src/`; `dist/index.js` and
  `dist/tui.js` import `@opencode/plugin` and `@opencode/plugin/tui`, both
  externalized at build time.
- `package.json` already declares `main`, `exports["."]` and `exports["./tui"]`
  against `dist/`, and lists `@opentui/core`, `@opentui/solid` and `solid-js`
  as peer dependencies. `@opencode/plugin` is only a dev dependency today.
- The OpenCode docs publish the TUI part through `./tui` and show source files
  in `exports`, while pointing out that the host resolves `@opencode/plugin`
  at runtime. The docs also show `cli.json` entries as package strings, scoped
  names and pins.
- The repo has no `LICENSE` file while `package.json` claims MIT.
- `nix flake check` builds the package with `esbuild` and runs tests plus the
  coverage gate. `bun` is not installed globally.

## Goals / Non-Goals

**Goals:**

- One artifact definition for npm and the flake, so a published tarball and a
  `nix build` produce the same runtime files.
- A release that cannot publish a version the checks did not pass.
- Evidence that a tarball install works without this checkout.

**Non-Goals:**

- Publishing the server stub as a separately loadable plugin for remote
  servers. `cli.json` remains the documented route.
- Automated npm publishing from CI. The release runs locally.
- Changing completion behavior or the vocabulary loader.

## Decisions

### Ship `dist/`, not TypeScript sources

Keep `exports` pointing at `dist/index.js` and `dist/tui.js` and publish the
built files, rather than following the docs example that exports `src/*.tsx`.

Rationale: the tarball then contains exactly what the tests and `nix flake
check` exercised, needs no transpiler for consumers, and cannot drift from the
committed `dist/`. Shipping sources was considered and rejected: it moves
building to the host, includes `src/`, and leaves `bun:sqlite` bundling to an
unknown host step.

### `@opencode/plugin` becomes a runtime dependency

The built entry points import it, so an npm install that resolves the package
must have it. Pin a floor, `">=2.3.0"`, in `dependencies`. Using `"latest"` as
the docs example does was rejected: it makes an install non-reproducible.
Keeping it a dev dependency was rejected: the import would fail in a consumer
project.

The OpenTUI and Solid packages stay peers, because OpenCode supplies its own
copies and a second copy would break rendering.

### Explicit publish set, checked before publish

Add `files: ["dist", "README.md", "CHANGELOG.md", "LICENSE"]`. `package.json`
is always included by npm. Add `scripts/check-pack.ts` that runs
`npm pack --dry-run --json` and asserts the allowed set and the presence of the
two entry files; wire it into `npm test` or the release script and into the
flake's checks so both paths enforce it.

### Release script owns version, tag and publish

`scripts/release.sh <version>`:

1. Refuse a dirty working copy and a version that does not match semver.
2. Require a `## [<version>]` section in `CHANGELOG.md`.
3. Run `nix flake check` (build, tests, coverage gate, pack check).
4. Set the version with `npm version --no-git-tag-version`, so no git commit is
   created behind jj's back.
5. Publish with `npm publish`.
6. Create the `git tag <version>` after `jj git export`, move the `main`
   bookmark, and push the bookmark and tag.

Publishing before tagging means a failed tag leaves a published version; the
alternative order leaves a tag for an unpublished version. A publish failure is
the worse outcome for users, so the tag failure is accepted and the design
documents it. Manual `npm publish` stays possible for recovery.

### Package metadata

Add `keywords`, `homepage`, `bugs`, `engines` (bun for development, node for
npm tooling), and the existing `repository`. Add `LICENSE` with the MIT text
and a `license` field that already says MIT.

## Risks / Trade-offs

- Host API drift: `@opencode/plugin` is not stable, and a floor without a
  ceiling may break on a future major. Mitigation: the release checklist loads
  the tarball in the current OpenCode; raise or bound the range when the API
  breaks.
- Docs show source exports and a dev dependency. A reviewer may expect that
  shape. Mitigation: the design states why `dist/` and a real dependency are
  used, and the scratch install proves it.
- `npm pack --dry-run` does not model npm's always-included files exactly.
  Mitigation: the check asserts an allowed set and additionally allows
  `package.json`.
- First publish reserves a public name with no way back. Mitigation: pack and
  scratch-install checks run first; publish only after they pass.
