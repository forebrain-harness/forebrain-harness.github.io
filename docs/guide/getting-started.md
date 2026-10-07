# Getting Started

After this page you will have Forebrain Harness installed, a first session
running in your own project, and a ten-minute tour of the commands that make
it useful.

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

## First Session

Start the agent in your project:

```bash
cd your-project
forebrain
```

Two prompts walk you through the first run:

1. **Trust the workspace.** Forebrain Harness asks whether you trust the
   directory before it will read files, edit code, or run commands there.
   Review the path, accept if it is the directory you mean to work in, and
   decline if you opened the wrong one.
2. **Choose a provider.** Sign in with your ChatGPT plan, or use an API key
   for OpenAI, Anthropic, Google Gemini, DeepSeek, Qwen, xAI, Mistral,
   Moonshot, Z.AI, or MiniMax.

When the session opens, type `/` to see every command and `@` to mention a
file.

## A Ten-Minute Tour

With a session open, try these in order:

1. **Switch models mid-session** — `/model` lists any of 362 models from 33
   vendors and sets reasoning effort.
2. **Give it one real coding task** from your project. You will see it read
   files, edit, and run commands, asking before anything leaves the sandbox.
3. **Plan before changing** — `/plan` puts the agent in plan mode: it
   investigates and proposes, and changes only after you approve the plan.
4. **Make it remember** — say "remember that this project deploys with
   `make release`". The note is shown to you before it is saved, and it is
   back in the next session.

Pick up an earlier session any time with `/resume` inside the TUI, or
`forebrain resume <session id>` from a fresh shell. Coming from Claude Code
or Codex? `/migrate` imports your history — sessions, memories, skills, MCP
servers, and input history.

## Where Next

- [What You Can Do](/guide/what-you-can-do) — every capability at a glance.
- [Run It As A Gateway](/guide/gateway) — the same agent as a web UI and API.
- [Stay In Control](/guide/safety-model) — how approvals and the sandbox work.
