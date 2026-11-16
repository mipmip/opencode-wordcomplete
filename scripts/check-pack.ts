#!/usr/bin/env bun
import { execFileSync } from "node:child_process"

const allowed = new Set([
  "package.json",
  "README.md",
  "CHANGELOG.md",
  "LICENSE",
  "dist/index.js",
  "dist/tui.js",
])

const required = [
  "package.json",
  "README.md",
  "CHANGELOG.md",
  "LICENSE",
  "dist/index.js",
  "dist/tui.js",
]

let output: string
try {
  output = execFileSync("npm", ["pack", "--dry-run", "--json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  })
} catch (error) {
  console.error("pack check: npm pack failed")
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}

const [{ files }] = JSON.parse(output) as Array<{
  files: Array<{ path: string }>
}>
const packed = files.map((file) => file.path)

const stray = packed.filter((path) => !allowed.has(path))
const missing = required.filter((path) => !packed.includes(path))

if (stray.length > 0) {
  console.error("pack check: files outside the publish set:")
  for (const path of stray) console.error(`  ${path}`)
}

if (missing.length > 0) {
  console.error("pack check: required files are not published:")
  for (const path of missing) console.error(`  ${path}`)
}

if (stray.length > 0 || missing.length > 0) {
  process.exit(1)
}

console.log(`pack check: ${packed.length} files, only the publish set is included`)
