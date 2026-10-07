# What You Can Do

Forebrain Harness is one agent runtime with eight capabilities you can put to
work today. Each section below tells you what it is, what you get, the one
command or path that starts it, and where to read more.

## Code In The Terminal

The interactive TUI is a coding agent that lives in your project: it reads and
edits files, runs commands, and shows its work.

- Pick from any of 362 models from 33 vendors — or sign in with your ChatGPT
  plan — and switch mid-session with `/model`.
- `/plan` makes the agent investigate and propose before it changes anything;
  `/goal` keeps it working toward an objective until it is done.
- Pick up where you left off with `/resume`, or `forebrain resume <session id>`
  from a fresh shell.

Start it with `cd your-project && forebrain`. Read more:
[Getting Started](/guide/getting-started).

## Serve It As An API

The same agent becomes a service: `forebrain gateway start` serves a web UI, a
REST API, and WebSocket chat on your machine.

- The web UI mirrors the terminal: same chat, same slash commands, same
  approvals — plus pages for agents, projects, providers, permissions, MCP
  servers, language servers, and scheduled tasks.
- REST and WebSocket endpoints cover sessions, runs and events, files,
  permissions, skills, and memory, so you can script or embed the agent.
- Runs on `http://127.0.0.1:6060` by default; token required by default.

Start it with `forebrain gateway start`. Read more:
[Run It As A Gateway](/guide/gateway).

## Chat From Your Team's Platforms

Channel adapters connect the agent to the chat apps your team already uses.

- 18 adapters: Telegram, Discord, Slack, WhatsApp, Signal, email, SMS,
  Feishu/Lark, DingTalk, WeCom, WeChat, QQ, Matrix, Mattermost, iMessage via
  BlueBubbles, Home Assistant, and generic HTTP/WebSocket bridges.
- A channel message starts or continues a real agent session — same tools,
  same memory, same approvals as the terminal.
- Approvals still apply in chat, so nothing dangerous runs just because the
  message arrived from Slack.

Configure it under `agents.definitions.<agent>.channels` in
`forebrain.yaml`. Read more: [Your Agent In Team Chat](/guide/chat-channels).

## Understand Code With Real Language Servers

Code intelligence puts a language server behind the agent, so it reads your
code the way your compiler does instead of guessing from text search.

- The `lsp` tool finds definitions, declarations, references, type
  hierarchies, call hierarchies, and symbols — and reports the errors an edit
  introduced, straight from the language server.
- The built-in catalog covers 38 servers, including gopls, pyright,
  rust-analyzer, typescript-language-server, clangd, and jdtls.
- Nothing starts until you say so: the first time the agent edits a file of a
  language with an available server, Forebrain Harness asks.

List what is available with `forebrain lsp list`. Read more:
[Code Intelligence](/guide/code-intelligence).

## Remember Across Sessions

Memory persists per project and globally, so context you give once is there
next session.

- Memory is distilled from past sessions into durable notes — not a raw
  transcript replay.
- Retrieval works across English, Chinese, Japanese, and Korean.
- Say "remember this" in a session and it is written down, with the note
  shown to you before it is saved.

Steer it in a session with `/memories`. Read more:
[Remember Across Sessions](/guide/memory-systems).

## Delegate To Subagents

Subagents take bounded child work in sessions of their own, so the main
conversation stays readable.

- Typed subagents fit the job: `general-purpose`, read-only `explore`,
  planning-only `plan`, and adversarial `verification`.
- Each child run is tracked — status, parent run, output — so delegated work
  is reviewable, not ephemeral.
- The main session stays free while children run, and you can watch or
  interrupt them.

Trigger one by asking the agent to delegate. Read more:
[Delegate To Subagents](/guide/subagents).

## Extend With Skills

A skill is a reusable instruction pack your agent loads when a task matches
it.

- Bundled skills cover Word, Excel, PowerPoint, and PDF documents, code
  review, frontend design, image editing, and writing new skills.
- Project skills live in `.forebrain/skills/` at your project root; global
  skills live under your Forebrain home.
- `/skills` runs, adds, creates, improves, and toggles skills.

Check what is loaded with `/skills`. Read more:
[Extend With Skills](/guide/skills-and-tools).

## Stay In Control

Approvals, permissions, and the sandbox are separate layers, so a powerful
agent never runs past what you allowed.

- Commands run inside an OS-level sandbox on macOS, Linux, and Windows;
  anything that needs to leave it asks first.
- `/permissions` switches between presets, and approvals show the full
  command before it runs.
- Plan mode (`/plan`) separates investigating from changing.

Set your posture with `/permissions`. Read more:
[Stay In Control](/guide/safety-model).

## Where Next

- [Getting Started](/guide/getting-started) — be running in five minutes.
- [Run It As A Gateway](/guide/gateway) — the agent as a web UI and API.
- [Stay In Control](/guide/safety-model) — approvals, permissions, sandbox.
