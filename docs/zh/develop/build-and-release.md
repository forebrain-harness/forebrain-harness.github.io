# 构建与发布

本页记录 Forebrain Harness 完整的构建、打包和发布流水线：前端如何编译并
内嵌进二进制、如何产出自包含可执行文件，以及容器镜像和按平台的 npm 包
如何构建。

写给从源码构建 Forebrain Harness 的维护者和贡献者。

## 自包含二进制

Forebrain Harness 以单个自包含二进制分发。Vue 前端在构建时经 `go:embed`
**内嵌进 Go 可执行文件**，gateway 直接从内存提供 web UI，没有需要部署的
外部文件。

这意味着发布产物就是二进制本身。没有需要发布、挂载或配置的独立静态
目录。

### 内嵌如何工作

- 前端在 `frontend/`，用 Vite 构建。
- 构建产物**直接写进 Go embed 包** `pkg/gateway/dist`（Vite 的
  `outDir`）。
- `pkg/gateway/http_server.go` 内嵌该目录：

  ```go
  //go:embed all:dist
  var distFS embed.FS

  func FS() (fs.FS, bool) { /* returns the dist subtree + whether it is built */ }
  ```

- 启动时 gateway 调用 `gateway.FS()`，服务内嵌的文件。

一个已提交的占位文件 `pkg/gateway/dist/.gitkeep` 保证 `go build` 总能
编译，即使在尚未构建前端的干净 checkout 上。这种状态下二进制只是不提供
UI（与旧的"没有静态目录"行为一致），直到前端构建跑过。

### 静态服务解析

运行时 gateway 按以下顺序解析从哪里服务 UI 文件：

1. **磁盘覆盖** — 如果 `FOREBRAIN_STATIC_DIST` 指向一个有效目录，gateway
   从磁盘服务。这是开发者热替换路径：只重建前端然后刷新，不需要重新构建
   Go。
2. **内嵌** — 否则 gateway 服务二进制内嵌的文件。
3. **无** — 两者都不可用时，不注册静态路由。

请求按单页应用解析：存在的文件直接服务；其他任何非 API 路径回退到
`index.html` 做客户端路由。`/api` 和 `/ws` 下的请求永不回退，保持正常
状态码。

## 前置条件

- 与 `go.mod` 匹配的 **Go**（当前 `go 1.26.x`）。
- **Node.js 22** 配 **pnpm 10**（经 Corepack——`corepack enable`）。
- 启用 **CGO** 和 C 工具链（`gcc`/`clang`），因为 Forebrain Harness 带
  `fts5` 构建标签链接 SQLite。

## 用 Make 构建

顶层 `Makefile` 是规范入口，把整条链串起来。目标：

| 目标 | 做什么 |
| --- | --- |
| `make ui` | 把前端构建进 Go embed 包（`pkg/gateway/dist`）。 |
| `make build` | 先跑 `ui`，再把自包含二进制编译到 `build/bin/forebrain`。 |
| `make test` | 运行 Go 测试套件。 |
| `make docker` | 构建容器镜像。 |
| `make release` | 构建按平台的 npm 包，每个都内嵌前端。 |
| `make clean` | 移除构建产物（`build/bin`）；被 gitignore 的 UI 产物留着。 |

常见用法：

```bash
make build
```

这产出 `build/bin/forebrain`，内嵌当前前端，版本号取自 `VERSION` 文件。

`make ui` 先清理过期资产（保留 `.gitkeep`），只在全新 checkout 上安装
前端依赖，然后跑 Vite 构建。内嵌资产带内容哈希，清理步骤防止旧哈希在
二进制里累积。

## 手动构建

如果你想自己驱动每一步：

```bash
# 1. 把前端构建进 embed 包
cd frontend
corepack pnpm install            # 仅首次 checkout 需要
corepack pnpm build              # 输出到 ../pkg/gateway/dist
cd ..

# 2. 构建内嵌 UI 的二进制
CGO_ENABLED=1 go build -tags fts5 -trimpath \
  -ldflags "-s -w -X github.com/forebrain-harness/forebrain-harness/pkg/home.Version=v$(cat VERSION)" \
  -o build/bin/forebrain ./cmd/forebrain
```

运行：

```bash
./build/bin/forebrain gateway start
```

Gateway 监听你配置的地址（`gateway.http_addr`，默认 `127.0.0.1:6060`），
在 `/` 服务内嵌 UI，JSON/websocket API 在 `/api` 和 `/ws` 下。

## 容器镜像

`docker build` 产出一个最小镜像，二进制和 UI 都烘焙在内——没有要挂载的
静态卷。

```bash
make docker
# 或：
docker build -t forebrain:$(cat VERSION) .
```

Dockerfile 是多阶段构建：

1. **frontend 阶段**（`node:22`）——安装依赖并跑 Vite 构建，写到
   `pkg/gateway/dist`。
2. **gobuild 阶段**（`golang:1.26`）——在 `go build` **之前**拷入构建好的
   前端，编译内嵌 UI 的二进制。
3. **final 阶段**（`debian:bookworm-slim`）——只拷贝二进制。暴露 `6060`，
   运行 `gateway start`。

因为 UI 是内嵌的，最终镜像不带 `/app/static` 目录、不设
`FOREBRAIN_STATIC_DIST`——二进制完全自包含。

## 按平台的 npm 包

`npm/scripts/build-platform-packages.sh` 在 `npm/dist/@forebrain-harness/`
下为每个平台产出一个 npm 包，各含原生二进制和一个平台作用域的
`package.json`（`os`/`cpu` 字段）。

```bash
make release
# 或：
FOREBRAIN_VERSION=$(cat VERSION) npm/scripts/build-platform-packages.sh
```

脚本把前端**只构建一次**，然后内嵌进每个平台的二进制，所以每个包都带
完整 UI。

有用的环境变量：

| 变量 | 默认 | 用途 |
| --- | --- | --- |
| `FOREBRAIN_VERSION` | `0.1.0` | 包与二进制版本。 |
| `FOREBRAIN_BUILD_TARGETS` | 宿主 triple | 空格分隔的目标，如 `"darwin/arm64 linux/amd64"`。 |
| `FOREBRAIN_SKIP_UI_BUILD` | 未设置 | 设为 `1` 跳过前端重建，直接内嵌现有 `pkg/gateway/dist`（发版流水线如此使用）。 |

交叉编译要求 `CGO_ENABLED=1` 和每个目标匹配的 C 工具链；脚本默认只构建
宿主 triple，本地开发不需要交叉工具链。

## 验证一次构建

`make build` 之后：

```bash
# embedded assets are present
ls pkg/gateway/dist           # index.html + assets/

# run and check serving
./build/bin/forebrain gateway start &
curl -s localhost:6060/                 # embedded index.html
curl -s localhost:6060/api/health       # "ok" (API beats the SPA fallback)
curl -s localhost:6060/dashboard        # SPA fallback to index.html
```

要验证磁盘覆盖路径，启动前把 `FOREBRAIN_STATIC_DIST` 指向一个已构建的
目录：

```bash
FOREBRAIN_STATIC_DIST=/path/to/dist ./build/bin/forebrain gateway start
```

## 注意与坑

- **`.gitkeep` 必须保持已提交。** 它让 `go build` 在任何前端构建之前都能
  工作。Vite 配置用 `emptyOutDir: false` 正是为了让占位文件在构建后存活；
  Makefile 改为显式清理过期资产。
- **内嵌资产被 gitignore。** `pkg/gateway/dist` 下只有 `.gitkeep`
  占位被跟踪；构建出的 `index.html` 和 `assets/` 由流水线重新生成，
  从不提交。
- **前端 lockfile。** 如果 `pnpm install --frozen-lockfile` 因 `overrides`
  不匹配而失败，说明已提交的 lockfile 漂移了；在 `frontend/` 里跑
  `pnpm install --no-frozen-lockfile` 刷新它，然后提交更新后的 lockfile。
