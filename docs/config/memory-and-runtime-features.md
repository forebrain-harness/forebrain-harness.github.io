# Memory, Compaction, And Runtime Features

This page documents the configuration that shapes Forebrain Harness's memory-facing and
session-behavior features without explaining the underlying behavior in depth.

Use this page for:

- Active Memory configuration
- Core Memory and dreaming flags
- automatic compaction

## `compact`

`compact` controls structured transcript compaction behavior.

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `compact.prompt` | string | built-in handoff prompt | Overrides the prompt used only for local summary compaction. |
| `compact.model_auto_compact_token_limit` | integer | model limit, capped at 90% of the context window | Sets an earlier automatic-compaction threshold. Values above the model default do not raise it. |
| `compact.model_auto_compact_token_limit_scope` | `total` or `body_after_prefix` | `total` | Counts either the full active context or only growth after the current compact-window prefix. |
| `compact.remote_compaction_v2` | boolean | `true` | For OpenAI Responses, uses a normal `/responses` request containing a compaction trigger. `false` selects `/responses/compact`. |

Automatic compaction is part of the runtime and has no enable/disable setting.
It runs before a turn and again between model samples when the threshold is
reached. The model's full context window remains a hard limit under both token
scopes. `/compact` invokes the same replacement-history pipeline manually.

## `memory`

The top-level `memory` block covers Active Memory and Core Memory.

It is separate from `agents.defaults.memory_*`, which controls memory-related
runtime policy such as search and governance.

### `memory.active`

`memory.active` configures Active Memory as a product feature.

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `memory.active.enabled` | boolean | effective `true` when omitted | Entry-level switch for Active Memory. |
| `memory.active.config.enabled` | boolean | effective `true` when omitted | Nested runtime switch for Active Memory behavior. |
| `memory.active.config.agents` | string[] | effective `["main"]` | Agent IDs allowed to use Active Memory. |
| `memory.active.config.model` | string | empty | Preferred model for Active Memory runs. |
| `memory.active.config.model_fallback` | string | empty | Fallback model for Active Memory runs. |
| `memory.active.config.allowed_chat_types` | string[] | effective `["direct"]` | Allowed chat types for Active Memory use. |
| `memory.active.config.thinking` | string | empty | Reserved label field; parsed but not currently consumed by runtime decision logic. |
| `memory.active.config.query_mode` | string | `recent` | Controls how much recent conversation is included in the recall query. |
| `memory.active.config.prompt_style` | string | inferred from `query_mode`; usually `balanced` | Shapes the recall prompt style. |
| `memory.active.config.prompt_override` | string | empty | Full prompt override. |
| `memory.active.config.prompt_append` | string | empty | Suffix appended to the generated prompt. |
| `memory.active.config.timeout_ms` | integer | `15000` | Active Memory timeout in milliseconds. |
| `memory.active.config.max_summary_chars` | integer | `220` | Maximum summary size returned by Active Memory. |
| `memory.active.config.recent_user_turns` | integer | `2` | Recent user-turn window. |
| `memory.active.config.recent_assistant_turns` | integer | `1` | Recent assistant-turn window. |
| `memory.active.config.recent_user_chars` | integer | `220` | Recent user-character budget. |
| `memory.active.config.recent_assistant_chars` | integer | `180` | Recent assistant-character budget. |
| `memory.active.config.logging` | boolean | `false` | Enables Active Memory status logging. |
| `memory.active.config.cache_ttl_ms` | integer | `15000` | Cache TTL for Active Memory results. |
| `memory.active.config.persist_transcripts` | boolean | `false` | Persists transcripts used by Active Memory processing. |
| `memory.active.config.transcript_dir` | string | `active-memory` | Directory name for persisted Active Memory transcripts. |

#### How To Use Active Memory Settings

Use `agents` when:

- only some named agents should be allowed to perform recall

Use `model` and `model_fallback` when:

- you want Active Memory to use a different model from the main response model
- you want a cheaper or more stable fallback path

Use `query_mode` when:

- you want tighter or broader recall context

Accepted `query_mode` values:

- `recent`
- `message`
- `full`

Use `prompt_style` when:

- recall needs to be stricter, more contextual, or more preference-oriented

Accepted prompt styles:

- `balanced`
- `strict`
- `contextual`
- `recall-heavy`
- `precision-heavy`
- `preference-only`

Use `prompt_override` only when:

- you need full control over recall prompting
- you are willing to own the resulting behavior

Use the recent-turn and recent-char windows when:

- Active Memory is pulling too little or too much short-term context into recall

Use `persist_transcripts` when:

- you need reproducibility or inspection for Active Memory behavior

### `memory.core`

`memory.core` is the top-level Core Memory block.

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `memory.core.enabled` | boolean | effective `true` when the entry exists and the flag is omitted | Enables the Core Memory entry. |

### `memory.core.config.dreaming`

Dreaming flags are documented here as configuration because they are part of
the public config surface.

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `memory.core.config.dreaming.enabled` | boolean | effective `false` | Enables dreaming status for Core Memory. |
| `memory.core.config.dreaming.frequency` | string | effective `manual` | Labels the intended dreaming cadence. |

Important note:

- the dreaming flags mirror documented memory-core state
- consolidation work is surfaced through memory tooling and governance flows
- if `frequency` is omitted, the status surface reports `manual`

## Related

- [Agents And Models](/config/agents-and-models)
- [Hooks And Skill Extensions](/config/hooks-and-skill-extensions)
- [Memory Systems](/guide/memory-systems)
