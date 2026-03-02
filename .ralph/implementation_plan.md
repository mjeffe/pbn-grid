# Implementation Plan

> **Status:** Complete — all tasks planned, ready for build.
>
> **Current state:** Greenfield — no `src/` directory, `package.json`, or any
> implementation files exist yet. Everything below must be created from scratch.

---

## Task 1 — Dev Environment Scaffold

**Spec:** [dev-environment.md](../specs/dev-environment.md)
**Status:** `planned`

Create the project infrastructure files needed before any application code:

- `package.json` with `dev`, `test`, and `test:watch` scripts; `vite` and
  `vitest` as dev dependencies; no production dependencies; `"type": "module"`.
- `vite.config.js` — configure Vite to serve `src/` as root with
  `src/index.html` as entry.
- `vitest.config.js` — configure Vitest for the project.
- `Dockerfile` — `node:lts-slim`, working dir `/app`, `npm install`, expose
  5173, default cmd `npm run dev`.
- `docker-compose.yml` — single `app` service with volume mount for project
  root, anonymous volume for `node_modules`, port `5173:5173`, pass `--host`
  flag.
- Update `.gitignore` to include `node_modules/`, `dist/`, etc.

**Gotchas:**
- `package.json` must have `"type": "module"` for ES module support in Node/Vitest.
- Vite dev server needs `--host` flag in Docker for external access.

**Verify:** `npm install` succeeds, `npm run dev` starts Vite, `npm test` runs
(even with zero tests).

---

## Task 2 — Core Library: Color Quantization

**Spec:** [pbn-grid-core.md](../specs/pbn-grid-core.md)
**Status:** `planned`
**Depends on:** Task 1

Implement the median-cut color quantization algorithm:

- Create `src/pbn-grid-core/quantize.js`:
  - `quantizeColors(imageData, colorCount) → PBNColor[]`
  - Median-cut algorithm: collect RGB values from RGBA pixel data (skip fully
    transparent pixels), recursively split color buckets along the channel with
    the largest range until `colorCount` buckets exist, compute average color
    per bucket, return 1-based indexed `PBNColor` array.
  - `PBNColor` shape: `{ index, r, g, b }` where `index` is 1-based.
- Create `src/pbn-grid-core/__tests__/quantize.test.js`:
  - Correct number of colors returned for multi-color input.
  - Single-color data → one color returned.
  - Two distinct colors → two colors returned with correct RGB values.
  - `colorCount` exceeding actual distinct colors in image.
  - 1×1 image.

**Verify:** `npm test` — all quantize tests pass.

---

## Task 3 — Core Library: Grid Generation & Public API

**Spec:** [pbn-grid-core.md](../specs/pbn-grid-core.md)
**Status:** `planned`
**Depends on:** Task 2

Implement grid generation and wire up the core public API:

- Create `src/pbn-grid-core/grid.js`:
  - `buildGrid(imageData, palette, gridWidth, gridHeight) → number[][]`
  - Divide image into rectangular pixel regions per cell, find the dominant
    (most frequent) quantized color per region using nearest-color matching
    against the palette, return 2D array `[row][col]` of 1-based palette indices.
- Create `src/pbn-grid-core/index.js` — public API:
  - `generatePBNGrid(imageData, options) → PBNGridResult`
  - Apply defaults: `colorCount: 10`, `constrainBy: "width"`, `cellCount: 30`.
  - Calculate grid dimensions: constrained dimension = `cellCount`, other
    dimension = `Math.round(cellCount * aspectRatio)`.
  - Call `quantizeColors`, then `buildGrid`, assemble and return `PBNGridResult`:
    `{ grid, palette, gridWidth, gridHeight }`.
  - Re-export `quantizeColors` and `buildGrid`.
- Create `src/pbn-grid-core/__tests__/grid.test.js`:
  - Grid dimension calculation (aspect ratio, rounding) for both `constrainBy`
    values.
  - Solid-color image → all cells same index.
  - Two-color vertical split → correct indices per column.
  - Default option application when options omitted.
  - Edge case: very small image, 1×1 grid.

**Verify:** `npm test` — all core tests pass.

---

## Task 4 — Renderer: Grid & Legend Rendering

**Spec:** [pbn-grid-renderer.md](../specs/pbn-grid-renderer.md)
**Status:** `planned`
**Depends on:** Task 3 (uses `PBNGridResult` / `PBNColor` types)

Implement the canvas renderer:

- Create `src/pbn-grid-renderer/grid-renderer.js`:
  - Render grid cells as white squares with muted gray grid lines (`lineColor`,
    `lineWidth`).
  - Center 1-based palette index numbers in each cell using muted gray text
    (`numberColor`, `fontSize`).
  - Font size should scale reasonably with `cellSize`.
- Create `src/pbn-grid-renderer/legend-renderer.js`:
  - Render legend below (or beside) the grid on the same canvas.
  - Each entry: palette index number, filled color swatch, empty bordered
    swatch (for user to pencil in their own color).
  - Entries arranged in a wrapped row layout fitting canvas width.
- Create `src/pbn-grid-renderer/index.js` — public API:
  - `renderPBNGrid(canvas, gridResult, options?) → void`
    - Sets canvas width/height, renders grid then legend.
  - `getCanvasDimensions(gridResult, options?) → { width, height }`
    - Calculates required canvas size including legend area.
  - Apply render option defaults: `cellSize: 30`, `lineColor: '#cccccc'`,
    `lineWidth: 0.5`, `numberColor: '#999999'`, `fontSize: 12`,
    `showLegend: true`.
- Create `src/pbn-grid-renderer/__tests__/dimensions.test.js`:
  - `getCanvasDimensions` for various grid sizes and cell sizes.
  - Legend enabled vs. disabled affects height.
  - Canvas dimensions account for legend space.

**Verify:** `npm test` — all renderer dimension tests pass.

---

## Task 5 — Web UI

**Spec:** [web-ui.md](../specs/web-ui.md)
**Status:** `planned`
**Depends on:** Task 3, Task 4

Create the single-page web interface:

- Create `src/index.html`:
  - File input for image upload with thumbnail preview area.
  - Options panel: color count (numeric, min 2, max 30, default 10), constrain
    by (dropdown: Width/Height), cell count (numeric, min 5, max 100,
    default 30).
  - Warning area for large grids (either dimension > ~60 cells).
  - Generate button (disabled until image uploaded).
  - Result area: canvas container, Download PNG button, Print button.
  - Load `app.js` as `<script type="module">`.
- Create `src/style.css`:
  - Clean, minimal, functional desktop-focused design.
  - Style all UI components: upload area, options panel, buttons, canvas,
    warnings.
- Create `src/app.js`:
  - Image upload: read file via `FileReader`, display thumbnail preview, load
    into off-screen canvas to extract `ImageData`.
  - Generate click handler: call `generatePBNGrid()` from core, then
    `renderPBNGrid()` from renderer, display result.
  - Warning logic: after computing grid dimensions, show warning if either
    dimension exceeds ~60 cells.
  - Download PNG: `canvas.toBlob()` → `URL.createObjectURL()` →
    programmatic `<a download="pbn-grid.png">` click → revoke URL.
  - Print: open new tab, write minimal HTML with `<img>` of canvas data URL,
    call `window.print()`.
  - Import paths: `'./pbn-grid-core/index.js'` and
    `'./pbn-grid-renderer/index.js'` (relative, no bare specifiers).

**Verify:** `npm run dev` — app loads. Manual end-to-end test: upload image →
configure → generate → download/print works.

---

## Task 6 — CI/CD Pipeline

**Spec:** [ci-cd.md](../specs/ci-cd.md)
**Status:** `planned`
**Depends on:** Task 1

Create the GitHub Actions workflow:

- Create `.github/workflows/ci.yml`:
  - Trigger on push to all branches and pull requests.
  - Test job: checkout → setup Node (LTS) → `npm ci` → `npm test`.
  - Deploy job (main only, tests must pass): use
    `actions/upload-pages-artifact` to upload `src/` directory, then
    `actions/deploy-pages` to deploy.
  - Set `permissions` for Pages deployment (`pages: write`,
    `id-token: write`).
  - Configure `environment` with GitHub Pages URL.

**Verify:** Push to a branch → tests run. Push to main → tests run + deploy.
