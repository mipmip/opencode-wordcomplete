# Spec Delta

## Purpose

Makes the plugin installable from the npm registry as a versioned package whose
published files, entry points and dependencies let OpenCode load it the same way
it loads a local checkout.

## ADDED Requirements

### Requirement: Published package contents

The published tarball SHALL contain `package.json`, `README.md`, `CHANGELOG.md`,
`LICENSE`, `dist/index.js` and `dist/tui.js`, and SHALL NOT contain `src/`,
`node_modules/`, tests, `scripts/`, `openspec/`, `.beans/`, `.opencode/` or
`flake.nix`.

#### Scenario: Packing the package

- **WHEN** `npm pack --dry-run` runs in the repository
- **THEN** the file list contains exactly the documented publish set
- **AND** no source, test or development file is listed

#### Scenario: Package without a license file

- **WHEN** the tarball is inspected for license terms
- **THEN** a `LICENSE` file with the MIT text is present

### Requirement: Entry points

`package.json` SHALL declare `main` and `exports["."]` for the server part and
`exports["./tui"]` for the TUI part, and each declared path SHALL exist in the
published tarball.

#### Scenario: Installing and resolving both parts

- **WHEN** the package is installed in an empty project
- **THEN** `import("opencode-wordcomplete")` resolves
- **AND** `import("opencode-wordcomplete/tui")` resolves

#### Scenario: Loading the TUI part in OpenCode

- **WHEN** `cli.json` lists `opencode-wordcomplete`
- **THEN** OpenCode loads the TUI plugin and registers its commands

### Requirement: Runtime and peer dependencies

The package SHALL declare every module its built entry points import at runtime
as a dependency, and SHALL declare the host-provided OpenTUI and Solid packages
as peer dependencies rather than bundling them.

#### Scenario: Fresh install without host packages

- **WHEN** the package is installed alone in an empty project
- **THEN** its runtime imports resolve without the repository's `node_modules`

#### Scenario: Host supplies the UI framework

- **WHEN** OpenCode loads the plugin with its own `@opentui/*` and `solid-js`
- **THEN** the plugin uses the host copies and does not ship a second copy

### Requirement: Install instructions

`README.md` SHALL document both install routes: the global npm install and the
`cli.json` entry as a package string, with an example that pins a version.

#### Scenario: Reader follows the npm route

- **WHEN** a reader follows the README install section without a checkout
- **THEN** the documented commands and `cli.json` example are enough to enable
  the plugin
- **AND** the string form `opencode-wordcomplete@<version>` is shown

### Requirement: Release discipline

Each published version SHALL have a matching `CHANGELOG.md` entry and git tag,
and the version in `package.json` SHALL equal the tag without a leading `v`.

#### Scenario: Publishing a release

- **WHEN** the release script publishes version `0.1.0`
- **THEN** `package.json` reports `0.1.0`
- **AND** a `0.1.0` git tag points at the released commit
- **AND** `CHANGELOG.md` has a `## [0.1.0]` section

#### Scenario: Checks fail before publish

- **WHEN** typecheck, tests, coverage gate or `nix flake check` fails
- **THEN** the release script exits non-zero
- **AND** nothing is published and no tag is created

### Requirement: Package identity

The package SHALL be named `opencode-wordcomplete`, SHALL use semantic
versioning, and the first published version SHALL be `0.1.0`.

#### Scenario: Name matches the registry

- **WHEN** the published package is queried on the npm registry
- **THEN** its name is `opencode-wordcomplete`
- **AND** its `latest` version is a semver release

#### Scenario: First release

- **WHEN** version `0.1.0` is published
- **THEN** the registry lists it as the initial release
