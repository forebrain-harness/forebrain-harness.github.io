# Run It As A Gateway

The same agent you use in the terminal becomes a service: a web UI, a REST
API, and WebSocket chat — on your machine or your server.

## Start, Check, Stop

One command group runs the service:

```bash
forebrain gateway start
forebrain gateway status
forebrain gateway stop
```

- `gateway start` is the only command that starts the gateway. It serves the
  web UI and API on `http://127.0.0.1:6060` by default. If first-run
  configuration is missing and the process has a terminal, setup runs before
  the service starts.
- `gateway status` checks the health endpoint.
- `gateway stop` requests a graceful shutdown.

The gateway requires a token by default. `gateway.auth.mode` selects the auth
mode and `gateway.auth.token` holds the credential — reference it as
`${ENV_NAME}` rather than writing it in plain text. See
[Runtime, Gateway, And Channels](/config/runtime-gateway-and-channels) for
every setting.

## What The Web UI Gives You

The web UI is in English and Chinese and carries the same chat and slash
commands as the terminal, so nothing has to be relearned.

- Chat pages with sessions, approvals, plan mode, and subagent history.
- Management pages for agents, projects, providers, permissions, MCP servers,
  language servers, tools, hooks, memories, channels, scheduled tasks, and
  configuration.
- Every primary agent is a separate tenant with its own workspace, sessions,
  and settings; a top-nav dropdown switches the active agent, backed by the
  same state as the terminal's `/agent`.

## What The API Exposes

The HTTP and WebSocket surface covers the same runtime the terminal drives.
The main route families:

- **Sessions** — create and list chat sessions; read messages, context,
  todos, plans, tool audit records, and cost summaries.
- **Runs and events** — send input, cancel runs, and stream run events.
- **Subagents** — send input to, watch, and manage child agent runs.
- **Approvals and permissions** — answer approval requests, review and edit
  permission rules.
- **Files** — upload, download, parse, and extract text.
- **Skills** — list, install, edit, toggle, and download skills, globally and
  per project.
- **Memory** — read and edit memory files and settings, trigger a reset.
- **Channels** — read and update the channel adapters bound to an agent.
- Plus models and providers, MCP servers, language servers, workspace trees
  and mentions, scheduled tasks, hooks, and configuration.

WebSocket chat streams the same turn events the web UI consumes.

## Bring Your Own Client

Anything that can call HTTP or open a WebSocket can drive the agent: scripts,
internal tools, CI jobs, or your own frontend. Sessions created through the
API are the same sessions `/resume` picks up in the terminal.

## Production Notes

Token-based auth is designed for more than one process: replicas sharing a
token agree on web sessions, and rotating the token invalidates every session
at once. Auth settings and channel wiring live in
[Runtime, Gateway, And Channels](/config/runtime-gateway-and-channels).

## Where Next

- [Your Agent In Team Chat](/guide/chat-channels) — connect Slack, Telegram,
  WeChat, and 15 more platforms.
- [Runtime, Gateway, And Channels](/config/runtime-gateway-and-channels) —
  auth, ports, and channel configuration.
