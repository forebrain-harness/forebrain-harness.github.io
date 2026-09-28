# Context and Compaction

Forebrain Harness uses replacement-history compaction. It replaces the model's
active history with one provider-produced compacted history
or one local handoff summary, while keeping the transcript append-only for audit
and resume.

## When Compaction Runs

Automatic compaction is always active. It is checked:

- before recording the incoming user message for a new turn
- between model samples during a turn
- after a provider reports that the context window was exceeded

The default threshold is the model's automatic-compaction limit, capped at 90%
of its full context window. A positive
`compact.model_auto_compact_token_limit` can lower that threshold but cannot
raise it. The full model context window is always a hard cap.

`compact.model_auto_compact_token_limit_scope` controls threshold accounting:

- `total` counts the complete active context
- `body_after_prefix` counts growth after the input-token baseline of the
  current compact window

The incoming message is not included in the pre-turn compaction request. It is
appended exactly once to the replacement history afterward.

## Manual `/compact`

`/compact` immediately runs the same compaction pipeline with reason
`user_requested`. It runs `PreCompact` before the request and `PostCompact`
after a successful checkpoint. Automatic compaction uses the same hooks with an
automatic trigger.

In the terminal UI, an indeterminate animated bar is shown for the complete
compact request lifetime. The running card is replaced by the completed or
failed compact result, so provider failures cannot leave stale progress behind.

## Provider And Local Semantics

For OpenAI Responses, remote v2 is the default. Forebrain Harness sends the current history
to the normal `/responses` endpoint with an input item of type
`compaction_trigger`. The response must contain exactly one compaction item; its
opaque encrypted content is stored and replayed without interpretation. Recent
eligible user history is retained within the provider-compatible 64,000-token
budget.

When `compact.remote_compaction_v2` is `false`, Forebrain Harness uses
`/responses/compact`. The provider response becomes the replacement history
after stale developer, system, tool, and non-conversation items are removed.

Providers without remote compaction use the current main model and the built-in 
handoff prompt. On context-window errors, Forebrain Harness retries after removing
the oldest history item. The replacement contains up to 20,000 tokens of the
newest real user messages, followed by a user-role handoff summary with the 
summary prefix. The oldest partially retained user message keeps its
beginning and end with a truncation marker.

## Checkpoints And Resume

Every successful compaction appends a durable checkpoint containing the complete
replacement history. Checkpoints form a UUID-v7 window chain with the current,
previous, and first window IDs and a monotonically increasing window number.

On resume, Forebrain Harness reconstructs model context from the latest checkpoint plus
the transcript suffix written after it. Older transcript rows remain available
for audit but are no longer model-active. A mid-turn compaction reinjects the
current initial instructions immediately before the newest real user or compact
item; pre-turn and manual compaction wait for the next normal turn to inject
fresh instructions.

## The `/context` Command

`/context` shows a compact, human-readable report of the current session's
context health. It answers: *how full is the context, what is it made of, and
what compaction has happened recently?*

The report reflects the latest assembled context snapshot — a point-in-time
view regenerated on each run, not a live stream.

### Example Output

```text
Context Snapshot

Status
- Pressure: warn
- Remaining: 64,000 / 128,000 tokens (50%)

Usage
- Context used: 42,000 tokens
- Projected: 48,000 tokens
- Transcript: 36,000 tokens
- Last run: prompt=8,200 completion=1,100

Composition
- Items: 24
- Working set: 6
- Included sources: 18
- Evicted sources: 3
- Tool spills: 2

Compaction
- Events: 4
- Latest: remote_v2 (trigger=auto, reason=context pressure)

Session
- ID: session-123
- Mode: agent
- Generated: 2026-08-07T18:00:00Z
- Run: run-456
```

### Status — Context Pressure

| Field | Meaning |
| --- | --- |
| `Pressure` | Pressure level: `ok` (normal), `warn` (approaching the threshold), or `critical`. Shows `unknown` when no data is available. |
| `Remaining` | Available tokens left / model context window, plus the remaining percentage. |

This is the first line to read. The lower the percentage, the closer the
session is to automatic compaction.

### Usage — Token Consumption

| Field | Meaning |
| --- | --- |
| `Context used` | Estimated tokens currently in context (prefers budget `used_tokens`, falls back to `effective_input_tokens`). |
| `Projected` | Estimated full input for the next request: conversation history (the larger of the local transcript estimate and the last model-reported prompt usage) plus injected context items plus the current query. |
| `Transcript` | Local token estimate of the session conversation history only. |
| `Last run` | Actual token consumption from the last run: prompt (input) and completion (output). |

The gap between `Projected` and `Transcript` is the context injected beyond the
raw conversation: the working set, recent file activity, the git snapshot, and
the current query (see [What Is Injected Beyond The
Conversation](#what-is-injected-beyond-the-conversation)). It does not by
itself measure compression.

Compaction shows up elsewhere: after a compaction, the model-reported
`Last run: prompt` usage drops (the history was replaced by a summary), and
`Remaining` in the Status section rises. The Compaction section records how
many compactions happened and the strategy of the latest one.

### Composition — What Makes Up The Context

| Field | Meaning |
| --- | --- |
| `Items` | Total number of context items currently included. |
| `Working set` | Number of working-set files or paths included in context. |
| `Included sources` | Number of provenance sources included. |
| `Evicted sources` | Number of sources trimmed because of budget or other reasons. |
| `Tool spills` | Number of oversized tool results that were spilled to disk instead of kept inline (recoverable with `retrieve_output`). |

Only counts are shown — not paths or content — to keep the terminal readable.
Full details remain available in the internal snapshot and the gateway context
API.

### What Is Injected Beyond The Conversation

Each interactive turn, the context engine injects a small set of items on top
of the raw conversation history. The injection budget is deliberately small:
1,800 tokens and up to 18 items in `agent` mode, 2,200 tokens and up to 14
items in `plan` mode. Items are sorted pinned-first, then by priority
descending, then by estimated tokens ascending; anything beyond the budget or
item limit is evicted.

| Source | Priority | What it injects | When it is included |
| --- | --- | --- | --- |
| Working Set | 92 (highest) | Up to 16 file paths referenced with `@path` in your query, plus session-pinned working-set files. Emitted as a single item. | Only when `@refs` or pins exist. Pinned items bypass the token budget. |
| Recent Files | 88 | Up to 12 recently read or written file paths (`kind: path`), emitted as a single item. | Only when recent read state exists. |
| Git Snapshot | 62 (lowest) | Summarized `git status --porcelain` and `git diff --stat HEAD`: dirty file count, up to 3 hot paths, up to 3 largest diffs, and diff totals. | Agent mode only (skipped in `plan` mode); skipped when the working tree is clean. |

These are the only sources the context engine registers for assembly. Rules
and per-turn diff sources have priority entries in the planner but are not
registered, so they are not injected on this path.

The `Projected` figure therefore includes the conversation history (the larger
of the local transcript estimate and the last model-reported prompt usage),
the injected items above, and the current query. The `Composition` section's
`Items`, `Working set`, `Included sources`, and `Evicted sources` counts map
to how many items, working-set paths, provenance entries, and evictions the
last assembly produced.

### Compaction — History

| Field | Meaning |
| --- | --- |
| `Events` | Number of compaction events for this session. |
| `Latest` | Strategy, trigger, and reason of the most recent compaction. |

Common strategies are `remote_v2` (provider summary) and `local` (local handoff
summary). Common triggers are `auto` (threshold reached) and `manual`
(`/compact`). With no records, the report shows `Events: 0` and `Latest: none`.

### Session — Attribution

| Field | Meaning |
| --- | --- |
| `ID` | Session identifier. |
| `Mode` | Active mode, such as `agent` or `plan`. |
| `Generated` | Snapshot generation time (UTC). |
| `Run` | Run identifier for the latest run. |

### Related Subcommands

| Command | Purpose |
| --- | --- |
| `/context` | Show the context health report described above. |
| `/context compression` | Show cumulative savings from shell and MCP output compression: record counts, saved bytes and tokens, and how often each compression capability was retrieved. Data comes from the persistent outfilter history database and accumulates across sessions. |
| `/context reset-snapshot` | Clear the session's cached context snapshot so it is regenerated on the next run. This does not clear conversation history, compaction history, or compression statistics. |

### Data Sources And Boundaries

- `/context` reads the in-memory context snapshot assembled by the runtime on
  each run. `Projected` and `Transcript` are estimates, not exact counts:
  `Projected` estimates the next request's full input (conversation + injected
  context + current query), while `Transcript` estimates only the raw
  conversation history.
- Paths, content, the full timeline, and token-attribution internals are not
  shown in the terminal report; they remain in the internal snapshot and are
  available through the gateway context API.
- `/context compression` is a separate data channel backed by the on-disk
  outfilter history database, independent of the snapshot.

## Related

- [Architecture](/guide/architecture)
- [Memory Systems](/guide/memory-systems)
- [Configuration](/config/memory-and-runtime-features)
