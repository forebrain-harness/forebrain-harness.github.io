# 配置参考

Forebrain Harness 使用一个主运行时配置文件，通常是
`~/.forebrain/forebrain.yaml`。本节是该文件的参考手册。

本节刻意比指南页面更窄：

- `/config/*` 解释每个设置控制什么、怎么用、默认值是什么。
- `/guide/*` 解释产品工作流与系统行为。

## 配置如何解析

Forebrain Harness 按以下顺序解析配置：

1. Forebrain Harness home 目录：
   设了 `FOREBRAIN_HOME` 就用它，否则用 `~/.forebrain`
2. 配置文件：
   Forebrain Harness home 内的 `forebrain.yaml`、`forebrain.yml` 或 `forebrain.json`
3. 环境文件：
   `~/.forebrain/.env` 或 `$FOREBRAIN_HOME/.env`
4. 运行时归一化：
   省略的字段在产品定义了有效默认值的地方被填上

## 秘密的处理

秘密形态的值不得明文存进 `forebrain.yaml`。

改用以下形式之一：

- 空值
- `${ENV_NAME}` 占位符
- `~/.forebrain/.env` 里的对应值

典型示例：

```yaml
gateway:
  auth:
    token: "${FOREBRAIN_GATEWAY_TOKEN}"

agents:
  definitions:
    main:
      llm_providers:
        - provider: openai
          model: gpt-5.4
          config:
            api_key: "${OPENAI_API_KEY}"
```

## 两种默认值

Forebrain Harness 有两种不同的默认值，这个区分很重要。

### `forebrain.yaml` 示例默认值

随包分发的示例文件展示了常见值和大量注释。它们适合当起点，但有些只是
示例，不是运行时保证。

### 有效运行时默认值

有些字段在省略时自动填充。例如：

- `gateway.http_addr` 默认 `127.0.0.1:6060`
- `gateway.auth.mode` 默认 `token`
- `compact.model_auto_compact_token_limit_scope` 默认 `total`
- `compact.remote_compaction_v2` 默认 `true`

下面每一页参考都显式标出有效运行时默认值。

## 作用域地图

编辑配置时按下面的划分找位置。

- [运行时、Gateway 与渠道](/zh/config/runtime-gateway-and-channels)
  覆盖服务运行时、HTTP/gRPC gateway、消息渠道、webhook 路径、集成凭据
  和投递策略。
- [Agent 与模型](/zh/config/agents-and-models)
  覆盖命名 agent、provider 链、agent 默认值、loop guard、heartbeat、
  MCP 服务器、web 搜索、sourcegraph、planning 和运行时策略默认值。
- [沙箱与权限](/zh/config/sandbox-and-permissions)
  覆盖沙箱执行策略、文件系统与网络限制，以及危险回退控制。
- [Memory、压缩与运行时特性](/zh/config/memory-and-runtime-features)
  覆盖 memory 生成、检索与流水线调优、压缩，以及人格选择。
- [Hook 与 Skill 扩展](/zh/config/hooks-and-skill-extensions)
  覆盖生命周期 hook 和 skill 专属扩展配置。

## 本参考覆盖什么

本手册覆盖：

- 主 Forebrain Harness 配置 schema 的每个顶层字段
- 每个字段控制的运行时行为
- 可接受的形状与取值
- Forebrain Harness 定义了的有效默认值
- 一个设置何时要紧的实操建议

## 本参考不做什么

本节不解释这些主题背后的系统设计：

- context assembly
- session compaction 策略
- memory 合并
- subagent 协调
- 安全分层

这些主题记录在 `/guide` 下。

## 快速上手的阅读顺序

如果你第一次配置 Forebrain Harness，按这个顺序读：

1. [运行时、Gateway 与渠道](/zh/config/runtime-gateway-and-channels)
2. [Agent 与模型](/zh/config/agents-and-models)
3. [沙箱与权限](/zh/config/sandbox-and-permissions)
4. [Memory、压缩与运行时特性](/zh/config/memory-and-runtime-features)
5. [Hook 与 Skill 扩展](/zh/config/hooks-and-skill-extensions)

## 相关页面

- [架构](/zh/guide/architecture)
- [上下文与压缩](/zh/guide/context-and-compaction)
- [跨会话记忆](/zh/guide/memory-systems)
