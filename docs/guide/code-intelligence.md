# Code Intelligence

The agent reads your code with a real language server behind it — definitions,
references, call hierarchies, diagnostics — instead of guessing from grep.

## What The Agent Gains

With a language server running, the agent's `lsp` tool answers the questions
text search cannot:

- **Where things are** — definitions, declarations, type definitions,
  implementations, and references, returned as file positions it can open.
- **What things are** — hover type information, document and workspace
  symbols, supertypes and subtypes.
- **How things connect** — incoming and outgoing call hierarchies.
- **What just broke** — after an edit, the result lists the errors and
  warnings the edit introduced; later diagnostics reach the agent with its
  next request.

All thirteen lookups are read-only, and every result uses the same 1-based
line numbering as the agent's file reads, so it can act on an answer
immediately.

## The Built-In Catalog

The catalog ships thirty-eight language servers, including gopls (Go),
pyright and pylsp (Python), rust-analyzer (Rust), typescript-language-server
and vtsls (TypeScript/JavaScript), clangd (C/C++), jdtls (Java), ruby-lsp
(Ruby), elixir-ls (Elixir), sourcekit-lsp (Swift), metals (Scala), csharp-ls
(C#), intelephense and phpactor (PHP), zls (Zig), lua-language-server,
dart, kotlin-language-server, haskell-language-server, ocamllsp (OCaml),
bash-language-server, clojure-lsp, elp (Erlang), nil (Nix), gleam,
vue-language-server, svelte-language-server, yaml-language-server,
dockerfile-language-server, terraform-ls, ruff, biome, and eslint.

Every server in the catalog can also be added to or overridden under
`lsp.servers` in `forebrain.yaml`.

## You Decide What Starts

Servers run on your machine, outside the sandbox, and only in trusted
projects — opening a project with a language server enabled is like building
it, so consent is explicit at two levels:

- **The project must be trusted.** Servers never start in untrusted
  directories.
- **Each server needs consent.** None is enabled until you say so: the first
  time the agent edits a file of a language with an available server,
  Forebrain Harness asks, and your answer is remembered for that project.

After consent, servers start lazily in the background — not on the first
frame — share one instance per project, and stop when idle.

## The Commands

```bash
forebrain lsp list             # every server, its switch, and its binary
forebrain lsp doctor           # check one end to end, and what to do about problems
forebrain lsp enable <id>      # enable a server in trusted projects
forebrain lsp disable <id>     # turn a server back off
forebrain lsp install <id>     # install the server binary (runs on your machine)
forebrain lsp recommendations  # per-project suggestions, with `reset` to clear
```

In a session, `/lsp` shows status and handles enable, install, and restart.

An edit waits at most `lsp.diagnostics.wait_ms` (2.5 seconds by default) for
the server's answer and returns as soon as it arrives, so code intelligence
never stalls a turn.

## Where Next

- [Stay In Control](/guide/safety-model) — trust, approvals, and the sandbox
  that language servers sit outside of.
- [Sandbox and Permissions](/config/sandbox-and-permissions) — the full
  permission reference.
