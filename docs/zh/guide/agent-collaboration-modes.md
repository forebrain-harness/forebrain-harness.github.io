# Agent 协作模式

Forebrain Harness 的协作围绕主代理与子 subagent 构建。

主代理是顶层的工作分区。每个主代理拥有自己的 workspace、私有 memory、
workspace 本地 skills、活跃 run 和子 subagent。子 subagent 继承活跃主代理
的边界。

## 总览

| 层 | 入口 | 最适合 |
| --- | --- | --- |
| 主代理 | `/agent`、Web 顶部导航下拉框、`/agents` 页面 | 切换活跃的 workspace、memory、skills 和 run 分区 |
| 子会话视图 | `/subagents`、Stream roster、Web `/agents` 页面 | 聚焦当前主代理行或某个子 subagent 会话 |
| Forked subagent | 省略 `subagent_type` | 应继承父对话上下文的后台工作 |
| 类型化 subagent | 设置 `subagent_type` | 带 prompt 与工具边界的角色化工作 |
| Fanout | `subagent_fanout` | 可以并行运行的独立任务 |
| 异步生命周期 | `subagent_send`、`subagent_wait`、`subagent_continue`、`subagent_close` | 长时运行的 worker、状态检查和修订循环 |

## 主代理

`/agent` 是纯选择器。不接受内联模式或子命令。从 Stream 打开它来选择活跃
主代理。在 Web 里，使用顶部导航的主代理下拉框或 `/agents` 页面。

`main` 永远是主代理。其他用户定义的 agent 定义在设置 `primary: true` 时
成为主代理：

```yaml
agents:
  definitions:
    main:
      workspace: workspace
    review:
      primary: true
      workspace: workspaces/review
```

主代理运行时布局：

| 根 | 含义 |
| --- | --- |
| `<home>/workspace` | 默认 `main` workspace |
| `<home>/workspaces/<id>` | 默认非 main 主 workspace |
| `<primary-workspace>/MEMORY.md` | 私有入口 memory |
| `<primary-workspace>/memory` | 私有持久 memory |
|
| `<primary-workspace>/skills` | 私有 workspace skills |
| `<home>/memory/shared` | 共享 memory |
| `<home>/skills` | 共享 skills |

文件操作保留终端工作目录。选中的主代理仍控制 memory 路由、transcript
连续性、workspace 本地 skills、活跃 run 分区和 subagent 继承。

## 子会话选择

`/subagents` 是纯选择器。在 Stream 里它打开子会话选择器或聚焦实时
roster。在 Web 里，使用 `/agents` 页面或 Chat 右栏。

选择一行会切换可见的实时会话。当前活跃主代理行与子 subagent 行一起显示，
所以实时 roster 的含义是"当前活跃主代理加上子 subagent"，而不是硬编码的
`main` 标签。

## Forked Subagent

Forked subagent 是继承缓存安全的父上下文的子执行分支。当 worker 能从当前
对话上下文受益、且中间工具输出应留在子任务里时，省略 `subagent_type`。

示例：

```json
{
  "task": "Investigate why package X fails and report the root cause."
}
```

Forked worker 不能调用 subagent 工具。

## 类型化 Subagent

类型化 subagent 从内置角色定义启动。设置 `subagent_type` 来选择：

```json
{
  "task": "Review the diff and report correctness risks.",
  "subagent_type": "verification"
}
```

公开的内置类型：

| `subagent_type` | 用途 | 可续派 |
| --- | --- | --- |
| `general-purpose` | 通用实现 worker | 是 |
| `explore` | 只读调查 | 否 |
| `plan` | 只读规划 | 否 |
| `verification` | 验证与证伪 | 是 |

类型化 subagent 使用共享的工具策略逻辑。只读类型不能编辑项目文件，内置
类型化 subagent 不能再派生别的 subagent。

## Fanout

`subagent_fanout` 并发启动独立的子任务并聚合结果。

用于并行读代码、比较方案或独立验证模块。会写重叠文件或要求严格顺序的
worker 避免使用。

## 异步生命周期

异步 subagent 生命周期是长时委派工作的首选模式：

| 工具 | 用途 |
| --- | --- |
| `subagent_send` | 启动异步 subagent 并返回标识 |
| `subagent_list` | 列出当前会话或父 run 范围内最近的 subagent |
| `subagent_status` | 读取一个 subagent 的最新状态 |
| `subagent_wait` | 等待完成或超时 |
| `subagent_continue` | 向既有 subagent 发送自包含的后续指令 |
| `subagent_close` | 取消运行中的异步 subagent |

Subagent 历史存储在 Forebrain Harness home 下的
`state/subagent-history.jsonl`。运行中的异步 subagent 还有进程内注册表
句柄，用于状态、等待和取消。

## 选择模式

| 需要 | 推荐模式 |
| --- | --- |
| 切换 workspace、memory、skills 和活跃 run 分区 | 主代理 |
| 聚焦一个子 run 的实时输出 | `/subagents` 或 roster |
| 保留父对话上下文 | Forked subagent |
| 强制角色化行为 | 类型化 subagent |
| 并行读多个区域 | `subagent_fanout` 配 `explore` |
| 评审同一 worker 并要求修订 | 异步生命周期 |

## 实现地图

| 路径 | 职责 |
| --- | --- |
| `internal/primaryagent` | 主代理解析器、活跃状态、workspace 摘要 |
| `internal/agentrun/subagent_tool.go` | `subagent_*` 工具、fork/类型化准备、历史、生命周期 |
| `internal/agentdefs/defs.go` | 内置类型化 subagent 定义 |
| `internal/codetools/subagent_tools.go` | 类型化 subagent 的可见工具策略 |
| `internal/subagents/history.go` | 持久化的 subagent 历史 JSONL |
| `internal/subagents/registry.go` | 进程内运行中 subagent 注册表 |
| `internal/gateway/agents_api.go` | Web 主代理与 roster API |
