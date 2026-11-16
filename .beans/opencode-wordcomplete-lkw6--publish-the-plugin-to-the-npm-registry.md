---
# opencode-wordcomplete-lkw6
title: Publish the plugin to the npm registry
status: in-progress
type: task
created_at: 2026-11-16T21:44:45Z
updated_at: 2026-11-17T12:20:00Z
parent: opencode-wordcomplete-ine0
---

Make the plugin installable with npm instead of a local path, so cli.json can point at a version.

Decisions to settle: whether the package works as a plain OpenCode plugin entry (dist/index.js plus dist/tui.js), and whether to publish under the unscoped name or a scope.

- [ ] confirm the npm name is free and matches package.json
- [ ] add a files field so only dist/, README.md, CHANGELOG.md and package.json are published
- [ ] verify the entry points and peerDependencies install cleanly in a scratch project
- [ ] publish 0.1.0, then tag the release and add the link to CHANGELOG.md
