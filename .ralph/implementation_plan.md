# Implementation Plan

## Status: complete

All specs are implemented. One UI task remains — the "Show titles" checkbox
and puzzle list sizing described in the specs but not yet in the code.

---

### Task 1: "Show titles" toggle and puzzle list sizing

**Spec:** `specs/web-ui.md`, `specs/pre-generated-puzzles.md`

**Status:** `planned`

**Description:**

Three related gaps in the "Choose a Puzzle" tab:

1. **"Show titles" checkbox missing.** The spec requires a checkbox that hides
   puzzle titles by default (each entry shows only `#1`, not `#1 — Dog`).
   Titles should be revealed when the checkbox is checked. Currently,
   `renderPuzzleList()` always shows the title if present.

2. **Puzzle info should respect "Show titles."** When rendering a pre-generated
   puzzle, `puzzleInfo.title` should only be passed to the renderer when the
   checkbox is checked. Currently `loadPuzzle()` always passes `puzzle.title`.

3. **Puzzle list height too large.** The spec says the list should show
   approximately 4 visible items with scrolling. The current
   `#puzzle-list { max-height: 400px }` shows ~11 items. Reduce to ~160px.

**Changes:**

- `src/index.html` — Add a `<label><input type="checkbox" id="show-titles"> Show titles</label>`
  between the filter input and the puzzle list.
- `src/app.js`:
  - Add a reference to the new checkbox element.
  - Update `renderPuzzleList()` to read the checkbox state and only include
    titles when checked.
  - Add a `change` event listener on the checkbox that re-renders the list
    and, if a puzzle is currently displayed, re-renders the canvas with
    updated `puzzleInfo`.
  - Update `loadPuzzle()` to conditionally pass `title` in `puzzleInfo`
    based on checkbox state.
  - Track the currently-displayed puzzle so re-rendering on checkbox toggle
    is possible.
- `src/style.css` — Change `#puzzle-list { max-height: 400px }` to `~160px`.

**Verification:** Manual browser testing (tab switching, checkbox toggle,
filter, puzzle rendering, print). All existing `npm test` tests must still pass.
