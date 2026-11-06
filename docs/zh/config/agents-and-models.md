# Agent 与模型

本页记录 `forebrain.yaml` 的完整 `agents:` 段。

这是 Forebrain Harness 配置里最重要的部分之一，因为它定义：

- 存在哪些 agent
- 它们用什么模型
- 哪些 agent 是主工作区
- memory、planning、guardrails 和高级运行时默认值如何表现

## `agents`

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `agents.defaults` | object | 空对象，叠加运行时默认值 | Agent 行为的共享默认值。 |
| `agents.definitions` | object map | `main` 缺失时自动创建 | 命名 agent 定义。 |

## `agents.definitions`

`agents.definitions` 下的每个条目是一个命名 agent。`main` 永远是主代理。
其他用户定义的条目只有设了 `primary: true` 才成为主代理；没有 `primary`
或 `primary: false` 的条目是 subagent 定义。

如果省略 `main`，Forebrain Harness 会自动创建它，带：

- `max_iterations: 90`
- 一个空的 `llm_providers` 条目

示例：

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

### Agent 定义参考

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `agents.definitions.<name>.primary` | boolean | `false`，但 `main` 永远是 primary | 把一个用户定义的 agent 标记为主工作区。对 `main` 和内置 subagent 类型无效。 |
| `agents.definitions.<name>.max_iterations` | integer | 省略或非法时为 `90` | Agent run 循环的最大迭代次数。 |
| `agents.definitions.<name>.llm_providers` | object[] | `main` 至少一个空条目 | Agent 可用的模型服务列表（无顺序语义，行序只是存储顺序，任何操作都不会改变它）。 |
| `agents.definitions.<name>.default_model` | string | 空 = 第一项 | 默认模型，格式 `provider/model`（model id 自身可含 `/`，按第一个 `/` 拆分）。必须指向本 agent 列表中的某一项；悬空的值在加载与保存时都会被拒绝。 |
| `agents.definitions.<name>.loop_guard` | object | 未配置即禁用 | Agent 的 loop-guard 行为。 |
| `agents.definitions.<name>.heartbeat` | object | 继承 `agents.defaults.heartbeat` | 按 agent 覆盖 heartbeat。 |

`role`、`goal` 和 `backstory` 不是受支持的配置键。它们不影响 Forebrain
Harness 的运行时 prompt 路径。

### 主工作区布局

每个主代理拥有隔离的 workspace 和私有运行时根。workspace 位置由 Forebrain
Harness 固定，用户不可配置：

| 路径 | 含义 |
| --- | --- |
| `<home>/workspace` | `main` 主工作区。 |
| `<home>/workspaces/<id>` | 非 main 主代理的 workspace。 |
| `<primary-workspace>/MEMORY.md` | 主代理私有的入口 memory。 |
| `<primary-workspace>/memory` | 主代理私有的持久 memory。 |
|
| `<primary-workspace>/skills` | 主代理私有的 workspace skills。 |
| `<home>/memory/shared` | 所有主代理可见的共享 memory。 |
| `<home>/skills` | 所有主代理可见的共享 skills。 |

活跃主代理通过 Web 顶部导航的下拉框、Web 的 `/agents` 页面或 Stream 的
`/agent` 选择器切换。Forebrain Harness 把这个运行时选择存在
`<home>/state/primary-agent.json`。

### 如何使用命名 Agent

以下情况使用命名 agent：

- 不同任务需要不同模型
- 一个 agent 应专注评审，另一个专注实现
- 你想要各自独立的主工作区、memory、skills、活跃 run 和子 subagent

避免创建大量区分度低的 agent。最好的命名 agent 有清晰的运营目的。

## `llm_providers`

`llm_providers` 是一条有序的 provider 链。

每个条目包含 provider 身份、模型身份和可选的运行时覆盖。运行时覆盖与
`provider`、`model` 同级。

### Provider 条目参考

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `provider` | string | 空 | Provider 名，如 `openai`、`anthropic`、`deepseek` 或 `openrouter`。 |
| `model` | string | 空 | 模型标识。 |
| `api_key` | string | 空 | Provider API key。 |
| `base_url` | string | 空 | 覆盖 base URL。 |
| `api_path` | string | 空 | 覆盖 API 路径。 |
| `params` | object | 空 | 合并进请求体的 provider 原生请求参数。 |

### Provider 凭据与环境变量覆盖

Provider 凭据可以用占位符或 `.env` 提供。

受支持的环境变量名包括：

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `DEEPSEEK_API_KEY`
- `GEMINI_API_KEY`
- `OPENROUTER_API_KEY`
- `GROQ_API_KEY`
- `XAI_API_KEY`
- `MISTRAL_API_KEY`
- `OLLAMA_API_KEY`

以下情况使用 `base_url`：

- 把 Forebrain Harness 指向 OpenAI 兼容代理
- 使用自托管 provider 端点
- 对接企业 API gateway

以下情况使用 `params`：

- 模型 provider 支持额外的请求期旋钮
- 你需要 provider 原生 JSON 选项，如 `temperature` 或 `max_tokens`

### Anthropic provider 专属行为

`anthropic` provider 上有两件事是替你处理好的、不可配置：

- **采样参数永不发送。** Opus 4.7 起每个 Anthropic 模型都直接拒绝
  `temperature` / `top_p` / `top_k`，仍接受它们的模型也拒绝任何非默认值。
  改用 prompt 和 `reasoning.effort` 来引导行为。
- **Prompt 缓存永远开启。** 请求携带 `cache_control` 断点——一个覆盖工具
  定义与 system prompt，其余铺在 transcript 尾部，让长的 agentic turn 留在
  API 的 20 块回看窗口内。没有它们，Anthropic 因为缓存是 opt-in 的，每次
  调用都会按完整前缀计费。用 provider 返回的 cache-read 计数器验证。

## `loop_guard`

Loop guard 是 agent 级的安全与恢复控制。

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `enabled` | boolean | 未配置即禁用 | 启用 loop guard。 |
| `after_iterations` | integer | `0` | 这么多次迭代之后开始守护。 |
| `repeat_interval` | integer | `0` | 激活后的复检节奏。 |
| `history_assistant_rounds` | integer | `0` | 提供给 loop 评估的 assistant 轮窗口。 |
| `rewrite_llm_providers` | object[] | 空 | 用于改写辅助的 provider 链。 |
| `eval_llm_providers` | object[] | 空 | 用于评估辅助的 provider 链。 |

以下情况使用 loop guard：

- 长时运行的 agent 任务可能陷入重复行为
- 你想让一条更便宜专用模型链评估或改写停滞的工作

## `agents.defaults`

`agents.defaults` 集中管理 agent 的共享运行时策略。

Forebrain Harness 的大多数高级运行时行为都在这里配置。

## `memory`

控制 per-primary-agent 的 memory 子系统。每个特性和工具默认开启。下面的
每个开关都可由用户配置——把任何一个设为 `false` 即关闭那个单独的特化。

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `enabled` | boolean | `true` | Memory 子系统总开关。 |
| `use_memories` | boolean | `true` | 通过读取路径呈现 memories。 |
| `generate_memories` | boolean | `true` | 运行后台抽取与合并流水线。 |
| `dedicated_tools` | boolean | `true` | 注册带命名空间的 memory 工具。 |
| `disable_on_external_context` | boolean | `false` | 当外部上下文可能已进入 transcript 时，把会话标记为已污染。 |
| `max_raw_memories_for_consolidation` | integer | `256` | 进入合并的 stage1 raw memories 上限。 |
| `max_unused_days` | integer | `30` | 修剪掉闲置这么多天的 stage1 输出。 |
| `extract_model` / `extract_provider` | string | 空 | Stage1 抽取的模型与 provider。 |
| `consolidation_model` / `consolidation_provider` | string | 空 | Stage2 合并的模型与 provider。 |

专用 memory 工具是 `memories_list`、`memories_read`、`memories_search` 和
`memories_add_ad_hoc_note`。

## `agents.defaults.context_inject`

控制注入哪些上下文来源，以及它们可以变得多大。

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `workspace_bootstrap_md` | boolean | `true` | 包含 workspace bootstrap 指引。 |
| `max_pre_hook_rules_chars` | integer | 调用方各自的回退值 | Pre-hook 规则的最大字符数。 |
| `model_context_tokens` | integer | 未配置即未设置 | 显式模型上下文窗口。 |
| `warn_remaining_tokens` | integer | `25000` | 剩余 token 警告阈值。 |

## `agents.defaults.mcp_servers`

MCP 服务器条目把外部工具或资源服务器暴露给 Forebrain Harness。

### MCP 服务器条目参考

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `name` | string | 空 | 逻辑服务器名。 |
| `transport` | string | 空 | 传输种类。运行时接受 `stdio`、`streamable_http`、`sse` 和 `websocket`。省略时，Forebrain Harness 从 `url` 推断传输，否则回退到 `stdio`。 |
| `url` | string | 空 | 网络传输的端点 URL。`stdio` 留空。 |
| `headers` | object | 空 | HTTP、SSE 或 WebSocket 传输的传输头。支持 `${ENV_NAME}` 占位符。 |
| `oauth.mode` | string | 空，可推断 | OAuth 模式。 |
| `oauth.access_token` | string | 空 | 缓存的 access token。 |
| `oauth.token_type` | string | 空 | Token 类型。 |
| `oauth.client_id` | string | 空 | Client ID。 |
| `oauth.client_secret` | string | 空 | Client secret。 |
| `oauth.token_url` | string | 空 | Token 端点。 |
| `oauth.authorization_url` | string | 空 | 授权端点。 |
| `oauth.redirect_url` | string | 空 | 重定向 URL。 |
| `oauth.refresh_token` | string | 空 | Refresh token。 |
| `oauth.scopes` | string[] | 空 | OAuth scopes。 |
| `disable_standalone_sse` | boolean | `false` | 禁用独立 SSE 回退。 |
| `command` | string | 空 | stdio 启动的本地命令。 |
| `args` | string[] | 空 | 命令参数。 |
| `env` | object | 空 | 子进程环境覆盖。支持 `${ENV_NAME}` 占位符。 |
| `inherit_parent_env` | boolean | `false` | 继承父环境。 |
| `expected_command_sha256` | string | 空 | stdio 启动的可选固定命令哈希。 |

### MCP 运行时注意

- MCP 工具以 `mcp__<server-name>__<tool-name>` 这样的命名空间工具名注册。
- 如果 MCP 服务器暴露 prompt 或资源，Forebrain Harness 还会注册 prompt
  列举、资源读取之类的辅助工具。
- Forebrain Harness 自动把当前 CLI workspace 传给 MCP：
  - 对 `stdio`，子进程工作目录被设为当前 workspace
  - 对所有传输，同一 workspace 作为 MCP roots 集发送

### CodeGraph 示例

CodeGraph 通常应配置为不带仓库路径覆盖。Forebrain Harness 自动提供当前
workspace。

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

当 CodeGraph MCP 服务器可用且 Forebrain Harness 正运行在 Git workspace 内
时，Forebrain Harness 会让 `mcp__codegraph__codegraph_explore` 保持在默认
工具列表中可见，模型可以直接使用它。

## `agents.defaults.tool_classifier`

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `enabled` | boolean | 未配置且未被 env 强制时为 `false` | 启用自动工具分类。 |
| `allow` | string[] | 空 | 显式 allow 列表。 |
| `soft_deny` | string[] | 空 | 软拒绝列表。 |
| `environment` | string[] | 空 | 暴露给分类器的环境变量。 |

## `agents.defaults.long_run_sync`

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `enabled` | boolean | `true` | 启用 long-run 同步策略。 |
| `strict` | boolean | `true` | 强制执行严格的 long-run 同步策略。 |
| `wall_clock_threshold` | string | `30m` | 同步处理激活前的阈值。 |
| `poll_interval` | string | `15s` | long-run 检查的轮询节奏。 |
| `confirm_timeout` | string | `30m` | 待确认的超时。 |
| `require_channel_confirm` | boolean | `true` | 要求显式的渠道确认。 |
| `memory_file_base` | string | `long_run` | long-run memory note 的基础名。 |
| `skip_if_batch_tools_used` | boolean | `true` | 已用过批量工具时跳过同步流程。 |

## `agents.defaults.guardrails`

输入、输出和检索护栏始终开启、无法禁用。可配置的只有它们的可调项。

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `input.max_runes` | integer | `200000` | 输入大小限制。 |
| `input.block_substrings` | string[] | 空 | 硬阻断子串。 |
| `input.policy_enforcer.timeout_seconds` | integer | `45` | 执行超时。 |
| `retrieval.max_chunk_runes` | integer | `120000` | 检索块上限。 |

## `agents.defaults.heartbeat`

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `every` | string | `30m` | Heartbeat 节奏。 |
| `prompt` | string | 内置 heartbeat prompt | Heartbeat 提示文本。 |
| `include_system_prompt_section` | boolean | `true` | 在 system prompt 里包含 heartbeat 指引。 |
| `ack_max_chars` | integer | `300` | Heartbeat 确认的最大长度。 |
| `light_context` | boolean | `false` | Heartbeat run 使用更轻的上下文。 |
| `isolated_session` | boolean | `false` | 在隔离会话中运行 heartbeat。 |
| `target` | string | 空 | 目标 agent ID。 |
| `session` | string | 空 | 目标 session ID。 |
| `active_hours.start` | string | 空 | Heartbeat 活跃时段开始时间。 |
| `active_hours.end` | string | 空 | Heartbeat 活跃时段结束时间。 |
| `active_hours.timezone` | string | 空 | 活跃时段时区。 |

## `agents.defaults.token_estimate`

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `encoding` | string | 空；运行时回退到活跃模型或 `cl100k_base` | 显式分词器 encoding。 |
| `model` | string | 空 | 用于 token 估算启发式的模型。 |

## `agents.defaults.web_search`

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `provider` | string | 空，行为等同 `auto` | 搜索 provider 选择。 |
| `tavily.api_key` | string | 空 | Tavily API key。 |
| `tavily.search_depth` | string | 非 `advanced` 即 `basic` | Tavily 搜索深度。 |
| `brave.api_key` | string | 空 | Brave Search API key。 |
| `baidu.api_key` | string | 空 | Baidu web 搜索 API key。 |
| `deepseek.api_key` | string | 空 | DeepSeek API key。环境变量 DEEPSEEK_API_KEY 会同时填入本字段与 web_fetch.deepseek.api_key。 |

可接受的 provider 取值：

- `auto`
- `tavily`
- `brave`
- `baidu`
- `deepseek`

## `agents.defaults.web_fetch`

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `provider` | string | 空，内置直连 HTTP 抓取器 | 显式设为 `deepseek` 才把抓取路由到 DeepSeek Fetch API（服务端渲染为 Markdown）。永不自动选择。 |
| `deepseek.api_key` | string | 空 | DeepSeek API key，由环境变量 DEEPSEEK_API_KEY 填入。 |
| `allow_private_ip` | boolean | `false` | 允许内置抓取器访问回环与 RFC1918 主机。路由到第三方 provider（`provider: deepseek`）时够不到这些地址，这类目标会被拒绝。 |

## `agents.defaults.sourcegraph`

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `enabled` | boolean | 省略时实际为 `true` | 启用 Sourcegraph 支撑的特性。 |
| `graphql_endpoint` | string | 空 | GraphQL 端点。 |
| `token` | string | 空 | Sourcegraph token。 |

## `agents.defaults.network_retry_max` 与 `agents.defaults.stream_idle_timeout_seconds`

这两个键决定"模型请求不再前进时会发生什么"，都属于 `agents.defaults`。

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `network_retry_max` | integer | `10` | 失败模型请求的重发次数。`0` 关闭网络重试；负数在加载时被拒；大于 `15` 按 `15` 运行。 |
| `stream_idle_timeout_seconds` | integer | `300` | 流式请求可以静默多久——没有响应头，或没有新数据——之后被视为掉线。`0` 关闭看门狗；负数在加载时被拒；其它值被限制在 `10` 到 `1800` 秒之间。 |

重试是**整请求重发**，不会接着被打断的那段流往下写。已经完整到达的回答会被保留而不是重说一遍，
已经跑过工具调用的请求也不会再发一次——运行中落盘的状态让这两件事都成立。

想让卡住的回合更快结束就调小 `stream_idle_timeout_seconds`；但对思考型模型不要远低于默认值：
模型思考期间不会发送任何数据，窗口短于它的思考时间就会把它掐断并重发请求。

```yaml
agents:
  defaults:
    network_retry_max: 5
    stream_idle_timeout_seconds: 120
```

## 相关页面

- [Memory、压缩与运行时特性](/zh/config/memory-and-runtime-features)
- [沙箱与权限](/zh/config/sandbox-and-permissions)
- [委派给子代理](/zh/guide/subagents)
