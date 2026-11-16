import { readFileSync } from "node:fs"

const OVERALL = 0.7
const CORE = 0.8
const CORE_FILES = ["src/words.ts"]

const lcovPath = process.argv[2] ?? "coverage/lcov.info"

type Record = { file: string; found: number; hit: number }

function parse(text: string): Record[] {
  const records: Record[] = []
  let current: Record | undefined
  for (const line of text.split("\n")) {
    if (line.startsWith("SF:")) {
      current = { file: line.slice(3).trim(), found: 0, hit: 0 }
    } else if (line.startsWith("LF:") && current) {
      current.found = Number(line.slice(3))
    } else if (line.startsWith("LH:") && current) {
      current.hit = Number(line.slice(3))
    } else if (line.trim() === "end_of_record" && current) {
      records.push(current)
      current = undefined
    }
  }
  return records
}

function normalize(file: string): string {
  const index = file.indexOf("src/")
  return index === -1 ? file : file.slice(index)
}

function percent(hit: number, found: number): number {
  return found === 0 ? 100 : (hit / found) * 100
}

const records = parse(readFileSync(lcovPath, "utf8")).map((record) => ({
  ...record,
  file: normalize(record.file),
}))

if (records.length === 0) {
  console.error(`coverage: no records in ${lcovPath}`)
  process.exit(1)
}

const found = records.reduce((total, record) => total + record.found, 0)
const hit = records.reduce((total, record) => total + record.hit, 0)
const failed: string[] = []

console.log("coverage (lines)")
for (const record of records.sort((left, right) => left.file.localeCompare(right.file))) {
  const core = CORE_FILES.includes(record.file)
  const value = percent(record.hit, record.found)
  const need = core ? CORE : OVERALL
  const mark = value >= need * 100 ? "ok" : "below gate"
  console.log(
    `  ${record.file.padEnd(24)} ${value.toFixed(1).padStart(5)}%  need ${(need * 100).toFixed(0)}%  ${mark}`,
  )
  if (core && value < need * 100) failed.push(`${record.file} at ${value.toFixed(1)}%`)
}

const overall = percent(hit, found)
console.log(`  ${"overall".padEnd(24)} ${overall.toFixed(1).padStart(5)}%  need ${(OVERALL * 100).toFixed(0)}%`)
if (overall < OVERALL * 100) failed.push(`overall at ${overall.toFixed(1)}%`)

for (const file of CORE_FILES) {
  if (!records.some((record) => record.file === file)) failed.push(`${file} has no coverage record`)
}

if (failed.length > 0) {
  console.error(`coverage gate failed: ${failed.join(", ")}`)
  process.exit(1)
}

console.log("coverage gate passed")
