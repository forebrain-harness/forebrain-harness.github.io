# Sandbox And Permissions

This page is the configuration reference for Forebrain Harness's sandbox controls.

This page does not explain the full safety model. It documents the config
surface that shapes execution isolation and dangerous fallback behavior.

## `sandbox_mode`

`sandbox_mode` accepts exactly:

- `read-only`: files are readable and writes are denied.
- `workspace-write`: the workspace and configured writable roots are writable.
- `danger-full-access`: commands run without an operating-system sandbox.

When `sandbox_mode` is omitted it is derived from the launch project's trust
decision:

| Trust decision | Derived mode |
| --- | --- |
| Trusted | `workspace-write` |
| Explicitly rejected | `workspace-write` |
| Not decided yet | `read-only` |

Any explicit decision earns a writable workspace, including a rejection: a
rejected project is held back by its approval policy, which asks before anything
that is not provably safe, rather than by a read-only filesystem. A project
nobody has judged has no such backstop, so the sandbox is what protects it.

On Windows the derivation stays `read-only` unless `windows.sandbox` is
configured, because there is otherwise no enforcement to fall back on.

Setting `sandbox_mode` or `default_permissions` explicitly disables the
derivation. The derived value is runtime state and is never written back to
`forebrain.yaml`.

When a selected sandbox backend is unavailable, execution fails closed. A
single command can request host execution with
`sandbox_permissions: require_escalated`; whether an approval prompt may be
shown is controlled by `approval_policy`.

`--yolo` sets `approval_policy` to `never` and `sandbox_mode` to
`danger-full-access` for the process.

### Go build caches

Trusted Go projects automatically use project-scoped caches under
`$FOREBRAIN_HOME/cache/go/<project-id>`. Forebrain Harness sets `GOCACHE`, `GOMODCACHE`, and
`GOTMPDIR` for sandboxed commands and exposes the host module download cache as
a read-only `file://` GOPROXY. Cached dependencies are extracted on demand;
Forebrain Harness never copies or hard-links the complete host module tree. Missing
dependencies still use the configured upstream GOPROXY and remain subject to
the normal network policy.

Configure the behavior under `sandbox_workspace_write`:

```yaml
sandbox_workspace_write:
  go_cache_mode: isolated # isolated (default), shared, or disabled
```

`shared` grants write access to the host paths reported by `go env GOCACHE
GOMODCACHE`. It is faster across many projects but lets every sandboxed command
in the project mutate those expendable shared caches. `disabled` leaves the Go
environment unchanged. Isolated caches are pruned after 30 days and bounded by
a shared 10 GiB quota.

## `approval_policy`

`approval_policy` decides **when Forebrain Harness may ask you to approve something**. It is
a separate axis from `sandbox_mode`, which decides what a command may touch once
it runs.

When `approval_policy` is omitted it is derived from the launch project's trust
decision:

| Trust decision | Derived policy |
| --- | --- |
| Trusted | `on-request` |
| Explicitly rejected | `untrusted` |
| Not decided yet | `on-request` |

A project nobody has judged is not treated as rejected. Like `sandbox_mode`, the
derived value is runtime state and is never written back to `forebrain.yaml` —
persisting it would pin one branch of the derivation and the project's trust
decision could no longer change the policy. The two derivations are independent:
setting `sandbox_mode` explicitly does not freeze `approval_policy`, and vice
versa.

Three values are written as a plain string:

| Value | When Forebrain Harness asks | What it means for shell commands |
| --- | --- | --- |
| `untrusted` | Whenever a command is not provably safe | Known-safe commands run; everything else prompts before it runs. |
| `on-request` | Only when a command needs to leave the sandbox | Commands run inside the sandbox without prompting. |
| `never` | Never | Nothing is ever prompted. A rule that would ask becomes a denial, so the agent is confined to what the sandbox and the allow rules already permit. |

`on-failure` is accepted as a legacy spelling of `on-request`.

Use `untrusted` when:

- you are working in an unfamiliar repository and want to see each command first

Use `never` when:

- Forebrain Harness runs unattended (CI, cron, a gateway worker) and nobody can answer a
  prompt — pair it with explicit allow rules, because unmatched work is denied
  rather than queued

`--yolo` sets `approval_policy` to `never` and `sandbox_mode` to
`danger-full-access` for the process. That combination is the opposite of the
`never` case above: nothing is asked *and* nothing is sandboxed.

### `approval_policy.granular`

The fourth value is an object rather than a string, and turns prompting on or
off per category. It must be written as an object — the bare string `granular`
is rejected.

```yaml
approval_policy:
  granular:
    sandbox_approval: true
    rules: true
    mcp_elicitations: true
    skill_approval: false
    request_permissions: false
```

| Field | Type | Required | Default | Prompt it controls |
| --- | --- | --- | --- | --- |
| `sandbox_approval` | boolean | yes | — | A command was denied by the sandbox and wants to run on the host. |
| `rules` | boolean | yes | — | A permission rule with `ask` behavior matched. |
| `mcp_elicitations` | boolean | yes | — | An MCP server elicits input. |
| `skill_approval` | boolean | no | `false` | A skill asks to run. |
| `request_permissions` | boolean | no | `false` | A tool calls `request_permissions` for extra filesystem or network access. |

The three required fields must be present; omitting any one of them is a
configuration error rather than a silent default. Network approvals and MCP tool
approvals always prompt and are not switchable here.

Use `granular` when:

- you want unattended sandbox escalation to be refused, but still want to be
  asked about MCP elicitations or `ask` rules

### Approval Policy And Sandbox Escalation

When the sandbox denies a command, Forebrain Harness offers to run it on the host. Two
policies refuse that prompt: `never`, which refuses every prompt, and `granular`
with `sandbox_approval: false`, which refuses this one specifically. Under
`untrusted` and `on-request` the prompt is shown — a command that cannot do its
work inside the sandbox is exactly what those policies exist to ask about.

Where the prompt is refused, the denial is returned to the model as a command
error instead, and the model is expected to find another approach.

### Runtime-Only Modes

Two further modes exist but cannot be written into `forebrain.yaml`. They are
session state produced by the four choices Forebrain Harness offers when a plan is
approved with `exit_plan_mode`:

- `auto-approve`: every tool call is approved for the rest of the session.
- `auto-approve-edits`: file reads, edits, and writes are approved
  automatically; everything else still follows `approval_policy`.

Keeping them separate from `approval_policy` means approving a plan cannot
silently rewrite your configured policy.

## `sandbox`

The `sandbox` object contains detailed filesystem, network, violation, and
platform-backend settings. It does not select whether commands are sandboxed;
that selection belongs to `sandbox_mode`.

## `sandbox.filesystem`

Controls filesystem policy inside the sandbox.

### Filesystem Reference

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `allow_write` | string[] | empty | Explicit writable paths. |
| `deny_write` | string[] | empty | Explicit write-deny paths. |
| `allow_read` | string[] | empty | Explicit readable paths. |
| `deny_read` | string[] | empty | Explicit read-deny paths. |
| `allow_managed_read_paths_only` | boolean | `false` | Restricts reads to managed paths only. |

Use `allow_write` when:

- a worktree, temp directory, or generated-output path must remain writable

Use `deny_write` when:

- you want strong protection around system or secret-sensitive directories

Use `allow_managed_read_paths_only` when:

- Forebrain Harness should not read arbitrary host paths even if the sandbox exists

## `sandbox.network`

Controls network policy inside the sandbox.

### Network Reference

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `allowed_domains` | string[] | empty | Allowed outbound domains. |
| `denied_domains` | string[] | empty | Explicitly denied outbound domains. |
| `allow_unix_sockets` | string[] | empty | Explicitly allowed Unix sockets. |
| `allow_all_unix_sockets` | boolean | `false` | Allows all Unix sockets. |
| `allow_local_binding` | boolean | `false` | Allows local listener binding. |
| `http_proxy_port` | integer | `0` | Local HTTP proxy helper port. |
| `socks_proxy_port` | integer | `0` | Local SOCKS proxy helper port. |
| `allow_managed_domains_only` | boolean | `false` | Restricts network access to managed domains only. |

Validation rules worth knowing:

- domains must not include scheme, path, whitespace, or credentials
- ports must be between `0` and `65535`

Use `allowed_domains` and `allow_managed_domains_only` when:

- Forebrain Harness should be able to reach only a strict external allowlist

Use `denied_domains` when:

- specific destinations must always be blocked even if other network access is allowed

Use proxy ports when:

- the sandbox should route traffic through a local helper proxy

## `sandbox.ignore_violations`

Maps tool names to a list of violation kinds Forebrain Harness should tolerate.

Example shape:

```yaml
ignore_violations:
  shell:
    - "network"
  read_file:
    - "path_escape"
```

Use this only when:

- a specific tool is known to need a narrow exception
- you can describe exactly which violation kind is acceptable

## `sandbox.enable_weaker_nested_sandbox`

Relaxes sandbox behavior when Forebrain Harness itself is already running inside another
sandboxed environment.

Default:

- `false`

Use it when:

- a stricter nested sandbox is unreliable in your host environment

## `sandbox.enable_weaker_network_isolation`

Relaxes network isolation for constrained environments.

Default:

- `false`

Use it when:

- the environment cannot support the normal network-isolation path

## `sandbox.ripgrep`

Controls the `rg` binary selection inside the sandbox.

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `command` | string | empty | Ripgrep binary to execute. |
| `args` | string[] | empty | Extra arguments. |
| `argv0` | string | empty | Optional `argv0` override. |

Use it when:

- the sandbox must invoke a specific ripgrep binary
- the sandbox wrapper requires a custom `argv0`

## Related

- [Runtime, Gateway, And Channels](/config/runtime-gateway-and-channels)
- [Safety Model](/guide/safety-model)
- [CLI Command Reference](/guide/cli-command-reference)
