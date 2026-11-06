# Hook 与 Skill 扩展

本页记录：

- `hooks`
- `skills:` 下的 skill 专属扩展配置

两者都是运行时邻近的设置，但它们不是同一回事。

- `hooks` 改变生命周期自动化
- `skills` 配置暴露自己外部设置的个别 skill

## `hooks`

`hooks` 是事件名到 hook matcher 链的映射。

支持的事件名：

- `PreToolUse`
- `PostToolUse`
- `PostToolUseFailure`
- `Notification`
- `UserPromptSubmit`
- `SessionStart`
- `Stop`
- `SubagentStop`

### Hook 形状

每个事件包含一组 matcher：

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `hooks.<event>[].matcher` | string | 空或 `*` 表示匹配一切 | 选择这个 matcher 作用于哪些查询或工具名。 |
| `hooks.<event>[].hooks` | object[] | 必填 | matcher 命中时按序执行的 hook。 |

### Matcher 行为

Matcher 可以是：

- 空或 `*`，匹配一切
- 简单精确匹配
- `|` 分隔的精确匹配列表
- 正则表达式

### Hook 命令参考

每个 hook 条目可以包含以下字段。

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `type` | string | 必填 | Hook 种类：`command`、`prompt`、`agent` 或 `http`。 |
| `command` | string | 空 | `command` hook 的 shell 命令。 |
| `prompt` | string | 空 | `prompt` 或 `agent` hook 的提示文本。 |
| `url` | string | 空 | `http` hook 的绝对 URL。 |
| `if` | string | 空 | 可选的权限风格规则，如 `shell(git *)`。 |
| `shell` | string | 运行时省略时为 `bash` | 命令 hook 的 shell 解释器。 |
| `timeout` | number | 实际运行时回退为 10 分钟 | Hook 超时（秒）。 |
| `status_message` | string | 空 | Hook 运行期间暴露的状态文本。 |
| `once` | boolean | `false` | 受支持时，每个 matcher 生命周期只运行一次。 |
| `async` | boolean | `false` | 异步运行。 |
| `async_rewake` | boolean | `false` | 异步完成后请求 rewake 行为。 |
| `model` | string | 空 | 尊重模型选择的宿主在 prompt 类 hook 上使用的模型提示。 |
| `headers` | object | 空 | 相关 hook runner 的附加 HTTP 风格头。 |
| `allowed_env_vars` | string[] | 空 | 转发给 hook 进程的环境变量的显式白名单。 |

### 如何安全地使用 Hook

以下情况使用 `PreToolUse`：

- 你想在执行前检视或改写工具输入
- 你想要针对特定工具模式的 hook 驱动审批决定

以下情况使用 `PostToolUse`：

- 你想在成功的工具调用之后做摘要、记录或后续动作

`shell` 工具的 `tool_response` 是结果对象（`stdout`、`stderr`、`exit_code` 等）；命令在 git 工作树里改了文件时还带 `shell_edit_diff`，其中 `changed_files` 列出至多 200 个绝对路径。

以下情况使用 `PostToolUseFailure`：

- 失败的工具调用应触发补救、复查或事故式处理

以下情况使用 `Notification`、`SessionStart`、`Stop` 和 `SubagentStop`：

- Forebrain Harness 应通知外部系统，或产生结构化的运维副作用

放手用 `allowed_env_vars`：

- 不要默认转发完整的父环境
- 只允许 hook 真正需要的变量

## `skills`

`skills:` 块是 skill 专属的扩展工作面。

它是公开 `forebrain.yaml` 生态的一部分，但不像 `gateway`、`agents` 或
`memory` 那样属于主 Forebrain Harness 根 schema。

以下情况使用它：

- 某个 skill 明确记录了 `skills.<skill-name>` 下的配置
- 你想给一个 skill 提供外部连接信息或策略

## 相关页面

- [运行时、Gateway 与渠道](/zh/config/runtime-gateway-and-channels)
- [Agent 与模型](/zh/config/agents-and-models)
- [用 Skill 扩展](/zh/guide/skills-and-tools)
