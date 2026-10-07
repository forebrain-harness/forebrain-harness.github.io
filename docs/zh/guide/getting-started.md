# 快速开始

读完本页，你将完成 Forebrain Harness 的安装，在自己的项目里跑起第一个
会话，并用十分钟过一遍那些让 agent 真正好用的命令。

## 安装

用 npm 安装（Node.js 18+；macOS arm64/x64、Linux x64/arm64、Windows x64）：

```bash
npm install -g @forebrain-harness/forebrain
```

或用 Go 安装（Go 1.26+ 和一个 C 编译器）：

```bash
CGO_ENABLED=1 go install -tags fts5 github.com/forebrain-harness/forebrain-harness/cmd/forebrain@latest
```

`go install` 构建会在首次需要时自动下载用于中文和日文 memory 检索的分词
词典，之后即可离线工作。每个平台的预编译压缩包都附在
[GitHub release](https://github.com/forebrain-harness/forebrain-harness/releases) 页面上。

验证安装：

```bash
forebrain --version
```

## 第一次会话

在你的项目里启动 agent：

```bash
cd your-project
forebrain
```

首次运行会依次出现两个提示：

1. **信任工作区。** 在读取文件、修改代码或在这个目录里运行命令之前，
   Forebrain Harness 会先询问你是否信任该目录。核对路径：是你要工作的
   目录就接受，开错了就拒绝。
2. **选择 provider。** 用你的 ChatGPT 套餐登录，或使用 OpenAI、Anthropic、
   Google Gemini、DeepSeek、Qwen、xAI、Mistral、Moonshot、Z.AI 或
   MiniMax 的 API key。

会话打开后，输入 `/` 查看全部命令，输入 `@` 提及一个文件。

## 十分钟速览

会话打开后，按顺序试这些：

1. **会话中途切换模型** — `/model` 列出 33 家供应商的 362 个模型，并可
   设置 reasoning effort。
2. **交给它一个真实的编码任务**——从你的项目里挑一个。你会看到它读文件、
   改代码、运行命令，任何要离开沙箱的操作都会先征得同意。
3. **先计划再动手** — `/plan` 让 agent 进入 plan mode：先调查、先提方案，
   你批准计划之后才会修改。
4. **让它记住** — 说一句"记住这个项目用 `make release` 部署"。保存前你会
   先看到这条 note，下一个会话它就回来了。

随时在 TUI 里用 `/resume` 接续早前的会话，或在新的 shell 里执行
`forebrain resume <session id>`。从 Claude Code 或 Codex 过来？
`/migrate` 会导入你的历史——sessions、memories、skills、MCP 服务器和
输入历史。

## 接下来去哪

- [你能做什么](/zh/guide/what-you-can-do) — 所有能力一览。
- [作为 Gateway 运行](/zh/guide/gateway) — 同一个 agent 变成 web UI 和 API。
- [保持掌控](/zh/guide/safety-model) — 审批与沙箱如何工作。
