---
layout: home

hero:
  name: "Forebrain Harness"
  text: "既是终端 AI 工作 agent，也能作为 agent gateway 运行"
  tagline: "一个开源 agent 产品，为开发者和日常效率用户把终端工作、有服务支撑的 gateway API、多渠道接入、memory、skills、subagent 和执行控制在同一个运行时里交付。"
  image:
    src: /mark.svg
    alt: Forebrain Harness mark
  actions:
    - theme: brand
      text: 快速开始
      link: /zh/guide/getting-started
    - theme: alt
      text: 架构
      link: /zh/guide/architecture
    - theme: alt
      text: GitHub
      link: https://github.com/forebrain-harness/forebrain-harness

features:
  - title: 终端优先的编码 Agent
    details: "Forebrain Harness 的交互式 TUI 为本地开发工作而建：实时会话、斜杠命令、审批、可见的工具进度、会话恢复、本地 workspace 访问和面向 shell 的执行。"
  - title: Gateway 运行时，不是附属品
    details: "同一个运行时通过 Forebrain Harness gateway 暴露：HTTP API、WebSocket 聊天、run 事件、sessions、文件、权限、skills、memory 和渠道投递。"
  - title: 多渠道 Agent Gateway
    details: "渠道适配器把你的 agent 接到 Telegram、Discord、Slack、WhatsApp、Signal、email、SMS、Feishu/Lark、DingTalk、WeCom、WeChat、QQ、Matrix、Mattermost、经 BlueBubbles 接入的 iMessage、Home Assistant，以及通用 HTTP/WebSocket 桥接。"
  - title: 办公生产力 Agent
    details: "Forebrain Harness 的 gateway 与渠道工作面可以支撑日常效率工作流，例如文档密集型任务、知识召回、周期性自动化、审批和团队沟通。"
  - title: 聊天之外的有状态工作
    details: "Sessions、runs、上下文预算、压缩、持久的 per-project 与全局 memory、transcript 连续性和 subagent，给 Forebrain Harness 的长时开发与办公工作以持久结构。"
  - title: 内建的委派与协调
    details: "Coordinator mode、subagent 工具、fanout 执行和子 run 跟踪是产品模型的一部分，而不是松散的 prompt。"
  - title: 安全作为产品工作面
    details: "Forebrain Harness 把权限、审批、沙箱、guardrails、路径控制和审计工作面彼此分开，让强大的 agent 保持可观测、可控制。"
---

## 五分钟跑起来

用 npm 安装（Node.js 18+；macOS arm64/x64、Linux x64/arm64、Windows x64）：

```bash
npm install -g @forebrain-harness/forebrain
```

或用 Go 安装（Go 1.26+ 和一个 C 编译器）：

```bash
CGO_ENABLED=1 go install -tags fts5 github.com/forebrain-harness/forebrain-harness/cmd/forebrain@latest
```

然后：

1. 打开你的项目并启动 agent：`cd your-project && forebrain`。
2. 首次运行时，在询问时确认你信任该目录。
3. 按提示选择 provider：用你的 ChatGPT 套餐登录，或使用 OpenAI、Anthropic、
   Google Gemini、DeepSeek、Qwen、xAI、Mistral、Moonshot、Z.AI 或 MiniMax
   的 API key。
4. 输入 `/` 查看全部命令，输入 `@` 提及一个文件。试试 `/model` 在会话中途
   切换模型。

每个平台的预编译压缩包都附在
[GitHub release](https://github.com/forebrain-harness/forebrain-harness/releases) 页面上。

## 你能得到什么

### 一个引擎，横跨终端、浏览器和聊天

交互式 TUI、gateway 提供的 web UI 和团队的聊天应用，对话的是同一个
agent。Sessions、斜杠命令、审批、权限和 memory 在每个工作面上表现一致，
因为它们是同一份代码。见[选择你的工作面](/zh/guide/cli-and-surfaces)。

### 33 家供应商的 362 个模型任你选

带上 OpenAI、Anthropic、Google Gemini、DeepSeek、Qwen、xAI、Mistral、
Moonshot、Z.AI、MiniMax 等的 API key——或者不用 API key、直接用你的
ChatGPT 套餐登录。用 `/model` 在会话中途切换模型和 reasoning effort。见
[Agent 与模型](/zh/config/agents-and-models)。

### 长会话，成本低得住

Agent 每个 turn 都把整段对话发给模型。Forebrain Harness 的构建目标是让尽
可能多的部分由 provider 的 prompt 缓存服务，长会话因此保持可负担。见
[上下文与压缩](/zh/guide/context-and-compaction)。

### 真沙箱，掌控权在你手里

命令在 macOS、Linux 和 Windows 的操作系统级沙箱内运行。任何需要离开沙箱
的操作都先问你：`/permissions` 切换预设，Plan mode（`/plan`）让 agent 先
调查、先提方案，批准之前什么都不改。见
[保持掌控](/zh/guide/safety-model)。

### 持久的 memory，任何语言

Forebrain Harness 保存 per-project 与全局 memory，从过去的会话中提炼它，
并且无论用英文、中文、日文还是韩文写下，都能找到对的那条。见
[跨会话记忆](/zh/guide/memory-systems)。

### 你的 Agent 触达 18 个聊天平台——外加你的浏览器

渠道适配器把同一个 agent——工具、沙箱、memory、审批——接到 Telegram、
Discord、Slack、WhatsApp、Signal、email、SMS、Feishu/Lark、DingTalk、
WeCom、WeChat、QQ、Matrix、Mattermost、经 BlueBubbles 接入的 iMessage、
Home Assistant，以及通用 HTTP/WebSocket 桥接。更想用 API？
`forebrain gateway start` 提供 web UI、REST API 和 WebSocket 聊天。见
[团队聊天里的 Agent](/zh/guide/chat-channels) 和
[作为 Gateway 运行](/zh/guide/gateway)。

## 选择你的工作方式

| 你想 | 用 | 从这里开始 |
| --- | --- | --- |
| 在终端里和 agent 一起写代码 | 交互式 TUI | [快速开始](/zh/guide/getting-started) |
| 在浏览器里工作，或把 agent 作为 API 提供 | `forebrain gateway start` | [作为 Gateway 运行](/zh/guide/gateway) |
| 从团队的聊天应用触达 agent | 渠道适配器 | [团队聊天里的 Agent](/zh/guide/chat-channels) |

## 接下来去哪

- [快速开始](/zh/guide/getting-started) — 安装、第一次会话和十分钟速览。
- [你能做什么](/zh/guide/what-you-can-do) — 所有能力一览。
- [配置参考](/zh/config/overview) — agents、模型、沙箱、memory 等等。
