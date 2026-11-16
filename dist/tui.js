// src/tui.tsx
import { Plugin } from "@opencode/plugin/tui";
import { createSignal, Show } from "solid-js";
import { appendFileSync } from "node:fs";

// src/words.ts
import { Database } from "bun:sqlite";
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join } from "node:path";
var MAX_MESSAGES = 4e3;
var MIN_WORD = 3;
var MAX_WORD = 40;
var DB_FILE = "opencode.db";
function dataDir() {
  const xdg = process.env.XDG_DATA_HOME?.trim();
  const base = xdg ? xdg : join(homedir(), ".local", "share");
  return join(base, "opencode");
}
function existingDbIn(dir) {
  const preferred = join(dir, DB_FILE);
  if (existsSync(preferred)) return preferred;
  try {
    const candidates = readdirSync(dir).filter((name) => /^opencode-.*\.db$/.test(name)).sort();
    const last = candidates[candidates.length - 1];
    if (last) return join(dir, last);
  } catch {
    return void 0;
  }
  return void 0;
}
function databasePath() {
  const override = process.env.OPENCODE_DB?.trim();
  if (override) {
    if (override === ":memory:") return override;
    return isAbsolute(override) ? override : join(dataDir(), override);
  }
  return existingDbIn(dataDir()) ?? join(dataDir(), DB_FILE);
}
function tokenize(text) {
  const out = [];
  for (const match of text.matchAll(/[\p{L}\p{N}_]+/gu)) {
    const token = match[0];
    if (token.length >= MIN_WORD && token.length <= MAX_WORD) out.push(token);
  }
  return out;
}
function rows(db) {
  const tables = new Set(
    db.query("SELECT name FROM sqlite_master WHERE type = 'table'").all().map(
      (row) => row.name
    )
  );
  if (tables.has("session_message")) {
    return db.query(
      `SELECT type, data, time_created AS time
         FROM session_message
         WHERE type IN ('user', 'assistant')
         ORDER BY time_created DESC
         LIMIT ${MAX_MESSAGES}`
    ).all();
  }
  return db.query(
    `SELECT json_extract(m.data, '$.role') AS type,
              json_object('text', json_extract(p.data, '$.text')) AS data,
              m.time_created AS time
       FROM message m
       JOIN part p ON p.message_id = m.id
       WHERE json_extract(p.data, '$.type') = 'text'
       ORDER BY m.time_created DESC
       LIMIT ${MAX_MESSAGES}`
  ).all();
}
function textOf(row) {
  let parsed;
  try {
    parsed = JSON.parse(row.data);
  } catch {
    return "";
  }
  const data = parsed;
  if (row.type === "user") return typeof data.text === "string" ? data.text : "";
  if (!Array.isArray(data.content)) return "";
  return data.content.filter((block) => block.type === "text" && typeof block.text === "string").map((block) => block.text).join(" ");
}
function loadWords() {
  let db;
  try {
    db = new Database(databasePath(), { readonly: true });
  } catch {
    return [];
  }
  try {
    const byLower = /* @__PURE__ */ new Map();
    for (const row of rows(db)) {
      for (const token of tokenize(textOf(row))) {
        const lower = token.toLowerCase();
        const known = byLower.get(lower);
        if (known) {
          known.count++;
          if (row.time > known.seen) known.seen = row.time;
        } else {
          byLower.set(lower, { text: token, lower, count: 1, seen: row.time });
        }
      }
    }
    return [...byLower.values()];
  } catch {
    return [];
  } finally {
    db.close();
  }
}
function matchPrefix(prefix, words, limit = 100) {
  const lower = prefix.toLowerCase();
  if (lower.length < RESOLVE_MIN) return [];
  return words.filter((word) => word.lower !== lower && word.lower.startsWith(lower)).sort((left, right) => right.seen - left.seen || right.count - left.count).slice(0, limit);
}
var RESOLVE_MIN = 2;
function trailingPrefix(text) {
  const match = text.match(/[\p{L}\p{N}_]+$/u);
  return match ? match[0] : "";
}

// src/tui.tsx
import { jsx } from "@opentui/solid/jsx-runtime";
var POLL_MS = 50;
var LOG = "/tmp/opencode-wordcomplete-diag.log";
var registryKey = "__opencodeWordcompleteRegistry";
var registry = globalThis[registryKey] ??= {};
var normalizeKey = (value, fallback) => typeof value === "string" && value.trim() ? value.trim() : fallback;
var tui_default = Plugin.define({
  id: "wordcomplete",
  setup(context) {
    const options = context.options ?? {};
    if (options.enabled === false) return;
    const acceptKey = normalizeKey(options.acceptKey, "tab");
    const nextKey = normalizeKey(options.nextKey, "ctrl+n");
    const prevKey = normalizeKey(options.prevKey, "ctrl+p");
    const minPrefix = typeof options.minPrefix === "number" ? options.minPrefix : 2;
    const maxCandidates = typeof options.maxCandidates === "number" ? options.maxCandidates : 50;
    const debug = options.debug === true;
    const log = (message) => {
      if (!debug) return;
      try {
        appendFileSync(LOG, `${(/* @__PURE__ */ new Date()).toISOString()} ${message}
`);
      } catch {
      }
    };
    let words = loadWords();
    let lastText = "";
    let prefix = "";
    let candidates = [];
    let index = 0;
    let dismissed = "";
    const [label, setLabel] = createSignal("");
    const editor = () => context.renderer.currentFocusedEditor;
    const render = () => {
      if (dismissed === lastText) {
        setLabel("");
        return;
      }
      const word = candidates[index];
      if (!word) {
        setLabel("");
        return;
      }
      const counter = candidates.length > 1 ? `  ${index + 1}/${candidates.length}` : "";
      setLabel(`${acceptKey}  ${word.text}${counter}`);
    };
    const refresh = (text) => {
      lastText = text;
      prefix = trailingPrefix(text);
      candidates = prefix.length >= minPrefix ? matchPrefix(prefix, words, maxCandidates) : [];
      index = 0;
      render();
    };
    const poll = () => {
      const text = editor()?.plainText;
      if (typeof text !== "string" || text === lastText) return;
      refresh(text);
      log(`input=${JSON.stringify(text.slice(-40))} prefix=${prefix} candidates=${candidates.length}`);
    };
    const accept = () => {
      const word = candidates[index];
      const target = editor();
      if (!word || !target?.setText) return false;
      const next = lastText.slice(0, lastText.length - prefix.length) + word.text;
      target.setText(next);
      target.gotoBufferEnd?.();
      lastText = next;
      dismissed = next;
      prefix = "";
      candidates = [];
      index = 0;
      setLabel("");
      log(`accept=${word.text}`);
      return;
    };
    const step = (delta) => {
      if (candidates.length === 0) return false;
      dismissed = "";
      index = (index + delta + candidates.length) % candidates.length;
      render();
      log(`step=${delta} index=${index + 1}/${candidates.length}`);
      return;
    };
    const dismiss = () => {
      if (!label()) return false;
      dismissed = lastText;
      setLabel("");
      return;
    };
    const unregister = context.ui.slot({
      prepend: "prompt.footer",
      render: () => /* @__PURE__ */ jsx(Show, { when: label(), children: /* @__PURE__ */ jsx("text", { fg: context.theme.text.muted, children: label() }) })
    });
    context.keymap.layer(() => ({
      mode: "global",
      priority: 20,
      commands: [
        {
          id: "wordcomplete.next",
          title: "Complete word: next",
          group: "Word completion",
          bind: nextKey,
          run: () => step(1)
        },
        {
          id: "wordcomplete.prev",
          title: "Complete word: previous",
          group: "Word completion",
          bind: prevKey,
          run: () => step(-1)
        },
        {
          id: "wordcomplete.accept",
          title: "Complete word: accept",
          group: "Word completion",
          bind: acceptKey,
          run: () => accept()
        },
        {
          id: "wordcomplete.dismiss",
          title: "Complete word: dismiss",
          group: "Word completion",
          bind: "escape",
          run: () => dismiss()
        },
        {
          id: "wordcomplete.reload",
          title: "Word completion: reload chat vocabulary",
          group: "Word completion",
          palette: true,
          run: () => {
            words = loadWords();
            refresh(editor()?.plainText ?? "");
            context.ui.toast.show({ message: `Vocabulary reloaded: ${words.length} words` });
          }
        }
      ],
      bindings: ["wordcomplete.next", "wordcomplete.prev", "wordcomplete.accept", "wordcomplete.dismiss"]
    }));
    const timer = setInterval(poll, POLL_MS);
    log(`setup words=${words.length} accept=${acceptKey} next=${nextKey} prev=${prevKey}`);
    const dispose = () => {
      clearInterval(timer);
      unregister();
      log("dispose");
    };
    registry.dispose?.();
    registry.dispose = dispose;
    return dispose;
  }
});
export {
  tui_default as default
};
