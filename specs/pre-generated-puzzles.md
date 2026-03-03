# Pre-Generated Puzzles

## Summary

Pre-generated puzzles allow an admin to convert a directory of source images
into ready-to-print paint-by-number grids. Users browse a numbered list of
puzzles, select one, and print/download it — without ever seeing the original
image.

This feature supplements the existing "upload your own image" workflow. Both
are accessible from the main page via a tabbed interface.

## Generation Script

### Location

```
scripts/generate-puzzles.js
```

A Node.js script that imports `pbn-grid-core` directly (no DOM dependencies)
to produce `PBNGridResult` JSON files and a manifest.

### Usage

```bash
node scripts/generate-puzzles.js [source-dir] [options]
```

**Arguments:**

| Argument         | Default                   | Description                                   |
| ---------------- | ------------------------- | --------------------------------------------- |
| `source-dir`     | `puzzles/source-images/`  | Directory containing source images             |
| `--color-count`  | 10                        | Number of colors for quantization              |
| `--cell-count`   | 30                        | Number of cells along the constrained dimension|
| `--constrain-by` | `width`                   | Constrained dimension: `width` or `height`     |
| `--force`        | (flag)                    | Regenerate all puzzles, preserving manifest IDs |

CLI arguments are parsed from `process.argv` directly (no external libraries).

### Behavior

1. **Scan** the source directory for image files (jpg, png, gif, webp).
2. **Load the manifest** (`src/puzzles/manifest.json`) if it exists.
3. **For each image:**
   - Compute a hash of the file contents (e.g., SHA-256).
   - If the image already exists in the manifest (matched by filename) and
     its hash is unchanged, **skip** it (unless `--force` is set).
   - If the image is new, assign the next available ID (one greater than the
     current maximum ID in the manifest). IDs are never reused.
   - If the image exists but its hash changed, regenerate its JSON using the
     same ID.
   - Load the image, extract pixel data, call `generatePBNGrid()` with the
     provided options, and write the `PBNGridResult` to
     `src/puzzles/{id}.json`.
4. **Remove** manifest entries whose source image no longer exists in the
   source directory. Delete the corresponding JSON file. The removed ID is
   never reassigned.
5. **Write the updated manifest** to `src/puzzles/manifest.json`.
6. **Print a summary** of actions taken (added, updated, removed, skipped).

### Image Loading in Node.js

Since the core library expects `ImageData`-compatible input
(`{ data: Uint8ClampedArray, width, height }`), the script will need to
decode images in Node.js without a DOM. A lightweight dev dependency (e.g.,
`sharp` or `canvas`) can be used for this purpose — it is a dev-only tool
dependency, not a production dependency.

## Output

### Directory Structure

```
src/puzzles/
├── manifest.json    # committed, deployed
├── 1.json           # PBNGridResult for puzzle #1
├── 2.json
└── 3.json
```

### Manifest Format

`src/puzzles/manifest.json`:

```json
{
    "options": {
        "colorCount": 10,
        "cellCount": 30,
        "constrainBy": "width"
    },
    "puzzles": [
        { "id": 1, "filename": "dog.jpg", "hash": "a3f8c2...", "title": "Dog" },
        { "id": 2, "filename": "r2d2.jpg", "hash": "e7b1d4...", "title": "R2D2" }
    ]
}
```

- **`options`** — The generation options used. Stored for reference so the
  admin knows what settings produced these puzzles.
- **`id`** — Stable, auto-incrementing integer. Never reused.
- **`filename`** — Original source image filename (for admin reference).
- **`hash`** — SHA-256 hash of the source image file, used for change
  detection.
- **`title`** — Display title, defaults to the filename without extension.
  Can be manually edited in the manifest.

### Source Images

Source images live in a directory outside of version control (default:
`puzzles/source-images/`, gitignored). They are not deployed. The manifest
and generated JSON files are committed and deployed.

## UI Changes

### Tabbed Layout

The main page uses a tabbed interface with two tabs:

```
[ Choose a Puzzle ]    [ Create Your Own ]
```

- **"Choose a Puzzle"** is the default active tab.
- **"Create Your Own"** contains the existing upload + options + generate flow,
  unchanged.
- The result/canvas area below the tabs is shared — both tabs render into the
  same area.

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

### Puzzle Info on Rendered Grid

When rendering a pre-generated puzzle, a small info line is displayed on the
canvas **below the legend**. The info line respects the "Show titles" setting:

- When titles are **hidden** (default): `Puzzle #14`
- When titles are **shown**: `Puzzle #14 — Dog`

This ensures the puzzle number appears on printed output for reference by
returning users.

