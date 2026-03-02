# Implementation Plan

## Current State

The core library, renderer, basic web UI ("Create Your Own" flow), dev environment,
and CI/CD pipeline are all implemented and working. All 34 tests pass.

What remains is the **pre-generated puzzles** feature: the generation script,
renderer support for puzzle info, and the tabbed UI for browsing puzzles.

---

## Tasks

### 1. Renderer: Add `puzzleInfo` support

- **Spec:** `specs/pbn-grid-renderer.md` (Render Options table, Puzzle Info Line section)
- **Status:** `complete`
- **Description:**
  - Add `puzzleInfo` to `DEFAULT_OPTIONS` (default: `null`).
  - In `renderPBNGrid`, when `puzzleInfo` is provided, render a text line below
    the legend: `Puzzle #14 — Dog` (or just `Puzzle #14` if no title).
  - Update `getCanvasDimensions` to account for the extra height when
    `puzzleInfo` is present.
  - Add dimension tests for `puzzleInfo` in `dimensions.test.js`.
- **Files:** `src/pbn-grid-renderer/index.js`, `src/pbn-grid-renderer/__tests__/dimensions.test.js`
- **Gotchas:** The puzzle info rendering could live in `legend-renderer.js` or inline
  in `index.js`. Keep it simple — a few lines of canvas text drawing in `index.js`
  after the legend render call.

### 2. Pre-generated puzzles: Generation script

- **Spec:** `specs/pre-generated-puzzles.md`
- **Status:** `planned`
- **Description:**
  - Create `scripts/generate-puzzles.js` — a Node.js CLI script.
  - Add `sharp` as a dev dependency for image decoding.
  - Add `generate-puzzles` npm script: `node scripts/generate-puzzles.js`.
  - Script behavior:
    1. Parse CLI args from `process.argv` (no external libs): `source-dir`,
       `--color-count`, `--cell-count`, `--constrain-by`, `--force`.
    2. Scan source directory for image files (jpg, png, gif, webp).
    3. Load existing manifest from `src/puzzles/manifest.json` if it exists.
    4. For each image: compute SHA-256 hash, skip unchanged images (unless `--force`),
       assign next available ID for new images, regenerate on hash change.
    5. Remove manifest entries for deleted source images and delete their JSON files.
    6. Write `PBNGridResult` JSON to `src/puzzles/{id}.json`.
    7. Write updated manifest to `src/puzzles/manifest.json`.
    8. Print summary of actions (added, updated, removed, skipped).
  - Create `src/puzzles/` directory (it will hold committed/deployed puzzle data).
  - The script imports `pbn-grid-core` directly via relative path.
- **Files:** `scripts/generate-puzzles.js`, `package.json`
- **Dependencies:** Task 1 is not strictly required, but completing it first means
  the script could optionally pass `puzzleInfo` to the renderer in the future.
- **Gotchas:**
  - `sharp` is a native dependency — ensure it's dev-only.
  - The script must use relative import paths to `src/pbn-grid-core/index.js`.
  - Output JSON is `PBNGridResult` (grid, palette, gridWidth, gridHeight) — no
    renderer options, no puzzle metadata inside the JSON.

### 3. Web UI: Tabbed layout and puzzle browsing

- **Spec:** `specs/web-ui.md`, `specs/pre-generated-puzzles.md`
- **Status:** `planned`
- **Description:**
  - Restructure `index.html` with a tabbed interface:
    - Tab 1: "Choose a Puzzle" (default active)
    - Tab 2: "Create Your Own" (existing upload flow)
    - Shared result/canvas area below both tabs.
  - Implement "Choose a Puzzle" tab in `app.js`:
    1. On page load, fetch `puzzles/manifest.json` and display a scrollable list
       of puzzles showing ID and title (e.g., `#1 — Dog`).
    2. Add a search/filter input that filters by puzzle number or title as user types.
    3. On puzzle click, fetch `puzzles/{id}.json`, render with `renderPBNGrid`
       using default options + `puzzleInfo`, show result with download/print buttons.
  - Add tab and puzzle list styles to `style.css`.
  - The existing "Create Your Own" flow stays unchanged, just wrapped in its tab.
- **Files:** `src/index.html`, `src/app.js`, `src/style.css`
- **Dependencies:** Task 1 (for `puzzleInfo` rendering on selected puzzles).
  Task 2 is needed to have actual puzzle data, but the UI can be built and tested
  with a manually created manifest/puzzle JSON.
- **Gotchas:**
  - Puzzle data path is `puzzles/manifest.json` (relative to `src/` root, which
    is the deployed site root). During dev, Vite serves from `src/`.
  - The result section's `display: none` is set by CSS, so JS must set
    `style.display = 'block'` explicitly (not clear to `''`).
  - Handle fetch errors gracefully (e.g., no puzzles directory yet).
