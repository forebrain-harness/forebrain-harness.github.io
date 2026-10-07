# 委派给子代理

把有边界的工作交给在自己会话里运行的子 agent：主对话保持可读，多个子
任务可以同时工作，每个子 run 都有跟踪、可复查。

## 委派带来什么

- **隔离的上下文。** Subagent 有自己的会话，一次大规模调研或一轮验证
  永远不会淹没你的主线程。
- **并行的子工作。** 多个 subagent 可以同时运行，各有自己的状态。
- **可复查的 run。** 每个子 run 记录自己的身份、父 run、任务、状态和
  输出——委派出去的工作可检视，不是一闪而过。

## 类型化的 Subagent

四种角色类型覆盖大多数委派：

- `general-purpose` — 独立的实现或研究任务。
- `explore` — 只读调查与定位事实。
- `plan` — 只读设计与排序，不改代码。
- `verification` — 用具体检查试图证伪或证实工作。

第五种风格是 fork：从父代理当前的上下文出发，作为子分支继续——当子任务
需要与父代理已经理清的内容强连续时很有用。

## 如何触发与旁观

开口即可。"Run a subagent to find every caller of this function" 或
"verify this fix with a subagent" 就够了——agent 通过它的 subagent 工具
委派，你会看到子 run 在 transcript 里启动。

- 在终端里，`/subagents` 打开本次聊天的 subagent 会话选择器，你可以聚焦
  一个子任务、给它发后续指令，或把它的结论收回主线程。
- 在 web UI 里，agents 页面显示实时的主代理与 subagent 行，带取消控件。
- Subagent 历史是会话记录的一部分：TUI、web UI 和 API 都暴露它。

审批同样作用于子任务——subagent 的命令面对与主代理相同的沙箱和权限检查
（[保持掌控](/zh/guide/safety-model)）。

## 什么时候动用一个

- 一个有边界的任务会灌满主对话：全代码库搜索、依赖审计、测试扫一遍。
- 这份工作需要的契约与主线程不同：严格只读的探索，或对抗式验证。
- 你要的是答案而不是绕路——委派、读结果、保持 transcript 干净。

协调模式在运行时层面如何组合，见
[Agent 协作模式](/zh/guide/agent-collaboration-modes)。

## 接下来去哪

- [你能做什么](/zh/guide/what-you-can-do) — 这项能力所属的全景。
- [用 Skill 扩展](/zh/guide/skills-and-tools) — 你的 subagent 也会加载的
  知识包。
- [Agent 协作模式](/zh/guide/agent-collaboration-modes) — 协调的内部原理。
