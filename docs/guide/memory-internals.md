# Memory Internals

This document is based on Forebrain Harness source code analysis. It systematically covers the memory isolation model, write mechanisms, read/injection mechanisms, LLM provider compatibility, and a complete scenario walkthrough. It is intended for developers who need a deep understanding of memory internals.

For a product-level overview, read [Memory Systems](/guide/memory-systems) first.

::: tip Bilingual
[中文版本](/guide/memory-internals-zh)
:::

## Architecture Overview

```mermaid
flowchart TB
    subgraph WritePath["Write Path"]
        U["User conversation"] --> AT["memories_add_ad_hoc_note tool"]
        AT --> AN["extensions/ad_hoc/notes/"]
        U --> S1["Stage1: Extraction"]
        S1 --> DB["SQLite: fb_memory_stage1_outputs"]
        DB --> S2["Stage2: Consolidation"]
        AN --> S2
        S2 --> MEM["MEMORY.md + memory_summary.md"]
    end
    subgraph ReadPath["Read Path"]
        MEM --> RP["memoryInstructionLLM wrapper"]
        AN -. "until consolidated" .-> RP
        RP --> DEV["developer message injection"]
        DEV --> LLM["Model call"]
    end
```

Forebrain Harness memory consists of the following core components:

| Component | Package | Responsibility |
|-----------|---------|---------------|
| `Store` | `internal/memories` | Bound to a single primary agent; all reads/writes filtered by `agent_id` |
| `Pipeline` | `internal/memories` | Background async Stage1 extraction + Stage2 consolidation |
| `memoryInstructionLLM` | `internal/agentrun` | LLM wrapper that injects the turn instruction — memory_summary, pending notes, and the capture rules — on every model call |
| Dedicated memory tools | `internal/codetools` | `memories_list` / `memories_read` / `memories_search` / `memories_add_ad_hoc_note` |
| `localbackend.Backend` | `internal/memories/localbackend` | Filesystem read/write backend for memory artifacts |

## Isolation Dimension: Tenant, Not Project

### Core Conclusion

Forebrain Harness memory's sole isolation boundary is **Tenant (primary agent / agentID)**. **There is no project-dimension memory mechanism.**

### Evidence

`Store` is bound to a single `agentID`. All SQL queries filter by `agent_id=?`:

- **Extraction** — `ClaimStage1JobsForStartup` (`jobs.go:102`):
  ```sql
  WHERE agent_id=? AND memory_mode=? AND id<>? AND memory_source IN (?,?) AND updated_at>=? AND updated_at<=?
  ```
- **Consolidation selection** — `SelectStage1ForPhase2` (`store.go:235`):
  ```sql
  WHERE o.agent_id=? AND s.agent_id=? AND s.memory_mode=?
  ```
- **Write/delete/usage update** — `UpsertStage1Output`, `DeleteThreadMemory`, `UpdateUsage` all use `agent_id=?`

The consolidation job key is also the tenant itself: `consolidateJobKey(agentID) = agentID` (`jobs.go:43`).

### Memory File Root = Per-Tenant Workspace Root

```
ResolveRootForAgent(workspaceRoot) → <workspaceRoot>/memories/   (root.go:28)
```

- `workspaceRoot()` (`runner.go:1424`) = `r.WorkspaceRoot` or `~/.forebrain/workspace` — this is per-agent
- `MEMORY.md` / `memory_summary.md` live under the per-tenant directory — **no project key in the path**

### `memories/project.go` Functions Serve Other Subsystems

`project.go` defines `ProjectKey()` / `ProjectRoot()` / `GitBranch()`, but they are **not used for memory store isolation/filtering**:

| Function | Actual purpose | Callers |
|----------|---------------|---------|
| `ProjectKey()` | Plan file directory `planstore.PlanDirForProject`, subagent inheritance | `clifacade/chat_session.go`, `workerhost/open.go` |
| `ProjectRoot()` | File tool default path, permissions | `clifacade/chat_session.go` |
| `GitBranch()` | Written to `fb_sessions.git_branch` column (session metadata) | `clifacade`, `workerhost` |

`Store` never calls any of these functions internally.

### Cwd / GitBranch Are Descriptive Metadata Only

`Stage1Output` and `SessionCandidate` structs have `Cwd` and `GitBranch` fields, but they:

1. Are only SELECTed out as metadata
2. Written to rollout summary file headers (`storage.go:78-84`) and evidence JSONL (`evidence.go:30-34`)
3. **Never appear in any WHERE clause** — not used for extraction/consolidation/read filtering

### Isolation Test Verification

`tenant_isolation_test.go` explicitly verifies: two agents share the same SQLite DB, isolation is achieved entirely through `agent_id` filtering, project does not participate.

## Write Mechanism

Memory writes have two paths that converge into the same `MEMORY.md`.

### Path 1: Ad-hoc Note (Immediate Write)

The agent calls the `memories_add_ad_hoc_note` tool either when the user explicitly asks to "remember...", or on its own when the user's message states a durable rule, constraint, or preference (see [Proactive Capture](#proactive-capture) below):

```
memories_add_ad_hoc_note
  → backend.AddAdHocNote(filename, note)                    (memory_tools.go:61)
  → writes to <workspaceRoot>/memories/extensions/ad_hoc/notes/<timestamp>-<slug>.md
```

- Default `DedicatedTools=true` (`config.go:368`), tool is registered by default
- The write is gated by tool approval, so the user sees the note body before it is stored (`permissions/engine.go`: memory reads are `safe_readonly_default_allow`, the writer is not)
- Write is **immediate**, but the note only lives in the extensions directory — **not in `MEMORY.md`**, which only a consolidation pass can update
- Until a consolidation pass picks it up, the note is injected into every turn by the pending-notes section of the turn instruction (`instruction.go: renderPendingNotesSection`), so a freshly captured rule is honored in the very next session instead of waiting hours for Phase 2

#### Proactive Capture

The `capture.md` half of the turn instruction (rendered whenever `generate_memories` is on) tells the agent to check every reply for a lesson that is **applicable** (it would change what a later session does, and it came from the user), **durable** (judged by how wide the user scoped the instruction, in whatever language they used, not by matching particular words), and **legible** (rule plus reason, self-contained). A qualifying lesson must be written in the same reply that engages it. Unlike the recall half, this section renders even when the store is empty — otherwise the first rule a user states in a fresh workspace could never be recorded.

Capture is rendered only for runs that can carry a user turn. Subagent runs (`agent:*` query sources), compaction, and hook runs are excluded (`memoryCaptureAllowedForSource`): their "user" messages are prompts written by another agent, so a note captured there would record task text as a durable user rule.

#### Which Notes Are Still Pending

A consolidation pass consolidates the workspace diff it snapshots when it starts. That instant is recorded at `<stateRoot>/memory-consolidated-at` (`markConsolidationStart`), and two things read it:

- `renderPendingNotesSection` injects the notes modified after it (newest first, capped at 20 notes / 1200 tokens), as of the session's first model call
- `resetGitBaseline` leaves extension files modified after it **out** of the new baseline commit, so a note captured while the pass was running still shows up in the next pass's diff instead of being buried

### Path 2: Automatic Extraction + Consolidation (Async Pipeline)

#### Trigger Timing

After each root interactive turn, `maybeLaunchMemoryStartup` (`supervisorrun/run.go:186`) fires `Pipeline.Run`:

```go
func maybeLaunchMemoryStartup(o Options, sessionID string) {
    if o.Runner == nil { return }
    if strings.TrimSpace(o.ParentRunID) != "" { return }   // subagents don't trigger
    if !isRootInteractiveSource(querySourceForRun(o)) { return }
    o.Runner.LaunchMemoryStartup(sessionID)
}
```

#### Stage1: Extraction

`ClaimStage1JobsForStartup` selects eligible sessions from `fb_sessions`:

- `agent_id=?` — current tenant
- `memory_mode=enabled` — session has memory enabled
- `memory_source IN ('tui','webchat')` — from interactive surfaces
- `updated_at >= now - MaxRolloutAgeDays` (default 10 days)
- `updated_at <= now - MinRolloutIdleHours` (default **6 hours** idle)

::: warning 6-Hour Idle Threshold
The current session won't be extracted until it has been idle for 6 hours. This means when a user says "remember...", that conversation is not immediately extracted as raw memory — it must wait 6 hours of idleness before entering Stage1.
:::

Stage1 uses the ExtractLLM to produce structured JSON (`raw_memory` / `rollout_summary` / `rollout_slug`) from the conversation transcript, redacts secrets, and writes to the `fb_memory_stage1_outputs` table.

#### Stage2: Consolidation

`runStage2` (`pipeline.go:292`) **runs regardless of whether Stage1 produced output**:

1. `TryClaimGlobalPhase2` acquires the consolidation lock (6-hour cooldown)
2. `SelectStage1ForPhase2` selects all stage1 outputs for the current tenant
3. `syncPhase2WorkspaceInputs` syncs outputs to the memories directory (`raw_memories.md` + `rollout_summaries/`)
4. `memoryWorkspaceDiff` computes the git diff of the memories directory
5. If `changed=true` → consolidation LLM runs, reads workspace diff + ad-hoc notes, merges into `MEMORY.md` + `memory_summary.md`
6. `validateConsolidationArtifacts` validates outputs (`MEMORY.md` exists, `memory_summary.md` first line is `v1`)

::: tip Ad-hoc Note Consolidation
Ad-hoc notes appear as new files in the git diff. The consolidation LLM follows `ad_hoc_instructions.md` instructions to merge note content into `MEMORY.md` and `memory_summary.md`. The instructions state: "Every note must be consolidated in the memory structure."
:::

## Read and Injection Mechanism

### Core Conclusion: MEMORY.md Is Never Directly Injected

What is automatically injected is `memory_summary.md` (a separate index/summary file), not `MEMORY.md`. `MEMORY.md` is only **mentioned** in the injected template text — the agent must actively retrieve it.

### Injection Chain

**Installation timing** — `loadLocked()` (`runner.go:729`) builds the LLM client chain:

```go
llmClient = wrapMemoryInstructionLLM(llmClient, r.workspaceRoot(), r.AppCfg)
```

Triggers: runner initialization, config hot-reload, `/model` switch.

**Execution timing** — every LLM `Execute` call (i.e., every model call in every turn):

```go
func (w *memoryInstructionLLM) Execute(ctx, messages, tools) {
    opts := memories.InstructionOptionsFromConfig(w.cfg)
    opts.Capture = opts.Capture && memoryCaptureAllowedForSource(QuerySourceFromContext(ctx))
    // Rendered once per session, then returned byte-identical.
    instruction := w.instructionForSession(codetools.AgentSessionIDFromContext(ctx), opts)
    if instruction != "" {
        messages = memories.InjectDeveloperInstruction(messages, instruction)
    }
    return w.inner.Execute(ctx, messages, tools)
}
```

`InstructionOptions` has two independent halves, each following its own setting: `Recall` (`use_memories`) renders stored memory and the rules for using it, `Capture` (`generate_memories`) renders the rules for writing new memory. The wrapper is skipped entirely only when both are off.

**Frozen per session** — the instruction is rendered on the session's first model call and every later call in that session gets that exact string back, keyed by session id and the rendered options.

This is a prompt-cache requirement, not an optimization. The instruction sits ahead of the entire conversation, so providers serve a cached prefix only while it stays byte-identical; re-reading `memory_summary.md` and the notes directory per call would change the message the moment a note is captured or a consolidation pass lands, invalidating the cached system prompt, tool definitions, and every prior turn. Nothing is lost by waiting: a note captured mid-session is already in that session's transcript, and the next session renders fresh.

### Injection Content Generation

```
RenderTurnInstruction(root, opts)                      (instruction.go)
  ├─ Recall: <workspaceRoot>/memories/memory_summary.md
  │    → os.ReadFile, TrimSpace, skip section if empty
  │    → truncateTextToTokenBudget(content, 2500)       ← truncate to 2500 tokens
  │    → renderTemplate(readPathInstruction, {base_path, memory_summary, tool_guidance})
  ├─ Recall: extensions/ad_hoc/notes/ modified after the consolidation marker
  │    → newest first, capped at 20 notes / 1200 tokens
  │    → renderTemplate(pendingNotesInstruction, {pending_notes})
  └─ Capture: renderTemplate(captureInstruction, {base_path, note_write_guidance})
  → sections joined → InjectDeveloperInstruction
```

`renderTemplate` is a simple `strings.ReplaceAll`: it replaces `{{ base_path }}`, `{{ memory_summary }}` and the other placeholders in the template text with actual values. **All other template text is preserved verbatim.**

Final injected message structure:

```
[System message]
[Developer message: recall section + pending notes + capture section]   ← here
[User/Assistant messages...]
```

### Turn Instruction Template Content

The templates are injected whole, including:

| Template | Section | Description |
|----------|---------|-------------|
| `read_path.md` | Decision boundary | "Skip memory ONLY when..." — when to use memory |
| `read_path.md` | Memory layout | Lists memory_summary.md / MEMORY.md / skills/ / rollout_summaries/ structure |
| `read_path.md` | Quick memory pass | 5-step retrieval workflow guidance |
| `read_path.md` | Citation requirements | `<oai-mem-citation>` format specification |
| `read_path.md` | `{{ memory_summary }}` | Replaced with memory_summary.md content truncated to 2500 tokens |
| `pending_notes.md` | `{{ pending_notes }}` | Notes captured since the last consolidation pass, with their bodies |
| `capture.md` | Capture rules | applicable / durable / legible test, same-reply requirement, what never to store |
| `capture.md` | `{{ note_write_guidance }}` | `memories_add_ad_hoc_note` usage, or the notes path when the tools are off |
| all | `{{ base_path }}` | Replaced with actual path, e.g. `~/.forebrain/workspace/memories` |

### Ways Stored Memory Reaches a Turn

| Method | Mechanism | Automatic? |
|--------|-----------|------------|
| `memory_summary.md` injection | developer message, every LLM call | ✅ Automatic |
| Pending ad-hoc notes injection | developer message, from the next session until consolidated | ✅ Automatic |
| read_path template guided search | Template text guides agent to "search MEMORY.md" | ❌ Depends on LLM initiative |
| Dedicated tools | `memories_search` / `memories_read` / `memories_list` | ❌ Depends on LLM calling tools |

### Injection Prerequisites

1. At least one half is enabled (checked at construction time)
   - Recall: `features.memories=true` **and** `memories.use_memories=true`
   - Capture: `features.memories=true` **and** `memories.generate_memories=true`
   - All three default to true
2. The recall section additionally needs `memory_summary.md` to exist and be non-empty (checked at runtime); the pending-notes section needs at least one unconsolidated note. The capture section has no runtime prerequisite — it renders in an empty workspace, which is where the first rule gets captured.
3. Re-checked on every Execute call

## LLM Provider Compatibility

The injected developer message has role **`developer`** (`llm.RoleDeveloper = "developer"`, `llm.go:260`).

The source code comment specifies: providers that do not support the developer role must map it to their closest instruction role.

| Provider | Role sent to API | Source location |
|----------|-----------------|-----------------|
| OpenAI Responses API | `developer` (native support) | `openai_responses_llm.go:649-654` |
| OpenAI-compatible (DeepSeek, etc.) | **Downgraded to `system`** | `openai_compat_llm.go:1075-1081` |
| Anthropic | **Merged into system parts** | `anthropic_agent_llm.go:194` |

Providers that don't support the `developer` role all downgrade to `system` role — content is never lost.

## Scenario Example: "No Unit Tests" Memory for Project A

### Scenario

The user launches Forebrain Harness TUI from the root of a Java project (Project A) and asks the primary agent to remember: "Project A should not generate unit test code."

### Where Is It Stored?

Memory is stored at the **agent (tenant) level workspace directory**, not the project level:

```
<workspaceRoot>/memories/
```

Where `<workspaceRoot>` = `rt.StateRoot()` = the agent's workspace root (typically `~/.forebrain/workspace`), **unrelated to the Project A path where the user launched the TUI**.

### Write Timeline

```
1. User: "Remember that Project A should not generate unit tests" — or simply
   states it as a standing rule while asking for something else
   → agent calls memories_add_ad_hoc_note (user approves the note body)
   → note immediately written to <workspaceRoot>/memories/extensions/ad_hoc/notes/<timestamp>-<slug>.md
   (at this point the note is NOT in MEMORY.md)

2. Rest of this session: the note is in the transcript, so the rule is in force
   without re-injecting it (the injected instruction is frozen for the session
   to keep the prompt cache valid)

   Every later session: memoryInstructionLLM.Execute finds the note is newer
   than the consolidation marker and injects it into that session's instruction

3. Current turn ends → maybeLaunchMemoryStartup → Pipeline.Run
   → Stage1: MinRolloutIdleHours=6, current session not idle enough, won't be extracted
   → Stage2: runStage2 runs (if 6h cooldown has passed)
     → memoryWorkspaceDiff detects ad-hoc note as a new file
     → consolidation LLM runs, merges note into MEMORY.md + memory_summary.md
     → marker advances, so the note stops being injected separately

4. Subsequent turns
   → memoryInstructionLLM.Execute reads memory_summary.md from disk
   → injects as developer message
   → agent sees the memory and follows it during development
```

### Does It Actually Take Effect?

**Yes, it takes effect** — but with delays and limitations:

| Limitation | Reason | Source |
|-----------|--------|--------|
| Ad-hoc note doesn't immediately appear in memory_summary.md | Only a consolidation pass writes that file; until then the note is injected as a pending note instead | `instruction.go: renderPendingNotesSection` |
| Consolidation has 6-hour cooldown | `phase2CooldownSeconds = 6*60*60` | `jobs.go:29` |
| Consolidation runs asynchronously in background | `LaunchAsync` starts a goroutine; may fail | `pipeline.go:39-52` |

### Can It Be Recalled When Developing Project A?

**After consolidation completes, yes**:

- `memory_summary.md` is automatically injected into the system prompt every turn (truncated to 2500 tokens)
- The read_path.md template guides the agent to search `MEMORY.md` for relevant keywords
- The agent can use `memories_search` / `memories_read` to actively retrieve

### Cross-Project Leakage

::: warning No Project-Dimension Isolation
Memory is stored at the agent (tenant) level under `<workspaceRoot>/memories/`. When the same agent develops Project B, it **will also see** the "Project A should not generate unit tests" memory. The system performs no project-level filtering — whether the constraint applies only to Project A depends entirely on the LLM inferring from the text "Project A" in the memory.
:::

## Configuration Parameters

All memory config options are enabled by default and adjustable via YAML:

```yaml
features:
  memories: true              # master memory switch

memories:
  use_memories: true          # read path switch
  generate_memories: true     # generation (extraction) switch
  dedicated_tools: true       # dedicated memory tools switch
  max_unused_days: 30         # max days stage1 output can go unused (pruned after)
  max_rollout_age_days: 10    # max session age for extraction (days)
  max_rollouts_per_startup: 2 # max sessions extracted per startup
  min_rollout_idle_hours: 6   # hours a session must be idle before extraction
  min_rate_limit_remaining_percent: 25  # minimum rate limit remaining percent
```

Source: `internal/config/config.go:331-374`

## Memory Artifact File Structure

```
<workspaceRoot>/memories/
├── memory_summary.md          # Auto-injected summary index, first line must be v1
├── MEMORY.md                  # Memory handbook, main file for active retrieval
├── raw_memories.md            # Merged Stage1 raw memories (temp file, Phase2 input)
├── rollout_summaries/         # Per-session summary recaps
│   └── <timestamp>-<hash>-<slug>.md
├── skills/                    # Reusable skills
│   └── <skill-name>/
│       └── SKILL.md
├── extensions/
│   └── ad_hoc/
│       ├── instructions.md    # Ad-hoc note consolidation guidance
│       └── notes/             # Captured memories (injected until consolidated)
│           └── <timestamp>-<slug>.md
└── phase2_workspace_diff.md   # Phase2 git diff (temp, not a persistent artifact)
```

## Limitations and Caveats

1. **No project-dimension isolation** — Memory is isolated by tenant. All project memories for the same agent are mixed in a single `MEMORY.md`. Cross-project constraints may interfere with each other.

2. **Consolidation delay** — An ad-hoc note is in force from the moment it is written, because pending notes are injected into every turn, but it does not reach `MEMORY.md` or `memory_summary.md` until a consolidation pass runs — in the worst case after the 6-hour cooldown. Until then it is not searchable through `memories_search`, and it is not deduplicated against what is already remembered.

3. **Depends on LLM judgment** — Memory extraction, consolidation, and retrieval all rely on LLM judgment. Lower-capability models may fail to extract high-signal memories or may miss relevant content during retrieval.

4. **memory_summary.md truncation** — Injection truncates to 2500 tokens. If the summary is too long, the middle portion is truncated (via `MiddleTokens` strategy), potentially losing critical content.

5. **MEMORY.md is not auto-injected** — Only `memory_summary.md` is automatically injected. `MEMORY.md` content requires the agent to actively read it via tools or file search.

## Related

- [Memory Systems](/guide/memory-systems) — Product-level memory overview
- [Context and Compaction](/guide/context-and-compaction) — Session continuity and compaction
- [Memory, Compaction, And Runtime Features](/config/memory-and-runtime-features) — Configuration reference
- [Architecture](/guide/architecture) — Overall architecture
- [中文版本](/guide/memory-internals-zh) — Chinese version of this page
