# Forebrain Harness Website

Official documentation site for Forebrain Harness, built with VitePress and intended for
GitHub Pages deployment.

## Local Startup

Install dependencies once:

```bash
npm install
```

Start the local docs server:

```bash
npm run docs:dev
```

The dev server binds to `0.0.0.0` and VitePress will print the local URL in the
terminal. In most environments it will be:

```text
http://localhost:5173/
```

If port `5173` is already occupied, start VitePress on another port:

```bash
npx vitepress dev docs --host 0.0.0.0 --port 5174
```

## Local Debugging Workflow

Recommended workflow while editing:

1. keep `npm run docs:dev` running in one terminal
2. edit pages or theme files
3. refresh the browser and confirm layout, navigation, and Mermaid diagrams
4. run `npm run docs:build` before considering the change complete

## Production Build And Preview

Build the static site:

```bash
npm run docs:build
```

Preview the production build locally:

```bash
npm run docs:preview
```

The generated static output is written to:

```text
docs/.vitepress/dist
```

That directory is the GitHub Pages deployment artifact.

## What To Edit

- `docs/*.md`
  Main page content.
- `docs/config/*.md`
  Configuration reference manual.
- `docs/guide/*.md`
  Product guide pages, tutorials, and system behavior explanations.
- `docs/.vitepress/config.mjs`
  Site navigation, sidebar, footer, and search config.
- `docs/.vitepress/theme/index.js`
  Theme extension and Mermaid setup.
- `docs/.vitepress/theme/style.css`
  Global site styling, brand treatment, layout tuning.
- `docs/public/`
  Static assets such as logos and additional images.

## Debugging Notes

- `docs:dev` is hot-reload mode. Most markdown and style edits should appear immediately.
- If a Mermaid diagram does not render, inspect `docs/.vitepress/theme/index.js` first.
- If links, nav, or sidebar structure are wrong, inspect `docs/.vitepress/config.mjs`.
- If a page looks fine in dev but breaks in static output, run `npm run docs:build` and fix the build error before continuing.
- If a page renders but the content hierarchy feels wrong, verify both the page frontmatter and the sidebar placement. VitePress issues are often information-architecture issues rather than rendering issues.
