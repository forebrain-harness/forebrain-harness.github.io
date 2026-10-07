# 选择你的工作面

同一个 agent 在四个地方与你相遇：终端、浏览器、团队聊天和脚本。按工作
发生的地方来选——底层的引擎、工具、memory 和审批完全一致。

## 一张决策表

| 你的场景 | 用什么 | 为什么 |
| --- | --- | --- |
| 本地写代码 | 终端（TUI） | `cd your-project && forebrain` — 审批、diff 和斜杠命令都在上下文里 |
| 在浏览器里工作，或共享访问 | Gateway web UI | `forebrain gateway start` 在 `http://127.0.0.1:6060` 提供同样的聊天和管理页面 |
| 在团队聊天的地方对话 | 渠道适配器 | 给 Slack/Telegram/WeChat 机器人发消息，它会续上真实的 agent 会话 |
| 写脚本或做集成 | CLI + REST/WebSocket | 在管道末尾用 `forebrain resume <session id>`，或通过 gateway API 驱动会话 |

## 终端

对本地开发工作，TUI 是最快的循环：实时的工具进度、上下文内的审批、
plan mode 和会话恢复。下面这些都是从它驱动的——`/model`、
`/permissions`、`/plan`、`/goal`、`/subagents`、`/skills`、`/lsp`、
`/memories`、`/compact`、`/fork`、`/migrate`。

## 浏览器

`forebrain gateway start` 把 agent 变成一项服务，提供中英双语的 web UI。
它带有与终端相同的聊天和斜杠命令，外加 agents、projects、providers、
permissions、MCP 服务器、语言服务器、tools、hooks、memories、channels 和
定时任务的管理页面。每个主代理都是独立的租户，有自己的 workspace、
sessions 和设置。参见[作为 Gateway 运行](/zh/guide/gateway)。

## 团队聊天

渠道适配器把 agent 放到团队的 Slack、Telegram、WeChat、Feishu 以及另外
十个平台背后。一条渠道消息会开始或续上真实的会话——同样的工具、同样的
memory、同样的审批——agent 就在对话已经发生的地方工作。参见
[团队聊天里的 Agent](/zh/guide/chat-channels)。

## 脚本

交互使用之外，两个入口最重要：

- `forebrain resume <session id>` 不经选择器直接重开一个已保存的会话——
  可以放在管道末尾或别名里。
- gateway 的 REST API 和 WebSocket 聊天能从任意客户端创建并驱动会话，
  这些会话正是 `/resume` 接续的那些。

API 的几大家族见[作为 Gateway 运行](/zh/guide/gateway)，每条命令见
[CLI 命令参考](/zh/guide/cli-command-reference)。

## 接下来去哪

- [快速开始](/zh/guide/getting-started) — 安装与第一次会话。
- [作为 Gateway 运行](/zh/guide/gateway) — 浏览器与脚本工作面。
- [团队聊天里的 Agent](/zh/guide/chat-channels) — 聊天工作面。
