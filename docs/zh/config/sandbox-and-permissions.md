# 沙箱与权限

本页是 Forebrain Harness 沙箱控制的配置参考。

本页不解释完整的安全模型。它记录塑造执行隔离与危险回退行为的配置工作面。

## `sandbox_mode`

`sandbox_mode` 恰好接受：

- `read-only`：文件可读，写入被拒绝。
- `workspace-write`：workspace 和配置的可写根可写。
- `danger-full-access`：命令在没有操作系统沙箱的情况下运行。

省略 `sandbox_mode` 时，它从启动项目的信任决定推导：

| 信任决定 | 推导模式 |
| --- | --- |
| 受信任 | `workspace-write` |
| 显式拒绝 | `workspace-write` |
| 尚未判定 | `read-only` |

任何显式决定都换来可写的 workspace，包括拒绝：被拒绝的项目是被它的审批
策略拦住的——凡不是可证明安全的操作都先问——而不是被只读文件系统拦住。
一个没人判定的项目没有这道后盾，所以保护它的是沙箱。

在 Windows 上，除非配置了 `windows.sandbox`，推导保持 `read-only`，否则
没有可依赖的强制手段。

显式设置 `sandbox_mode` 或 `default_permissions` 会禁用推导。推导值是
运行时状态，从不写回 `forebrain.yaml`。

所选沙箱后端不可用时，执行 fail closed。单条命令可以用
`sandbox_permissions: require_escalated` 请求宿主执行；能否弹出审批提示
由 `approval_policy` 控制。

`--yolo` 为该进程把 `approval_policy` 设为 `never`、`sandbox_mode` 设为
`danger-full-access`。

### Go 构建缓存

受信任的 Go 项目自动使用 `$FOREBRAIN_HOME/cache/go/<project-id>` 下的
项目级缓存。Forebrain Harness 为沙箱内命令设置 `GOCACHE`、`GOMODCACHE` 和
`GOTMPDIR`，并把宿主的模块下载缓存以只读 `file://` GOPROXY 暴露。缓存的
依赖按需抽取；Forebrain Harness 从不复制或硬链接完整的宿主模块树。缺失的
依赖仍走配置的上游 GOPROXY，并受正常网络策略约束。

在 `sandbox_workspace_write` 下配置该行为：

```yaml
sandbox_workspace_write:
  go_cache_mode: isolated # isolated（默认）、shared 或 disabled
```

`shared` 授予对 `go env GOCACHE GOMODCACHE` 所报宿主路径的写访问。跨大量项目更快，但让项目里每条沙箱内
命令都能改动那些可丢弃的共享缓存。`disabled` 保持 Go 环境不变。隔离缓存
30 天后修剪，受共享的 10 GiB 配额约束。

## `approval_policy`

`approval_policy` 决定 **Forebrain Harness 何时可以请你批准某件事**。它与
`sandbox_mode` 是两个独立的轴，后者决定一条命令一旦运行可以碰什么。

省略 `approval_policy` 时，它从启动项目的信任决定推导：

| 信任决定 | 推导策略 |
| --- | --- |
| 受信任 | `on-request` |
| 显式拒绝 | `untrusted` |
| 尚未判定 | `on-request` |

没人判定的项目不会被当成被拒绝。与 `sandbox_mode` 一样，推导值是运行时
状态，从不写回 `forebrain.yaml`——持久化它会把推导钉死在一个分支上，
项目的信任决定就无法再改变策略。两个推导相互独立：显式设置
`sandbox_mode` 不会冻结 `approval_policy`，反之亦然。

三个值写成纯字符串：

| 取值 | Forebrain Harness 何时询问 | 对 shell 命令意味着什么 |
| --- | --- | --- |
| `untrusted` | 命令不是可证明安全时就问 | 已知安全的命令运行；其余一切运行前先提示。 |
| `on-request` | 只在命令需要离开沙箱时问 | 命令在沙箱内运行、不提示。 |
| `never` | 从不 | 什么都不提示。本该询问的规则变成拒绝，agent 被限定在沙箱和 allow 规则已经允许的范围内。 |

`on-failure` 作为 `on-request` 的旧拼法被接受。

以下情况使用 `untrusted`：

- 你在一个陌生仓库里工作，想先看到每条命令

以下情况使用 `never`：

- Forebrain Harness 无人值守运行（CI、cron、gateway worker），没人能回应
  提示——配合显式 allow 规则使用，因为未匹配的工作是被拒绝而不是排队

`--yolo` 为该进程把 `approval_policy` 设为 `never`、`sandbox_mode` 设为
`danger-full-access`。这个组合与上面的 `never` 情形相反：既不问任何事，
也不沙箱任何东西。

### `approval_policy.granular`

第四个值是对象而不是字符串，按类别开关询问。必须写成对象——裸字符串
`granular` 会被拒绝。

```yaml
approval_policy:
  granular:
    sandbox_approval: true
    rules: true
    mcp_elicitations: true
    skill_approval: false
    request_permissions: false
```

| 字段 | 类型 | 必填 | 默认 | 它控制的提示 |
| --- | --- | --- | --- | --- |
| `sandbox_approval` | boolean | 是 | — | 命令被沙箱拒绝、想到宿主上运行。 |
| `rules` | boolean | 是 | — | 一条带 `ask` 行为的权限规则命中。 |
| `mcp_elicitations` | boolean | 是 | — | MCP 服务器请求输入。 |
| `skill_approval` | boolean | 否 | `false` | 一个 skill 请求运行。 |
| `request_permissions` | boolean | 否 | `false` | 工具调用 `request_permissions` 申请额外文件系统或网络访问。 |

三个必填字段必须都在；缺任何一个都是配置错误，而不是静默默认。网络审批
和 MCP 工具审批永远提示，在这里不可切换。

以下情况使用 `granular`：

- 你想让无人值守的沙箱提权被拒绝，但仍希望被问到 MCP elicitation 或
  `ask` 规则

### 审批策略与沙箱提权

沙箱拒绝一条命令时，Forebrain Harness 会提议在宿主上运行它。两个策略
拒绝这个提示：`never` 拒绝一切提示，`granular` 配
`sandbox_approval: false` 专门拒绝这一个。在 `untrusted` 和 `on-request`
下提示会显示——一条在沙箱内完不成自己工作的命令，正是这些策略存在要问
的事情。

提示被拒绝的地方，拒绝结果作为命令错误返回给模型，模型应当另找办法。

### 仅运行时模式

还有两个模式存在，但不能写进 `forebrain.yaml`。它们是会话状态，由计划经
`exit_plan_mode` 批准时 Forebrain Harness 提供的四个选择产生：

- `auto-approve`：本会话剩余时间每个工具调用都自动批准。
- `auto-approve-edits`：文件读取、编辑和写入自动批准；其余一切仍遵循
  `approval_policy`。

把它们与 `approval_policy` 分开，意味着批准一个计划不能悄悄改写你配置的
策略。

## `sandbox`

`sandbox` 对象包含细粒度的文件系统、网络、违规和平台后端设置。它不选择
命令是否被沙箱化；那个选择属于 `sandbox_mode`。

## `sandbox.filesystem`

控制沙箱内的文件系统策略。

### 文件系统参考

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `allow_write` | string[] | 空 | 显式可写路径。 |
| `deny_write` | string[] | 空 | 显式拒绝写入路径。 |
| `allow_read` | string[] | 空 | 显式可读路径。 |
| `deny_read` | string[] | 空 | 显式拒绝读取路径。 |
| `allow_managed_read_paths_only` | boolean | `false` | 读取仅限托管路径。 |

以下情况使用 `allow_write`：

- worktree、临时目录或生成物路径必须保持可写

以下情况使用 `deny_write`：

- 你想给系统目录或秘密敏感目录强保护

以下情况使用 `allow_managed_read_paths_only`：

- 即使沙箱存在，Forebrain Harness 也不应读取任意宿主路径

## `sandbox.network`

控制沙箱内的网络策略。

### 网络参考

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `allowed_domains` | string[] | 空 | 允许的出站域名。 |
| `denied_domains` | string[] | 空 | 显式拒绝的出站域名。 |
| `allow_unix_sockets` | string[] | 空 | 显式允许的 Unix socket。 |
| `allow_all_unix_sockets` | boolean | `false` | 允许所有 Unix socket。 |
| `allow_local_binding` | boolean | `false` | 允许本地监听绑定。 |
| `http_proxy_port` | integer | `0` | 本地 HTTP 代理辅助端口。 |
| `socks_proxy_port` | integer | `0` | 本地 SOCKS 代理辅助端口。 |
| `allow_managed_domains_only` | boolean | `false` | 网络访问仅限托管域名。 |

值得知道的校验规则：

- 域名不得包含 scheme、路径、空白或凭据
- 端口必须在 `0` 到 `65535` 之间

以下情况使用 `allowed_domains` 和 `allow_managed_domains_only`：

- Forebrain Harness 应该只能到达一份严格的外部白名单

以下情况使用 `denied_domains`：

- 即使其他网络访问被允许，特定目的地也必须始终被挡

以下情况使用代理端口：

- 沙箱应把流量路由经过本地辅助代理

## `sandbox.ignore_violations`

把工具名映射到 Forebrain Harness 应当容忍的违规类型列表。

形状示例：

```yaml
ignore_violations:
  shell:
    - "network"
  read_file:
    - "path_escape"
```

只在以下情况使用：

- 某个特定工具明确需要一条窄例外
- 你能准确说出哪种违规类型可接受

## `sandbox.enable_weaker_nested_sandbox`

当 Forebrain Harness 自己已经跑在另一个沙箱化环境里时，放宽沙箱行为。

默认：

- `false`

以下情况使用：

- 更严格的嵌套沙箱在你的宿主环境里不可靠

## `sandbox.enable_weaker_network_isolation`

为受限环境放宽网络隔离。

默认：

- `false`

以下情况使用：

- 环境无法支持正常的网络隔离路径

## `sandbox.ripgrep`

控制沙箱内的 `rg` 二进制选择。

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `command` | string | 空 | 要执行的 ripgrep 二进制。 |
| `args` | string[] | 空 | 额外参数。 |
| `argv0` | string | 空 | 可选的 `argv0` 覆盖。 |

以下情况使用：

- 沙箱必须调用特定的 ripgrep 二进制
- 沙箱 wrapper 要求自定义 `argv0`

## 相关页面

- [运行时、Gateway 与渠道](/zh/config/runtime-gateway-and-channels)
- [保持掌控](/zh/guide/safety-model)
- [CLI 命令参考](/zh/guide/cli-command-reference)
