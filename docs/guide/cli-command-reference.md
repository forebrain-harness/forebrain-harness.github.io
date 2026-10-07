# CLI Command Reference

Forebrain Harness intentionally exposes a small command surface. The supported
commands are exactly:

```text
forebrain
forebrain resume <session-id>
forebrain gateway start
forebrain gateway status
forebrain gateway stop
forebrain lsp list
forebrain lsp doctor
forebrain lsp enable <id>
forebrain lsp disable <id>
forebrain lsp install <id>
forebrain lsp recommendations
forebrain lsp recommendations reset
```

## Interactive Commands

### `forebrain`

Starts the TUI in an interactive terminal. On first launch, the TUI runs the
setup flow — workspace trust, then provider setup — before opening a session.

### `forebrain resume <session-id>`

Starts the TUI and resumes the specified session.

## Gateway Commands

`forebrain gateway` is a command group, not a start alias. It must be
followed by `start`, `status`, or `stop`.

### `forebrain gateway start`

Starts the gateway service — the web UI and API on `http://127.0.0.1:6060`
by default. This is the only CLI command that starts the gateway. If
first-run configuration is missing and the process has a TTY, setup runs
before the service starts.

### `forebrain gateway status`

Checks the gateway health endpoint.

### `forebrain gateway stop`

Requests a graceful gateway shutdown.

## Language Server Commands

`forebrain lsp` manages code intelligence from the shell; `/lsp` does the
same inside a session.

### `forebrain lsp list`

Lists every catalog server, its enabled/disabled switch, and the binary it
would run.

### `forebrain lsp doctor`

Checks language servers end to end and prints what to do about problems.

### `forebrain lsp enable <id>`

Enables a language server in trusted projects.

### `forebrain lsp disable <id>`

Disables a language server.

### `forebrain lsp install <id>`

Installs a language server binary. The install runs on your machine, outside
the sandbox.

### `forebrain lsp recommendations` · `forebrain lsp recommendations reset`

Manages per-project language-server recommendations; `reset` clears them.

See [Code Intelligence](/guide/code-intelligence) for what the servers give
the agent and how consent works.

## Global Flags

The supported application flags are:

- `--home <directory>`: set the Forebrain Harness data root (`FOREBRAIN_HOME`).
- `--yolo`: bypass tool approvals and use danger-full-access execution for
  executable tools.

Cobra's standard `--help` and `--version` flags remain available. `--help` is
the only public help entrypoint; there is no redundant `help` subcommand.
Global flags can be supplied before a subcommand.

## Deliberately Unsupported Commands

Forebrain Harness does not expose separate CLI commands for setup,
configuration, model selection, memory, skills, sessions, authentication,
integrations, or run supervision. Interactive operations belong in the TUI;
channel and model management belongs in the TUI or the gateway web UI, and
shared runtime semantics live below both adapters instead of being
duplicated as CLI commands. Language-server health has one CLI exception —
`forebrain lsp doctor` — because it must be answerable before any session
exists.

## Related

- [Getting Started](/guide/getting-started)
- [Choose Your Surface](/guide/cli-and-surfaces)
- [Code Intelligence](/guide/code-intelligence)
- [Configuration Overview](/config/overview)
