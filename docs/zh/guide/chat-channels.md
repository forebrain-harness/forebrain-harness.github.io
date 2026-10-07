# 团队聊天里的 Agent

把团队的聊天应用指向你的 agent——同一个引擎、同样的工具、同样的 memory、
同样的审批。一条渠道消息会开始或续上真实的 agent 会话，而不止于消息送达。

## 适配器

Forebrain Harness 自带 18 个渠道适配器。每个都在 `forebrain.yaml` 的
`agents.definitions.<agent>.channels` 下配置；只有当前活跃主代理的
channels 在运行，切换活跃 agent 会停掉旧 agent 的渠道、换成新 agent 的。

| 平台 | 它是什么 | 配置键 |
| --- | --- | --- |
| Telegram | Bot-token 渠道；agent 从 Telegram bot API 接收事件 | `channels.telegram` |
| Discord | 经 Discord gateway 的 bot-token 渠道 | `channels.discord` |
| Slack | Bot token 加 signing secret，带一条入站 webhook 路由 | `channels.slack` |
| WhatsApp | 桥接集成：入站 webhook 加出站桥 | `channels.whatsapp` |
| Signal | 出站桥，接到一个 Signal gateway | `channels.signal` |
| Email | 邮件进出：入站 webhook 加 SMTP 出站 | `channels.email` |
| SMS | 短信进出：入站 webhook 加出站桥 | `channels.sms` |
| Webhook（通用 HTTP 桥） | 任何能调 HTTP 端点的东西 | `channels.webhook` |
| iMessage（经 BlueBubbles） | 连接一台 [BlueBubbles](https://bluebubbles.app) 服务器收发 iMessage | `channels.bluebubbles` |
| Mattermost | 到 Mattermost 实例的出站 hook 桥 | `channels.mattermost` |
| Matrix | 到 Matrix homeserver 的出站桥 | `channels.matrix` |
| Home Assistant | 经 Home Assistant 的 API 发送 | `channels.homeassistant` |
| WeCom | 企业微信回调集成，入站回调加密 | `channels.wecom` |
| WeCom（备用回调） | 第二个 WeCom 回调工作面，给需要另一条回调路由的部署用 | `channels.wecom_callback` |
| WeChat | 个人微信集成，带发送者与私信策略 | `channels.weixin` |
| Feishu / Lark | 应用凭据集成；默认经 WebSocket 连接 | `channels.feishu` |
| DingTalk | 经 WebSocket 的客户端凭据集成 | `channels.dingtalk` |
| QQ | 经 WebSocket 的应用凭据集成 | `channels.qq` |

Feishu、DingTalk 和 QQ 跑在同一个 WebSocket 桥接引擎上，所以新的
WebSocket 平台不需要新传输层就能接入。

每条渠道回答同样四个问题：是否启用、入站流量到哪、出站流量从哪走、需要
哪些凭据。逐字段参考见
[运行时、Gateway 与渠道](/zh/config/runtime-gateway-and-channels)。

## 一个完整示例：Telegram

一个 bot token 就是 Telegram 渠道的全部所需。在 `forebrain.yaml` 里：

```yaml
agents:
  definitions:
    main:
      channels:
        telegram:
          enabled: true
          bot_token: "${FOREBRAIN_MAIN_TELEGRAM_BOT_TOKEN}"
```

用 `${ENV_NAME}` 引用秘密——配置从不明文存储它们。启动 gateway
（`forebrain gateway start`）并给机器人发消息：这条消息会打开一个 agent
会话，工具、memory、审批与终端完全一致。

## 审批照样生效

聊天发起的 run 与终端发起的 run 有完全相同的护栏：命令在沙箱内运行，
任何需要离开沙箱的操作都等待审批。待审批项挂在会话上，你从 web UI——或
经 API——回应它，和其他任何 run 一模一样。

## 语音消息

微信家族的语音消息以 Silk 音频到达。把 `channels.weixin.silk_voice_decode`
设为 `true` 会把它们解码成 agent 能读的文本，说一段话和打一段字一样可用。

## 接下来去哪

- [作为 Gateway 运行](/zh/guide/gateway) — 启动渠道依附的那项服务。
- [运行时、Gateway 与渠道](/zh/config/runtime-gateway-and-channels) —
  每一个渠道字段和 gateway 设置。
- [保持掌控](/zh/guide/safety-model) — 审批、权限、沙箱。
