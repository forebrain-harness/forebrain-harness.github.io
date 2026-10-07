# Delegate To Subagents

Hand bounded work to child agents that run in sessions of their own: your
main conversation stays readable, several children can work at once, and
every child run is tracked and reviewable.

## What Delegation Buys

- **Isolated context.** A subagent gets its own session, so a big research
  sweep or a verification pass never buries your main thread.
- **Parallel child work.** Several subagents can run at the same time, each
  with its own status.
- **Reviewable runs.** Every child run records its identity, parent run,
  task, status, and output — delegated work is inspectable, not ephemeral.

## The Typed Subagents

Four role types cover most delegation:

- `general-purpose` — an independent implementation or research task.
- `explore` — read-only investigation and locating facts.
- `plan` — read-only design and sequencing, no code changes.
- `verification` — tries to falsify or verify work with concrete checks.

A fifth style, the fork, starts from the parent's current context and
continues as a child branch — useful when the child needs strong continuity
with what the parent already worked out.

## How To Trigger And Watch Them

Just ask. "Run a subagent to find every caller of this function" or "verify
this fix with a subagent" is enough — the agent delegates through its
subagent tools and you see the child run start in the transcript.

- In the terminal, `/subagents` opens the picker for this chat's subagent
  sessions, so you can focus a child, send it follow-ups, or pull its
  findings back into the main thread.
- In the web UI, the agents page shows live primary and subagent rows with
  cancellation controls.
- Subagent history is part of the session record: the TUI, the web UI, and
  the API all expose it.

Approvals apply to children too — a subagent's commands face the same
sandbox and permission checks as the main agent's
([Stay In Control](/guide/safety-model)).

## When To Reach For One

- A bounded task would flood the main conversation: a codebase-wide search,
  a dependency audit, a test sweep.
- The work needs a different contract than the main thread: strictly
  read-only exploration, or adversarial verification.
- You want the answer, not the detour — delegate, read the result, keep the
  transcript clean.

How coordination modes compose at the runtime level is covered in
[Agent Collaboration Modes](/guide/agent-collaboration-modes).

## Where Next

- [What You Can Do](/guide/what-you-can-do) — the capability this fits into.
- [Extend With Skills](/guide/skills-and-tools) — packages of know-how your
  subagents also load.
- [Agent Collaboration Modes](/guide/agent-collaboration-modes) — the
  coordination internals.
