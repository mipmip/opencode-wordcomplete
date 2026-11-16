# Tasks

## 1. Publish metadata and license

- [x] 1.1 Add `files: ["dist", "README.md", "CHANGELOG.md", "LICENSE"]`,
  `keywords`, `homepage`, `bugs` and `engines` to `package.json`, and verify
  `bun run build` still emits both entry files.
- [x] 1.2 Add `@opencode/plugin` (`>=2.3.0`) to `dependencies`, keep the
  OpenTUI and Solid packages as peers, and verify `bun pm ls` shows it as a
  production dependency.
- [x] 1.3 Add a `LICENSE` file with the MIT text naming Pim Snel as holder, and
  verify `npm pack --dry-run` lists it.
- [x] 1.4 Run `npm pack --dry-run` and verify the file list contains only
  `dist/`, `README.md`, `CHANGELOG.md`, `LICENSE` and `package.json`.

## 2. Publish-set check

- [x] 2.1 Add `scripts/check-pack.ts` that runs `npm pack --dry-run --json`,
  asserts the allowed file set, and asserts `dist/index.js` and `dist/tui.js`
  are present, then verify it passes on the current tree.
- [x] 2.2 Verify the check fails when a stray file (for example `src/words.ts`)
  is added to the allowed set check, and restore the file list afterwards.
- [x] 2.3 Wire the check into a `package.json` script and into
  `flake.nix` checks, and verify `nix flake check` still passes.

## 3. Release script

- [x] 3.1 Add `scripts/release.sh <version>` that refuses a dirty working copy
  and a non-semver version, requires a `## [<version>]` changelog section,
  runs `nix flake check`, sets the version with
  `npm version --no-git-tag-version`, publishes, then tags, moves `main` and
  pushes, and verify `bash -n scripts/release.sh` is clean.
- [x] 3.2 Verify the script refuses: a dirty tree, version `0.1`, and a
  version without a changelog section, and that each refusal exits non-zero
  before any publish step.
- [x] 3.3 Add a `scripts/release.sh --dry-run <version>` path that stops before
  `npm publish`, and verify it prints the version, tag and publish command
  without changing the tree.

## 4. Documentation

- [x] 4.1 Update the README install section with
  `npm install -g opencode-wordcomplete` and a `cli.json` string entry
  `opencode-wordcomplete@0.1.0`, keeping the local path route, and verify the
  commands run as written.
- [x] 4.2 Document the release command and its preconditions in README
  Development, and verify the named script exists and is executable.

## 5. Install verification

- [x] 5.1 Pack the tarball with `npm pack`, install it in an empty project
  under `/tmp/opencode/`, and verify `import("opencode-wordcomplete")` and
  `import("opencode-wordcomplete/tui")` both resolve without this repo's
  `node_modules`.
- [x] 5.2 Point `cli.json` at the scratch install and verify OpenCode loads the
  TUI plugin, registers the commands, and completes a word from history.

## 6. Publish 0.1.0

- [ ] 6.1 Confirm npm authentication and that `opencode-wordcomplete` is still
  unclaimed, then verify `npm whoami` and `npm view opencode-wordcomplete`
  both answer as expected.
- [ ] 6.2 Move the `Unreleased` changelog entries under `## [0.1.0]`, run
  `scripts/release.sh 0.1.0`, and verify the registry lists `0.1.0` as
  `latest` with both entry files in the tarball.

## Workflow follow-up

- Add the archived change path to the bean frontmatter as `openspec-link`.
- Archive the change with `openspec archive publish-to-npm --yes`.
