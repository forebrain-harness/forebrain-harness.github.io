# Stay In Control

You decide what the agent may do, every time: commands run inside a real
OS-level sandbox, permission presets decide what runs without asking, and
everything else is put in front of you in full before it runs.

## The Controls You Actually Touch

### The Trust Prompt

Before Forebrain Harness touches a directory it asks whether you trust it.
Trust is per project: a project you have rejected starts restricted, and a
trusted project starts with work happening inside the sandbox.

### The Sandbox

Commands run inside an OS-level sandbox on macOS, Linux, and Windows —
bounded filesystem paths, allowed and denied network domains. A mode never
widens what the sandbox permits; it only decides whether you are asked
before an action is attempted.

### `/permissions`

One command switches your approval posture between presets — from "only
provably safe commands run unasked" to "ask me whenever something needs to
leave the sandbox". Underneath, the posture comes from `approval_policy` in
`forebrain.yaml`:

- `untrusted` — only provably safe commands run unasked.
- `on-request` — work happens inside the sandbox; you are asked only when
  something needs to leave it.
- `never` — nothing is ever asked; anything that would have been asked is
  denied instead.
- `granular` — prompting switched on or off per category.

Leaving it unset is the normal case: a rejected project starts `untrusted`,
a trusted or not-yet-judged project starts `on-request`.

### Approvals, With Memory

When an action needs approval, you see exactly what will run — command,
paths, network — and answer once. Approval memory puts the decision where it
belongs: a one-off stays session-scoped, a standing rule can be saved to
project or user settings so you are not re-asked forever.

### Plan Mode

`/plan` separates investigating from changing. The agent explores, then
proposes; nothing is modified until you approve the plan. Approving a plan
can relax prompting for the rest of the session (everything, or reads and
edits only) — deliberately a session state, never a rewrite of your
configured policy.

### Path Protections

Sensitive paths and secret-like surfaces are protected by policy regardless
of mode: reading secrets, modifying host-critical paths, and exposing
credentials fail closed, so an accident stays an accident instead of an
incident.

### Audit Surfaces

Tool calls, approvals, and run events are recorded and inspectable — tool
audit records and cost summaries per session in the TUI and the web UI, so
you can always answer "what did it run?".

## How The Layers Compose

One glance, bottom to top: the sandbox bounds what a command can touch;
permission presets decide what runs without asking; approvals put everything
else in front of you; path protections and the audit trail run underneath
all of it. The full configuration reference is
[Sandbox and Permissions](/config/sandbox-and-permissions).

## Where Next

- [Sandbox and Permissions](/config/sandbox-and-permissions) — presets,
  policies, and filesystem/network rules.
- [Code Intelligence](/guide/code-intelligence) — why language servers ask
  for consent separately.
- [Getting Started](/guide/getting-started) — the trust prompt in context.
