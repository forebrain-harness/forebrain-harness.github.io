# Memory, Compaction, And Runtime Features

This page documents the configuration that shapes Forebrain Harness's memory-facing and
session-behavior features without explaining the underlying behavior in depth.

Use this page for:

- memory generation, retrieval, and background-pipeline tuning
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

## `memories`

The top-level `memories` block configures memory generation, retrieval, and
the pacing of the background pipeline that distills sessions into durable
notes. Memory features are on by default; each switch below turns one
concern off without touching the others.

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `memories.generate_memories` | boolean | `true` | Generates memories from eligible completed turns. `false` leaves only explicit memory-tool use. |
| `memories.use_memories` | boolean | `true` | Injects distilled memory into sessions through the read path. |
| `memories.dedicated_tools` | boolean | `true` | Registers the dedicated memory tools (`memories_list`, `memories_read`, `memories_search`, `memories_add_ad_hoc_note`). |
| `memories.disable_on_external_context` | boolean | `false` | Skips memory generation for sessions whose transcript may contain externally injected context. |
| `memories.search_top_k` | integer | `5`, clamped to 1–20 | Memories returned by one `memories_search` call. This is a budget on the model's context, not a page size — there is no second page; values above the ceiling are clamped, not refused. |
| `memories.extract_model` | string | empty | Model override for the extraction stage. Empty means no override. |
| `memories.consolidation_model` | string | empty | Model override for the consolidation stage. Empty means no override. |
| `memories.max_raw_memories_for_consolidation` | integer | `256`, clamped to 1–4096 | Raw memories consumed per consolidation batch. |
| `memories.max_unused_days` | integer | `30`, clamped to 0–365 | Days an unused raw memory is kept before pruning. |
| `memories.max_rollout_age_days` | integer | `10`, clamped to 0–90 | Maximum age of a rollout the startup pass will claim. |
| `memories.min_rollout_idle_hours` | integer | `6`, clamped to 1–48 | A rollout must be idle this long before the startup pass claims it. |
| `memories.max_rollouts_per_startup` | integer | `2`, clamped to 1–128 | Rollouts claimed per startup pass — the pacing knob for background generation. |
| `memories.min_rate_limit_remaining_percent` | integer | `25`, clamped to 0–100 | Skips a generation pass when the provider rate-limit balance is below this percentage. |

#### How To Use Memory Settings

Use `generate_memories: false` when:

- you want memories written only when a tool call explicitly asks for it

Use `extract_model` and `consolidation_model` when:

- you want background memory work to run on a different model from the main
  response model — for example a cheaper or more stable one

Use the rollout knobs (`max_rollout_age_days`, `min_rollout_idle_hours`,
`max_rollouts_per_startup`) when:

- you want to slow down or speed up how much background generation happens
  after each startup

Use `min_rate_limit_remaining_percent` when:

- memory generation should yield to your main usage as the provider rate
  limit runs down

Use `search_top_k` when:

- recall is pulling too much context into each turn, or too little

## Related

- [Agents And Models](/config/agents-and-models)
- [Hooks And Skill Extensions](/config/hooks-and-skill-extensions)
- [Memory Systems](/guide/memory-systems)
