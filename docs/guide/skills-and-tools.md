# Extend With Skills

A skill is a reusable instruction pack your agent loads when a task matches
it — teach the agent once how your team reviews code or fills in a template,
and every later session benefits.

## What A Skill Is

From the user's seat: a folder with a `SKILL.md` that carries a way of
working — a process, standards and constraints, references or templates, and
supporting scripts or assets. Skills change how the agent approaches a class
of tasks; tools change what it can actually do.

Bundled skills cover Word, Excel, PowerPoint, and PDF documents, code
review, frontend design, image editing, and writing new skills — available
by default, and never overriding your own same-named skill.

## Where Skills Come From

Forebrain Harness loads skills from five roots, in priority order — a
same-name skill in a higher root shadows the lower one:

| Priority | Root |
| --- | --- |
| 1 | `<current-workspace>/.forebrain/skills` |
| 2 | `$FOREBRAIN_HOME/workspace/skills` |
| 3 | `$FOREBRAIN_HOME/skills` |
| 4 | `~/.agents/skills` |
| 5 | `$FOREBRAIN_HOME/skills/.system` |

In practice: put a skill in `.forebrain/skills/` at your project root to
share it with everyone who works on the project; put it under your
Forebrain home to keep it personal across projects. `$FOREBRAIN_HOME` is
Forebrain Harness's data root (`~/.forebrain` by default).

## Work With Skills In A Session

`/skills` is the single surface: run a skill, add or install one, create a
new one, improve an existing one, and toggle skills on or off. The gateway
web UI manages the same skills from its skills page — install, edit, toggle,
download — globally and per project.

Some skills need external resources such as service credentials; those go
under the `skills:` section of `forebrain.yaml`. See
[Hooks And Skill Extensions](/config/hooks-and-skill-extensions).

## Tools Are The Built-In Action Set

Skills say how; tools say what. Reading and editing files, running shell
commands, querying version control, web access, memory, code intelligence,
subagents, and asking you a question are all built-in tools — always
present, governed by approvals and the sandbox
([Stay In Control](/guide/safety-model)). Beyond the built-ins, MCP servers
add external tools, and hooks automate what happens around tool calls; see
[Projects And Project-Level MCP](/config/projects-and-mcp) and
[Hooks And Skill Extensions](/config/hooks-and-skill-extensions).

How tools, skills, and subagents fit together at the runtime level is
covered in [Architecture](/guide/architecture).

## Where Next

- [Stay In Control](/guide/safety-model) — what tools may do without asking.
- [Delegate To Subagents](/guide/subagents) — hand bounded work to child runs.
- [Hooks And Skill Extensions](/config/hooks-and-skill-extensions) — skill
  config and hook automation.
