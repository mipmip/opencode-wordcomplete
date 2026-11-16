---
# opencode-wordcomplete-ine0
title: 01 Ship the plugin as an installable package
status: todo
type: milestone
created_at: 2026-11-16T21:31:20Z
updated_at: 2026-11-16T21:31:20Z
---

Goal: anyone can add this plugin to their OpenCode TUI from a checkout or a published package.

The completion loop already works locally. This milestone covers turning it into something another person can install and trust: the committed dist build, an install path that survives restarts, and a release that can be referenced by version.

- [ ] dist/ stays in sync with src/ on every ship
- [ ] README install instructions match what a fresh user sees
- [ ] first tagged release exists
