# Runtime, Gateway, And Channels

This page documents the runtime-facing parts of `forebrain.yaml`:

- top-level runtime identity settings
- gateway service behavior
- messaging and webhook integrations

## Top-Level Runtime Settings

### `personality`

Controls the global personality selection used by supported models.

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `personality` | string | empty in file; effective runtime fallback is `friendly` | Selects global response style for models that honor personality selection. |

Accepted values:

- `friendly`
- `pragmatic`
- `none`

What it affects:

- global response style selection for supported OpenAI-family models
- agent tone shaping when the active model supports explicit personality mode

What it does not affect:

- models that ignore personality settings
- skill instructions
- hooks
- memory prompts

Use it when:

- you want Forebrain Harness to feel more direct and engineering-oriented across sessions
- you want to disable explicit personality selection for supported models

## `gateway`

The `gateway` block controls Forebrain Harness's service runtime.

It matters for:

- local HTTP access
- web clients
- API-backed sessions
- cross-surface operation

### Gateway Reference

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `gateway.http_addr` | string | `127.0.0.1:6060` | HTTP listen address for the Forebrain Harness gateway. |
| `gateway.cors_origins` | string[] | `http://127.0.0.1:5173`, `http://localhost:5173`, `http://127.0.0.1:3000`, `http://localhost:3000` | Browser origins allowed by CORS. |
| `gateway.auth.mode` | string | `token` | Selects gateway auth mode. |
| `gateway.auth.token` | string | empty | Token credential for token-based auth. |
| `gateway.auth.password` | string | empty | Password credential for password-based auth if used. |
| `gateway.grpc.port` | string | empty | Optional gRPC port for gateway-side runtime services. |
| `gateway.banner` | boolean | unset unless configured | Enables or disables gateway banner output. |
| `gateway.banner_text` | string | empty | Custom text shown in the banner. |
| `gateway.manage_enable` | boolean | unset unless configured | Enables management endpoints when supported by the runtime. |
| `gateway.enable_response_gzip` | boolean | unset unless configured | Enables gzip compression for responses. |
| `gateway.log_req_enable` | boolean | unset unless configured | Logs inbound gateway requests. |
| `gateway.route_root_path` | string | empty | Prefix root for gateway routes. |
| `gateway.write_timeout` | string | empty | HTTP write timeout duration. |
| `gateway.read_timeout` | string | empty | HTTP read timeout duration. |
| `gateway.idle_timeout` | string | empty | HTTP idle timeout duration. |
| `gateway.grace_timeout` | string | empty | Graceful shutdown timeout. |
| `gateway.service_name` | string | empty | Service identity label. |
| `gateway.service_group` | string | empty | Service grouping label. |
| `gateway.service_version` | string | empty | Service version label. |
| `gateway.log_level` | string | empty | Gateway log verbosity level. |
| `gateway.log_path` | string | empty | Output directory for gateway logs. |
| `gateway.log_caller` | boolean | unset unless configured | Includes caller metadata in logs. |
| `gateway.log_discard` | boolean | unset unless configured | Discards gateway logs entirely. |

### How To Use The Gateway Block

`gateway.http_addr` is the most important field for local bring-up.

Use it when:

- you need Forebrain Harness reachable by a browser, web client, or external caller
- you want to bind to a non-default interface or port

`gateway.cors_origins` matters when:

- you are serving the docs, UI, or a local web app from a different origin
- browser requests fail because of CORS

`gateway.auth.*` matters when:

- exposing Forebrain Harness beyond a strictly local environment
- integrating with a web client that must authenticate

The timeout fields matter when:

- you are proxying long-running requests
- large responses or slow clients cause connection churn

The service identity and logging fields matter when:

- you run Forebrain Harness as part of a larger platform
- you need clearer service metadata in logs or observability pipelines

## Messaging And Integration Channels

Channels are configured per primary agent, under
`agents.definitions.<agent>.channels`. There is no top-level channel
configuration: a bot or an inbound webhook belongs to exactly one agent, and a
message arriving on it starts a session owned by that agent — with that agent's
workspace, memories and permissions. Two primary agents can each run their own
Telegram bot or Feishu app without either seeing the other's traffic.

Only the active primary agent's channels are running. Switching the active
agent (`/agent`, or the gateway's agents API) stops the previous agent's
channels and starts the new agent's in their place.

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

Each channel typically answers the same four questions:

1. is the integration enabled?
2. where does inbound traffic arrive?
3. where does outbound traffic go?
4. which credentials or policies does the integration require?

## Common Channel Patterns

All section names below are relative to
`agents.definitions.<agent>.channels`.

### Simple bot-token channels

These channels mostly require an `enabled` switch and a bot token.

| Section | Fields |
| --- | --- |
| `telegram` | `enabled`, `bot_token` |
| `discord` | `enabled`, `bot_token` |

Use them when:

- Forebrain Harness should receive events directly from the platform bot interface

### Inbound webhook plus outbound bridge channels

These channels usually define:

- `enabled`
- `inbound_path`
- `outbound_url`
- `token`
- `secret`

This pattern applies to:

- `slack`
- `whatsapp`
- `email`
- `sms`
- `webhook`
- `bluebubbles`

### Outbound bridge-only channels

These channels define:

- `enabled`
- `outbound_url`
- `token`

This pattern applies to:

- `signal`
- `mattermost`
- `matrix`
- `homeassistant`

### Policy-driven chat platforms

These channels include sender, group, or DM policy controls:

- `weixin`
- `feishu`
- `dingtalk`
- `qq`

## Channel Reference

### `wecom`

Primary WeCom enterprise callback integration.

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.wecom.enabled` | boolean | `false` | Enables WeCom callback handling. |
| `agents.definitions.<agent>.channels.wecom.token` | string | empty | Verification token. |
| `agents.definitions.<agent>.channels.wecom.encoding_aes_key` | string | empty | WeCom callback encryption key. |
| `agents.definitions.<agent>.channels.wecom.corp_id` | string | empty | Enterprise corp ID. |
| `agents.definitions.<agent>.channels.wecom.corp_secret` | string | empty | Enterprise app secret. |
| `agents.definitions.<agent>.channels.wecom.agent_id` | integer | `0` | WeCom application agent ID. |
| `agents.definitions.<agent>.channels.wecom.callback_path` | string | `/wecom/callback` | Inbound callback route exposed by Forebrain Harness. |

Use it when:

- Forebrain Harness should receive enterprise WeCom callbacks directly

### `wecom_callback`

Alternate WeCom callback surface.

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.wecom_callback.enabled` | boolean | `false` | Enables the alternate WeCom callback surface. |
| `agents.definitions.<agent>.channels.wecom_callback.token` | string | empty | Verification token. |
| `agents.definitions.<agent>.channels.wecom_callback.encoding_aes_key` | string | empty | Encryption key. |
| `agents.definitions.<agent>.channels.wecom_callback.corp_id` | string | empty | Corp ID. |
| `agents.definitions.<agent>.channels.wecom_callback.corp_secret` | string | empty | Corp secret. |
| `agents.definitions.<agent>.channels.wecom_callback.agent_id` | integer | `0` | Agent ID. |
| `agents.definitions.<agent>.channels.wecom_callback.callback_path` | string | `/wecom_callback/callback` | Alternate inbound callback route. |

### `telegram`

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.telegram.enabled` | boolean | `false` | Enables Telegram bot ingress. |
| `agents.definitions.<agent>.channels.telegram.bot_token` | string | empty | Telegram bot token. |

### `discord`

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.discord.enabled` | boolean | `false` | Enables Discord bot ingress. |
| `agents.definitions.<agent>.channels.discord.bot_token` | string | empty | Discord bot token. |

### `slack`

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.slack.enabled` | boolean | `false` | Enables Slack integration. |
| `agents.definitions.<agent>.channels.slack.inbound_path` | string | `/channels/slack/inbound` | Slack inbound webhook route. |
| `agents.definitions.<agent>.channels.slack.outbound_url` | string | empty | Optional outbound bridge URL. |
| `agents.definitions.<agent>.channels.slack.bot_token` | string | empty | Slack bot token. |
| `agents.definitions.<agent>.channels.slack.secret` | string | empty | Slack signing secret. |

Use it when:

- Forebrain Harness must receive Slack events through the gateway
- Slack request signature validation is required

### `whatsapp`

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.whatsapp.enabled` | boolean | `false` | Enables WhatsApp bridge integration. |
| `agents.definitions.<agent>.channels.whatsapp.inbound_path` | string | `/channels/whatsapp/inbound` | Inbound webhook route. |
| `agents.definitions.<agent>.channels.whatsapp.outbound_url` | string | `http://127.0.0.1:3000` | Outbound bridge endpoint. |
| `agents.definitions.<agent>.channels.whatsapp.token` | string | empty | Integration token. |
| `agents.definitions.<agent>.channels.whatsapp.secret` | string | empty | Integration secret. |

`agents.definitions.<agent>.channels.whatsapp.outbound_url` is one of the few channel fields with a built-in runtime
default. It assumes a local bridge process unless you override it.

### `signal`

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.signal.enabled` | boolean | `false` | Enables Signal bridge integration. |
| `agents.definitions.<agent>.channels.signal.outbound_url` | string | empty | Outbound Signal bridge endpoint. |
| `agents.definitions.<agent>.channels.signal.token` | string | empty | Integration token. |

### `mattermost`

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.mattermost.enabled` | boolean | `false` | Enables Mattermost bridge integration. |
| `agents.definitions.<agent>.channels.mattermost.outbound_url` | string | empty | Outbound hook endpoint. |
| `agents.definitions.<agent>.channels.mattermost.token` | string | empty | Integration token. |

### `matrix`

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.matrix.enabled` | boolean | `false` | Enables Matrix bridge integration. |
| `agents.definitions.<agent>.channels.matrix.outbound_url` | string | empty | Outbound bridge endpoint. |
| `agents.definitions.<agent>.channels.matrix.token` | string | empty | Integration token. |

### `homeassistant`

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.homeassistant.enabled` | boolean | `false` | Enables Home Assistant integration. |
| `agents.definitions.<agent>.channels.homeassistant.outbound_url` | string | `http://homeassistant.local:8123` | Home Assistant base URL. |
| `agents.definitions.<agent>.channels.homeassistant.token` | string | empty | Home Assistant access token. |

### `email`

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.email.enabled` | boolean | `false` | Enables email ingress and egress. |
| `agents.definitions.<agent>.channels.email.inbound_path` | string | `/channels/email/inbound` | Email inbound route. |
| `agents.definitions.<agent>.channels.email.outbound_url` | string | empty | Outbound mail bridge URL. |
| `agents.definitions.<agent>.channels.email.token` | string | empty | Channel token. |
| `agents.definitions.<agent>.channels.email.secret` | string | empty | Channel secret. |

### `sms`

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.sms.enabled` | boolean | `false` | Enables SMS ingress and egress. |
| `agents.definitions.<agent>.channels.sms.inbound_path` | string | `/channels/sms/inbound` | SMS inbound route. |
| `agents.definitions.<agent>.channels.sms.outbound_url` | string | empty | Outbound bridge URL. |
| `agents.definitions.<agent>.channels.sms.token` | string | empty | Channel token. |
| `agents.definitions.<agent>.channels.sms.secret` | string | empty | Channel secret. |

### `webhook`

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.webhook.enabled` | boolean | `false` | Enables generic webhook ingestion. |
| `agents.definitions.<agent>.channels.webhook.inbound_path` | string | `/channels/webhook/inbound` | Generic inbound route. |
| `agents.definitions.<agent>.channels.webhook.outbound_url` | string | empty | Optional outbound callback URL. |
| `agents.definitions.<agent>.channels.webhook.token` | string | empty | Integration token. |
| `agents.definitions.<agent>.channels.webhook.secret` | string | empty | Integration secret. |

### `bluebubbles`

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.bluebubbles.enabled` | boolean | `false` | Enables BlueBubbles integration. |
| `agents.definitions.<agent>.channels.bluebubbles.inbound_path` | string | `/channels/bluebubbles/inbound` | Inbound route. |
| `agents.definitions.<agent>.channels.bluebubbles.outbound_url` | string | empty | Outbound bridge URL. |
| `agents.definitions.<agent>.channels.bluebubbles.token` | string | empty | Integration token. |
| `agents.definitions.<agent>.channels.bluebubbles.secret` | string | empty | Integration secret. |

### `weixin`

Weixin is more policy-rich than basic webhook channels.

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.weixin.enabled` | boolean | `false` | Enables Weixin integration. |
| `agents.definitions.<agent>.channels.weixin.base_url` | string | `https://ilinkai.weixin.qq.com` | Base service URL. |
| `agents.definitions.<agent>.channels.weixin.cdn_base_url` | string | empty | CDN base for media asset access. |
| `agents.definitions.<agent>.channels.weixin.token` | string | empty | Weixin token. |
| `agents.definitions.<agent>.channels.weixin.account_id` | string | empty | Account identifier. |
| `agents.definitions.<agent>.channels.weixin.bot_type` | string | empty | Bot flavor or channel label. |
| `agents.definitions.<agent>.channels.weixin.channel_version` | string | empty | Bridge version or protocol label. |
| `agents.definitions.<agent>.channels.weixin.route_tag` | string | empty | Internal route partition tag. |
| `agents.definitions.<agent>.channels.weixin.silk_voice_decode` | boolean | `false` | Enables Silk voice decoding. |
| `agents.definitions.<agent>.channels.weixin.dm_policy` | string | `open` | Direct-message access policy. |
| `agents.definitions.<agent>.channels.weixin.allow_from` | string[] | empty | Sender allowlist. |

Use `dm_policy` and `allow_from` when:

- the channel should be restricted to approved senders
- Forebrain Harness should operate in a narrower production context

### `feishu`

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.feishu.enabled` | boolean | `false` | Enables Feishu integration. |
| `agents.definitions.<agent>.channels.feishu.app_id` | string | empty | App ID. |
| `agents.definitions.<agent>.channels.feishu.app_secret` | string | empty | App secret. |
| `agents.definitions.<agent>.channels.feishu.domain` | string | `feishu` | Domain selector. |
| `agents.definitions.<agent>.channels.feishu.connection_mode` | string | `websocket` | Connection transport mode. |
| `agents.definitions.<agent>.channels.feishu.group_policy` | string | `allowlist` | Group access policy. |
| `agents.definitions.<agent>.channels.feishu.group_allow_from` | string[] | empty | Allowed group identifiers. |

### `dingtalk`

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.dingtalk.enabled` | boolean | `false` | Enables DingTalk integration. |
| `agents.definitions.<agent>.channels.dingtalk.client_id` | string | empty | Client ID. |
| `agents.definitions.<agent>.channels.dingtalk.client_secret` | string | empty | Client secret. |
| `agents.definitions.<agent>.channels.dingtalk.dm_policy` | string | `open` | Direct-message policy. |
| `agents.definitions.<agent>.channels.dingtalk.group_policy` | string | `open` | Group access policy. |
| `agents.definitions.<agent>.channels.dingtalk.allow_from` | string[] | empty | DM sender allowlist. |
| `agents.definitions.<agent>.channels.dingtalk.group_allow_from` | string[] | empty | Group allowlist. |

### `qq`

| Field | Type | Default | Usage |
| --- | --- | --- | --- |
| `agents.definitions.<agent>.channels.qq.enabled` | boolean | `false` | Enables QQ integration. |
| `agents.definitions.<agent>.channels.qq.app_id` | string | empty | QQ app ID. |
| `agents.definitions.<agent>.channels.qq.client_secret` | string | empty | QQ client secret. |
| `agents.definitions.<agent>.channels.qq.allow_from` | string[] | empty | Sender allowlist. |

## Environment Overrides

Credentials live in `~/.forebrain/.env` and are referenced from the configuration
as `${ENV_NAME}` placeholders, which are resolved wherever they appear.

Channel secrets are named per agent, because two primary agents may each run
the same kind of channel with different credentials and must not share one
variable. Onboarding writes them as `FOREBRAIN_<AGENT>_<SECRET>`:

```yaml
agents:
  definitions:
    main:
      channels:
        slack:
          bot_token: "${FOREBRAIN_MAIN_SLACK_BOT_TOKEN}"
          secret: "${FOREBRAIN_MAIN_SLACK_SECRET}"
```

A bare variable name such as `TELEGRAM_BOT_TOKEN` no longer configures a
channel by itself: nothing in the environment can name an agent, so a channel
secret only takes effect through a reference written under the agent that owns
the channel. Gateway and provider credentials, which are not per agent, still
resolve from names like `FOREBRAIN_GATEWAY_TOKEN` and `OPENAI_API_KEY`.

Use environment overrides when:

- the same config file is shared across environments
- secrets must stay outside version control
- deployment systems inject credentials at runtime

## Related

- [Agents And Models](/config/agents-and-models)
- [Sandbox And Permissions](/config/sandbox-and-permissions)
- [CLI and Surfaces](/guide/cli-and-surfaces)
