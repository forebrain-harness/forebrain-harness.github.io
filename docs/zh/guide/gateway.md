# 作为 Gateway 运行

你在终端里用的同一个 agent 可以变成服务：web UI、REST API 和 WebSocket
聊天——跑在你的机器或你的服务器上。

## 启动、检查、停止

一组命令管理这项服务：

```bash
forebrain gateway start
forebrain gateway status
forebrain gateway stop
```

- `gateway start` 是唯一启动 gateway 的命令。它默认在
  `http://127.0.0.1:6060` 提供 web UI 和 API。如果首次运行配置缺失且进程
  有终端，setup 会在服务启动前先运行。
- `gateway status` 检查健康端点。
- `gateway stop` 请求优雅停机。

Gateway 默认要求 token。`gateway.auth.mode` 选择认证模式，
`gateway.auth.token` 存放凭据——用 `${ENV_NAME}` 引用它，不要写明文。全部
设置见[运行时、Gateway 与渠道](/zh/config/runtime-gateway-and-channels)。

## Web UI 给你什么

Web UI 中英双语，带有与终端相同的聊天和斜杠命令，不需要重新学一遍。

- 聊天页面：sessions、审批、plan mode 和 subagent 历史。
- 管理页面：agents、projects、providers、permissions、MCP 服务器、语言
  服务器、tools、hooks、memories、channels、定时任务和配置。
- 每个主代理都是独立的租户，有自己的 workspace、sessions 和设置；顶部
  导航的下拉框切换当前 agent，背后与终端 `/agent` 用的是同一份状态。

## API 暴露什么

HTTP 和 WebSocket 工作面覆盖终端驱动的同一个运行时。主要路由家族：

- **Sessions** — 创建并列出聊天会话；读取消息、上下文、todos、plans、
  tool audit 记录和费用汇总。
- **Runs 与事件** — 发送输入、取消 run、流式接收 run 事件。
- **Subagents** — 向子 agent run 发送输入、旁观和管理。
- **审批与权限** — 回应审批请求，审阅和编辑权限规则。
- **文件** — 上传、下载、解析和抽取文本。
- **Skills** — 在全局和项目维度列出、安装、编辑、启停和下载 skill。
- **Memory** — 读写 memory 文件与设置，触发一次重置。
- **Channels** — 读取和更新绑定到 agent 的渠道适配器。
- 此外还有模型与 providers、MCP 服务器、语言服务器、workspace 树与提及、
  定时任务、hooks 和配置。

WebSocket 聊天流式推送的 turn 事件，正是 web UI 消费的那些。

## 带上你自己的客户端

任何能调 HTTP 或打开 WebSocket 的东西都能驱动 agent：脚本、内部工具、
CI 任务，或你自己的前端。通过 API 创建的会话，就是终端里 `/resume` 接续
的那些会话。

## 生产环境注意

基于 token 的认证为多进程而设计：共享 token 的多个副本对 web 会话达成
一致，轮换 token 会同时让所有会话失效。认证设置与渠道接线见
[运行时、Gateway 与渠道](/zh/config/runtime-gateway-and-channels)。

## 接下来去哪

- [团队聊天里的 Agent](/zh/guide/chat-channels) — 接入 Slack、Telegram、
  WeChat 等 15 个更多平台。
- [运行时、Gateway 与渠道](/zh/config/runtime-gateway-and-channels) —
  认证、端口和渠道配置。
