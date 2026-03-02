# Implementation Plan

> **Status:** Complete — all tasks planned, ready for build.
>
> **Current state:** Greenfield — no `src/` directory exists yet. Everything
> below must be created from scratch.

---

## Task 1 — Dev Environment Scaffold

**Spec:** [dev-environment.md](../specs/dev-environment.md)
**Status:** `planned`

Create the project infrastructure files needed before any application code:

- `package.json` with `dev`, `test`, and `test:watch` scripts; `vite` and
  `vitest` as dev dependencies; no production dependencies.
- `vite.config.js` — configure Vite to serve `src/` as root with
  `src/index.html` as entry.
- `vitest.config.js` — configure Vitest for the project.
- `Dockerfile` — `node:lts-slim`, working dir `/app`, `npm install`, expose
  5173, default cmd `npm run dev`.
- `docker-compose.yml` — single `app` service with volume mount for project
  root, anonymous volume for `node_modules`, port `5173:5173`, pass `--host`
  flag.

**Verify:** `npm install` succeeds, `npm run dev` starts Vite, `npm test` runs
(even with zero tests).

---

## Task 2 — Core Library: Color Quantization

**Spec:** [pbn-grid-core.md](../specs/pbn-grid-core.md)
**Status:** `planned`

Implement the median-cut color quantization algorithm:

- Create `src/pbn-grid-core/quantize.js`:
  - `quantizeColors(imageData, colorCount) → PBNColor[]`
  - Median-cut algorithm: build color buckets from RGBA pixel data, recursively
    split along the channel with the largest range, compute average color per
    bucket, return 1-based indexed `PBNColor` array.
  - Skip fully transparent pixels (alpha = 0).
- Create `src/pbn-grid-core/__tests__/quantize.test.js`:
  - Test correct number of colors returned.
  - Test with known single-color data → one color returned.
  - Test with two distinct colors → two colors returned.
  - Test color count exceeding actual colors in image.
  - Test 1×1 image.

**Verify:** `npm test` — all quantize tests pass.

---

## Task 3 — Core Library: Grid Generation & Public API

**Spec:** [pbn-grid-core.md](../specs/pbn-grid-core.md)
**Status:** `planned`
**Depends on:** Task 2

Implement grid generation and wire up the core public API:

- Create `src/pbn-grid-core/grid.js`:
  - `buildGrid(imageData, palette, gridWidth, gridHeight) → number[][]`
  - Divide image into grid cells (pixel regions), find dominant quantized color
    per cell, return 2D array of 1-based palette indices.
- Create `src/pbn-grid-core/index.js` — public API:
  - `generatePBNGrid(imageData, options) → PBNGridResult`
  - Apply defaults (`colorCount: 10`, `constrainBy: "width"`, `cellCount: 30`).
  - Calculate grid dimensions from image aspect ratio.
  - Call `quantizeColors`, then `buildGrid`, return `PBNGridResult`.
  - Re-export `quantizeColors` and `buildGrid`.
- Create `src/pbn-grid-core/__tests__/grid.test.js`:
  - Test grid dimension calculation (aspect ratio, rounding).
  - Test with solid-color image → all cells same index.
  - Test with two-color vertical split → correct indices per column.
  - Test default option application.
  - Test `constrainBy: "height"`.

**Verify:** `npm test` — all core tests pass.

---

## Task 4 — Renderer: Grid & Legend Rendering

**Spec:** [pbn-grid-renderer.md](../specs/pbn-grid-renderer.md)
**Status:** `planned`
**Depends on:** Task 3 (uses core data types)

Implement the canvas renderer:

- Create `src/pbn-grid-renderer/grid-renderer.js`:
  - Render grid cells as white squares with muted gray grid lines.
  - Center 1-based palette index numbers in each cell (muted gray text).
  - Font size scales with cell size.
- Create `src/pbn-grid-renderer/legend-renderer.js`:
  - Render legend below (or beside) the grid on the same canvas.
  - Each entry: palette index number, filled color swatch, empty bordered swatch.
  - Entries arranged in a row/wrapped layout fitting canvas width.
- Create `src/pbn-grid-renderer/index.js` — public API:
  - `renderPBNGrid(canvas, gridResult, options?) → void`
  - `getCanvasDimensions(gridResult, options?) → { width, height }`
  - Apply render option defaults (`cellSize: 30`, `lineColor: "#cccccc"`,
    `lineWidth: 0.5`, `numberColor: "#999999"`, `fontSize: 12`,
    `showLegend: true`).
- Create `src/pbn-grid-renderer/__tests__/dimensions.test.js`:
  - Test `getCanvasDimensions` for various grid sizes.
  - Test with legend enabled vs. disabled.
  - Test that canvas dimensions account for legend space.

**Verify:** `npm test` — all renderer dimension tests pass.

---

## Task 5 — Web UI

**Spec:** [web-ui.md](../specs/web-ui.md)
**Status:** `planned`
**Depends on:** Task 3, Task 4

Create the single-page web interface:

- Create `src/index.html`:
  - File input for image upload with thumbnail preview.
  - Options panel: color count (numeric input, min 2, max 30, default 10),
    constrain by (dropdown: Width/Height), cell count (numeric input, min 5,
    max 100, default 30).
  - Warning area for large grid sizes (either dimension > ~60 cells).
  - Generate button (disabled until image uploaded).
  - Result area: canvas container, Download PNG button, Print button.
  - Load `app.js` as ES module.
- Create `src/style.css`:
  - Clean, minimal, functional desktop-focused design.
  - Style all UI components: upload area, options panel, buttons, canvas
    display, warnings.
- Create `src/app.js`:
  - Handle image upload: read file, create thumbnail preview, load into
    off-screen canvas to extract `ImageData`.
  - Handle Generate click: call `generatePBNGrid()`, then `renderPBNGrid()`.
  - Display grid dimension warning if either dimension > 60 cells.
  - Download PNG: `canvas.toBlob()` → `URL.createObjectURL()` → `<a download>`.
  - Print: open new tab with minimal HTML containing the canvas image, call
    `window.print()`.

**Verify:** `npm run dev` — app loads, end-to-end manual test: upload image →
configure → generate → download/print.

---

## Task 6 — CI/CD Pipeline

**Spec:** [ci-cd.md](../specs/ci-cd.md)
**Status:** `planned`
**Depends on:** Task 1

Create the GitHub Actions workflow:

- Create `.github/workflows/ci.yml`:
  - Trigger on push to all branches and pull requests.
  - Jobs: checkout → setup Node (LTS) → `npm ci` → `npm test`.
  - Deploy step (main only, tests pass): publish `src/` directory to GitHub
    Pages using `actions/deploy-pages` (or `actions/upload-pages-artifact` +
    `actions/deploy-pages`).
  - Configure for GitHub Actions as Pages source (not branch-based).

**Verify:** Push to a branch → tests run. Push to main → tests run + deploy.
