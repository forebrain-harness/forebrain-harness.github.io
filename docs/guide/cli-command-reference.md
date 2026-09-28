# CLI Command Reference

Forebrain Harness intentionally exposes a small command surface. The supported commands
are exactly:

```text
forebrain
forebrain resume <session-id>
forebrain gateway start
forebrain gateway status
forebrain gateway stop
```

`forebrain gateway` is a command group, not a start alias. It does not start the
Gateway and must be followed by `start`, `status`, or `stop`.

## Interactive Commands

### `forebrain`

Starts the TUI in an interactive terminal. On first launch, the TUI runs the
setup flow before opening a session.

### `forebrain resume <session-id>`

Starts the TUI and resumes the specified session.

## Gateway Commands

### `forebrain gateway start`

Starts the Gateway service. This is the only CLI command that starts Gateway.
If first-run configuration is missing and the process has a TTY, setup runs
before the service starts.

### `forebrain gateway status`

Checks the Gateway health endpoint.

### `forebrain gateway stop`

Requests a graceful Gateway shutdown.

## Global Flags

The supported application flags are:

- `--home <directory>`: set the Forebrain Harness data root (`FOREBRAIN_HOME`).
- `--yolo`: bypass tool approvals and use danger-full-access execution for
  executable tools.

Cobra's standard `--help` and `--version` flags remain available. `--help` is
the only public help entrypoint; there is no redundant `help` subcommand.
Global flags can be supplied before a subcommand.

## Deliberately Unsupported Commands

Forebrain Harness does not expose separate CLI commands for setup, configuration, model
selection, memory, skills, sessions, diagnostics, authentication, integrations,
or run supervision. Interactive operations belong in the TUI; shared runtime
semantics belong below the TUI and Gateway adapters instead of being duplicated
as CLI command implementations.

## Related

- [Getting Started](/guide/getting-started)
- [CLI and Surfaces](/guide/cli-and-surfaces)
- [Configuration Overview](/config/overview)
