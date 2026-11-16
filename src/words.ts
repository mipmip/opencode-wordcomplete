import { Database } from "bun:sqlite"
import { existsSync, readdirSync } from "node:fs"
import { homedir } from "node:os"
import { isAbsolute, join } from "node:path"

export type Word = {
  text: string
  lower: string
  count: number
  seen: number
}

const MAX_MESSAGES = 4000
const MIN_WORD = 3
const MAX_WORD = 40
const DB_FILE = "opencode.db"

export function dataDir(): string {
  const xdg = process.env.XDG_DATA_HOME?.trim()
  const base = xdg ? xdg : join(homedir(), ".local", "share")
  return join(base, "opencode")
}

function existingDbIn(dir: string): string | undefined {
  const preferred = join(dir, DB_FILE)
  if (existsSync(preferred)) return preferred
  try {
    const candidates = readdirSync(dir)
      .filter((name) => /^opencode-.*\.db$/.test(name))
      .sort()
    const last = candidates[candidates.length - 1]
    if (last) return join(dir, last)
  } catch {
    return undefined
  }
  return undefined
}

export function databasePath(): string {
  const override = process.env.OPENCODE_DB?.trim()
  if (override) {
    if (override === ":memory:") return override
    return isAbsolute(override) ? override : join(dataDir(), override)
  }
  return existingDbIn(dataDir()) ?? join(dataDir(), DB_FILE)
}

export function tokenize(text: string): string[] {
  const out: string[] = []
  for (const match of text.matchAll(/[\p{L}\p{N}_]+/gu)) {
    const token = match[0]
    if (token.length >= MIN_WORD && token.length <= MAX_WORD) out.push(token)
  }
  return out
}

type Row = { type: string; data: string; time: number }

function rows(db: Database): Row[] {
  const tables = new Set(
    (db.query("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[]).map(
      (row) => row.name,
    ),
  )

  if (tables.has("session_message")) {
    return db
      .query(
        `SELECT type, data, time_created AS time
         FROM session_message
         WHERE type IN ('user', 'assistant')
         ORDER BY time_created DESC
         LIMIT ${MAX_MESSAGES}`,
      )
      .all() as Row[]
  }

  return db
    .query(
      `SELECT json_extract(m.data, '$.role') AS type,
              json_object('text', json_extract(p.data, '$.text')) AS data,
              m.time_created AS time
       FROM message m
       JOIN part p ON p.message_id = m.id
       WHERE json_extract(p.data, '$.type') = 'text'
       ORDER BY m.time_created DESC
       LIMIT ${MAX_MESSAGES}`,
    )
    .all() as Row[]
}

function textOf(row: Row): string {
  let parsed: unknown
  try {
    parsed = JSON.parse(row.data)
  } catch {
    return ""
  }
  const data = parsed as { text?: unknown; content?: { type?: string; text?: unknown }[] }
  if (row.type === "user") return typeof data.text === "string" ? data.text : ""
  if (!Array.isArray(data.content)) return ""
  return data.content
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text as string)
    .join(" ")
}

export function loadWords(): Word[] {
  let db: Database
  try {
    db = new Database(databasePath(), { readonly: true })
  } catch {
    return []
  }

  try {
    const byLower = new Map<string, Word>()
    for (const row of rows(db)) {
      for (const token of tokenize(textOf(row))) {
        const lower = token.toLowerCase()
        const known = byLower.get(lower)
        if (known) {
          known.count++
          if (row.time > known.seen) known.seen = row.time
        } else {
          byLower.set(lower, { text: token, lower, count: 1, seen: row.time })
        }
      }
    }
    return [...byLower.values()]
  } catch {
    return []
  } finally {
    db.close()
  }
}

export function matchPrefix(prefix: string, words: Word[], limit = 100): Word[] {
  const lower = prefix.toLowerCase()
  if (lower.length < RESOLVE_MIN) return []
  return words
    .filter((word) => word.lower !== lower && word.lower.startsWith(lower))
    .sort((left, right) => right.seen - left.seen || right.count - left.count)
    .slice(0, limit)
}

const RESOLVE_MIN = 2

export function trailingPrefix(text: string): string {
  const match = text.match(/[\p{L}\p{N}_]+$/u)
  return match ? match[0] : ""
}
