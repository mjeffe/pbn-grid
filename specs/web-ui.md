# PBN-Grid Web UI

## Purpose

A single-page web interface that allows users to browse pre-generated puzzles or
upload their own image, configure puzzle options, generate the paint-by-number
grid, and print or download it.

## Location

```
src/
├── index.html
├── style.css
└── app.js          # UI logic, imports pbn-grid-core and pbn-grid-renderer
```

## Tabbed Layout

The main page uses a tabbed interface with two tabs:

```
[ Choose a Puzzle ]    [ Create Your Own ]
```

- **"Choose a Puzzle"** is the default active tab.
- **"Create Your Own"** contains the existing upload + options + generate flow,
  unchanged.
- The result/canvas area below the tabs is shared — both tabs render into the
  same area with the same download/print buttons.

## User Flow — Choose a Puzzle

1. **Browse** — On page load, the app fetches `puzzles/manifest.json` and
   displays a scrollable list of available puzzles (limited to ~4 visible
   items). Each entry shows only its ID number (e.g., `#1`) by default —
   titles are hidden to keep the puzzle a mystery.
2. **Reveal titles** — A "Show titles" checkbox lets users reveal titles
   (e.g., `#1 — Dog`). This also controls whether the title appears on the
   rendered canvas.
3. **Filter** — A search/filter input filters the list by puzzle number or
   title as the user types — filtering by title works regardless of whether
   titles are currently shown.
4. **Select** — Clicking a puzzle entry fetches `puzzles/{id}.json` and renders
   the grid using the default renderer options.
5. **Export** — Download/print buttons work the same as the "Create Your Own"
   flow.

## User Flow — Create Your Own

1. **Upload image** — User selects an image file from their device.
2. **Configure options:**
   - **Color count** — Number of colors in the palette (default: 10).
   - **Constrain by** — Choose whether to set width or height.
   - **Cell count** — Number of cells along the chosen dimension (default: 30).
3. **Generate** — User clicks a button to generate the puzzle.
4. **View result** — The rendered grid + legend appears on the page.
5. **Export:**
   - **Download PNG** — Click a button to download the grid as a PNG image.
   - **Print** — Click a button to open the grid in a new browser tab for
     printing.

## UI Components

### Choose a Puzzle Tab

- On page load, fetch `puzzles/manifest.json`.
- Display a **scrollable list** of available puzzles. The list is limited to
  approximately **4 visible items** with vertical scrolling for the rest.
- By default, each entry shows only its ID number (e.g., `#1`). Titles are
  hidden to keep the puzzle a mystery.
- A **"Show titles" checkbox** lets users reveal titles (e.g., `#1 — Dog`).
- A **search/filter input** at the top filters the list by puzzle number or
  title as the user types — filtering by title works regardless of whether
  titles are currently shown.
- Clicking a puzzle entry fetches `puzzles/{id}.json`, renders the grid using
  the default renderer options, and displays the result with download/print
  buttons.

### Image Upload

- Standard file input accepting browser-supported image formats (JPG, PNG, GIF,
  WebP, etc.).
- Display a thumbnail preview of the uploaded image.
- The preview `<img>` element must be **hidden by default** (no `src` set
  initially). It is shown only after the user selects a file. This avoids
  browsers (notably Chrome) rendering a broken-image icon when no source is
  set.

### Options Panel

- **Color count:** Numeric input or range slider (min: 2, max: 30, default: 10).
- **Constrain by:** Dropdown or toggle — "Width" or "Height".
- **Cell count:** Numeric input (min: 5, max: 100, default: 30).

### Warnings

Display a warning message if the user selects a grid size that may be
problematic:

- **Too many cells:** If either grid dimension exceeds ~60 cells, warn that
  numbers may be very small and hard to read when printed.
- The warning is informational only — it does not prevent generation.

### Generate Button

- Disabled until an image is uploaded.
- On click: reads the image into pixel data, calls `generatePBNGrid()` from
  core, then calls `renderPBNGrid()` from renderer.

### Result Display

- The result section is hidden until the user clicks Generate.
- After generation, the result section is shown (`display: block`) below the
  options. Note: because the stylesheet sets `#result { display: none }`, the
  inline style must be set to `block` explicitly — clearing it to `''` would
  fall back to the stylesheet rule and remain hidden.
- The rendered canvas is displayed on the page below the options.
- Two export buttons appear alongside the result:
  - **"Download PNG"** — triggers a file download of the canvas as a PNG.
  - **"Print"** — opens the canvas image in a new browser tab for clean
    printing.

## Export Implementation

### PNG Download

```
canvas.toBlob() → URL.createObjectURL() → create <a download="pbn-grid.png"> → click → revoke URL
```

### Print

- Open a new browser tab.
- Write a minimal HTML page containing only the grid image.
- Call `window.print()` on the new tab.
- User controls paper size and orientation via their browser's print dialog.

## Styling

- Clean, minimal design.
- The page should look reasonable without heavy design effort — functional over
  polished.
- Responsive enough to be usable on desktop browsers (mobile is not a priority).
