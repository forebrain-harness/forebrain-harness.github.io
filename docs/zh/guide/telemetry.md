# 遥测

Forebrain Harness 有一等公民的遥测工作面，用于运行时观测。

本指南解释：

- Forebrain Harness 遥测包含什么
- 遥测与普通调试日志的区别
- 如何启用 OTEL 导出
- 本地调试日志写了什么
- run、tool 和 HTTP span 上挂了哪些数据
- 哪些环境变量影响遥测行为
- 遥测包含敏感数据时要警惕什么

当你需要的是运维可见性、而不是面向用户的工作流帮助时，用这一页。

## 遥测覆盖什么

Forebrain Harness 目前暴露四个不同的遥测层：

1. run span
2. tool span
3. LLM HTTP span
4. 本地调试文件日志

这些层相互关联，但它们不是同一个机制。

| 层 | 用途 | 输出 |
| --- | --- | --- |
| Run span | 一次受监督 run 的生命周期 | OTEL trace span |
| Tool span | 函数调用执行细节 | OTEL trace span |
| LLM HTTP span | 上游原始请求与响应观测 | OTEL trace span |
| Debug 文件日志 | 本地运维检视 | `debug.log` 文件 |

Forebrain Harness 还有一个面向结构化产品/运行时事件的分析事件队列，它与
OTEL tracing 相互独立。

## 遥测对调试日志

不要把遥测压扁成"就是日志"，这一点很重要。

### 遥测

遥测用于：

- 关联上下文的 run tracing
- 函数调用上的 span 属性
- 上游 HTTP 流量上的 span 属性
- 之后按 OTEL 协议导出到外部收集器

遥测是结构化的，挂在运行时执行边界上。

### 调试文件日志

调试文件日志用于：

- 本地检视
- 脱敏后的人类可读请求与响应转储
- 直接读文件时的运维排障

调试文件日志面向文件，不面向 span。

### Forebrain Harness 为什么把两者分开

这个分离要紧，因为 Forebrain Harness 现在支持：

- span 里的完整函数调用参数
- span 里面向预览的函数结果
- span 里的完整 HTTP 请求与响应头和体
- `debug.log` 里脱敏的本地请求与响应日志

它们是不同的观测产品，下游风险不同。

## 默认行为

### Run Span

Forebrain Harness 经由调用 `telemetry.StartRunSpan(...)` 的运行时路径执行
受监督 run 时，创建 run span。

当前的生产接线包括 gateway 与有服务支撑的执行路径所用的 supervisor run
流程。

### Tool Span

Tool span 经由默认的工具中间件链挂接。

它们由共享的工具注册路径施加，而不是每个工具各自施加。这让观测边界与
真实的函数调用对齐，不要求工具作者记得手工埋点。

### HTTP Span

LLM HTTP span 经由共享的 LLM HTTP 传输 wrapper 挂接。

它们独立于本地调试文件日志。只要配置了 OTEL，HTTP trace 收集就是遥测的
一部分，无论本地调试文件日志是否启用。

### 调试文件日志

调试文件日志默认启用，除非通过 `FOREBRAIN_LLM_HTTP_DEBUG` 显式禁用。

这个默认对本地开发和运维调试刻意宽容，但它与 OTEL 导出的敏感度含义不同。

## 配置

当前运行时中的遥测主要由环境变量控制，而不是 Forebrain Harness YAML
设置。

### OTEL 导出

`OTEL_EXPORTER_OTLP_ENDPOINT` 启用 OTEL trace 导出。

它为空时，Forebrain Harness 仍正常运行，但导出的 OTEL tracing 实际关闭。

示例：

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

这个变量存在时，Forebrain Harness 初始化 OTLP HTTP trace exporter 与
tracer provider。

注意：

- `http://localhost:*` 和 `http://127.0.0.1:*` 被视为不安全的 OTLP HTTP
  端点
- Forebrain Harness 目前会剪掉 `http://` 和 `https://`，把端点主机传给
  OTLP HTTP 客户端
- 当前公开配置工作面中没有用于 OTEL exporter 设置的 Forebrain YAML 字段

### 本地调试文件日志

`FOREBRAIN_LLM_HTTP_DEBUG` 控制本地调试文件日志。

可识别的假值：

- `0`
- `false`
- `no`
- `off`

任何其他值，包括省略，都启用本地调试文件日志。

示例：

```bash
export FOREBRAIN_LLM_HTTP_DEBUG=0
```

```bash
export FOREBRAIN_LLM_HTTP_DEBUG=false
```

```bash
unset FOREBRAIN_LLM_HTTP_DEBUG
```

最后一个例子靠回退到默认行为重新启用调试文件日志。

## 输出位置

### OTEL 导出

启用 OTEL 导出时，span 被发送到配置的 OTLP HTTP 端点。

### 本地调试文件

本地调试日志写入：

```text
$FOREBRAIN_HOME/logs/debug.log
```

Forebrain Harness 经由它的数据目录运行时解析有效的 Forebrain Harness
home，然后追加 `logs/debug.log`。

## Run Span

Run span 目前使用的 span 名：

```text
agent.run
```

当前挂接的属性包括：

- `forebrain.run_id`
- `forebrain.session_id`
- `forebrain.trigger`

这些 span 为嵌套的 tool 与 HTTP span 提供父上下文。

## Tool Span

Tool span 目前使用的 span 名模式：

```text
tool.<tool_name>
```

示例：

- `tool.read_file`
- `tool.mcp__codegraph__codegraph_explore`
- `tool.llm_http` — HTTP 层的 trace 步骤

### Tool Span 属性

Forebrain Harness 目前挂接这些基线工具属性：

- `forebrain.run_id`
- `forebrain.step_id`
- `forebrain.tool`

对函数调用式的工具执行，还挂接：

- `forebrain.tool.arguments`
- `forebrain.tool.result_preview`
- `forebrain.tool.result_truncated`
- 工具失败时的 `forebrain.error`

### 函数调用参数

`forebrain.tool.arguments` 包含经工具处理器发送的完整原始 JSON 参数串。

这是刻意全保真的遥测，不是摘要。

### 函数调用结果

Forebrain Harness 默认不把完整工具结果放进 span。

它记录的是：

- `forebrain.tool.result_preview`
- `forebrain.tool.result_truncated`

Preview 从格式化后的工具结果派生，截断到内部预览预算。

当前行为：

- preview 以字符串存储
- 截断由布尔属性显式标示
- 大结果以尾部省略号缩短

这让 tool span 保持有用，又不让任意大的工具输出撑爆 trace 体量。

## LLM HTTP Span

Forebrain Harness 通过当前 OpenAI 兼容、OpenAI Responses 与 Anthropic
运行时路径共用的传输 wrapper，为上游 LLM HTTP 流量埋点。

### HTTP Span 名

HTTP span 目前使用：

```text
tool.llm_http
```

它刻意嵌在共享的工具式 span 模型之下，让 HTTP 调用保持与活跃的
run/tool 执行链关联。

### HTTP Span 属性

Forebrain Harness 目前记录：

- `forebrain.http.method`
- `forebrain.http.url`
- `forebrain.http.request_headers`
- `forebrain.http.request_body`
- `forebrain.http.status_code`
- `forebrain.http.response_headers`
- `forebrain.http.response_body`
- 请求失败时的 `forebrain.error`

### 与调试日志的重要区别

对 OTEL HTTP span，Forebrain Harness 目前记录完整的请求与响应头和体。

对本地调试文件日志，Forebrain Harness 应用面向本地排障输出的头与内容
脱敏。

也就是说：

- span 是高保真遥测
- 调试文件日志是运维可读的调试输出
- 两者不应被视为可互换

## 分析事件

Forebrain Harness 还包含一个内部分析事件队列。

它与 OTEL tracing 不是一回事。

它用于结构化的运行时/产品事件，例如：

- 工具元数据事件
- compact/memory/MCP/API 元数据
- 挂接 sink 的队列投递

本指南聚焦 tracing 与调试日志。接入 sink 时，分析相关的行为请用代码与
配置文档。

## 敏感性与数据处理

这是本页最重要的运维警告。

### 当前 trace 策略

当前的 OTEL span 收集刻意捕获：

- 完整的函数调用参数
- 完整的 HTTP 请求体
- 完整的 HTTP 响应体
- 完整的请求与响应头

如果你的模型、prompt、工具或上游服务可能携带秘密、个人数据、受监管内容
或专有源码文本，你必须把配置的 OTEL 端点当作敏感数据汇。

### 当前调试文件日志策略

本地调试文件日志不同：

- 请求与响应转储为阅读而格式化
- 常见携带认证的头被脱敏
- 内容经过本地日志脱敏层

这比原始 span 导出安全，但在共享或不受信任的环境中仍不应被视为无害。

### 实操指引

在私有环境之外启用 OTEL 导出之前，先决定：

- 收集器跑在哪
- 谁能读 span
- span 如何保留
- prompt 与响应体是否允许离开这台机器
- 导出之前是否需要额外的过滤

## 如何启用遥测

### 仅本地调试

只用本地文件日志、不做 OTEL 导出：

```bash
unset OTEL_EXPORTER_OTLP_ENDPOINT
export FOREBRAIN_LLM_HTTP_DEBUG=1
```

这给你本地调试日志，没有外部 span 导出。

### OTEL 导出且不关本地调试日志

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
export FOREBRAIN_LLM_HTTP_DEBUG=1
```

这同时启用：

- OTEL trace 导出
- 本地调试文件日志

### OTEL 导出且不留本地调试文件

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
export FOREBRAIN_LLM_HTTP_DEBUG=0
```

这保持 tracing 活跃，同时禁用本地调试文件输出。

## 排障

### 设了 `OTEL_EXPORTER_OTLP_ENDPOINT` 却看不到 span

检查：

- Forebrain Harness 是否经由启动时初始化遥测的路径运行
- OTLP 端点是否可达
- 收集器是否接受 OTLP HTTP，而不只是 OTLP gRPC
- 运行时路径是否真的创建受监督 run 或被 trace 的 tool/http 活动

### 看得到调试日志、看不到导出的 trace

那通常意味着：

- `FOREBRAIN_LLM_HTTP_DEBUG` 已启用
- 但 `OTEL_EXPORTER_OTLP_ENDPOINT` 缺失或非法

调试文件日志与 OTEL 导出是两条独立的路径。

### 看得到 trace、看不到 `debug.log`

那通常意味着：

- OTEL 导出已启用
- `FOREBRAIN_LLM_HTTP_DEBUG` 被显式禁用

这是有效且符合预期的状态。

### Trace 载荷太大

当前行为对以下内容刻意高保真：

- 函数调用参数
- HTTP 请求与响应头和体

默认只有函数调用结果做预览截断。

如果 span 体量或载荷大小成为问题，下一步通常是策略工作，而不是运行时
故障。

## 当前产品边界

今天，遥测配置主要由环境变量驱动。

还没有一个完整的公开 Forebrain Harness YAML 遥测策略工作面来覆盖：

- 选择性字段脱敏
- body 采样
- 按传输的 span 截断阈值
- 按环境的导出策略

这意味着运维目前应当把遥测看作：

- 强大
- 高保真
- 对运维有用
- 尚未完全策略化

## 相关页面

- [快速开始](/zh/guide/getting-started)
- [选择你的工作面](/zh/guide/cli-and-surfaces)
- [运行时、Gateway 与渠道](/zh/config/runtime-gateway-and-channels)
- [Hook 与 Skill 扩展](/zh/config/hooks-and-skill-extensions)
