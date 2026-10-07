# 上下文与压缩

Forebrain Harness 使用替换历史式压缩。它用一个 provider 生成的紧凑历史、
或一份本地 handoff 摘要替换模型的活跃历史，同时保持 transcript 只追加，
以供审计和恢复。

## 压缩何时运行

自动压缩始终活跃。它在这些时点被检查：

- 新 turn 的入站用户消息落账之前
- turn 内的模型采样之间
- provider 报告上下文窗口超限之后

默认阈值是模型的自动压缩上限，封顶在其完整上下文窗口的 90%。正的
`compact.model_auto_compact_token_limit` 可以压低这个阈值，但不能抬高它。
模型的完整上下文窗口始终是硬上限。

`compact.model_auto_compact_token_limit_scope` 控制阈值的记账口径：

- `total` 计数完整的活跃上下文
- `body_after_prefix` 只计数当前 compact 窗口输入 token 基线之后的增长

入站消息不包含在 turn 前压缩请求里。它在此之后恰好一次追加进替换历史。

## 手动 `/compact`

`/compact` 以 `user_requested` 原因立即运行同一条压缩流水线。它在请求前
运行 `PreCompact`，在 checkpoint 成功后运行 `PostCompact`。自动压缩以自动
触发器使用同样的 hook。

终端 UI 会在整个 compact 请求存续期间显示一条不定态动画进度条。运行中的
卡片随后被完成或失败的 compact 结果替换，所以 provider 故障不会留下过期
的进度。

## Provider 与本地语义

对 OpenAI Responses，remote v2 是默认。Forebrain Harness 把当前历史发送到
普通 `/responses` 端点，带一个类型为 `compaction_trigger` 的输入项。响应
必须恰好包含一个 compaction 项；其不透明的加密内容被原样存储与回放、不做
解释。最近符合条件的历史在 provider 兼容的 64,000 token 预算内保留。

当 `compact.remote_compaction_v2` 为 `false` 时，Forebrain Harness 使用
`/responses/compact`。provider 响应在剔除过期的 developer、system、工具和
非对话项之后成为替换历史。

没有远程压缩的 provider 使用当前主模型和内置 handoff prompt。遇到上下文
窗口错误时，Forebrain Harness 在移除最老的历史项之后重试。替换内容包含
最多 20,000 token 的最新真实用户消息，其后是带摘要前缀的 user-role
handoff 摘要。被部分保留的最老用户消息保留其开头与结尾，中间是截断标记。

## Checkpoint 与恢复

每次成功的压缩都会追加一个包含完整替换历史的持久 checkpoint。checkpoint
构成一条 UUID-v7 窗口链，带当前、上一与首个窗口 ID，以及单调递增的窗口号。

恢复时，Forebrain Harness 从最新 checkpoint 加上其后写入的 transcript 后缀
重建模型上下文。更老的 transcript 行仍可审计，但不再是模型活跃的。turn 中
的压缩会把当前初始指令重新注入到最新的真实用户项或 compact 项之前；
turn 前与手动压缩则等到下一个正常 turn 才注入新指令。

## `/context` 命令

`/context` 显示当前会话上下文健康的一份紧凑、人类可读的报告。它回答：
*上下文有多满、由什么组成、最近发生过哪些压缩？*

报告反映最新一次组装的上下文快照——每次 run 重新生成的时点视图，不是
实时流。

### 示例输出

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

### Status — 上下文压力

| 字段 | 含义 |
| --- | --- |
| `Pressure` | 压力级别：`ok`（正常）、`warn`（接近阈值）或 `critical`。没有数据时显示 `unknown`。 |
| `Remaining` | 剩余可用 token / 模型上下文窗口，外加剩余百分比。 |

这是最先读的一行。百分比越低，会话离自动压缩越近。

### Usage — Token 消耗

| 字段 | 含义 |
| --- | --- |
| `Context used` | 当前在上下文中的估算 token（优先预算的 `used_tokens`，回退到 `effective_input_tokens`）。 |
| `Projected` | 下一次请求的完整输入估算：对话历史（本地 transcript 估算与上次模型上报的 prompt 用量中较大者）加注入的上下文项，再加当前查询。 |
| `Transcript` | 仅会话对话历史的本地 token 估算。 |
| `Last run` | 上次 run 的实际 token 消耗：prompt（输入）与 completion（输出）。 |

`Projected` 与 `Transcript` 之间的差就是注入到原始对话之外的上下文：
working set、近期文件活动、git 快照和当前查询（见
[注入对话之外的什么](#注入对话之外的什么)）。它本身不度量压缩。

压缩体现在别处：一次压缩之后，模型上报的 `Last run: prompt` 用量下降
（历史被摘要替换了），Status 段的 `Remaining` 上升。Compaction 段记录
发生了多少次压缩、最近一次用的策略。

### Composition — 上下文由什么组成

| 字段 | 含义 |
| --- | --- |
| `Items` | 当前包含的上下文项总数。 |
| `Working set` | 进入上下文的 working-set 文件或路径数。 |
| `Included sources` | 包含的来源（provenance）数。 |
| `Evicted sources` | 因预算或其他原因被裁掉的来源数。 |
| `Tool spills` | 因过大而溢写到磁盘、不内联保留的工具结果数（可用 `retrieve_output` 取回）。 |

只显示计数——不显示路径或内容——保持终端可读。完整细节仍在内部快照与
gateway context API 里。

### 注入对话之外的什么

每个交互 turn，上下文引擎在原始对话历史之上注入一小撮条目。注入预算刻意
很小：`agent` 模式 1,800 token、至多 18 项，`plan` 模式 2,200 token、至多
14 项。条目排序为先 pinned、再按优先级降序、再按估算 token 升序；超出
预算或条目上限的一切被逐出。

| 来源 | 优先级 | 注入什么 | 何时包含 |
| --- | --- | --- | --- |
| Working Set | 92（最高） | 查询里用 `@path` 引用过的至多 16 个文件路径，外加会话 pin 住的 working-set 文件。作为单个条目发出。 | 仅当存在 `@refs` 或 pin。Pinned 条目绕过 token 预算。 |
| Recent Files | 88 | 至多 12 个最近读或写的文件路径（`kind: path`），作为单个条目发出。 | 仅当存在近期读取状态。 |
| Git Snapshot | 62（最低） | 摘要的 `git status --porcelain` 与 `git diff --stat HEAD`：脏文件数、至多 3 条热路径、至多 3 个最大 diff，以及 diff 总计。 | 仅 agent 模式（`plan` 模式跳过）；工作树干净时跳过。 |

这些是上下文引擎为组装注册的全部来源。规则与按 turn 的 diff 来源在
planner 中有优先级条目但未注册，所以不会在这条路径上被注入。

因此 `Projected` 包含对话历史（本地 transcript 估算与上次模型上报的
prompt 用量中较大者）、上述注入条目和当前查询。`Composition` 段的
`Items`、`Working set`、`Included sources` 和 `Evicted sources` 对应上一
次组装产出的条目数、working-set 路径数、provenance 条目数和逐出数。

### Compaction — 历史

| 字段 | 含义 |
| --- | --- |
| `Events` | 本会话的压缩事件数。 |
| `Latest` | 最近一次压缩的策略、触发器与原因。 |

常见策略是 `remote_v2`（provider 摘要）和 `local`（本地 handoff 摘要）。
常见触发器是 `auto`（达到阈值）和 `manual`（`/compact`）。没有记录时，
报告显示 `Events: 0` 和 `Latest: none`。

### Session — 归属信息

| 字段 | 含义 |
| --- | --- |
| `ID` | 会话标识。 |
| `Mode` | 活跃模式，如 `agent` 或 `plan`。 |
| `Generated` | 快照生成时间（UTC）。 |
| `Run` | 最近一次 run 的标识。 |

### 相关子命令

| 命令 | 用途 |
| --- | --- |
| `/context` | 显示上文描述的上下文健康报告。 |
| `/context compression` | 显示 shell 与 MCP 输出压缩的累计节省：记录数、节省的字节与 token，以及每种压缩能力被取回的次数。数据来自持久化的 outfilter 历史库，跨会话累计。 |
| `/context reset-snapshot` | 清除会话缓存的上下文快照，让它在下一次 run 重新生成。这不清除对话历史、压缩历史或压缩统计。 |

### 数据源与边界

- `/context` 读取运行时每次 run 组装的内存上下文快照。`Projected` 和
  `Transcript` 是估算，不是精确计数：`Projected` 估算下一次请求的完整输入
  （对话 + 注入上下文 + 当前查询），`Transcript` 只估算原始对话历史。
- 路径、内容、完整时间线和 token 归因内部细节不显示在终端报告里；它们留在
  内部快照中，可经 gateway context API 获取。
- `/context compression` 是独立的数据通道，由磁盘上的 outfilter 历史库
  支撑，与快照无关。

## 相关页面

- [架构](/zh/guide/architecture)
- [跨会话记忆](/zh/guide/memory-systems)
- [配置](/zh/config/memory-and-runtime-features)
