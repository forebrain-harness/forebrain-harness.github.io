# Choose Your Surface

The same agent meets you in four places: your terminal, your browser, your
team's chat, and your scripts. Pick by where the work happens — the engine,
tools, memory, and approvals are identical underneath.

## One Decision Table

| You are… | Use | Why |
| --- | --- | --- |
| Coding locally | Terminal (TUI) | `cd your-project && forebrain` — approvals, diffs, and slash commands in context |
| Working from a browser, or sharing access | Gateway web UI | `forebrain gateway start` serves the same chat and management pages on `http://127.0.0.1:6060` |
| Talking where your team already talks | A channel adapter | Message a Slack/Telegram/WeChat bot and it continues a real agent session |
| Scripting or integrating | CLI + REST/WebSocket | `forebrain resume <session id>` in a pipeline, or drive sessions through the gateway API |

## Terminal

The TUI is the fastest loop for local development work: live tool progress,
approvals in context, plan mode, and session resume. Everything below is
driven from it — `/model`, `/permissions`, `/plan`, `/goal`, `/subagents`,
`/skills`, `/lsp`, `/memories`, `/compact`, `/fork`, `/migrate`.

## Browser

`forebrain gateway start` turns the agent into a service with a web UI in
English and Chinese. It carries the same chat and slash commands as the
terminal, plus management pages for agents, projects, providers, permissions,
MCP servers, language servers, tools, hooks, memories, channels, and
scheduled tasks. Every primary agent is a separate tenant with its own
workspace, sessions, and settings. See
[Run It As A Gateway](/guide/gateway).

## Team Chat

Channel adapters put the agent behind your team's Slack, Telegram, WeChat,
Feishu, and ten more platforms. A channel message starts or continues a real
session — same tools, same memory, same approvals — so the agent works where
the conversation already is. See
[Your Agent In Team Chat](/guide/chat-channels).

## Scripts

Two entry points matter outside interactive use:

- `forebrain resume <session id>` reopens a saved session without the picker —
  usable at the end of a pipeline or an alias.
- The gateway's REST API and WebSocket chat create and drive sessions from
  any client, and those sessions are the same ones `/resume` picks up.

See [Run It As A Gateway](/guide/gateway) for the API families, and the
[CLI Command Reference](/guide/cli-command-reference) for every command.

## Where Next

- [Getting Started](/guide/getting-started) — install and first session.
- [Run It As A Gateway](/guide/gateway) — the browser and scripting surface.
- [Your Agent In Team Chat](/guide/chat-channels) — the chat surface.
