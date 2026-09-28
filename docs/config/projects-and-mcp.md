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
  (next section), merged with the global list.

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

`/mcp` reports on-disk changes as *pending until a new session* rather than
silently applying them.

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

### Merging with the global list

- Entries are appended to the global `agents.defaults.mcp_servers` list.
- A project entry with the same name (case-insensitive) **replaces** the
  global entry whole — no field merging. `/mcp` lists the replaced globals.
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
   - The terminal asks at startup, right after the workspace-trust prompt.
   - The web gateway fails closed: unconfirmed entries stay out of the
     session and show as *awaiting confirmation*, with a confirmation entry
     on the project's page.
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
entry can never pick up a same-named global server's token. Global entries
keep the existing single-level path.

### Working directory and reload

- A project entry with the stdio transport runs with the **project root** as
  its working directory. Global entries keep using the process working
  directory.
- Project files, like the global list, apply to **new sessions only**. A
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
