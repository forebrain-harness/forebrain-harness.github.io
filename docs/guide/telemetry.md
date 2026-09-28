# Telemetry

Forebrain Harness has a first-class telemetry surface for runtime observation.

This guide explains:

- what Forebrain Harness telemetry includes
- how telemetry differs from ordinary debug logging
- how to enable OTEL export
- what is written to local debug logs
- what data is attached to run, tool, and HTTP spans
- which environment variables affect telemetry behavior
- what to watch for when telemetry contains sensitive data

Use this page when you need operational visibility rather than user-facing
workflow help.

## What Telemetry Covers

Forebrain Harness currently exposes four distinct telemetry layers:

1. run spans
2. tool spans
3. LLM HTTP spans
4. local debug file logs

These layers are related, but they are not the same mechanism.

| Layer | Purpose | Output |
| --- | --- | --- |
| Run span | lifecycle of one supervised run | OTEL trace span |
| Tool span | function-calling execution details | OTEL trace span |
| LLM HTTP span | raw upstream request and response observation | OTEL trace span |
| Debug file log | local operator inspection | `debug.log` file |

Forebrain Harness also has an analytics event queue for structured product/runtime events,
which is separate from OTEL tracing.

## Telemetry Versus Debug Logging

It is important not to flatten telemetry into "just logs".

### Telemetry

Telemetry is used for:

- context-linked run tracing
- span attributes on function calls
- span attributes on upstream HTTP traffic
- later export to external collectors by OTEL protocol

Telemetry is structured and attached to runtime execution boundaries.

### Debug File Logging

Debug file logging is used for:

- local inspection
- redacted human-readable request and response dumps
- operator troubleshooting when reading files directly

Debug file logging is file-oriented, not span-oriented.

### Why Forebrain Harness Keeps Them Separate

The separation matters because Forebrain Harness now supports:

- complete function-calling arguments in spans
- preview-oriented function results in spans
- complete HTTP request and response headers and bodies in spans
- redacted local request and response logs in `debug.log`

Those are different observation products with different downstream risks.

## Default Behavior

### Run Spans

Run spans are created when Forebrain Harness executes supervised runs through the runtime
paths that call `telemetry.StartRunSpan(...)`.

Current production wiring includes the supervisor run flows used by gateway and
service-backed execution paths.

### Tool Spans

Tool spans are attached through the default tool middleware chain.

They are applied by the shared tool-registration path rather than by each tool
individually. This keeps the observation boundary aligned with real function
calling instead of asking tool authors to remember manual instrumentation.

### HTTP Spans

LLM HTTP spans are attached through the shared LLM HTTP transport wrapper.

They are independent from local debug file logging. If OTEL is configured,
HTTP trace collection is part of telemetry whether or not local debug file logs
are enabled.

### Debug File Logs

Debug file logs are enabled by default unless explicitly disabled through
`FOREBRAIN_LLM_HTTP_DEBUG`.

That default is intentionally permissive for local development and operator
debugging, but it has different sensitivity implications from OTEL export.

## Configuration

Telemetry in the current runtime is primarily controlled by environment
variables rather than Forebrain Harness YAML settings.

### OTEL Export

`OTEL_EXPORTER_OTLP_ENDPOINT` enables OTEL trace export.

If it is empty, Forebrain Harness still runs normally, but exported OTEL tracing is
effectively disabled.

Example:

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

Forebrain Harness initializes an OTLP HTTP trace exporter and tracer provider when this
variable is present.

Notes:

- `http://localhost:*` and `http://127.0.0.1:*` are treated as insecure OTLP HTTP endpoints
- Forebrain Harness currently trims `http://` and `https://` and passes the endpoint host to the OTLP HTTP client
- there is no Forebrain Harness YAML field for OTEL exporter setup in the current public config surface

### Local Debug File Logging

`FOREBRAIN_LLM_HTTP_DEBUG` controls local debug file logging.

Recognized falsy values:

- `0`
- `false`
- `no`
- `off`

Any other value, including omission, enables local debug file logging.

Examples:

```bash
export FOREBRAIN_LLM_HTTP_DEBUG=0
```

```bash
export FOREBRAIN_LLM_HTTP_DEBUG=false
```

```bash
unset FOREBRAIN_LLM_HTTP_DEBUG
```

The last example enables debug file logging again by falling back to the
default behavior.

## Output Locations

### OTEL Export

When OTEL export is enabled, spans are sent to the configured OTLP HTTP
endpoint.

### Local Debug File

Local debug logs are written to:

```text
$FOREBRAIN_HOME/logs/debug.log
```

Forebrain Harness resolves the effective Forebrain Harness home through its data-directory runtime,
then appends `logs/debug.log`.

## Run Spans

Run spans currently use the span name:

```text
agent.run
```

Attributes attached today include:

- `forebrain.run_id`
- `forebrain.session_id`
- `forebrain.trigger`

These spans provide the parent context for nested tool and HTTP spans.

## Tool Spans

Tool spans currently use the span name pattern:

```text
tool.<tool_name>
```

Examples:

- `tool.read_file`
- `tool.mcp__codegraph__codegraph_explore`
- `tool.llm_http` for HTTP-level trace steps

### Tool Span Attributes

Forebrain Harness currently attaches these baseline tool attributes:

- `forebrain.run_id`
- `forebrain.step_id`
- `forebrain.tool`

For function-calling tool execution it also attaches:

- `forebrain.tool.arguments`
- `forebrain.tool.result_preview`
- `forebrain.tool.result_truncated`
- `forebrain.error` when the tool fails

### Function-Calling Arguments

`forebrain.tool.arguments` contains the complete raw JSON argument string as sent
through the tool handler.

This is intentionally full-fidelity telemetry, not a summary.

### Function-Calling Results

Forebrain Harness does not put the full tool result into the span by default.

Instead it records:

- `forebrain.tool.result_preview`
- `forebrain.tool.result_truncated`

The preview is derived from the formatted tool result and truncated to an
internal preview budget.

Current behavior:

- preview is stored as a string
- truncation is indicated explicitly by a boolean attribute
- large results are shortened with a trailing ellipsis

This keeps tool spans useful without letting arbitrarily large tool outputs
blow up trace volume.

## LLM HTTP Spans

Forebrain Harness instruments upstream LLM HTTP traffic through the shared transport
wrapper used by the current OpenAI-compatible, OpenAI Responses, and Anthropic
runtime paths.

### HTTP Span Name

HTTP spans currently use:

```text
tool.llm_http
```

This is intentionally nested under the shared tool-style span model so that the
HTTP call remains associated with the active run/tool execution chain.

### HTTP Span Attributes

Forebrain Harness currently records:

- `forebrain.http.method`
- `forebrain.http.url`
- `forebrain.http.request_headers`
- `forebrain.http.request_body`
- `forebrain.http.status_code`
- `forebrain.http.response_headers`
- `forebrain.http.response_body`
- `forebrain.error` when the request fails

### Important Difference From Debug Logs

For OTEL HTTP spans, Forebrain Harness currently records complete request and response
headers and bodies.

For local debug file logs, Forebrain Harness applies header and content redaction intended
for local troubleshooting output.

That means:

- spans are high-fidelity telemetry
- debug file logs are operator-readable debug output
- they should not be treated as interchangeable

## Analytics Events

Forebrain Harness also includes an internal analytics event queue.

This is not the same as OTEL tracing.

It is used for structured runtime/product events such as:

- tool metadata events
- compact/memory/MCP/API metadata
- sink-attached queue delivery

This guide focuses on tracing and debug logging. Use the code and config docs
for analytics-specific behavior when integrating a sink.

## Sensitivity And Data Handling

This is the most important operational warning on this page.

### Current Trace Policy

Current OTEL span collection intentionally captures:

- full function-calling arguments
- full HTTP request bodies
- full HTTP response bodies
- full request and response headers

If your models, prompts, tools, or upstream services may carry secrets,
personal data, regulated content, or proprietary source text, you must treat
the configured OTEL endpoint as a sensitive data sink.

### Current Debug File Log Policy

Local debug file logs are different:

- request and response dumps are formatted for reading
- common auth-bearing headers are redacted
- content is passed through the local log redaction layer

This is safer than raw span export, but it still should not be treated as
harmless in shared or untrusted environments.

### Practical Guidance

Before enabling OTEL export outside a private environment, decide:

- where the collector runs
- who can read spans
- how spans are retained
- whether prompt and response bodies are allowed to leave the machine
- whether additional filtering is required before export

## How To Enable Telemetry

### Local Debugging Only

Use local file logging without OTEL export:

```bash
unset OTEL_EXPORTER_OTLP_ENDPOINT
export FOREBRAIN_LLM_HTTP_DEBUG=1
```

This gives you local debug logs without external span export.

### OTEL Export Without Disabling Local Debug Logs

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
export FOREBRAIN_LLM_HTTP_DEBUG=1
```

This enables both:

- OTEL trace export
- local debug file logging

### OTEL Export Without Local Debug Files

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
export FOREBRAIN_LLM_HTTP_DEBUG=0
```

This keeps tracing active while disabling the local debug file output.

## Troubleshooting

### I Set `OTEL_EXPORTER_OTLP_ENDPOINT` But See No Spans

Check:

- Forebrain Harness is running through a path that initializes telemetry at startup
- the OTLP endpoint is reachable
- the collector accepts OTLP HTTP, not only OTLP gRPC
- the runtime path actually creates supervised runs or traced tool/http activity

### I See Debug Logs But No Exported Traces

That usually means:

- `FOREBRAIN_LLM_HTTP_DEBUG` is enabled
- but `OTEL_EXPORTER_OTLP_ENDPOINT` is missing or invalid

Debug file logging and OTEL export are separate paths.

### I See Traces But No `debug.log`

That usually means:

- OTEL export is enabled
- `FOREBRAIN_LLM_HTTP_DEBUG` is explicitly disabled

This is valid and expected.

### Trace Payloads Are Too Large

Current behavior is intentionally high fidelity for:

- function-calling arguments
- HTTP request and response headers and bodies

Only function-calling results are preview-truncated by default.

If span volume or payload size is a problem, the next step is usually policy
work rather than runtime breakage.

## Current Product Boundary

Today, telemetry configuration is primarily environment-driven.

There is not yet a full public Forebrain Harness YAML telemetry policy surface for:

- selective field redaction
- body sampling
- span truncation thresholds by transport
- export policies per environment

That means operators should currently think of telemetry as:

- powerful
- high fidelity
- operationally useful
- not yet fully policy-shaped

## Related

- [Getting Started](/guide/getting-started)
- [CLI and Surfaces](/guide/cli-and-surfaces)
- [Runtime, Gateway, And Channels](/config/runtime-gateway-and-channels)
- [Hooks And Skill Extensions](/config/hooks-and-skill-extensions)
