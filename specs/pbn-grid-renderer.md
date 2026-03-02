# PBN-Grid Renderer (`pbn-grid-renderer`)

## Purpose

The renderer module takes the output of `pbn-grid-core` (grid data + palette)
and renders it to an HTML `<canvas>` element. It draws the grid, cell numbers,
and the color legend.

## Location

```
src/pbn-grid-renderer/
```

## Input

### `PBNGridResult`

The result object returned by `pbn-grid-core`'s `generatePBNGrid()`. See
[pbn-grid-core.md](./pbn-grid-core.md) for the data structure.

### Render Options

| Option          | Type              | Default  | Description                                      |
| --------------- | ----------------- | -------- | ------------------------------------------------ |
| `cellSize`      | number            | 30       | Size of each grid cell in canvas pixels           |
| `lineColor`     | string            | "#cccccc"| Color of grid lines (muted)                       |
| `lineWidth`     | number            | 0.5      | Width of grid lines in canvas pixels              |
| `numberColor`   | string            | "#999999"| Color of the numbers in cells (muted)             |
| `fontSize`      | number            | 12       | Font size for cell numbers in canvas pixels       |
| `showLegend`    | boolean           | true     | Whether to render the legend alongside the grid   |

## Rendering Details

### Grid

- Each cell is a square of `cellSize` × `cellSize` pixels on the canvas.
- Cells are filled with **white** (blank) — this is a puzzle to be painted.
- Grid lines are drawn between all cells. Lines should be **muted** (light
  gray) so they do not overpower the final painted image.
- Each cell contains its palette index number, centered in the cell. Numbers
  should also be **muted** (gray) for the same reason.
- Font size should scale reasonably with cell size.

### Color Legend

The legend is rendered on the **same canvas**, positioned below or beside the
grid (whichever fits best given the grid's aspect ratio).

Each legend entry consists of:

1. **Palette index number** — the number that appears in grid cells.
2. **Color swatch** — a small filled square showing the actual color.
3. **Blank swatch** — an empty bordered square of the same size, where the user
   can fill in their own substitute color with a pencil or marker.

Legend entries are arranged in a row or wrapped grid layout to fit the canvas
width.

## API

### `renderPBNGrid(canvas, gridResult, options?) → void`

Renders the grid and legend onto the provided canvas element.

**Parameters:**

- `canvas` — an `HTMLCanvasElement` to render onto. The renderer will set the
  canvas width and height based on the grid dimensions, cell size, and legend.
- `gridResult` — a `PBNGridResult` object from `pbn-grid-core`.
- `options` — optional object matching the Render Options table above.

### `getCanvasDimensions(gridResult, options?) → { width: number, height: number }`

Calculates the required canvas dimensions without rendering. Useful for
pre-sizing containers.

**Parameters:**

- `gridResult` — a `PBNGridResult` object.
- `options` — optional render options.

**Returns:** `{ width, height }` in canvas pixels.

## Export Support

The renderer does not handle export directly. The canvas it renders to can be
exported by the web UI using standard canvas APIs:

- **PNG download:** `canvas.toBlob()` → create a download link
- **Print:** Open canvas content in a new browser tab, invoke `window.print()`

## Testing

The renderer has DOM dependencies (`<canvas>`), which makes it harder to unit
test. Testing strategy:

- **Dimension calculations** can be unit tested (no DOM needed).
- **Visual rendering** should be verified manually or via integration tests in
  the browser.
- Prioritize testing `getCanvasDimensions()` and ensuring the canvas is sized
  correctly for various grid sizes.
