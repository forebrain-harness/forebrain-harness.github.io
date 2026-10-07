---
layout: home

hero:
  name: "Forebrain Harness"
  text: "The terminal AI work agent that also runs as an agent gateway"
  tagline: "An open-source agent product for developers and everyday productivity users who want terminal work, service-backed gateway APIs, multi-channel integrations, memory, skills, subagents, and execution controls in one runtime."
  image:
    src: /mark.svg
    alt: Forebrain Harness mark
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Architecture
      link: /guide/architecture
    - theme: alt
      text: GitHub
      link: https://github.com/forebrain-harness/forebrain-harness

features:
  - title: Terminal-First Coding Agent
    details: "Forebrain Harness's interactive TUI is built for local development work: live sessions, slash commands, approvals, visible tool progress, session resume, local workspace access, and shell-oriented execution."
  - title: Gateway Runtime, Not A Sidecar
    details: "The same runtime is exposed through the Forebrain Harness gateway with HTTP APIs, WebSocket chat, run events, sessions, files, permissions, skills, memory, and channel delivery."
  - title: Multi-Channel Agent Gateway
    details: "Channel adapters connect your agent to Telegram, Discord, Slack, WhatsApp, Signal, email, SMS, Feishu/Lark, DingTalk, WeCom, WeChat, QQ, Matrix, Mattermost, iMessage via BlueBubbles, Home Assistant, and generic HTTP/WebSocket bridges."
  - title: Office Productivity Agent
    details: "Forebrain Harness's gateway and channel surfaces can support daily productivity workflows such as document-heavy tasks, knowledge recall, recurring automation, approvals, and team communication."
  - title: Stateful Work Beyond Chat
    details: "Sessions, runs, context budgets, compaction, durable per-project and global memory, transcript continuity, and subagents give Forebrain Harness durable structure for long-running development and office work."
  - title: Built-In Delegation And Coordination
    details: "Coordinator mode, subagent tools, fanout execution, and child run tracking are part of the product model rather than loose prompts."
  - title: Safety As A Product Surface
    details: "Forebrain Harness separates permissions, approvals, sandboxing, guardrails, path controls, and audit surfaces so powerful agents stay observable and controllable."
---

## Get Running In Five Minutes

Install with npm (Node.js 18+; macOS arm64/x64, Linux x64/arm64, Windows x64):

```bash
npm install -g @forebrain-harness/forebrain
```

Or with Go (Go 1.26+ and a C compiler):

```bash
CGO_ENABLED=1 go install -tags fts5 github.com/forebrain-harness/forebrain-harness/cmd/forebrain@latest
```

Then:

1. Open your project and start the agent: `cd your-project && forebrain`.
2. On first run, confirm you trust the directory when asked.
3. Choose a provider when prompted: sign in with your ChatGPT plan, or use an
   API key for OpenAI, Anthropic, Google Gemini, DeepSeek, Qwen, xAI, Mistral,
   Moonshot, Z.AI, or MiniMax.
4. Type `/` to see every command and `@` to mention a file. Try `/model` to
   switch models mid-session.

Prebuilt archives for every platform are attached to each
[GitHub release](https://github.com/forebrain-harness/forebrain-harness/releases).

## What You Get

### One Engine Across Terminal, Browser, And Chat

The interactive TUI, the web UI served by the gateway, and your team's chat
apps all talk to the same agent. Sessions, slash commands, approvals,
permissions, and memory behave the same way on every surface, because they are
the same code. See [Choose Your Surface](/guide/cli-and-surfaces).

### Any Of 362 Models From 33 Vendors

Bring an API key for OpenAI, Anthropic, Google Gemini, DeepSeek, Qwen, xAI,
Mistral, Moonshot, Z.AI, MiniMax, and more — or sign in with your ChatGPT
plan instead of an API key. Switch model and reasoning effort mid-session
with `/model`. See [Agents and Models](/config/agents-and-models).

### Long Sessions That Stay Cheap

An agent sends its whole conversation to the model on every turn. Forebrain
Harness is built so as much of it as possible is served from the provider's
prompt cache, which keeps long sessions affordable. See
[Context and Compaction](/guide/context-and-compaction).

### A Real Sandbox, And You Stay In Charge

Commands run inside an OS-level sandbox on macOS, Linux, and Windows. Anything
that needs to leave it asks you first: `/permissions` switches presets, and
Plan mode (`/plan`) lets the agent investigate and propose before it may
change anything. See [Stay In Control](/guide/safety-model).

### Memory That Lasts, In Any Language

Forebrain Harness keeps per-project and global memory, distills it from past
sessions, and finds the right memory whether it is written in English,
Chinese, Japanese, or Korean. See
[Remember Across Sessions](/guide/memory-systems).

### Your Agent In 18 Chat Platforms — And Your Browser

Channel adapters connect the same agent — tools, sandbox, memory, approvals —
to Telegram, Discord, Slack, WhatsApp, Signal, email, SMS, Feishu/Lark,
DingTalk, WeCom, WeChat, QQ, Matrix, Mattermost, iMessage via BlueBubbles,
Home Assistant, and generic HTTP/WebSocket bridges. Prefer an API?
`forebrain gateway start` serves a web UI, REST API, and WebSocket chat. See
[Your Agent In Team Chat](/guide/chat-channels) and
[Run It As A Gateway](/guide/gateway).

## Choose How You Work

| You want to | Use | Start here |
| --- | --- | --- |
| Code with an agent in your terminal | The interactive TUI | [Getting Started](/guide/getting-started) |
| Work from a browser, or serve the agent as an API | `forebrain gateway start` | [Run It As A Gateway](/guide/gateway) |
| Reach the agent from your team's chat app | A channel adapter | [Your Agent In Team Chat](/guide/chat-channels) |

## Where Next

- [Getting Started](/guide/getting-started) — install, first session, and a ten-minute tour.
- [What You Can Do](/guide/what-you-can-do) — every capability at a glance.
- [Configuration Reference](/config/overview) — agents, models, sandbox, memory, and more.
