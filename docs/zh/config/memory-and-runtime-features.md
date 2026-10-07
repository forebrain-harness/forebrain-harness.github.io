# Memory、压缩与运行时特性

本页记录塑造 Forebrain Harness memory 侧与会话行为特性的配置，不深入解释
底层行为。

用这一页：

- 调 memory 生成、检索和后台流水线
- 自动压缩

## `compact`

`compact` 控制结构化的 transcript 压缩行为。

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `compact.prompt` | string | 内置 handoff prompt | 覆盖仅用于本地摘要压缩的 prompt。 |
| `compact.model_auto_compact_token_limit` | integer | 模型上限，封顶在上下文窗口的 90% | 设置一个更早的自动压缩阈值。高于模型默认的值不会抬高它。 |
| `compact.model_auto_compact_token_limit_scope` | `total` 或 `body_after_prefix` | `total` | 计数整个活跃上下文，或只数当前 compact-window 前缀之后的增长。 |
| `compact.remote_compaction_v2` | boolean | `true` | 对 OpenAI Responses，使用带压缩触发器的普通 `/responses` 请求。`false` 选择 `/responses/compact`。 |

自动压缩是运行时的一部分，没有启用/禁用设置。它在每个 turn 之前运行，并在
达到阈值时在模型采样之间再次运行。两种 token 口径下，模型的完整上下文窗口
都仍是硬上限。`/compact` 手动调用同一条替换历史流水线。

## `memories`

顶层 `memories` 块配置 memory 生成、检索，以及把会话提炼成持久 note 的
后台流水线的节奏。Memory 特性默认开启；下面的每个开关只关掉一件事，不碰
其他的。

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `memories.generate_memories` | boolean | `true` | 从符合条件的已完成 turn 生成 memories。`false` 只留显式的 memory 工具调用。 |
| `memories.use_memories` | boolean | `true` | 通过读取路径把提炼后的 memory 注入会话。 |
| `memories.dedicated_tools` | boolean | `true` | 注册专用 memory 工具（`memories_list`、`memories_read`、`memories_search`、`memories_add_ad_hoc_note`）。 |
| `memories.disable_on_external_context` | boolean | `false` | 对 transcript 可能含外部注入上下文的会话跳过 memory 生成。 |
| `memories.search_top_k` | integer | `5`，钳制在 1–20 | 一次 `memories_search` 调用返回的 memories 数。这是模型上下文的预算，不是页大小——没有第二页；超过上限的值被钳制，不是拒绝。 |
| `memories.extract_model` | string | 空 | 抽取阶段的模型覆盖。空即不覆盖。 |
| `memories.consolidation_model` | string | 空 | 合并阶段的模型覆盖。空即不覆盖。 |
| `memories.max_raw_memories_for_consolidation` | integer | `256`，钳制在 1–4096 | 每个合并批次消费的 raw memories 数。 |
| `memories.max_unused_days` | integer | `30`，钳制在 0–365 | 未使用的 raw memory 在修剪前保留的天数。 |
| `memories.max_rollout_age_days` | integer | `10`，钳制在 0–90 | 启动轮会认领的 rollout 最大年龄。 |
| `memories.min_rollout_idle_hours` | integer | `6`，钳制在 1–48 | rollout 必须闲置这么久，启动轮才会认领它。 |
| `memories.max_rollouts_per_startup` | integer | `2`，钳制在 1–128 | 每次启动轮认领的 rollout 数——后台生成的节奏旋钮。 |
| `memories.min_rate_limit_remaining_percent` | integer | `25`，钳制在 0–100 | provider 速率限额余量低于这个百分比时，跳过一轮生成。 |

#### 如何使用 Memory 设置

以下情况使用 `generate_memories: false`：

- 你只想在工具调用显式要求时才写 memories

以下情况使用 `extract_model` 和 `consolidation_model`：

- 你想让后台 memory 工作跑在与主响应模型不同的模型上——比如一个更便宜
  或更稳定的

以下情况使用 rollout 旋钮（`max_rollout_age_days`、`min_rollout_idle_hours`、
`max_rollouts_per_startup`）：

- 你想放慢或加快每次启动之后后台生成的量

以下情况使用 `min_rate_limit_remaining_percent`：

- provider 速率限额快见底时，memory 生成应让你的主用量先行

以下情况使用 `search_top_k`：

- 召回往每个 turn 里带入的上下文太多，或太少

## 相关页面

- [Agent 与模型](/zh/config/agents-and-models)
- [Hook 与 Skill 扩展](/zh/config/hooks-and-skill-extensions)
- [跨会话记忆](/zh/guide/memory-systems)
