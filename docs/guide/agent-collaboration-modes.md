# Agent Collaboration Modes

Forebrain Harness collaboration is built around primary agents and child subagents.

Primary agents are top-level work partitions. Each primary agent owns its
workspace, private memory, workspace-local skills, active runs, and child
subagents. Child subagents inherit the active primary agent boundary.

## Overview

| Layer | Entry point | Best for |
| --- | --- | --- |
| Primary agent | `/agent`, Web top-nav dropdown, `/agents` page | Switching the active workspace, memory, skills, and run partition |
| Child session view | `/subagents`, Stream roster, Web `/agents` page | Focusing the current primary row or a child subagent session |
| Forked subagent | omit `subagent_type` | Background work that should inherit parent conversation context |
| Typed subagent | set `subagent_type` | Role-specific work with prompt and tool boundaries |
| Fanout | `subagent_fanout` | Independent tasks that can run in parallel |
| Async lifecycle | `subagent_send`, `subagent_wait`, `subagent_continue`, `subagent_close` | Long-running workers, status checks, and revision loops |

## Primary Agents

`/agent` is picker-only. It does not accept inline modes or subcommands. Open it
from Stream to choose the active primary agent. In Web, use the top-nav primary
agent dropdown or the `/agents` page.

`main` is always a primary agent. Other user-defined agent definitions become
primary agents when `primary: true` is set:

```yaml
agents:
  definitions:
    main:
      workspace: workspace
    review:
      primary: true
      workspace: workspaces/review
```

Primary-agent runtime layout:

| Root | Meaning |
| --- | --- |
| `<home>/workspace` | Default `main` workspace |
| `<home>/workspaces/<id>` | Default non-main primary workspace |
| `<primary-workspace>/MEMORY.md` | Private entry memory |
| `<primary-workspace>/memory` | Private durable memory |
| 
| `<primary-workspace>/skills` | Private workspace skills |
| `<home>/memory/shared` | Shared memory |
| `<home>/skills` | Shared skills |

Stream keeps the terminal working directory for file operations. The selected
primary agent still controls memory routing, transcript continuity, workspace-local
skills, active run partitioning, and subagent inheritance.

## Subagent Session Selection

`/subagents` is picker-only. In Stream it opens the child session picker or
focuses the live roster. In Web, use the `/agents` page or the Chat right rail.

Selecting a row changes the visible live session. The current active primary
row and child subagent rows are displayed together so the live roster means
"current active primary agent plus child subagents", not a hard-coded `main`
label.

## Forked Subagents

A forked subagent is a child execution branch that inherits cache-safe parent
context. Omit `subagent_type` when the worker benefits from the current
conversation context and intermediate tool output should stay in the child.

Example:

```json
{
  "task": "Investigate why package X fails and report the root cause."
}
```

Forked workers cannot call subagent tools.

## Typed Subagents

A typed subagent starts from a built-in role definition. Set `subagent_type` to
choose one:

```json
{
  "task": "Review the diff and report correctness risks.",
  "subagent_type": "verification"
}
```

Public built-in types:

| `subagent_type` | Purpose | Continuable |
| --- | --- | --- |
| `general-purpose` | General implementation worker | Yes |
| `explore` | Read-only investigation | No |
| `plan` | Read-only planning | No |
| `verification` | Verification and falsification | Yes |

Typed subagents use shared tool-policy logic. Read-only types cannot edit
project files, and built-in typed subagents cannot dispatch additional
subagents.

## Fanout

`subagent_fanout` starts independent child tasks concurrently and aggregates the
results.

Use it for parallel code reading, comparing approaches, or independent module
verification. Avoid it for workers that write overlapping files or require
strict ordering.

## Async Lifecycle

Async subagent lifecycle is the preferred pattern for long-running delegated
work:

| Tool | Purpose |
| --- | --- |
| `subagent_send` | Start an async subagent and return identifiers |
| `subagent_list` | List recent subagents scoped to the current session or parent run |
| `subagent_status` | Read one subagent's latest status |
| `subagent_wait` | Wait for completion or timeout |
| `subagent_continue` | Send a self-contained follow-up to an existing subagent |
| `subagent_close` | Cancel a running async subagent |

Subagent history is stored under Forebrain Harness home at
`state/subagent-history.jsonl`. Running async subagents also have an in-process
registry handle for status, wait, and cancellation.

## Choosing A Pattern

| Need | Recommended pattern |
| --- | --- |
| Switch workspace, memory, skills, and active run partition | Primary agent |
| Focus a child run's live output | `/subagents` or the roster |
| Preserve parent conversation context | Forked subagent |
| Enforce role-specific behavior | Typed subagent |
| Read several areas in parallel | `subagent_fanout` with `explore` |
| Review and request revision from the same worker | Async lifecycle |

## Implementation Map

| Path | Responsibility |
| --- | --- |
| `internal/primaryagent` | Primary-agent resolver, active state, workspace summaries |
| `internal/agentrun/subagent_tool.go` | `subagent_*` tools, fork/typed preparation, history, lifecycle |
| `internal/agentdefs/defs.go` | Built-in typed subagent definitions |
| `internal/codetools/subagent_tools.go` | Typed subagent visible-tool policy |
| `internal/subagents/history.go` | Durable subagent history JSONL |
| `internal/subagents/registry.go` | In-process running subagent registry |
| `internal/gateway/agents_api.go` | Web primary-agent and roster APIs |
