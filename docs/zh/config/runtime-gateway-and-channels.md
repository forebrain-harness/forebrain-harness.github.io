# 运行时、Gateway 与渠道

本页记录 `forebrain.yaml` 面向运行时的部分：

- 顶层运行时身份设置
- gateway 服务行为
- 消息与 webhook 集成

## 顶层运行时设置

### `personality`

控制受支持模型使用的全局人格选择。

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `personality` | string | 文件里为空；实际运行时回退为 `friendly` | 为尊重人格选择的模型选择全局响应风格。 |

可接受的取值：

- `friendly`
- `pragmatic`
- `none`

它影响什么：

- 受支持的 OpenAI 家族模型的全局响应风格选择
- 活跃模型支持显式人格模式时的 agent 语气塑造

它不影响什么：

- 忽略人格设置的模型
- skill 指令
- hooks
- memory prompt

以下情况使用：

- 你想让 Forebrain Harness 跨会话显得更直接、更工程向
- 你想为受支持的模型关闭显式人格选择

## `gateway`

`gateway` 块控制 Forebrain Harness 的服务运行时。

它在这些场景要紧：

- 本地 HTTP 访问
- web 客户端
- API 支撑的会话
- 跨工作面运行

### Gateway 参考

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `gateway.http_addr` | string | `127.0.0.1:6060` | Forebrain Harness gateway 的 HTTP 监听地址。 |
| `gateway.auth.mode` | string | `token` | 选择 gateway 认证模式。 |
| `gateway.auth.token` | string | 空 | Token 认证的 token 凭据。用 `${ENV_NAME}` 引用；明文秘密在启动时被拒绝。 |

### 如何使用 gateway 块

`gateway.http_addr` 是本地起步最重要的字段。

以下情况使用它：

- 你需要 Forebrain Harness 能被浏览器、web 客户端或外部调用方访问
- 你想绑定到非默认的接口或端口

`gateway.auth.*` 在这些场景要紧：

- 把 Forebrain Harness 暴露到严格本地环境之外
- 与必须认证的 web 客户端集成

### 启动输出

`forebrain gateway start` 在套接字打开后打印一条启动横幅：

- Forebrain Harness 字标和本次构建的版本；
- `Routes (N)` —— 本实例应答的每条 HTTP 路由，外加 `WS /ws/chat`
  websocket 端点；
- `Channel routes · <agent> (M)` —— 活跃主代理的 channels 挂载的入站
  端点（未绑定任何渠道时省略）；
- `Web UI` —— 内嵌 web UI 的服务地址；
- `Sign in` —— 携带 gateway token 的一键登录 URL。只在 stdout 是有人正在
  读的终端时打印，token 因此不会落进被捕获的日志文件；
- `Auth` —— 配置的认证模式；
- `Listening on` —— 实际绑定的地址。当 gateway 绑定不指定地址
  （`0.0.0.0`）时，上面可点击的 URL 使用 `127.0.0.1`。

## 消息与集成渠道

Channels 按主代理配置，位于 `agents.definitions.<agent>.channels` 下。没有
顶层渠道配置：一个机器人或入站 webhook 恰好属于一个 agent，到达它上面的
消息会开启一个归该 agent 所有的会话——带着该 agent 的 workspace、memories
和权限。两个主代理可以各自跑自己的 Telegram 机器人或飞书应用，彼此看不
见对方的流量。

只有活跃主代理的 channels 在运行。切换活跃 agent（`/agent`，或 gateway 的
agents API）会停掉上一个 agent 的渠道、换成新 agent 的。

```yaml
agents:
  definitions:
    main:
      channels:
        telegram:
          enabled: true
          bot_token: "${FOREBRAIN_MAIN_TELEGRAM_BOT_TOKEN}"
    acme:
      primary: true
      channels:
        feishu:
          enabled: true
          app_id: "cli_acme"
          app_secret: "${FOREBRAIN_ACME_FEISHU_APP_SECRET}"
```

每条渠道通常回答同样四个问题：

1. 集成是否启用？
2. 入站流量到哪？
3. 出站流量从哪走？
4. 集成需要哪些凭据或策略？

## 常见渠道模式

下面所有段名都相对于
`agents.definitions.<agent>.channels`。

### 简单 bot-token 渠道

这些渠道大多只需要一个 `enabled` 开关和一个 bot token。

| 段 | 字段 |
| --- | --- |
| `telegram` | `enabled`、`bot_token` |
| `discord` | `enabled`、`bot_token` |

以下情况使用它们：

- Forebrain Harness 应直接从平台机器人接口接收事件

### 入站 webhook 加出站桥渠道

这些渠道通常定义：

- `enabled`
- `inbound_path`
- `outbound_url`
- `token`
- `secret`

这个模式适用于：

- `slack`
- `whatsapp`
- `email`
- `sms`
- `webhook`
- `bluebubbles`

### 仅出站桥渠道

这些渠道定义：

- `enabled`
- `outbound_url`
- `token`

这个模式适用于：

- `signal`
- `mattermost`
- `matrix`
- `homeassistant`

### 策略驱动的聊天平台

这些渠道带发送者、群或私信策略控制：

- `weixin`
- `feishu`
- `dingtalk`
- `qq`

## 渠道参考

### `wecom`

主 WeCom 企业回调集成。

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.wecom.enabled` | boolean | `false` | 启用 WeCom 回调处理。 |
| `agents.definitions.<agent>.channels.wecom.token` | string | 空 | 验证 token。 |
| `agents.definitions.<agent>.channels.wecom.encoding_aes_key` | string | 空 | WeCom 回调加密密钥。 |
| `agents.definitions.<agent>.channels.wecom.corp_id` | string | 空 | 企业 corp ID。 |
| `agents.definitions.<agent>.channels.wecom.corp_secret` | string | 空 | 企业应用 secret。 |
| `agents.definitions.<agent>.channels.wecom.agent_id` | integer | `0` | WeCom 应用的 agent ID。 |
| `agents.definitions.<agent>.channels.wecom.callback_path` | string | `/wecom/callback` | Forebrain Harness 暴露的入站回调路由。 |

以下情况使用：

- Forebrain Harness 应直接接收企业 WeCom 回调

### `wecom_callback`

备用 WeCom 回调工作面。

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.wecom_callback.enabled` | boolean | `false` | 启用备用 WeCom 回调工作面。 |
| `agents.definitions.<agent>.channels.wecom_callback.token` | string | 空 | 验证 token。 |
| `agents.definitions.<agent>.channels.wecom_callback.encoding_aes_key` | string | 空 | 加密密钥。 |
| `agents.definitions.<agent>.channels.wecom_callback.corp_id` | string | 空 | Corp ID。 |
| `agents.definitions.<agent>.channels.wecom_callback.corp_secret` | string | 空 | Corp secret。 |
| `agents.definitions.<agent>.channels.wecom_callback.agent_id` | integer | `0` | Agent ID。 |
| `agents.definitions.<agent>.channels.wecom_callback.callback_path` | string | `/wecom_callback/callback` | 备用入站回调路由。 |

### `telegram`

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.telegram.enabled` | boolean | `false` | 启用 Telegram 机器人入站。 |
| `agents.definitions.<agent>.channels.telegram.bot_token` | string | 空 | Telegram bot token。 |

### `discord`

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.discord.enabled` | boolean | `false` | 启用 Discord 机器人入站。 |
| `agents.definitions.<agent>.channels.discord.bot_token` | string | 空 | Discord bot token。 |

### `slack`

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.slack.enabled` | boolean | `false` | 启用 Slack 集成。 |
| `agents.definitions.<agent>.channels.slack.inbound_path` | string | `/channels/slack/inbound` | Slack 入站 webhook 路由。 |
| `agents.definitions.<agent>.channels.slack.outbound_url` | string | 空 | 可选的出站桥 URL。 |
| `agents.definitions.<agent>.channels.slack.bot_token` | string | 空 | Slack bot token。 |
| `agents.definitions.<agent>.channels.slack.secret` | string | 空 | Slack signing secret。 |

以下情况使用：

- Forebrain Harness 必须经 gateway 接收 Slack 事件
- 需要校验 Slack 请求签名

### `whatsapp`

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.whatsapp.enabled` | boolean | `false` | 启用 WhatsApp 桥接集成。 |
| `agents.definitions.<agent>.channels.whatsapp.inbound_path` | string | `/channels/whatsapp/inbound` | 入站 webhook 路由。 |
| `agents.definitions.<agent>.channels.whatsapp.outbound_url` | string | `http://127.0.0.1:3000` | 出站桥端点。 |
| `agents.definitions.<agent>.channels.whatsapp.token` | string | 空 | 集成 token。 |
| `agents.definitions.<agent>.channels.whatsapp.secret` | string | 空 | 集成 secret。 |

`agents.definitions.<agent>.channels.whatsapp.outbound_url` 是少数带内置运行时
默认值的渠道字段之一。不覆盖它时，它假定一个本地桥进程。

### `signal`

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.signal.enabled` | boolean | `false` | 启用 Signal 桥接集成。 |
| `agents.definitions.<agent>.channels.signal.outbound_url` | string | 空 | 出站 Signal 桥端点。 |
| `agents.definitions.<agent>.channels.signal.token` | string | 空 | 集成 token。 |

### `mattermost`

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.mattermost.enabled` | boolean | `false` | 启用 Mattermost 桥接集成。 |
| `agents.definitions.<agent>.channels.mattermost.outbound_url` | string | 空 | 出站 hook 端点。 |
| `agents.definitions.<agent>.channels.mattermost.token` | string | 空 | 集成 token。 |

### `matrix`

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.matrix.enabled` | boolean | `false` | 启用 Matrix 桥接集成。 |
| `agents.definitions.<agent>.channels.matrix.outbound_url` | string | 空 | 出站桥端点。 |
| `agents.definitions.<agent>.channels.matrix.token` | string | 空 | 集成 token。 |

### `homeassistant`

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.homeassistant.enabled` | boolean | `false` | 启用 Home Assistant 集成。 |
| `agents.definitions.<agent>.channels.homeassistant.outbound_url` | string | `http://homeassistant.local:8123` | Home Assistant base URL。 |
| `agents.definitions.<agent>.channels.homeassistant.token` | string | 空 | Home Assistant access token。 |

### `email`

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.email.enabled` | boolean | `false` | 启用邮件进出。 |
| `agents.definitions.<agent>.channels.email.inbound_path` | string | `/channels/email/inbound` | 邮件入站路由。 |
| `agents.definitions.<agent>.channels.email.outbound_url` | string | 空 | 出站邮件桥 URL。 |
| `agents.definitions.<agent>.channels.email.token` | string | 空 | 渠道 token。 |
| `agents.definitions.<agent>.channels.email.secret` | string | 空 | 渠道 secret。 |

### `sms`

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.sms.enabled` | boolean | `false` | 启用短信进出。 |
| `agents.definitions.<agent>.channels.sms.inbound_path` | string | `/channels/sms/inbound` | 短信入站路由。 |
| `agents.definitions.<agent>.channels.sms.outbound_url` | string | 空 | 出站桥 URL。 |
| `agents.definitions.<agent>.channels.sms.token` | string | 空 | 渠道 token。 |
| `agents.definitions.<agent>.channels.sms.secret` | string | 空 | 渠道 secret。 |

### `webhook`

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.webhook.enabled` | boolean | `false` | 启用通用 webhook 摄取。 |
| `agents.definitions.<agent>.channels.webhook.inbound_path` | string | `/channels/webhook/inbound` | 通用入站路由。 |
| `agents.definitions.<agent>.channels.webhook.outbound_url` | string | 空 | 可选的出站回调 URL。 |
| `agents.definitions.<agent>.channels.webhook.token` | string | 空 | 集成 token。 |
| `agents.definitions.<agent>.channels.webhook.secret` | string | 空 | 集成 secret。 |

### `bluebubbles`

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.bluebubbles.enabled` | boolean | `false` | 启用 BlueBubbles 集成。 |
| `agents.definitions.<agent>.channels.bluebubbles.inbound_path` | string | `/channels/bluebubbles/inbound` | 入站路由。 |
| `agents.definitions.<agent>.channels.bluebubbles.outbound_url` | string | 空 | 出站桥 URL。 |
| `agents.definitions.<agent>.channels.bluebubbles.token` | string | 空 | 集成 token。 |
| `agents.definitions.<agent>.channels.bluebubbles.secret` | string | 空 | 集成 secret。 |

### `weixin`

Weixin 比基础 webhook 渠道策略更丰富。

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.weixin.enabled` | boolean | `false` | 启用 Weixin 集成。 |
| `agents.definitions.<agent>.channels.weixin.base_url` | string | `https://ilinkai.weixin.qq.com` | 基础服务 URL。 |
| `agents.definitions.<agent>.channels.weixin.cdn_base_url` | string | 空 | 访问媒体资产的 CDN 基址。 |
| `agents.definitions.<agent>.channels.weixin.token` | string | 空 | Weixin token。 |
| `agents.definitions.<agent>.channels.weixin.account_id` | string | 空 | 账号标识。 |
| `agents.definitions.<agent>.channels.weixin.bot_type` | string | 空 | Bot 风味或渠道标签。 |
| `agents.definitions.<agent>.channels.weixin.channel_version` | string | 空 | 桥版本或协议标签。 |
| `agents.definitions.<agent>.channels.weixin.route_tag` | string | 空 | 内部路由分区标签。 |
| `agents.definitions.<agent>.channels.weixin.silk_voice_decode` | boolean | `false` | 启用 Silk 语音解码。 |
| `agents.definitions.<agent>.channels.weixin.dm_policy` | string | `open` | 私信访问策略。 |
| `agents.definitions.<agent>.channels.weixin.allow_from` | string[] | 空 | 发送者白名单。 |

以下情况使用 `dm_policy` 和 `allow_from`：

- 渠道应只限已批准的发送者
- Forebrain Harness 应在更窄的生产上下文中运行

### `feishu`

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.feishu.enabled` | boolean | `false` | 启用 Feishu 集成。 |
| `agents.definitions.<agent>.channels.feishu.app_id` | string | 空 | App ID。 |
| `agents.definitions.<agent>.channels.feishu.app_secret` | string | 空 | App secret。 |
| `agents.definitions.<agent>.channels.feishu.domain` | string | `feishu` | 域选择器。 |
| `agents.definitions.<agent>.channels.feishu.connection_mode` | string | `websocket` | 连接传输模式。 |
| `agents.definitions.<agent>.channels.feishu.group_policy` | string | `allowlist` | 群访问策略。 |
| `agents.definitions.<agent>.channels.feishu.group_allow_from` | string[] | 空 | 允许的群标识。 |

### `dingtalk`

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.dingtalk.enabled` | boolean | `false` | 启用 DingTalk 集成。 |
| `agents.definitions.<agent>.channels.dingtalk.client_id` | string | 空 | Client ID。 |
| `agents.definitions.<agent>.channels.dingtalk.client_secret` | string | 空 | Client secret。 |
| `agents.definitions.<agent>.channels.dingtalk.dm_policy` | string | `open` | 私信策略。 |
| `agents.definitions.<agent>.channels.dingtalk.group_policy` | string | `open` | 群访问策略。 |
| `agents.definitions.<agent>.channels.dingtalk.allow_from` | string[] | 空 | 私信发送者白名单。 |
| `agents.definitions.<agent>.channels.dingtalk.group_allow_from` | string[] | 空 | 群白名单。 |

### `qq`

| 字段 | 类型 | 默认 | 用途 |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.qq.enabled` | boolean | `false` | 启用 QQ 集成。 |
| `agents.definitions.<agent>.channels.qq.app_id` | string | 空 | QQ app ID。 |
| `agents.definitions.<agent>.channels.qq.client_secret` | string | 空 | QQ client secret。 |
| `agents.definitions.<agent>.channels.qq.allow_from` | string[] | 空 | 发送者白名单。 |

## 环境变量覆盖

凭据存放在 `~/.forebrain/.env`，配置里以 `${ENV_NAME}` 占位符引用，占位符
出现在哪就在哪解析。

渠道秘密按 agent 命名，因为两个主代理可能各自跑同一种渠道、凭据不同，
且绝不能共享同一个变量。Onboarding 以 `FOREBRAIN_<AGENT>_<SECRET>` 的形式
写入它们：

```yaml
agents:
  definitions:
    main:
      channels:
        slack:
          bot_token: "${FOREBRAIN_MAIN_SLACK_BOT_TOKEN}"
          secret: "${FOREBRAIN_MAIN_SLACK_SECRET}"
```

`TELEGRAM_BOT_TOKEN` 这样的裸变量名不再能单独配置一个渠道：环境里任何东西
都无法指名一个 agent，所以渠道秘密只有写在拥有该渠道的 agent 之下、以引用
的形式才能生效。不属于按 agent 划分的 gateway 和 provider 凭据，仍从
`FOREBRAIN_GATEWAY_TOKEN` 和 `OPENAI_API_KEY` 这类名字解析。

以下情况使用环境变量覆盖：

- 同一份配置文件跨环境共享
- 秘密必须待在版本控制之外
- 部署系统在运行时注入凭据

## 相关页面

- [Agent 与模型](/zh/config/agents-and-models)
- [沙箱与权限](/zh/config/sandbox-and-permissions)
- [选择你的工作面](/zh/guide/cli-and-surfaces)
