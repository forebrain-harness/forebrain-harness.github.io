# Architecture

Forebrain Harness is not one interface wrapped around one model call. It is a multi-surface
agent runtime built to support sustained technical work.

This page explains the system architecture at the product level:

- which surfaces Forebrain Harness exposes
- which shared runtime layers those surfaces depend on
- how core systems such as memory, tools, subagents, and safety fit together

## Architectural Goal

Forebrain Harness is designed for workflows that are longer, more stateful, and more
operationally sensitive than ordinary chat.

That creates a different architectural requirement from a normal assistant:

- the system must preserve session continuity
- it must execute tools safely
- it must coordinate long-running work
- it must support both interactive and service-backed surfaces
- it must keep memory, context, and approval systems consistent across those surfaces

## The Three Main Layers

At the highest level, Forebrain Harness can be understood as three cooperating layers.

```mermaid
flowchart TB
    subgraph Surfaces
      A["Interactive terminal"]
      B["CLI command flows"]
      C["Gateway and web-backed clients"]
    end

    subgraph SharedRuntime
      D["Session and run services"]
      E["Agent execution runtime"]
      F["Context assembly and memory refresh hooks"]
      G["Tool, hook, and approval orchestration"]
    end

    subgraph CoreSystems
      H["Context and compaction"]
      I["Memory systems"]
      J["Skills and tool surfaces"]
      K["Subagents and coordinator mode"]
      M["Sandbox, permissions, and guardrails"]
    end

    A --> D
    B --> D
    C --> D
    D --> E
    E --> F
    E --> G
    F --> H
    F --> I
    G --> J
    G --> K
    G --> M
```

## Surface Layer

Forebrain Harness exposes multiple user-facing surfaces because different operational
contexts need different interaction styles.

### Interactive Terminal

The terminal surface is optimized for day-to-day local work.

This is where users most directly experience:

- live turns
- slash commands
- approvals
- tool output
- session resume behavior
- local shell and workspace interactions

The terminal surface is intentionally close to the work. It is the most direct
way to use Forebrain Harness as a coding agent rather than as a remote service.

### CLI Command Flows

Forebrain Harness also exposes command-oriented flows that are not structured as an open
interactive session.

This matters for:

- inspection
- diagnostics
- operational control
- setup and validation workflows

### Gateway And Web-Backed Clients

The gateway surface turns Forebrain Harness into a service runtime.

This matters when:

- a browser or web client needs to talk to Forebrain Harness
- remote or shared usage matters
- integrations arrive through HTTP callbacks or service endpoints
- session state must be projected beyond one local terminal instance

## Shared Runtime Layer

The shared runtime is what keeps Forebrain Harness from becoming several separate products.

No matter which surface you use, Forebrain Harness still needs common answers to the same
questions:

- what session is this?
- what run is currently active?
- which agent is responsible?
- what context should be injected?
- which tools are available?
- which approvals are required?
- what memory artifacts should be refreshed after the turn?

### Session And Run Services

Forebrain Harness represents work as sessions and runs, not as isolated prompt/response
pairs.

That distinction matters because:

- a session carries continuity
- a run carries execution state for one turn or delegated unit of work
- tool calls, approvals, subagents, and post-turn tasks can all be attached to a run

This is the backbone that lets Forebrain Harness show:

- active work
- interrupted work
- child work
- audit trails
- resumable state

### Agent Execution Runtime

The execution runtime is the layer that turns a configured agent into a live
working process.

Its responsibilities include:

- selecting the active agent definition
- resolving model-provider chains
- building prompts
- registering tools
- running hooks
- applying approvals and policy
- handling delegated work

This is where Forebrain Harness stops being “just configuration” and starts behaving like
an operational system.

### Context Assembly And Post-Turn Work

Forebrain Harness does not simply feed “recent messages” to a model.

Before a turn, the runtime assembles a working context from multiple sources.
When model-active history reaches the automatic-compaction threshold, it is
replaced synchronously with a compact checkpoint before sampling continues.

This is a major architectural difference from stateless chat systems.

## Core Systems Layer

The core systems layer contains the mechanisms that make Forebrain Harness usable for
serious multi-step work.

### Context And Compaction

Forebrain Harness tracks context as a managed budget. It does not treat context overflow as
an accidental failure state.

That means the runtime can:

- account for either total active context or growth after the compact prefix
- enforce the model's full context window as a hard cap
- compact automatically before a turn or between samples
- replace active history with a durable provider or local checkpoint

### Memory Systems

Forebrain Harness's memory layer is deliberately split instead of collapsed into one vague
feature.

It includes:

- retrieval-oriented search memory
- Active Memory recall
- transcript continuity distillation
- governance and consolidation paths
- documented dreaming state

Each part exists because “memory” in agent systems actually means several
different problems.

### Skills And Tool Surfaces

Forebrain Harness separates:

- tools, which execute actions
- skills, which package reusable operating knowledge

This lets the runtime remain action-capable without reducing everything to a
flat command list.

### Subagents And Coordinator Mode

Forebrain Harness supports multiple forms of delegated work.

At a high level:

- the main agent can stay in the primary thread
- coordinator mode can break work into steps
- subagents can perform bounded child work
- child runs can be tracked and resumed independently

This lets Forebrain Harness scale from one-turn tasks to structured multi-step execution.

### Sandbox, Permissions, And Guardrails

Safety in Forebrain Harness is layered rather than monolithic.

The architecture keeps these concerns distinct:

- permission policy
- approval memory
- sandbox execution
- filesystem and network restriction
- guardrail-style input and output controls

That separation is what lets Forebrain Harness stay useful without flattening every action
into a crude allow-or-block decision.

## Control Flow Through The System

A typical turn looks like this:

```mermaid
sequenceDiagram
    participant User
    participant Surface
    participant Runtime
    participant Context
    participant Tools
    participant Memory
    participant PostTurn

    User->>Surface: submit turn
    Surface->>Runtime: create or continue run
    Runtime->>Context: assemble working context
    Context-->>Runtime: selected items + budget status
    Runtime->>Tools: execute tool calls as needed
    Tools-->>Runtime: outputs, approvals, errors
    Runtime->>User: return assistant result
    Runtime->>Memory: refresh memory artifacts if needed
    Runtime->>PostTurn: queue background maintenance work
```

## Why This Architecture Matters

The architectural value is not abstraction for its own sake. It is practical.

It gives Forebrain Harness the ability to:

- continue long sessions without collapsing into transcript sprawl
- expose the same core behavior across terminal and gateway surfaces
- coordinate delegated work without losing traceability
- attach safety decisions to real execution flows
- preserve operational state beyond one conversation window

## Practical Reading Guidance

If you are trying to understand one specific part of Forebrain Harness, continue with:

- [Context and Compaction](/guide/context-and-compaction) for prompt-budget management
- [Memory Systems](/guide/memory-systems) for recall, transcript continuity, and consolidation
- [Skills and Tools](/guide/skills-and-tools) for capability surfaces
- [Subagents](/guide/subagents) for delegation and task structure
- [Safety Model](/guide/safety-model) for approvals, sandboxing, and guardrails
