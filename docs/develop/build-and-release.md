# Build and Release

This page documents the full build, packaging, and release pipeline for Forebrain Harness:
how the frontend is compiled and embedded into the binary, how to produce a
self-contained executable, and how the container image and per-platform npm
packages are built.

It is written for maintainers and contributors who build Forebrain Harness from source.

## The Self-Contained Binary

Forebrain Harness ships as a single self-contained binary. The Vue frontend is **embedded
into the Go executable** at build time via `go:embed`, so the gateway serves the
web UI directly from memory with no external files to deploy.

This means a release artifact is just the binary. There is no separate static
directory to ship, mount, or configure.

### How embedding works

- The frontend lives in `frontend/` and builds with Vite.
- Its build output is written **directly into the Go embed package** at
  `internal/webui/dist` (the Vite `outDir`).
- `internal/webui/embed.go` embeds that directory:

  ```go
  //go:embed all:dist
  var distFS embed.FS

  func FS() (fs.FS, bool) { /* returns the dist subtree + whether it is built */ }
  ```

- At startup the gateway calls `webui.FS()` and serves the embedded files.

A committed placeholder, `internal/webui/dist/.gitkeep`, guarantees that
`go build` always compiles even on a clean checkout where the frontend has not
been built yet. In that state the binary simply serves no UI (parity with the
old "no static directory" behavior) until a frontend build has run.

### Static serving resolution

At runtime the gateway resolves where to serve UI files from, in this order:

1. **Disk override** — if `FOREBRAIN_STATIC_DIST` points at a valid directory, the
   gateway serves from disk. This is the developer hot-swap path: rebuild only
   the frontend and refresh, no Go rebuild required.
2. **Embedded** — otherwise the gateway serves the files embedded in the binary.
3. **None** — if neither is available, no static routes are registered.

Requests resolve as a single-page application: an existing file is served
directly; any other non-API path falls back to `index.html` for client-side
routing. Requests under `/api` and `/ws` never fall back and keep their normal
status codes.

## Prerequisites

- **Go** matching the version in `go.mod` (currently `go 1.26.x`).
- **Node.js 22** with **pnpm 10** (via Corepack — `corepack enable`).
- **CGO** enabled with a C toolchain (`gcc`/`clang`), because Forebrain Harness links
  SQLite with the `fts5` build tag.

## Building With Make

A top-level `Makefile` is the canonical entry point and ties the whole chain
together. Targets:

| Target | What it does |
| --- | --- |
| `make ui` | Build the frontend into the Go embed package (`internal/webui/dist`). |
| `make build` | Run `ui`, then compile the self-contained binary to `build/bin/forebrain`. |
| `make test` | Run the Go test suite. |
| `make docker` | Build the container image. |
| `make release` | Build per-platform npm packages, frontend embedded in each. |
| `make clean` | Remove build outputs and generated frontend assets (keeps `.gitkeep`). |

The common case is:

```bash
make build
```

This produces `build/bin/forebrain` with the current frontend embedded and the
version stamped from the `VERSION` file.

`make ui` cleans stale assets first (preserving `.gitkeep`), installs frontend
dependencies only on a fresh checkout, then runs the Vite build. Because the
embedded assets are content-hashed, the clean step keeps old hashes from
accumulating inside the binary.

## Building Manually

If you prefer to drive the steps yourself:

```bash
# 1. Build the frontend into the embed package
cd frontend
corepack pnpm install            # first checkout only
corepack pnpm build              # outputs to ../internal/webui/dist
cd ..

# 2. Build the binary with the UI embedded
CGO_ENABLED=1 go build -tags fts5 -trimpath \
  -ldflags "-s -w -X github.com/forebrain-harness/forebrain-harness/internal/buildinfo.Version=$(cat VERSION)" \
  -o build/bin/forebrain ./cmd/forebrain
```

Run it:

```bash
./build/bin/forebrain gateway start
```

The gateway listens on the address from your configuration
(`gateway.http_addr`, default `127.0.0.1:6060`) and serves the embedded UI at
`/`, with the JSON/websocket APIs under `/api` and `/ws`.

## Container Image

`docker build` produces a minimal image with the binary and the UI baked in —
no static volume to mount.

```bash
make docker
# or:
docker build -t forebrain:$(cat VERSION) .
```

The Dockerfile is a multi-stage build:

1. **frontend stage** (`node:22`) — installs deps and runs the Vite build, which
   writes to `internal/webui/dist`.
2. **gobuild stage** (`golang:1.26`) — copies the built frontend in **before**
   `go build`, and compiles the binary with the UI embedded.
3. **final stage** (`debian:bookworm-slim`) — copies only the binary. It exposes
   `6060` and runs `gateway start`.

Because the UI is embedded, the final image carries no `/app/static` directory
and sets no `FOREBRAIN_STATIC_DIST` — the binary is fully self-contained.

## Per-Platform npm Packages

`npm/scripts/build-platform-packages.sh` produces one npm package per platform
under `npm/dist/@forebrain-harness/`, each containing the native binary and a
platform-scoped `package.json` (`os`/`cpu` fields).

```bash
make release
# or:
FOREBRAIN_VERSION=$(cat VERSION) npm/scripts/build-platform-packages.sh
```

The script builds the frontend **once** up front and embeds it into every
platform binary, so each package ships the complete UI.

Useful environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `FOREBRAIN_VERSION` | `0.1.0` | Package and binary version. |
| `FOREBRAIN_BUILD_TARGETS` | host triple | Space-separated targets, e.g. `"darwin/arm64 linux/amd64"`. |

Cross-compiling requires `CGO_ENABLED=1` and the matching C toolchain for each
target; by default the script builds only the host triple so local development
needs no cross toolchains.

## Verifying a Build

After `make build`:

```bash
# embedded assets are present
ls internal/webui/dist        # index.html + assets/

# run and check serving
./build/bin/forebrain gateway start &
curl -s localhost:6060/                 # embedded index.html
curl -s localhost:6060/api/health       # "ok" (API beats the SPA fallback)
curl -s localhost:6060/dashboard        # SPA fallback to index.html
```

To verify the disk override path, point `FOREBRAIN_STATIC_DIST` at a built
directory before starting:

```bash
FOREBRAIN_STATIC_DIST=/path/to/dist ./build/bin/forebrain gateway start
```

## Notes and Gotchas

- **`.gitkeep` must stay committed.** It keeps `go build` working before any
  frontend build. The Vite config uses `emptyOutDir: false` precisely so the
  placeholder survives a build; the Makefile cleans stale assets explicitly
  instead.
- **Embedded assets are gitignored.** Only the `.gitkeep` placeholder is tracked
  under `internal/webui/dist`; the built `index.html` and `assets/` are
  regenerated by the pipeline and never committed.
- **Frontend lockfile.** If `pnpm install --frozen-lockfile` fails with an
  `overrides` mismatch, the committed lockfile has drifted; run
  `pnpm install --no-frozen-lockfile` in `frontend/` to refresh it, then commit
  the updated lockfile.
