# 你能做什么

Forebrain Harness 是一个 agent 运行时，带着八项今天就能上手的能力。下面
每一段讲清楚它是什么、你能得到什么、启动它的那一条命令或路径，以及去哪
读更多。

## 在终端里写代码

交互式 TUI 是住在你项目里的编码 agent：读文件、改文件、运行命令，过程
全部可见。

- 从 33 家供应商的 362 个模型里挑一个——或用你的 ChatGPT 套餐登录——并在
  会话中途用 `/model` 切换。
- `/plan` 让 agent 在改动任何东西之前先调查、先提方案；`/goal` 让它朝一个
  目标持续工作直到完成。
- 用 `/resume` 从上次中断的地方继续，或在新的 shell 里执行
  `forebrain resume <session id>`。

用 `cd your-project && forebrain` 启动。读更多：
[快速开始](/zh/guide/getting-started)。

## 作为 API 提供服务

同一个 agent 可以变成服务：`forebrain gateway start` 在你的机器上提供
web UI、REST API 和 WebSocket 聊天。

- web UI 与终端一一对应：同样的聊天、同样的斜杠命令、同样的审批——外加
  agents、projects、providers、permissions、MCP 服务器、语言服务器和定时
  任务的管理页面。
- REST 和 WebSocket 端点覆盖 sessions、runs 与事件、文件、权限、skills 和
  memory，你可以脚本化或嵌入式地驱动 agent。
- 默认跑在 `http://127.0.0.1:6060`；默认要求 token。

用 `forebrain gateway start` 启动。读更多：
[作为 Gateway 运行](/zh/guide/gateway)。

## 在团队的平台里聊天

渠道适配器把 agent 接进团队已经在用的聊天应用。

- 18 个适配器：Telegram、Discord、Slack、WhatsApp、Signal、email、SMS、
  Feishu/Lark、DingTalk、WeCom、WeChat、QQ、Matrix、Mattermost、经
  BlueBubbles 接入的 iMessage、Home Assistant，以及通用 HTTP/WebSocket 桥接。
- 一条渠道消息会开始或续上一个真实的 agent 会话——同样的工具、同样的
  memory、同样的审批，和终端里一模一样。
- 审批在聊天里同样生效，不会因为消息来自 Slack 就放行危险操作。

在 `forebrain.yaml` 的 `agents.definitions.<agent>.channels` 下配置。读更多：
[团队聊天里的 Agent](/zh/guide/chat-channels)。

## 用真正的语言服务器理解代码

代码智能把语言服务器放在 agent 身后，让它像编译器一样读你的代码，而不是
靠文本搜索猜。

- `lsp` 工具能找定义、声明、引用、类型层级、调用层级和符号——还能直接从
  语言服务器报出一次编辑引入的错误。
- 内置目录覆盖 38 个服务器，包括 gopls、pyright、rust-analyzer、
  typescript-language-server、clangd 和 jdtls。
- 你不发话就不会启动：agent 第一次编辑某种语言、而该语言有可用服务器时，
  Forebrain Harness 会先询问。

用 `forebrain lsp list` 查看可用项。读更多：
[代码智能](/zh/guide/code-intelligence)。

## 跨会话记住

Memory 按项目并全局持久化，你给过一次的上下文，下个会话还在。

- Memory 从过去的会话中提炼成持久的 note——不是原始 transcript 回放。
- 检索横跨英文、中文、日文和韩文。
- 在会话里说一句"记住这个"，它就会被写下来，保存前你会先看到这条 note。

在会话里用 `/memories` 驾驭它。读更多：
[跨会话记忆](/zh/guide/memory-systems)。

## 委派给子代理

Subagent 在自己的会话里承接有边界的子任务，主对话保持可读。

- 类型化的 subagent 各司其职：`general-purpose`、只读的 `explore`、
  只做规划的 `plan`，以及对抗式验证的 `verification`。
- 每个子 run 都有跟踪——状态、父 run、输出——委派出去的工作可复查，
  不是一闪而过。
- 子 run 运行时主会话保持空闲，你可以旁观或打断它们。

让 agent 去委派即可触发。读更多：
[委派给子代理](/zh/guide/subagents)。

## 用 Skill 扩展

Skill 是一套可复用的指令包，任务匹配时 agent 会加载它。

- 内置 skill 覆盖 Word、Excel、PowerPoint 和 PDF 文档、代码评审、前端
  设计、图片编辑，以及编写新 skill。
- 项目 skill 放在项目根的 `.forebrain/skills/` 下；全局 skill 放在你的
  Forebrain home 下。
- `/skills` 运行、添加、创建、改进和启停 skill。

用 `/skills` 查看已加载的 skill。读更多：
[用 Skill 扩展](/zh/guide/skills-and-tools)。

## 保持掌控

审批、权限和沙箱是相互独立的层，强大的 agent 永远不会跑出你允许的范围。

- 命令在 macOS、Linux 和 Windows 的操作系统级沙箱里运行；任何需要离开
  沙箱的操作都会先询问。
- `/permissions` 在预设之间切换，审批会在命令运行前展示完整命令。
- Plan mode（`/plan`）把调查和修改分开。

用 `/permissions` 设定你的姿态。读更多：
[保持掌控](/zh/guide/safety-model)。

## 接下来去哪

- [快速开始](/zh/guide/getting-started) — 五分钟跑起来。
- [作为 Gateway 运行](/zh/guide/gateway) — agent 变成 web UI 和 API。
- [保持掌控](/zh/guide/safety-model) — 审批、权限、沙箱。
