# 代码智能

Agent 在真正的语言服务器支撑下读你的代码——定义、引用、调用层级、诊断
——而不是靠 grep 猜。

## Agent 得到什么

语言服务器跑起来之后，agent 的 `lsp` 工具能回答文本搜索答不了的问题：

- **东西在哪** — 定义、声明、类型定义、实现和引用，以它能打开的文件位置
  返回。
- **东西是什么** — 悬停类型信息、文档与 workspace 符号、父类型与子类型。
- **东西如何连接** — 调入与调出调用层级。
- **刚才弄坏了什么** — 一次编辑之后，结果会列出这次编辑引入的错误和
  警告；后续诊断随 agent 的下一次请求到达。

全部十三种查询都是只读的，每个结果都使用与 agent 读文件时相同的 1 基
行号，所以它能立刻对答案采取行动。

## 内置目录

目录自带三十八个语言服务器，包括 gopls（Go）、pyright 和 pylsp
（Python）、rust-analyzer（Rust）、typescript-language-server 和 vtsls
（TypeScript/JavaScript）、clangd（C/C++）、jdtls（Java）、ruby-lsp
（Ruby）、elixir-ls（Elixir）、sourcekit-lsp（Swift）、metals（Scala）、
csharp-ls（C#）、intelephense 和 phpactor（PHP）、zls（Zig）、
lua-language-server、dart、kotlin-language-server、
haskell-language-server、ocamllsp（OCaml）、bash-language-server、
clojure-lsp、elp（Erlang）、nil（Nix）、gleam、vue-language-server、
svelte-language-server、yaml-language-server、
dockerfile-language-server、terraform-ls、ruff、biome 和 eslint。

目录里的每个服务器也都可以在 `forebrain.yaml` 的 `lsp.servers` 下新增或
覆盖。

## 启动由你决定

服务器跑在你的机器上、沙箱之外，且只在受信任的项目里——打开一个启用了
语言服务器的项目就像构建它，所以同意是显式的，分两层：

- **项目必须被信任。** 服务器从不在不受信任的目录里启动。
- **每个服务器需要同意。** 你不发话就没有一个启用：agent 第一次编辑某种
  语言、而该语言有可用服务器时，Forebrain Harness 会询问，你的回答会为
  该项目记住。

同意之后，服务器在后台懒启动——不在第一帧就启动——每个项目共享一个
实例，空闲时停止。

## 命令

```bash
forebrain lsp list             # 每个服务器、它的开关和它的二进制
forebrain lsp doctor           # 端到端检查一路，以及出问题该怎么办
forebrain lsp enable <id>      # 在受信任的项目里启用一个服务器
forebrain lsp disable <id>     # 把服务器重新关掉
forebrain lsp install <id>     # 安装服务器二进制（跑在你的机器上）
forebrain lsp recommendations  # 按项目的建议，`reset` 可清除
```

会话里，`/lsp` 显示状态并处理启用、安装和重启。

一次编辑最多等待 `lsp.diagnostics.wait_ms`（默认 2.5 秒）拿服务器的答案，
答案一到立刻返回，所以代码智能从不拖住一个 turn。

## 接下来去哪

- [保持掌控](/zh/guide/safety-model) — 信任、审批，以及语言服务器所处
  其外的沙箱。
- [沙箱与权限](/zh/config/sandbox-and-permissions) — 完整的权限参考。
