# Implementation Plan

> **Status:** Complete — all tasks planned, ready for build.
>
> **Current state:** Tasks 1–6 from the original plan are complete. All infrastructure,
> core library, renderer, web UI, and CI/CD are implemented and tests pass (26/26).
> The remaining tasks address spec gaps found during review.

---

## Task 7 — Core: Over-Quantize and Merge Strategy

**Spec:** [pbn-grid-core.md](../specs/pbn-grid-core.md) — "Over-quantize and merge" section
**Status:** `complete`
**Depends on:** None (modifies existing code)

The current `quantizeColors()` runs plain median-cut directly to `colorCount`.
The spec requires an over-quantize-then-merge strategy to preserve minority
colors:

1. **Over-quantize:** Run median-cut targeting `colorCount × 3` colors (or the
   actual number of distinct colors, whichever is smaller).
2. **Merge:** Iteratively find the two palette entries with the smallest
   Euclidean distance in RGB space. When merging, weight the result by each
   entry's pixel count (more prevalent color dominates). Repeat until the
   palette has `colorCount` entries.
3. **Re-index:** Assign final 1-based indices to the merged palette.

Changes needed in `src/pbn-grid-core/quantize.js`:
- Track pixel count per bucket through the median-cut process.
- After median-cut, build an intermediate palette with pixel counts.
- Implement the merge loop: find closest pair by Euclidean RGB distance,
  merge with pixel-weighted average, repeat until at target count.
- Re-index final palette entries 1-based.

Tests to add/update in `src/pbn-grid-core/__tests__/quantize.test.js`:
- **Distinct minority colors survive:** 95% brown/tan + 5% vivid blue →
  quantize to 4 colors → palette includes a blue entry.
- **Similar colors merge:** 3 near-identical grays + 3 distinct colors →
  quantize to 4 → grays collapse to 1–2 entries.
- **Pixel-weighted merge:** When two colors merge, result is closer to the
  color with more pixels.
- **Edge case — colorCount ≥ distinct colors:** Image with fewer distinct
  colors than requested → no merge needed, returns as-is.
- **Deterministic:** Same input always produces the same palette.
- Existing tests should continue to pass (they don't assert exact color values
  that would break with the improved algorithm).

**Verify:** `npm test` — all quantize tests pass (old and new).

---

## Task 8 — Renderer: Auto-Scaling Font Size

**Spec:** [pbn-grid-renderer.md](../specs/pbn-grid-renderer.md) — fontSize option
**Status:** `planned`
**Depends on:** None (modifies existing code)

The spec says `fontSize` default should be `null`, and when null, auto-calculate
as `Math.max(8, Math.floor(cellSize * 0.45))`. Currently `fontSize` defaults to
`12` (hardcoded).

Changes needed:
- `src/pbn-grid-renderer/index.js`: Change `DEFAULT_OPTIONS.fontSize` to `null`.
  In `renderPBNGrid()` and `getCanvasDimensions()`, resolve `null` to the
  auto-scaled value before passing to `renderGrid()`.
- `src/pbn-grid-renderer/grid-renderer.js`: No changes needed if fontSize is
  resolved before it arrives here.
- Update JSDoc `@typedef RenderOptions` to reflect `fontSize` as
  `number | null` with default `null`.

Tests to add in `src/pbn-grid-renderer/__tests__/dimensions.test.js`:
- Verify default fontSize is null (auto-scale).
- Verify explicit fontSize overrides auto-scale.
- (Dimension tests shouldn't be affected since fontSize doesn't change canvas
  dimensions, but verify nothing breaks.)

**Verify:** `npm test` — all renderer tests pass.

---

## Task 9 — Web UI: Hide Preview Image by Default

**Spec:** [web-ui.md](../specs/web-ui.md) — Image Upload section
**Status:** `planned`
**Depends on:** None (modifies existing code)

The spec states the preview `<img>` must be **hidden by default** (no `src` set
initially) and shown only after the user selects a file. This avoids Chrome's
broken-image icon.

Changes needed:
- `src/index.html`: Add `style="display: none"` (or `hidden` attribute) to the
  `#preview` img element.
- `src/app.js`: In the image upload handler, set `preview.style.display = ''`
  (or remove `hidden` attribute) when displaying the thumbnail preview.

**Verify:** Manual — open app in browser, confirm no broken image icon on load,
confirm preview appears after file selection.

---

## Dependency Graph

```
Task 7 (Over-Quantize & Merge)   — independent
Task 8 (Auto-Scaling Font Size)  — independent
Task 9 (Hide Preview Image)      — independent
```

All three tasks are independent and can be built in any order.
Recommended order: 7 → 8 → 9 (core logic first, then renderer, then UI polish).
