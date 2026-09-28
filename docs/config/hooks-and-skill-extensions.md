# Hooks And Skill Extensions

This page documents:

- `hooks`
- skill-specific extension config under `skills:`

These are runtime-adjacent settings, but they are not the same thing.

- `hooks` changes lifecycle automation
- `skills` configures individual skills that expose their own external settings

## `hooks`

`hooks` is a map of event names to hook matcher chains.

Supported event names:

- `PreToolUse`
- `PostToolUse`
- `PostToolUseFailure`
- `Notification`
- `UserPromptSubmit`
- `SessionStart`
- `Stop`
- `SubagentStop`

### Hook Shape

Each event contains a list of matchers:

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `hooks.<event>[].matcher` | string | empty or `*` means match everything | Selects which queries or tool names this matcher applies to. |
| `hooks.<event>[].hooks` | object[] | required | Ordered hooks executed when the matcher applies. |

### Matcher Behavior

A matcher may be:

- empty or `*` to match everything
- a simple exact matcher
- a `|`-separated exact matcher list
- a regular expression

### Hook Command Reference

Every hook item can include the following fields.

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `type` | string | required | Hook kind: `command`, `prompt`, `agent`, or `http`. |
| `command` | string | empty | Shell command for `command` hooks. |
| `prompt` | string | empty | Prompt text for `prompt` or `agent` hooks. |
| `url` | string | empty | Absolute URL for `http` hooks. |
| `if` | string | empty | Optional permission-style rule such as `shell(git *)`. |
| `shell` | string | `bash` when omitted at runtime | Shell interpreter for command hooks. |
| `timeout` | number | 10 minutes effective runtime fallback | Hook timeout in seconds. |
| `status_message` | string | empty | Status text exposed while the hook runs. |
| `once` | boolean | `false` | Runs once per matcher lifecycle when supported. |
| `async` | boolean | `false` | Runs asynchronously. |
| `async_rewake` | boolean | `false` | Requests rewake behavior after async completion. |
| `model` | string | empty | Model hint used by hosts that honor model selection for prompt-style hooks. |
| `headers` | object | empty | Additional HTTP-style headers for relevant hook runners. |
| `allowed_env_vars` | string[] | empty | Explicit allowlist of environment variables forwarded to the hook process. |

### How To Use Hooks Safely

Use `PreToolUse` when:

- you want to inspect or rewrite tool input before execution
- you want hook-driven approval decisions for particular tool patterns

Use `PostToolUse` when:

- you want summarization, logging, or follow-up actions after successful tool calls

Use `PostToolUseFailure` when:

- failed tool calls should trigger remediation, review, or incident-style handling

Use `Notification`, `SessionStart`, `Stop`, and `SubagentStop` when:

- Forebrain Harness should notify external systems or produce structured operational side effects

Use `allowed_env_vars` aggressively:

- do not forward the full parent environment by default
- allow only the variables the hook truly needs

## `skills`

The `skills:` block is a skill-specific extension surface.

It is part of the public `forebrain.yaml` ecosystem, but it is not part of the
primary Forebrain Harness root schema in the same way as `gateway`, `agents`, or `memory`.

Use it when:

- a skill explicitly documents configuration under `skills.<skill-name>`
- you want to supply external connection details or policy to a skill

## Related

- [Runtime, Gateway, And Channels](/config/runtime-gateway-and-channels)
- [Agents And Models](/config/agents-and-models)
- [Skills and Tools](/guide/skills-and-tools)
