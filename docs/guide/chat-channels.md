# Your Agent In Team Chat

Point your team's chat app at your agent — same engine, same tools, same
memory, same approvals. A channel message starts or continues a real agent
session; it does not stop at message delivery.

## The Adapters

Forebrain Harness ships 18 channel adapters. Each one is configured under
`agents.definitions.<agent>.channels` in `forebrain.yaml`; only the active
primary agent's channels are running, and switching the active agent stops
the old agent's channels and starts the new agent's in their place.

| Platform | What it is | Config key |
| --- | --- | --- |
| Telegram | Bot-token channel; the agent receives events from the Telegram bot API | `channels.telegram` |
| Discord | Bot-token channel over the Discord gateway | `channels.discord` |
| Slack | Bot token plus signing secret, with an inbound webhook route | `channels.slack` |
| WhatsApp | Bridge integration: inbound webhook plus outbound bridge | `channels.whatsapp` |
| Signal | Outbound bridge to a Signal gateway | `channels.signal` |
| Email | Email ingress and egress: inbound webhook plus SMTP outbound | `channels.email` |
| SMS | SMS ingress and egress: inbound webhook plus outbound bridge | `channels.sms` |
| Webhook (generic HTTP bridge) | Anything that can call an HTTP endpoint | `channels.webhook` |
| iMessage (via BlueBubbles) | Connects to a [BlueBubbles](https://bluebubbles.app) server for iMessage | `channels.bluebubbles` |
| Mattermost | Outbound hook bridge to a Mattermost instance | `channels.mattermost` |
| Matrix | Outbound bridge to a Matrix homeserver | `channels.matrix` |
| Home Assistant | Sends through Home Assistant's API | `channels.homeassistant` |
| WeCom | Enterprise WeChat callback integration with encrypted inbound callbacks | `channels.wecom` |
| WeCom (alternate callback) | Second WeCom callback surface for deployments that need another callback route | `channels.wecom_callback` |
| WeChat | Consumer WeChat integration with sender and DM policies | `channels.weixin` |
| Feishu / Lark | App-credential integration; connects over WebSocket by default | `channels.feishu` |
| DingTalk | Client-credential integration over WebSocket | `channels.dingtalk` |
| QQ | App-credential integration over WebSocket | `channels.qq` |

Feishu, DingTalk, and QQ ride on a shared WebSocket bridge engine, so new
WebSocket platforms can be added without a new transport.

Every channel answers the same four questions: is it enabled, where inbound
traffic arrives, where outbound traffic goes, and which credentials it needs.
The full field-by-field reference is
[Runtime, Gateway, And Channels](/config/runtime-gateway-and-channels).

## A Worked Example: Telegram

A bot token is all a Telegram channel needs. In `forebrain.yaml`:

```yaml
agents:
  definitions:
    main:
      channels:
        telegram:
          enabled: true
          bot_token: "${FOREBRAIN_MAIN_TELEGRAM_BOT_TOKEN}"
```

Reference secrets as `${ENV_NAME}` — the config never stores them in plain
text. Start the gateway (`forebrain gateway start`) and message the bot: the
message opens an agent session with the same tools, memory, and approvals as
the terminal.

## Approvals Still Apply

A chat-initiated run has exactly the same guardrails as a terminal-initiated
one: commands run inside the sandbox, and anything that needs to leave it
waits for approval. The pending approval is attached to the session, so you
answer it from the web UI — or by API — exactly as you would any other run.

## Voice Notes

WeChat-family voice messages arrive as Silk audio. Setting
`channels.weixin.silk_voice_decode` to `true` decodes them into text the
agent can read, so a spoken message works like a typed one.

## Where Next

- [Run It As A Gateway](/guide/gateway) — start the service your channels
  attach to.
- [Runtime, Gateway, And Channels](/config/runtime-gateway-and-channels) —
  every channel field and gateway setting.
- [Stay In Control](/guide/safety-model) — approvals, permissions, sandbox.
