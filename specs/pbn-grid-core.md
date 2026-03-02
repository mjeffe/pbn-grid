# PBN-Grid Core Library (`pbn-grid-core`)

## Purpose

The core module is a pure data-processing library with **no DOM dependencies**.
It takes raw image pixel data and options, performs color quantization, and
produces a grid data structure and color palette.

Because it has no DOM dependencies, it is easily testable and reusable outside
the browser (e.g., in a CLI tool or Node.js script).

## Location

```
src/pbn-grid-core/
```

## Input

### Image Data

An `ImageData`-compatible object or a flat `Uint8ClampedArray` of RGBA pixel
data, along with the image's width and height in pixels.

### Options

| Option          | Type   | Default | Description                                              |
| --------------- | ------ | ------- | -------------------------------------------------------- |
| `colorCount`    | number | 10      | Number of colors to extract from the image (e.g., 6–20+) |
| `constrainBy`   | string | "width" | Which dimension the user is constraining: `"width"` or `"height"` |
| `cellCount`     | number | 30      | Number of cells along the constrained dimension          |

## Processing

### Color Quantization

Reduce the image to `colorCount` colors using the **median-cut algorithm**.

Median-cut is well-suited for this use case because:

- It runs efficiently in the browser on typical image sizes.
- It produces perceptually reasonable palettes.
- It is straightforward to implement in plain JavaScript with no external
  dependencies.

Each pixel in the image is mapped to the nearest color in the quantized palette.

### Grid Generation

1. Determine grid dimensions:
   - The constrained dimension uses `cellCount` cells.
   - The other dimension is auto-calculated from the image aspect ratio,
     rounded to the nearest integer.
2. Divide the image into a grid of square regions (in pixel space).
3. For each cell, determine the dominant color by examining the pixels in that
   region (e.g., most frequent quantized color).
4. Assign each cell the palette index (1-based number) of its dominant color.

## Output

The core module returns a result object with the following structure:

### `PBNGridResult`

```javascript
{
  grid: number[][],      // 2D array [row][col] of 1-based palette indices
  palette: PBNColor[],   // Array of colors in the palette
  gridWidth: number,     // Number of columns
  gridHeight: number,    // Number of rows
}
```

### `PBNColor`

```javascript
{
  index: number,         // 1-based index (the number shown in cells)
  r: number,             // Red (0–255)
  g: number,             // Green (0–255)
  b: number,             // Blue (0–255)
}
```

## API

### `generatePBNGrid(imageData, options) → PBNGridResult`

Main entry point. Takes image pixel data and options, returns the grid result.

**Parameters:**

- `imageData` — object with `{ data: Uint8ClampedArray, width: number, height: number }`
- `options` — object matching the Options table above (all fields optional,
  defaults applied)

**Returns:** `PBNGridResult`

### `quantizeColors(imageData, colorCount) → PBNColor[]`

Extracts a palette of `colorCount` colors from the image data using median-cut.

**Parameters:**

- `imageData` — same format as above
- `colorCount` — number of colors to extract

**Returns:** array of `PBNColor`

### `buildGrid(imageData, palette, gridWidth, gridHeight) → number[][]`

Maps image pixels to the palette and builds the 2D grid array.

**Parameters:**

- `imageData` — same format as above
- `palette` — array of `PBNColor` (from `quantizeColors`)
- `gridWidth` — number of columns
- `gridHeight` — number of rows

**Returns:** 2D array of 1-based palette indices

## Testing

This module must have tests (Vitest). Key areas to test:

- **Quantization:** Given known pixel data, verify the correct number of colors
  is returned.
- **Grid dimensions:** Given image dimensions and options, verify the grid
  width/height are calculated correctly (including aspect ratio rounding).
- **Grid content:** Given a simple image (e.g., solid color, two-color split),
  verify cells contain expected palette indices.
- **Defaults:** Verify default options are applied when not provided.
- **Edge cases:** Single-color image, very small image, 1×1 grid, color count
  exceeding actual colors in image.
