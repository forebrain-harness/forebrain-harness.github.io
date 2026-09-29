# Getting Started

This is the first guide page for Forebrain Harness. It explains what Forebrain Harness provides, what
to expect during the first run, and where to go next after the interactive
session opens.

## What Forebrain Harness Provides

Forebrain Harness combines several capabilities in one local runtime:

- an interactive terminal for direct coding work
- a gateway service for API-backed usage
- configurable agents and model providers
- memory features for retrieval, recall, and summarization
- reusable skills and callable tools
- subagents for structured execution
- permission and sandbox controls around tool execution

For a new user, the main goal is to reach a valid interactive session first.
After that, the rest of the guide explains the core runtime surfaces and
features.

## Install

Install with npm (Node.js 18+; macOS arm64/x64, Linux x64/arm64, Windows x64):

```bash
npm install -g @forebrain-harness/forebrain
```

Or with Go (Go 1.26+ and a C compiler):

```bash
CGO_ENABLED=1 go install -tags fts5 github.com/forebrain-harness/forebrain-harness/cmd/forebrain@latest
```

A `go install` build downloads the tokenization dictionaries used for Chinese
and Japanese memory search automatically the first time they are needed, and
works offline afterwards. Prebuilt archives for every platform are attached to
each [GitHub release](https://github.com/forebrain-harness/forebrain-harness/releases).

Verify the installation:

```bash
forebrain --version
```

## What You Need

Before starting Forebrain Harness, make sure you have:

- a local terminal session
- a [Forebrain Harness installation](#install)
- valid model-provider credentials for the main agent
- a workspace you are willing to trust for file access and tool execution

## Start An Interactive Session

A clean first run is not just "open chat immediately". Forebrain Harness performs a gated
startup flow so the interactive session begins in a valid state.

```mermaid
flowchart TD
    A["Launch Forebrain Harness"] --> B["Confirm interactive terminal"]
    B --> C["Trust the workspace"]
    C --> D["Complete first-time setup if needed"]
    D --> E["Validate main agent model configuration"]
    E --> F["Open session"]
    F --> G["Enter interactive runtime"]
```

### Step 1: Launch Forebrain Harness Interactively

Start Forebrain Harness through its interactive entry path.

If Forebrain Harness does not detect a real terminal, it will not continue into the main
interactive experience. That is expected: Forebrain Harness distinguishes interactive and
non-interactive entry conditions.

### Step 2: Trust The Workspace

If this is your first time entering the current workspace, Forebrain Harness asks whether
the workspace should be trusted.

This matters because Forebrain Harness is designed for file access, code editing, tool
execution, and other operations that should not silently begin in an unknown
directory context.

When prompted:

1. review the workspace path
2. accept trust if this is the directory you intend to work in
3. decline if you opened the wrong location

### Step 3: Complete Initial Setup

On a fresh installation, Forebrain Harness may enter a first-time setup flow before opening
the main session.

The purpose of this setup stage is to ensure the runtime does not start in a
half-configured state.

Typical outcomes:

- Forebrain Harness proceeds directly if setup is already complete
- Forebrain Harness guides you through onboarding if required configuration is missing

### Step 4: Confirm Main Model Readiness

Forebrain Harness requires a working primary model configuration for the main agent before
the session starts.

At this stage, a working setup means:

- a provider is selected
- a model is selected
- required credentials and connection details are available

If that configuration is incomplete, Forebrain Harness stops and asks you to fix it rather
than entering a misleading partial session.

### Step 5: Enter The Runtime

Once the startup checks pass, Forebrain Harness opens the session and launches the
interactive runtime.

Expected capabilities include:

- entering prompts
- seeing session state
- using slash commands
- working through run results and approvals

## Choose The Right Surface

Forebrain Harness exposes more than one product surface. Start with the interactive
terminal unless you specifically need service-backed usage.

### Interactive Terminal

Use this surface when you want:

- terminal-first coding work
- slash commands
- approvals in context
- visible session and run continuity

### Gateway Service

Use the gateway path when you want:

- API-backed usage
- shared access patterns
- web-oriented workflows
- runtime APIs and service health management

The gateway path still depends on valid setup and model configuration.

### Management CLI

Use command-oriented workflows when you need to inspect or operate Forebrain Harness:

- runtime status
- model configuration
- memory state
- skills
- active or recent runs

## First Checks To Run

After Forebrain Harness is installed, these are the most useful checks to perform early:

- inspect runtime status
- verify the configured model provider
- confirm configuration loading
- confirm memory status
- list installed skills

These checks tell you whether Forebrain Harness is merely installed or actually ready for
useful work.

## Common Misunderstandings

### Forebrain Harness Is Not Only A Chat Interface

Forebrain Harness has multiple user surfaces and operational workflows. Some features are
best understood as runtime systems rather than UI buttons.

### Startup Validation Is Intentional

Forebrain Harness validates trust, setup, and model readiness before starting the main
interactive experience. That is part of the product design.

### Not Every Feature Belongs To The Same Layer

Some concerns belong to the interactive experience, some belong to the gateway
service, and some are shared runtime systems used by both.

## Troubleshooting

### Forebrain Harness Does Not Enter The Interactive Shell

Most often, one of these is true:

- the session is not running in an interactive terminal
- workspace trust has not been granted yet
- initial setup is incomplete
- the main agent model configuration is missing or invalid

### Forebrain Harness Keeps Redirecting Into Setup

That usually means the installation is present but not operationally ready yet.
Finish the required onboarding or model configuration instead of retrying the
same launch path unchanged.

### You Expected A Gateway Or Web Experience

Start with the gateway workflow rather than the interactive shell workflow.

## Continue Reading

1. [CLI and Surfaces](/guide/cli-and-surfaces)
2. [Architecture](/guide/architecture)
3. [Context and Compaction](/guide/context-and-compaction)
4. [Memory Systems](/guide/memory-systems)
5. [Skills and Tools](/guide/skills-and-tools)
6. [Subagents](/guide/subagents)
7. [Safety Model](/guide/safety-model)
8. [CLI Command Reference](/guide/cli-command-reference)
9. [Telemetry](/guide/telemetry)
