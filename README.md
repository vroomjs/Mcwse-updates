# Minecraft Websim Edition — build archive

Every release is kept in its own folder. **`Latest/` always holds the newest
build**; the numbered folders are the historical archive.

| Folder | Files | Notes |
|---|---|---|
| `Deploy-1/` | 574 | earliest archived build |
| `Deploy-2/` | 592 | |
| `Deploy-2-2/` | 594 | |
| `Deploy-3/` | 594 | |
| `Deploy-4/` | 599 | |
| `Deploy-6/` | 610 | service worker removed — cache-first was serving stale bundles |
| `Deploy-7/` | 629 | |
| `Deploy-7-6/` | 746 | adds `album_art/` |
| **`Latest/`** | **747** | **= Deploy 7.7** — adds `FurnaceDisplayRenderer.js`, 21 files changed vs 7-6 |

Each folder is a complete, self-contained static site: `index.html` at its root,
`three.js` vendored in `libraries/`, no build step.

## Running a build locally

```bash
cd Latest          # or any version folder
python3 -m http.server 8080
```

Then open <http://localhost:8080>. Opening `index.html` directly from disk will
not work — the game loads ES modules, which browsers block over `file://`.

## Deploying

`netlify.toml` publishes `Latest/`. To ship an older build instead, change one
line:

```toml
[build]
  publish = "Deploy-7-6"
```

## Updating to a new version

1. Copy the new build into a folder named after it, e.g. `Deploy-7-8/`.
2. Replace the contents of `Latest/` with the same files.
3. Commit both.

`Latest/` is a copy rather than a symlink so that static hosts serve it directly.
Git stores the shared files once, so the duplication costs almost nothing.
