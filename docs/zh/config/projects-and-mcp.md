# 项目与项目级 MCP

项目把一个工作目录与随它走的设置绑定在一起：会话携带的项目指令、记忆作用域，以及声明在这个目录里的 MCP 服务。本页同时说明这两部分——项目实体本身，以及仓库可以携带的项目级 MCP 文件。

## 项目

项目存在的意义是让目录携带上下文。没有项目时，每个会话都运行在代理级默认值上；有了项目，在项目里开的会话会得到：

- **项目指令**——注入会话开头，并在会话生命周期内冻结。
- **记忆作用域**——跨项目共享，或仅限本项目的记忆。
- **项目级 MCP 服务**——项目根目录下声明的服务（见下一节），与全局列表合并。

主代理是租户：项目与会话、记忆一样，属于某一个代理。

### 创建项目

项目在 web 界面创建（导航中的 **项目**）。一个项目需要：

| 字段 | 含义 |
| --- | --- |
| `name` | 项目名。 |
| `root` | 绑定的工作目录。必须存在、是目录、且不在 Forebrain Harness home 之内。MCP、技能、记忆键、沙箱可写根全部以它为键。 |
| `icon` | 可选的列表标识。 |
| `description` | 一句话说明，只在列表中展示，不进 prompt。 |
| `instructions` | 项目指令，注入会话。 |
| `memory_scope` | `shared`（默认，可跨项目召回）或 `project_only`（仅本项目记忆）。 |
| `resource_access` | 本项目会话能否读取项目目录之外的 agent workspace 资料（文件库、跨项目记忆）。默认开启。 |
| `trust` | 为该目录记录信任决定。必须由操作者显式选择，绝不默认开启。 |

信任一个目录，项目级文件才会生效：未信任目录的项目指令与 MCP 条目都不会进入会话。

### 会话内冻结的内容

项目指令、记忆作用域、MCP 有效列表都在会话启动时解析一次并冻结。修改项目——或项目根下的 MCP 文件——只对**下一个**会话生效。这是有意为之：tools、system prompt 与会话前部的注入内容都被提供方缓存，中途移动其中任何一段都会让整个前缀重新计费。

`/mcp` 会把磁盘上的变化报告为「待新会话生效」，而不是悄悄应用。

## 项目级 MCP 服务

一个文件声明项目级服务——Forebrain Harness 自己的位置：

| 文件 | 形状 |
| --- | --- |
| `<项目根>/.forebrain/mcp_servers.yaml` | 顶层 `mcp_servers:` 列表；条目与 `agents.defaults.mcp_servers` 同构。 |

Forebrain Harness 有意不读取其它 agent 的项目文件（`.mcp.json`、`.codex/config.toml`）。仓库里若有这类文件，`/migrate` 会把条目复制进这个文件；如果同时原生读取，同一仓库里就会有两份各自漂移的事实来源。`/mcp` 发现这类文件时会给出提示。

### 与全局列表合并

- 条目追加到全局 `agents.defaults.mcp_servers` 列表之后。
- 项目条目与全局条目同名（大小写不敏感）时**整条替换**——不做字段合并。`/mcp` 会列出被替换的全局条目。
- 项目条目标记为 `scope=project`；`/mcp`、`/status` 与 web 的 MCP 视图都会显示来源。

### 门控

一个项目条目要进入会话，需要过三道门：

1. **仓库信任。** 启动项目必须是版本控制且被信任的目录——与项目技能同一道门。
2. **逐条确认。** 每个项目条目按指纹（transport、command、args、env、url、headers、oauth、审批模式）确认一次。命令或 URL 一变就会重新询问。确认记录按主代理、按项目存放在
   `<agent workspace>/state/mcp/project_consent.json`。
   - 终端在启动时询问，紧跟 workspace 信任提示之后。
   - web 网关则关闭失败（fail closed）：未确认的条目不进会话，显示为「待确认」，项目页面提供确认入口。
3. **审批收敛。** 项目条目不能放宽审批：缺省模式是 `prompt`，最宽也只到 `prompt`——随 checkout 到达的文件不能给自己的工具免批。

任何一道没过，该条目都不进有效列表，`/mcp` 会用一句话说明原因。

### 环境变量与凭据

项目条目**不读**宿主进程环境。项目条目里的 `${NAME}` 引用只从 `~/.forebrain/.env`——一个只有操作者能写的文件——解析。`inherit_parent_env` 对项目条目无效。

OAuth 凭据按作用域分命名空间：项目条目的令牌存放在
`~/.forebrain/state/mcp-oauth/projects/<projectKey>/<server>.json`，项目条目永远拿不到同名全局服务的令牌。全局条目维持原有的单层路径不变。

### 工作目录与重载

- stdio 传输的项目条目以**项目根**为工作目录。全局条目维持进程工作目录不变。
- 项目文件与全局列表一样，只对**新会话**生效。配置重载不会重建会话已冻结的 MCP 段：连接与由它派生的工具定义原样保留。

### 示例

```yaml
# <项目>/.forebrain/mcp_servers.yaml
mcp_servers:
  - name: docs-index
    transport: stdio
    command: /usr/local/bin/docs-mcp
    args: ["--root", "."]
    default_tools_approval_mode: prompt
```

来自其它 agent 的项目文件条目经 `/migrate` 到达：它写进同一个文件，所以迁移之后 `docs-index` 与迁入的 `graph` 都在这里，各自等待第一次确认。
