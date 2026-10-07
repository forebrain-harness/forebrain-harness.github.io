# CLI 命令参考

Forebrain Harness 刻意保持很小的命令工作面。受支持的命令恰好是：

```text
forebrain
forebrain resume <session-id>
forebrain gateway start
forebrain gateway status
forebrain gateway stop
forebrain lsp list
forebrain lsp doctor
forebrain lsp enable <id>
forebrain lsp disable <id>
forebrain lsp install <id>
forebrain lsp recommendations
forebrain lsp recommendations reset
```

## 交互命令

### `forebrain`

在交互终端启动 TUI。首次启动时，TUI 会先跑 setup 流程——workspace 信任，
然后是 provider 设置——再打开会话。

### `forebrain resume <session-id>`

启动 TUI 并恢复指定的会话。

## Gateway 命令

`forebrain gateway` 是命令组，不是 start 别名。它后面必须跟 `start`、
`status` 或 `stop`。

### `forebrain gateway start`

启动 gateway 服务——默认在 `http://127.0.0.1:6060` 提供 web UI 和 API。
这是唯一启动 gateway 的 CLI 命令。如果首次运行配置缺失且进程有 TTY，
setup 会在服务启动前先运行。

### `forebrain gateway status`

检查 gateway 健康端点。

### `forebrain gateway stop`

请求 gateway 优雅停机。

## 语言服务器命令

`forebrain lsp` 从 shell 管理代码智能；`/lsp` 在会话内做同样的事。

### `forebrain lsp list`

列出目录里每个服务器、它的启用/禁用开关，以及它将运行的二进制。

### `forebrain lsp doctor`

端到端检查语言服务器，并打印出问题该怎么办。

### `forebrain lsp enable <id>`

在受信任的项目里启用一个语言服务器。

### `forebrain lsp disable <id>`

禁用一个语言服务器。

### `forebrain lsp install <id>`

安装一个语言服务器二进制。安装在你的机器上、沙箱之外进行。

### `forebrain lsp recommendations` · `forebrain lsp recommendations reset`

管理按项目的语言服务器建议；`reset` 清除它们。

服务器给 agent 带来什么、同意机制怎么工作，见
[代码智能](/zh/guide/code-intelligence)。

## 全局标志

受支持的应用标志：

- `--home <directory>`：设置 Forebrain Harness 数据根（`FOREBRAIN_HOME`）。
- `--yolo`：跳过工具审批，可执行工具使用 danger-full-access 执行。

Cobra 标准的 `--help` 和 `--version` 标志仍然可用。`--help` 是唯一的公开
帮助入口；没有冗余的 `help` 子命令。全局标志可以放在子命令之前。

## 刻意不提供的命令

Forebrain Harness 不为 setup、配置、模型选择、memory、skills、会话、认证、
集成或 run 监管提供单独的 CLI 命令。交互操作属于 TUI；渠道和模型管理属于
TUI 或 gateway web UI；共享的运行时语义下沉在两个适配器之下，而不是复制
成 CLI 命令。语言服务器健康有一个 CLI 例外——`forebrain lsp doctor`——
因为它必须能在任何会话存在之前得到回答。

## 相关页面

- [快速开始](/zh/guide/getting-started)
- [选择你的工作面](/zh/guide/cli-and-surfaces)
- [代码智能](/zh/guide/code-intelligence)
- [配置参考](/zh/config/overview)
