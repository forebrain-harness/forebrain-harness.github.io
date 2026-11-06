# Projects And Project-Level MCP

A project binds one working directory to the settings that travel with it:
instructions its sessions carry, a memory scope, and the MCP servers declared
inside that directory. This page documents both halves — the project entity
and the project-level MCP files a repository can carry.

## Projects

A project exists so a directory can carry context. Without one, every session
runs on the agent-level defaults; with one, sessions opened in that project
get:

- **Project instructions** — injected at the start of the session, frozen for
  its lifetime.
- **A memory scope** — either shared across projects, or restricted to this
  project's own memories.
- **Project-level MCP servers** — the servers declared under the project root
  (next section), merged with the shared and agent-level lists.

The primary agent is the tenant: projects belong to one agent the same way
sessions and memories do.

### Creating a project

Projects are created from the web UI (**Projects** in the navigation). A
project needs:

| Field | Meaning |
| --- | --- |
| `name` | Project name. |
| `root` | The bound working directory. Must exist, be a directory, and be outside the Forebrain Harness home. MCP, skills, memory keys, and the sandbox's writable root all key off it. |
| `icon` | Optional marker for the list. |
| `description` | One line, shown in the list only. Never injected into a prompt. |
| `instructions` | Project instructions, injected into the session. |
| `memory_scope` | `shared` (default; recall across projects) or `project_only` (this project's memories only). |
| `resource_access` | Whether this project's sessions may read agent-workspace material outside the project (the file library, cross-project memories). On by default. |
| `trust` | Record a trust decision for the directory. An explicit operator choice — never defaulted. |

Trusting a directory is what allows project-level files to take effect: an
untrusted directory's project instructions and MCP entries stay out.

### What freezes per session

Project instructions, the memory scope, and the effective MCP list are all
resolved once when a session starts and frozen for its lifetime. Editing a
project — or the MCP files under its root — takes effect in the **next**
session. This is deliberate: the tools, the system prompt, and the injected
context ahead of the conversation are cached by the provider, and moving any
of them mid-session would re-bill the whole prefix every time.

The next session is where the change lands. The three MCP layers are
re-resolved when a session starts and reconciled against what is already
running: a server that is connected keeps its connection and the tools
derived from it, a server that is configured but not connected is started, and
a server the configuration no longer names is retired with its connection
closed. A project entry nobody has confirmed yet is asked for one entry at a
time; once it is allowed, it runs in the session being entered.

`/mcp` reports on-disk changes as *pending until a new session* rather than
silently applying them.

## The three layers of MCP configuration

MCP servers are configured in three places, and the three are layers rather than
alternatives: what one layer does not name, the next one still supplies.

| Layer | Where it lives | Who it applies to |
| --- | --- | --- |
| Shared | `agents.defaults.mcp_servers` in `forebrain.yaml` | every primary agent |
| Agent | `agents.definitions.<agent>.mcp_servers` in `forebrain.yaml` | that primary agent's sessions |
| Project | `<project root>/.forebrain/mcp_servers.yaml` | sessions launched in that project, once the gates below are passed |

- **Different names add up.** An agent that configures a server of its own still
  inherits every shared one, and a project adds its entries on top of both.
- **The same name replaces whole.** Precedence is project > agent > shared: the
  higher layer's entry is used exactly as written — command, arguments,
  environment, headers, OAuth, timeouts, approvals — and nothing is merged field
  by field. A repository redefines a server; it does not silently rearrange one.
- `/mcp` groups the effective list by layer (`Global MCPs`, `Agent MCPs`,
  `Project MCPs`) and names the entries a higher layer replaced.

### Entry fields

Every layer's entries share one shape. Times are **seconds**:

| Field | Meaning |
| --- | --- |
| `name` | Identity: entries of the same name across layers are the same server. |
| `transport` | `stdio`, `streamable_http`, `sse`, or `websocket`. |
| `command`, `args`, `env` | The stdio server to run. |
| `url`, `headers` | The remote server to reach. |
| `startup_timeout` | How long this server may take to start and list its tools. `0` = the runtime default (30s). |
| `request_timeout` | How long one tool call may take. `0` = no bound: the call runs until its caller ends it. |
| `enabled` | Whether the entry runs at all. Absent means yes; `false` keeps the entry configured, keeps it out of every new session, and shows it in `/mcp` with the reason. |
| `required` | A server a run cannot do without. `required: true` with `enabled: false` is refused at load — nothing could start it. |
| `oauth`, `inherit_parent_env`, `disable_standalone_sse`, `expected_command_sha256`, `default_tools_approval_mode`, `tools` | Unchanged. |

There are no aliases. Another client's spellings for the same two bounds
(`connectionTimeoutMs`, `connect_timeout`, `connectTimeout`, `requestTimeoutMs`)
are not read: write `startup_timeout` and `request_timeout`, in seconds. An
unknown key is ignored rather than fatal, so a typo leaves its field at the
default instead of refusing the whole file.

`enabled`, `request_timeout`, and `startup_timeout` are deliberately **not** part
of a project entry's consent fingerprint. Switching a server off, or saying how
long you are willing to wait, does not change *which* server it is, and it must
not make the operator confirm the entry again.

## Project-level MCP servers

One file declares project-level servers — Forebrain Harness's own location:

| File | Shape |
| --- | --- |
| `<project root>/.forebrain/mcp_servers.yaml` | Top-level `mcp_servers:` list; each entry has the same shape as `agents.defaults.mcp_servers`. |

Forebrain Harness deliberately does not read other agents' project files (`.mcp.json`,
`.codex/config.toml`). If your repository carries one, `/migrate` copies its
entries into this file; reading it natively as well would leave two sources
of truth drifting apart in one repository. `/mcp` mentions the hint when it
finds such a file.

### Merging with the higher layers

- Project entries are appended after the shared and agent-level lists.
- A project entry with the same name (case-insensitive) **replaces** the entry
  the higher layers declared, whole — no field merging. `/mcp` lists the
  replaced entries and the layer each came from.
- Project entries are marked `scope=project`; `/mcp`, `/status`, and the web
  MCP view all show the scope.

### Gating

A project entry reaches the session only after three gates:

1. **Repository trust.** The launch project must be version controlled and
   trusted — the same gate project skills use.
2. **Per-entry confirmation.** Every project entry is confirmed once per
   fingerprint (transport, command, args, env, url, headers, oauth, approval
   modes). Change the command or the URL and it asks again. Confirmations are
   stored per primary agent and per project under
   `<agent workspace>/state/mcp/project_consent.json`.
   - The terminal asks at startup, right after the workspace-trust prompt,
     and again when a new session opens.
   - The web gateway fails closed: unconfirmed entries stay out of the
     session and show as *awaiting confirmation*, with a confirmation entry
     on the project's page. A conversation that opens asks for them as well.
3. **Approval clamping.** Project entries may not widen approvals: the
   default mode is `prompt`, and no mode wider than `prompt` is honored — a
   file that arrived with a checkout cannot approve its own tools.

An entry that fails any gate stays out of the effective list, and `/mcp` says
why in one line.

### Environment variables and credentials

Project entries do **not** read the host process environment. `${NAME}`
references in a project entry resolve from `~/.forebrain/.env` — a file only the
operator can write. `inherit_parent_env` is ignored for project entries.

OAuth credentials are namespaced by scope: a project entry's tokens are stored
under
`~/.forebrain/state/mcp-oauth/projects/<projectKey>/<server>.json`, so a project
entry can never pick up a same-named global server's token. An entry declared in
a primary agent's own list is namespaced under `agent:<agent id>` for the same
reason: two agents that configure the same server authenticate separately.
Shared entries keep the existing single-level path.

### Working directory and reload

- A project entry with the stdio transport runs with the **project root** as
  its working directory. The shared and agent-level entries keep using the
  process working directory.
- Project files, like the other two layers, apply to **new sessions only**. A
  config reload never rebuilds the MCP segment a session already froze: live
  connections and the tool definitions derived from them stay put.

### Example

```yaml
# <project>/.forebrain/mcp_servers.yaml
mcp_servers:
  - name: docs-index
    transport: stdio
    command: /usr/local/bin/docs-mcp
    args: ["--root", "."]
    default_tools_approval_mode: prompt
```

Entries from other agents' project files arrive through `/migrate`: it writes
them into the same file, so after a migration `docs-index` and a migrated
`graph` both live here, each pending its first confirmation.
