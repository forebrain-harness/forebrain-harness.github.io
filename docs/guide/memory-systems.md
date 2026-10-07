# Remember Across Sessions

Context you give once comes back on its own: Forebrain Harness keeps memory
per project and globally, distills it from past sessions, and retrieves it
across English, Chinese, Japanese, and Korean.

## What The Agent Remembers

Two scopes, one behavior:

- **Per-project memory** — how this codebase builds, tests, deploys, and what
  your team corrected along the way. It belongs to the project you opened.
- **Global memory** — preferences and facts that travel with you across
  projects.

Memory is not a raw transcript replay. A background pipeline distills
completed sessions into durable notes, and what comes back next session is
the distilled result.

If you run several primary agents, each one's memory is fully isolated —
switching agents switches memories.

## Steer It In A Session

- **Say "remember this".** An explicit "remember this" (or "forget that")
  always writes a note — captured in the same reply, shown to you before it
  is saved, and in force from the next session. Corrections and standing
  rules stated in passing are captured the same way, with a one-line note
  saying what was stored.
- **`/memories`** configures memory use and generation in the session.
- **The agent reads memory too.** The model can list, read, and search
  memory explicitly with its memory tools, and a compact summary of what you
  have is injected into every session so prior knowledge is recalled before
  it continues.

Everything memory-related is on by default and individually configurable —
`memories.generate_memories` turns off automatic capture and leaves only
explicit tool use. See
[Memory, Compaction, And Runtime Features](/config/memory-and-runtime-features)
for the settings.

## Why Retrieval Works Across Languages

You can write a memory in Chinese and recall it in an English session.
Search is powered by SQLite full-text indexes with tokenization dictionaries
for Chinese and Japanese, so matches cross language boundaries instead of
requiring the same script.

## How It Fits With Long Sessions

Memory is the durable layer; the current conversation is kept readable by
compaction, which summarizes the transcript before it hits the context
limit. `/compact` triggers it manually. Read
[Context and Compaction](/guide/context-and-compaction) for that half, and
[Memory Internals](/guide/memory-internals) for the full mechanism — the
pipeline stages, the read path, and the note lifecycle.

## Where Next

- [Memory Internals](/guide/memory-internals) — how capture, consolidation,
  and retrieval actually work.
- [Context and Compaction](/guide/context-and-compaction) — long sessions.
- [Memory, Compaction, And Runtime Features](/config/memory-and-runtime-features) —
  every memory setting.
