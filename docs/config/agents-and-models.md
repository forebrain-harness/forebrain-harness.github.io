# Agents And Models

This page documents the full `agents:` section of `forebrain.yaml`.

This is one of the most important parts of Forebrain Harness configuration because it
defines:

- which agents exist
- which models they use
- which agents are primary workspaces
- how memory, planning, guardrails, and advanced runtime defaults behave

## `agents`

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `agents.defaults` | object | empty object with runtime defaults applied | Shared defaults for agent behavior. |
| `agents.definitions` | object map | `main` is auto-created if missing | Named agent definitions. |

## `agents.definitions`

Each entry under `agents.definitions` is one named agent. `main` is always a
primary agent. Other user-defined entries become primary agents only when
`primary: true` is set; entries without `primary` or with `primary: false` are
subagent definitions.

If `main` is omitted, Forebrain Harness creates it automatically with:

- `max_iterations: 90`
- one empty `llm_providers` entry

Example:

```yaml
agents:
  definitions:
    main:
      llm_providers:
        - provider: openai
          model: gpt-5
    review:
      primary: true
      llm_providers:
        - provider: openai
          model: gpt-5
    verification:
      primary: false
      llm_providers:
        - provider: openai
          model: gpt-5
```

### Agent Definition Reference

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `agents.definitions.<name>.primary` | boolean | `false`, except `main` is always primary | Marks a user-defined agent as a primary workspace. Ignored for `main` and built-in subagent types. |
| `agents.definitions.<name>.max_iterations` | integer | `90` if omitted or invalid | Maximum iterations for the agent run loop. |
| `agents.definitions.<name>.llm_providers` | object[] | at least one empty entry for `main` | Provider chain used by the agent. |
| `agents.definitions.<name>.loop_guard` | object | disabled unless configured | Loop-guard behavior for the agent. |
| `agents.definitions.<name>.heartbeat` | object | inherited from `agents.defaults.heartbeat` | Per-agent heartbeat override. |

`role`, `goal`, and `backstory` are not supported configuration keys. They do
not affect Forebrain Harness's runtime prompt path.

### Primary Workspace Layout

Each primary agent owns an isolated workspace and private runtime roots. The
workspace location is fixed by Forebrain Harness and is not user-configurable:

| Path | Meaning |
| --- | --- |
| `<home>/workspace` | `main` primary workspace. |
| `<home>/workspaces/<id>` | Workspace for a non-main primary agent. |
| `<primary-workspace>/MEMORY.md` | Primary-agent private entry memory. |
| `<primary-workspace>/memory` | Primary-agent private durable memory. |
| 
| `<primary-workspace>/skills` | Primary-agent private workspace skills. |
| `<home>/memory/shared` | Shared memory visible to all primary agents. |
| `<home>/skills` | Shared skills visible to all primary agents. |

The active primary agent is selected through the Web top-nav dropdown, the Web
`/agents` page, or the Stream `/agent` picker. Forebrain Harness stores that runtime
selection in `<home>/state/primary-agent.json`.

### How To Use Named Agents

Use named agents when:

- different tasks require different models
- one agent should be review-focused while another is implementation-focused
- you want separate primary workspaces, memory, skills, active runs, and child
  subagents

Avoid creating many weakly differentiated agents. The best named agents have a
clear operating purpose.

## `llm_providers`

`llm_providers` is an ordered provider chain.

Each entry includes provider identity, model identity, and optional runtime
overrides. Runtime overrides sit at the same level as `provider` and `model`.

### Provider Entry Reference

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `provider` | string | empty | Provider name such as `openai`, `anthropic`, `deepseek`, or `openrouter`. |
| `model` | string | empty | Model identifier. |
| `api_key` | string | empty | Provider API key. |
| `base_url` | string | empty | Override base URL. |
| `api_path` | string | empty | Override API path. |
| `params` | object | empty | Provider-native request parameters merged into the request body. |

### Provider Credentials And Env Overrides

Provider credentials can be supplied by placeholder or `.env`.

Examples of supported environment names include:

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `DEEPSEEK_API_KEY`
- `GEMINI_API_KEY`
- `OPENROUTER_API_KEY`
- `GROQ_API_KEY`
- `XAI_API_KEY`
- `MISTRAL_API_KEY`
- `OLLAMA_API_KEY`

Use `base_url` when:

- pointing Forebrain Harness at an OpenAI-compatible proxy
- using a self-hosted provider endpoint
- targeting an enterprise API gateway

Use `params` when:

- the model provider supports extra request-time knobs
- you need provider-native JSON options such as `temperature` or `max_tokens`

### Anthropic provider specifics

Two things are handled for you on the `anthropic` provider and are not
configurable:

- **Sampling parameters are never sent.** Every Anthropic model from Opus 4.7
  on rejects `temperature` / `top_p` / `top_k` outright, and the models that
  still accept them reject any non-default value. Steer behavior through the
  prompt and through `reasoning.effort` instead.
- **Prompt caching is always on.** Requests carry `cache_control` breakpoints —
  one covering the tool definitions and system prompt, the rest spread over the
  tail of the transcript so a long agentic turn stays inside the API's 20-block
  lookback window. Without them Anthropic bills the full prefix on every call,
  since its caching is opt-in. Verify with the cache-read counters the provider
  returns.

## `loop_guard`

Loop guard is an agent-level safety and recovery control.

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `enabled` | boolean | disabled unless configured | Enables loop guard. |
| `after_iterations` | integer | `0` | Start guarding after this many iterations. |
| `repeat_interval` | integer | `0` | Re-check cadence after activation. |
| `history_assistant_rounds` | integer | `0` | Assistant-round window provided to loop evaluation. |
| `rewrite_llm_providers` | object[] | empty | Provider chain used for rewrite assistance. |
| `eval_llm_providers` | object[] | empty | Provider chain used for evaluation assistance. |

Use loop guard when:

- long-running agent tasks can get stuck in repetitive behavior
- you want a dedicated cheaper model chain to assess or rewrite stalled work

## `agents.defaults`

`agents.defaults` centralizes the shared runtime policy for agents.

This is where most of Forebrain Harness's advanced runtime behavior is configured.

## `memory`

Controls the per-primary-agent memory subsystem. Every feature and tool is on
by default. Each switch below is user-configurable — set any of them to `false`
to turn that individual feature off.

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `enabled` | boolean | `true` | Master switch for the memory subsystem. |
| `use_memories` | boolean | `true` | Surface memories through the read path. |
| `generate_memories` | boolean | `true` | Run the background extraction and consolidation pipeline. |
| `dedicated_tools` | boolean | `true` | Register the namespaced memory tools. |
| `disable_on_external_context` | boolean | `false` | Mark a session polluted when external context may have entered the transcript. |
| `max_raw_memories_for_consolidation` | integer | `256` | Cap on stage1 raw memories fed into consolidation. |
| `max_unused_days` | integer | `30` | Prune stage1 outputs unused for this many days. |
| `extract_model` / `extract_provider` | string | empty | Model and provider for stage1 extraction. |
| `consolidation_model` / `consolidation_provider` | string | empty | Model and provider for stage2 consolidation. |

The dedicated memory tools are `memories_list`, `memories_read`,
`memories_search`, and `memories_add_ad_hoc_note`.

## `agents.defaults.context_inject`

Controls what context sources are injected and how large they can become.

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `workspace_bootstrap_md` | boolean | `true` | Includes workspace bootstrap guidance. |
| `active_memory_pre_hook` | boolean | `true` | Injects Active Memory in pre-hook context. |
| `skills_level0_source` | boolean | `true` | Exposes level-0 skills as a context source. |
| `max_pre_hook_rules_chars` | integer | caller-specific fallback | Maximum pre-hook rules chars. |
| `max_active_memory_summary_chars` | integer | plugin-specific fallback | Active Memory summary cap. |
| `model_context_tokens` | integer | unset unless configured | Explicit model context window. |
| `warn_remaining_tokens` | integer | `8000` | Remaining-token warning threshold. |

## `agents.defaults.mcp_servers`

MCP server entries expose external tool or resource servers to Forebrain Harness.

### MCP Server Entry Reference

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `name` | string | empty | Logical server name. |
| `transport` | string | empty | Transport kind. Runtime accepts `stdio`, `streamable_http`, `sse`, and `websocket`. When omitted, Forebrain Harness infers the transport from `url` and otherwise falls back to `stdio`. |
| `url` | string | empty | Endpoint URL for network transports. Leave empty for `stdio`. |
| `headers` | object | empty | Transport headers for HTTP, SSE, or WebSocket transports. `${ENV_NAME}` placeholders are supported. |
| `oauth.mode` | string | empty, can be inferred | OAuth mode. |
| `oauth.access_token` | string | empty | Cached access token. |
| `oauth.token_type` | string | empty | Token type. |
| `oauth.client_id` | string | empty | Client ID. |
| `oauth.client_secret` | string | empty | Client secret. |
| `oauth.token_url` | string | empty | Token endpoint. |
| `oauth.authorization_url` | string | empty | Authorization endpoint. |
| `oauth.redirect_url` | string | empty | Redirect URL. |
| `oauth.refresh_token` | string | empty | Refresh token. |
| `oauth.scopes` | string[] | empty | OAuth scopes. |
| `disable_standalone_sse` | boolean | `false` | Disables standalone SSE fallback. |
| `command` | string | empty | Local command for stdio launch. |
| `args` | string[] | empty | Command args. |
| `env` | object | empty | Child-process environment overrides. `${ENV_NAME}` placeholders are supported. |
| `inherit_parent_env` | boolean | `false` | Inherits parent environment. |
| `expected_command_sha256` | string | empty | Optional pinned command hash for stdio launches. |

### MCP Runtime Notes

- MCP tools are registered as namespaced tool names like `mcp__<server-name>__<tool-name>`.
- If an MCP server exposes prompts or resources, Forebrain Harness also registers helper tools such as prompt listing and resource reading.
- Forebrain Harness automatically passes the current CLI workspace to MCP:
  - for `stdio`, the child process working directory is set to the current workspace
  - for all transports, the same workspace is sent as the MCP roots set

### CodeGraph Example

CodeGraph should usually be configured without a repository path override. Forebrain Harness automatically supplies the current workspace.

```yaml
agents:
  defaults:
    mcp_servers:
      - name: codegraph
        transport: stdio
        command: /path/to/codegraph
        args:
          - serve
          - --mcp
        inherit_parent_env: true
```

When the CodeGraph MCP server is available and Forebrain Harness is running inside a Git workspace, Forebrain Harness keeps `mcp__codegraph__codegraph_explore` visible in the default tool list so the model can use it directly.

## `agents.defaults.tool_classifier`

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `enabled` | boolean | `false` unless configured or env-forced | Enables automatic tool classification. |
| `allow` | string[] | empty | Explicit allow list. |
| `soft_deny` | string[] | empty | Soft-deny list. |
| `environment` | string[] | empty | Environment variables exposed to the classifier. |

## `agents.defaults.long_run_sync`

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `enabled` | boolean | `true` | Enables long-run sync policy. |
| `strict` | boolean | `true` | Enforces strict long-run sync policy. |
| `wall_clock_threshold` | string | `30m` | Threshold before sync handling activates. |
| `poll_interval` | string | `15s` | Poll cadence for long-run checks. |
| `confirm_timeout` | string | `30m` | Timeout for pending confirmation. |
| `require_channel_confirm` | boolean | `true` | Requires explicit channel confirmation. |
| `memory_file_base` | string | `long_run` | Base name for long-run memory notes. |
| `skip_if_batch_tools_used` | boolean | `true` | Skips sync flow if batch tools were already used. |

## `agents.defaults.guardrails`

The input, output, and retrieval rails are always on and cannot be disabled. Only their tunables are configurable.

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `input.max_runes` | integer | `200000` | Input size limit. |
| `input.block_substrings` | string[] | empty | Hard-block substrings. |
| `input.policy_enforcer.timeout_seconds` | integer | `45` | Enforcement timeout. |
| `retrieval.max_chunk_runes` | integer | `120000` | Retrieval chunk cap. |

## `agents.defaults.heartbeat`

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `every` | string | `30m` | Heartbeat cadence. |
| `prompt` | string | built-in heartbeat prompt | Heartbeat prompt text. |
| `include_system_prompt_section` | boolean | `true` | Includes heartbeat guidance in system prompt. |
| `ack_max_chars` | integer | `300` | Maximum heartbeat acknowledgement length. |
| `light_context` | boolean | `false` | Uses lighter context for heartbeat runs. |
| `isolated_session` | boolean | `false` | Runs heartbeat in an isolated session. |
| `target` | string | empty | Target agent ID. |
| `session` | string | empty | Target session ID. |
| `active_hours.start` | string | empty | Heartbeat active-hours start time. |
| `active_hours.end` | string | empty | Heartbeat active-hours end time. |
| `active_hours.timezone` | string | empty | Active-hours timezone. |

## `agents.defaults.token_estimate`

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `encoding` | string | empty; runtime falls back to active model or `cl100k_base` | Explicit tokenizer encoding. |
| `model` | string | empty | Model used for token-estimation heuristics. |

## `agents.defaults.web_search`

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `provider` | string | empty, behaves like `auto` | Search provider selection. |
| `tavily.api_key` | string | empty | Tavily API key. |
| `tavily.search_depth` | string | `basic` unless explicitly `advanced` | Tavily search depth. |
| `brave.api_key` | string | empty | Brave Search API key. |
| `baidu.api_key` | string | empty | Baidu web search API key. |

Accepted provider values:

- `auto`
- `tavily`
- `brave`
- `baidu`

## `agents.defaults.sourcegraph`

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `enabled` | boolean | effective `true` when omitted | Enables Sourcegraph-backed features. |
| `graphql_endpoint` | string | empty | GraphQL endpoint. |
| `token` | string | empty | Sourcegraph token. |

## Related

- [Memory, Compaction, And Runtime Features](/config/memory-and-runtime-features)
- [Sandbox And Permissions](/config/sandbox-and-permissions)
- [Subagents](/guide/subagents)
