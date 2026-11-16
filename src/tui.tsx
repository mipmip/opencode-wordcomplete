import { Plugin } from "@opencode/plugin/tui"
import { createSignal, Show } from "solid-js"
import { appendFileSync } from "node:fs"
import { loadWords, matchPrefix, trailingPrefix, type Word } from "./words"

const POLL_MS = 50
const LOG = "/tmp/opencode-wordcomplete-diag.log"

type Editor = {
  plainText?: string
  setText?(text: string): void
  gotoBufferEnd?(): void
}

type Options = {
  enabled?: boolean
  acceptKey?: string
  nextKey?: string
  prevKey?: string
  minPrefix?: number
  maxCandidates?: number
  debug?: boolean
}

type Registry = { dispose?: () => void }
const registryKey = "__opencodeWordcompleteRegistry"
const registry = ((globalThis as unknown as Record<string, Registry>)[registryKey] ??= {})

const normalizeKey = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim() ? value.trim() : fallback

export default Plugin.define({
  id: "wordcomplete",
  setup(context) {
    const options = (context.options ?? {}) as Options
    if (options.enabled === false) return

    const acceptKey = normalizeKey(options.acceptKey, "tab")
    const nextKey = normalizeKey(options.nextKey, "ctrl+n")
    const prevKey = normalizeKey(options.prevKey, "ctrl+p")
    const minPrefix = typeof options.minPrefix === "number" ? options.minPrefix : 2
    const maxCandidates = typeof options.maxCandidates === "number" ? options.maxCandidates : 50
    const debug = options.debug === true

    const log = (message: string) => {
      if (!debug) return
      try {
        appendFileSync(LOG, `${new Date().toISOString()} ${message}\n`)
      } catch {}
    }

    let words: Word[] = loadWords()
    let lastText = ""
    let prefix = ""
    let candidates: Word[] = []
    let index = 0
    let dismissed = ""

    const [label, setLabel] = createSignal("")

    const editor = () =>
      (context.renderer as unknown as { currentFocusedEditor?: Editor }).currentFocusedEditor

    const render = () => {
      if (dismissed === lastText) {
        setLabel("")
        return
      }
      const word = candidates[index]
      if (!word) {
        setLabel("")
        return
      }
      const counter = candidates.length > 1 ? `  ${index + 1}/${candidates.length}` : ""
      setLabel(`${acceptKey}  ${word.text}${counter}`)
    }

    const refresh = (text: string) => {
      lastText = text
      prefix = trailingPrefix(text)
      candidates = prefix.length >= minPrefix ? matchPrefix(prefix, words, maxCandidates) : []
      index = 0
      render()
    }

    const poll = () => {
      const text = editor()?.plainText
      if (typeof text !== "string" || text === lastText) return
      refresh(text)
      log(`input=${JSON.stringify(text.slice(-40))} prefix=${prefix} candidates=${candidates.length}`)
    }

    const accept = () => {
      const word = candidates[index]
      const target = editor()
      if (!word || !target?.setText) return false
      const next = lastText.slice(0, lastText.length - prefix.length) + word.text
      target.setText(next)
      target.gotoBufferEnd?.()
      lastText = next
      dismissed = next
      prefix = ""
      candidates = []
      index = 0
      setLabel("")
      log(`accept=${word.text}`)
      return
    }

    const step = (delta: number) => {
      if (candidates.length === 0) return false
      dismissed = ""
      index = (index + delta + candidates.length) % candidates.length
      render()
      log(`step=${delta} index=${index + 1}/${candidates.length}`)
      return
    }

    const dismiss = () => {
      if (!label()) return false
      dismissed = lastText
      setLabel("")
      return
    }

    const unregister = context.ui.slot({
      prepend: "prompt.footer",
      render: () => (
        <Show when={label()}>
          <text fg={context.theme.text.muted}>{label()}</text>
        </Show>
      ),
    })

    context.keymap.layer(() => ({
      mode: "global",
      priority: 20,
      commands: [
        {
          id: "wordcomplete.next",
          title: "Complete word: next",
          group: "Word completion",
          bind: nextKey,
          run: () => step(1),
        },
        {
          id: "wordcomplete.prev",
          title: "Complete word: previous",
          group: "Word completion",
          bind: prevKey,
          run: () => step(-1),
        },
        {
          id: "wordcomplete.accept",
          title: "Complete word: accept",
          group: "Word completion",
          bind: acceptKey,
          run: () => accept(),
        },
        {
          id: "wordcomplete.dismiss",
          title: "Complete word: dismiss",
          group: "Word completion",
          bind: "escape",
          run: () => dismiss(),
        },
        {
          id: "wordcomplete.reload",
          title: "Word completion: reload chat vocabulary",
          group: "Word completion",
          palette: true,
          run: () => {
            words = loadWords()
            refresh(editor()?.plainText ?? "")
            context.ui.toast.show({ message: `Vocabulary reloaded: ${words.length} words` })
          },
        },
      ],
      bindings: ["wordcomplete.next", "wordcomplete.prev", "wordcomplete.accept", "wordcomplete.dismiss"],
    }))

    const timer = setInterval(poll, POLL_MS)
    log(`setup words=${words.length} accept=${acceptKey} next=${nextKey} prev=${prevKey}`)

    const dispose = () => {
      clearInterval(timer)
      unregister()
      log("dispose")
    }

    registry.dispose?.()
    registry.dispose = dispose

    return dispose
  },
})
