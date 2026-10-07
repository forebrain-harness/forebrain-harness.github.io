# 用 Skill 扩展

Skill 是一套可复用的指令包，任务匹配时 agent 会加载它——把团队怎么评审
代码、怎么填模板教一遍，之后的每个会话都受益。

## Skill 是什么

从使用者的位置看：一个带 `SKILL.md` 的文件夹，承载一种做事方式——流程、
标准与约束、参考资料或模板，以及配套脚本或资产。Skill 改变 agent 对待
一类任务的方式；工具改变它真正能做什么。

内置 skill 覆盖 Word、Excel、PowerPoint 和 PDF 文档、代码评审、前端设计、
图片编辑，以及编写新 skill——默认可用，且永不覆盖你自己的同名 skill。

## Skill 从哪来

Forebrain Harness 按优先级从五个根加载 skill——更高优先级根里的同名
skill 遮蔽低优先级的：

| 优先级 | 根 |
| --- | --- |
| 1 | `<current-workspace>/.forebrain/skills` |
| 2 | `$FOREBRAIN_HOME/workspace/skills` |
| 3 | `$FOREBRAIN_HOME/skills` |
| 4 | `~/.agents/skills` |
| 5 | `$FOREBRAIN_HOME/skills/.system` |

实践中：把 skill 放在项目根的 `.forebrain/skills/` 下，与所有在这个项目
上工作的人共享；放在 Forebrain home 之下，则跨项目私有。`$FOREBRAIN_HOME`
是 Forebrain Harness 的数据根（默认 `~/.forebrain`）。

## 在会话里操作 Skill

`/skills` 是唯一入口：运行一个 skill、添加或安装一个、新建一个、改进一个
已有的，以及启停 skill。Gateway web UI 从它的 skills 页面管理同样的
skill——安装、编辑、启停、下载——全局和按项目皆可。

有些 skill 需要服务凭据之类的外部资源；它们放在 `forebrain.yaml` 的
`skills:` 段。见
[Hook 与 Skill 扩展](/zh/config/hooks-and-skill-extensions)。

## 工具是内置的行动集

Skill 说怎么做；工具说能做什么。读改文件、运行 shell 命令、查询版本控制、
web 访问、memory、代码智能、subagent，以及向你提问，都是内置工具——始终
在场，受审批与沙箱约束
（[保持掌控](/zh/guide/safety-model)）。内置之外，MCP 服务器添加外部
工具，hook 自动化工具调用前后发生的事；见
[项目与项目级 MCP](/zh/config/projects-and-mcp) 和
[Hook 与 Skill 扩展](/zh/config/hooks-and-skill-extensions)。

工具、skill 与 subagent 在运行时层面如何配合，见
[架构](/zh/guide/architecture)。

## 接下来去哪

- [保持掌控](/zh/guide/safety-model) — 工具不问就能做什么。
- [委派给子代理](/zh/guide/subagents) — 把有边界的工作交给子 run。
- [Hook 与 Skill 扩展](/zh/config/hooks-and-skill-extensions) — skill
  配置与 hook 自动化。
