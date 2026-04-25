# JSON Viewer

A fast, beautiful JSON viewer built with React + Vite. Designed for inspecting large JSON documents — collapsible tree, search, copy paths, theme toggle, and lazy rendering so the UI stays responsive on big files.

![Stack](https://img.shields.io/badge/stack-React%2018%20%2B%20Vite%205-black) ![License](https://img.shields.io/badge/license-MIT-black)

## Features

- **Tree view** with syntax highlighting, type-aware coloring, and collapsible nodes
- **Lazy rendering** — children render only when expanded; long arrays/objects paginate at 100 items per chunk so 100k-item arrays don't hang the DOM
- **Search** across keys and values with prev/next navigation, auto-expanding ancestors of matches (Cmd/Ctrl+F to focus, Enter / Shift+Enter to navigate)
- **Path copy** — click the ⎘ icon next to any node to copy its JSONPath (e.g. `users[0].address.city`)
- **Multiple inputs** — paste, drag-and-drop a `.json` file, or load the bundled sample
- **Recursive expand/collapse** — Alt+Click a toggle to expand or collapse an entire subtree
- **Live stats** — keys, objects, arrays, depth, and file size in the toolbar
- **Dark / light themes** with `localStorage` persistence
- **Copy formatted** or **download** the parsed JSON with one click
- **Keyboard-first**: Cmd/Ctrl+F search, Enter / Shift+Enter navigate matches, Esc clears

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173.

```bash
npm run build      # production build to dist/
npm run preview    # preview the production build locally
```

## Deploying to GitHub Pages

Two paths — pick one. **Path A (GitHub Actions)** is recommended: zero config beyond pushing to `main`. **Path B (`gh-pages` branch)** is the classic flow if you'd rather deploy manually.

### Before either path: configure for your repo

The Vite `base` and the `homepage` in `package.json` must match your repository's URL path. Open the project and edit:

**`vite.config.js`** — change `/json-viewer/` to `/<your-repo-name>/`:

```js
base: command === 'build' ? '/your-repo-name/' : '/',
```

> If you're deploying to a user/org root site (`<username>.github.io`), set `base: '/'` instead.

**`package.json`** — replace `YOUR_USERNAME` and the repo name:

```json
"homepage": "https://your-username.github.io/your-repo-name/"
```

### Path A — GitHub Actions (recommended)

The repo already contains `.github/workflows/deploy.yml`. Once you push to `main`, GitHub builds and deploys automatically.

1. Create a new repository on GitHub (e.g. `json-viewer`). Don't initialize it with a README.
2. Initialize git locally and push:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

3. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. The first deploy runs automatically. When it finishes, your site is live at `https://<your-username>.github.io/<your-repo-name>/`.
5. Every subsequent push to `main` redeploys.

### Path B — `gh-pages` branch

Uses the `gh-pages` package (already a dev dependency).

1. Steps 1–2 from Path A (create repo, push to `main`).
2. Run:

   ```bash
   npm run deploy
   ```

   This builds to `dist/` and force-pushes the contents to a `gh-pages` branch.

3. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `gh-pages` / `(root)` → Save**.
4. Your site goes live at `https://<your-username>.github.io/<your-repo-name>/` within a minute.
5. Re-run `npm run deploy` whenever you want to publish updates.

> **Tip:** Pick one path and stick with it. If you've used Path B and want to switch to Path A, change the Pages source to "GitHub Actions" in Settings — the workflow will take over.

## Project structure

```
json-viewer/
├── .github/workflows/deploy.yml    # GitHub Actions CI/CD
├── public/favicon.svg
├── src/
│   ├── components/
│   │   ├── InputPanel.jsx          # Empty state: paste / upload / sample
│   │   ├── JsonNode.jsx            # Recursive tree node (memoized, paginated)
│   │   ├── JsonViewer.jsx          # Tree container + expand/collapse logic
│   │   ├── Toast.jsx               # Copy confirmations
│   │   └── Toolbar.jsx             # Search, expand, copy, theme toggle
│   ├── hooks/useTheme.js
│   ├── utils/jsonUtils.js          # Type detection, path builder, search, stats
│   ├── App.jsx                     # State wiring
│   ├── App.css                     # Component styles
│   ├── index.css                   # Design tokens (CSS variables)
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

## How it handles big JSON

- **Lazy children** — `JsonNode` renders its children only when its path is in the `expandedPaths` set. Collapsed subtrees cost zero DOM nodes.
- **Pagination** — when an expanded array or object has more than 100 children, only the first 100 render. A "Load more" button reveals the next 100; "Load all" reveals everything for that node.
- **Iterative algorithms** — stats, search, and ancestor lookup use explicit stacks instead of recursion to avoid stack overflows on deeply nested input.
- **Capped search** — `searchJson` stops after 1,000 matches by default, so a query like `e` on a 50MB file returns instantly.
- **Memoization** — every node is wrapped in `memo`, so toggling one branch doesn't re-render siblings.

Tested cleanly on documents up to ~50MB. Beyond that, browser `JSON.parse` and clipboard APIs become the bottleneck rather than the renderer.

## Keyboard shortcuts

| Action | Shortcut |
|---|---|
| Focus search | `Cmd/Ctrl + F` |
| Next match | `Enter` (in search) |
| Previous match | `Shift + Enter` (in search) |
| Clear search | `Esc` (in search) |
| Toggle node | Click toggle / row |
| Recursively toggle subtree | `Alt + Click` toggle |
| Copy node path | Click ⎘ next to any row |

## Customization notes

- **Theme colors** live in `src/index.css` as CSS variables (`--bg`, `--accent`, `--json-key`, etc.). Tweak there to restyle the entire app.
- **Page size** for large-collection pagination is the `PAGE_SIZE` constant at the top of `src/components/JsonNode.jsx` (default 100).
- **Search match limit** is the `limit` option in `searchJson()` calls in `src/App.jsx` (default 1,000).
- **Default expansion depth** — by default, root + 1 level expand. Adjust the `initial` `useMemo` in `src/components/JsonViewer.jsx`.

## License

MIT — do whatever you'd like with it.
