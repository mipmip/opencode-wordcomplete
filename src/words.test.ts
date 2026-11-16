import { Database } from "bun:sqlite"
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  databasePath,
  dataDir,
  loadWords,
  matchPrefix,
  tokenize,
  trailingPrefix,
  type Word,
} from "./words.ts"

const saved: Record<string, string | undefined> = {}

beforeEach(() => {
  saved.XDG_DATA_HOME = process.env.XDG_DATA_HOME
  saved.OPENCODE_DB = process.env.OPENCODE_DB
})

afterEach(() => {
  for (const key of ["XDG_DATA_HOME", "OPENCODE_DB"]) {
    const value = saved[key]
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

describe("tokenize", () => {
  test("keeps only words of three to forty characters", () => {
    expect(tokenize("a ab abc abcd")).toEqual(["abc", "abcd"])
    expect(tokenize("a".repeat(40))).toEqual(["a".repeat(40)])
    expect(tokenize("a".repeat(41))).toEqual([])
  })

  test("splits on punctuation and keeps unicode letters and digits", () => {
    expect(tokenize("héllo, werld! 123")).toEqual(["héllo", "werld", "123"])
    expect(tokenize("snake_case stays")).toEqual(["snake_case", "stays"])
  })

  test("returns nothing for text without words", () => {
    expect(tokenize("... ---")).toEqual([])
  })
})

describe("trailingPrefix", () => {
  test("returns the word the cursor sits in", () => {
    expect(trailingPrefix("hello wor")).toBe("wor")
    expect(trailingPrefix("thé")).toBe("thé")
  })

  test("returns an empty prefix after whitespace or punctuation", () => {
    expect(trailingPrefix("hello ")).toBe("")
    expect(trailingPrefix("done.")).toBe("")
    expect(trailingPrefix("")).toBe("")
  })
})

describe("matchPrefix", () => {
  const words: Word[] = [
    { text: "alps", lower: "alps", count: 2, seen: 5 },
    { text: "Alpha", lower: "alpha", count: 1, seen: 10 },
    { text: "alpine", lower: "alpine", count: 5, seen: 5 },
  ]

  test("orders by newest sighting, then by count", () => {
    expect(matchPrefix("al", words).map((word) => word.text)).toEqual(["Alpha", "alpine", "alps"])
  })

  test("ignores case and drops the exact word", () => {
    expect(matchPrefix("ALP", words).map((word) => word.lower)).toEqual(["alpha", "alpine", "alps"])
    expect(matchPrefix("alpha", words)).toEqual([])
  })

  test("needs two characters and honours the limit", () => {
    expect(matchPrefix("a", words)).toEqual([])
    expect(matchPrefix("al", words, 1).map((word) => word.text)).toEqual(["Alpha"])
  })
})

describe("dataDir", () => {
  test("uses XDG_DATA_HOME when set", () => {
    process.env.XDG_DATA_HOME = "/tmp/xdg"
    expect(dataDir()).toBe("/tmp/xdg/opencode")
  })

  test("falls back to ~/.local/share", () => {
    delete process.env.XDG_DATA_HOME
    expect(dataDir().endsWith("/.local/share/opencode")).toBe(true)
  })
})

describe("databasePath", () => {
  test("honours an absolute override", () => {
    process.env.OPENCODE_DB = "/tmp/custom.db"
    expect(databasePath()).toBe("/tmp/custom.db")
  })

  test("resolves a relative override inside the data dir", () => {
    process.env.XDG_DATA_HOME = "/tmp/xdg"
    process.env.OPENCODE_DB = "extra.db"
    expect(databasePath()).toBe("/tmp/xdg/opencode/extra.db")
  })

  test("passes :memory: through", () => {
    process.env.OPENCODE_DB = ":memory:"
    expect(databasePath()).toBe(":memory:")
  })

  test("defaults to opencode.db in the data dir", () => {
    delete process.env.OPENCODE_DB
    process.env.XDG_DATA_HOME = "/tmp/xdg"
    expect(databasePath()).toBe("/tmp/xdg/opencode/opencode.db")
  })
})

function tempDb(name: string): { dir: string; file: string } {
  const dir = mkdtempSync(join(tmpdir(), "wordcomplete-"))
  return { dir, file: join(dir, name) }
}

describe("loadWords", () => {
  let dirs: string[] = []

  afterEach(() => {
    for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
    dirs = []
  })

  test("counts tokens across user and assistant messages", () => {
    const { dir, file } = tempDb("opencode.db")
    dirs.push(dir)
    const db = new Database(file)
    db.exec("CREATE TABLE session_message (type TEXT, data TEXT, time_created INTEGER)")
    const insert = db.prepare("INSERT INTO session_message VALUES (?, ?, ?)")
    insert.run("user", JSON.stringify({ text: "Refactor the parser parser" }), 2000)
    insert.run(
      "assistant",
      JSON.stringify({
        content: [
          { type: "text", text: "Parser rewrite finished" },
          { type: "tool", text: "ignored" },
        ],
      }),
      1000,
    )
    db.close()

    process.env.OPENCODE_DB = file
    const words = loadWords()
    const parser = words.find((word) => word.lower === "parser")
    expect(parser).toEqual({ text: "parser", lower: "parser", count: 3, seen: 2000 })
    expect(words.map((word) => word.lower).sort()).toEqual([
      "finished",
      "parser",
      "refactor",
      "rewrite",
      "the",
    ])
  })

  test("reads the legacy message and part tables", () => {
    const { dir, file } = tempDb("opencode.db")
    dirs.push(dir)
    const db = new Database(file)
    db.exec("CREATE TABLE message (id TEXT, data TEXT, time_created INTEGER)")
    db.exec("CREATE TABLE part (message_id TEXT, data TEXT)")
    db.prepare("INSERT INTO message VALUES (?, ?, ?)").run(
      "m1",
      JSON.stringify({ role: "user" }),
      1000,
    )
    db.prepare("INSERT INTO part VALUES (?, ?)").run(
      "m1",
      JSON.stringify({ type: "text", text: "Legacy table words" }),
    )
    db.close()

    process.env.OPENCODE_DB = file
    expect(loadWords().map((word) => word.lower).sort()).toEqual(["legacy", "table", "words"])
  })

  test("skips malformed rows and unknown roles", () => {
    const { dir, file } = tempDb("opencode.db")
    dirs.push(dir)
    const db = new Database(file)
    db.exec("CREATE TABLE session_message (type TEXT, data TEXT, time_created INTEGER)")
    const insert = db.prepare("INSERT INTO session_message VALUES (?, ?, ?)")
    insert.run("user", "{not json", 1000)
    insert.run("tool", JSON.stringify({ text: "ignored words here" }), 1000)
    insert.run("user", JSON.stringify({ text: 42 }), 1000)
    insert.run("assistant", JSON.stringify({ content: "not an array" }), 1000)
    db.close()

    process.env.OPENCODE_DB = file
    expect(loadWords()).toEqual([])
  })

  test("returns an empty vocabulary when the database is missing", () => {
    process.env.OPENCODE_DB = "/tmp/wordcomplete-does-not-exist.db"
    expect(loadWords()).toEqual([])
  })
})
