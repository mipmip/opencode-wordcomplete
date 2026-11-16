# Proposal

## Why

The plugin can only be installed from a local checkout: the README tells people
to clone the repository and point `cli.json` at a directory path. That ties
users to a moving worktree, gives them no version to pin, and makes the plugin
undiscoverable. The npm registry already exists for exactly this, and the
unscoped name `opencode-wordcomplete` is free.

Bean: `.beans/opencode-wordcomplete-lkw6--publish-the-plugin-to-the-npm-registry.md`

## What Changes

- Publish the package to npm as `opencode-wordcomplete`, beginning with 0.1.0.
- Add a `files` field so the published tarball contains only `dist/`,
  `README.md`, `CHANGELOG.md`, `LICENSE` and `package.json`.
- Declare `@opencode/plugin` as a runtime dependency, because the built entry
  points import it, and keep `@opentui/core`, `@opentui/solid` and `solid-js`
  as peer dependencies.
- Add the MIT `LICENSE` file that `package.json` already claims, plus the
  publish metadata: keywords, homepage, bugs and engines.
- Add a release script that runs the checks, bumps the version, tags the
  release and publishes, and a changelog entry for every release.
- Document `npm install -g opencode-wordcomplete` and the string form of a
  `cli.json` plugin entry beside the existing path form.
- Verify the published package in a scratch project: install it from the
  tarball, load both entry points, and confirm completion still works.

## Capabilities

### New Capabilities

- `npm-distribution`: what the published package must contain and satisfy. The
  tarball, entry points, dependencies and install instructions that make an npm
  install work like a checkout.

### Modified Capabilities

None. Runtime completion behavior does not change.

## Impact

- `package.json`: `files`, `dependencies`, `keywords`, `homepage`, `bugs`,
  `engines`, and release scripts.
- New `LICENSE`, new `scripts/release.sh`.
- `README.md` install section, `CHANGELOG.md`.
- `flake.nix`: the package build should match what npm publishes, so the same
  files and no missing runtime dependency.
- Release process: publishing needs an npm account with access to the name.
