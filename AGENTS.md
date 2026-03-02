# AGENTS.md — PBN-Grid

## Project Overview

PBN-Grid is a client-side web app that converts images into grid-based,
printable paint-by-number puzzles. Read the specs in `specs/` for full details.
Architecture, constraints, and data types are defined there — do not duplicate
them here. Pay special attention to the **Constraints** section in
`specs/overview.md`.

## Conventions

- **File naming:** Lowercase with hyphens (e.g., `grid-renderer.js`).
- **Module exports:** Each subdirectory has an `index.js` that serves as the
  public API. Internal modules should not be imported directly by other layers.
- **Data types:** Core defines the data structures (`PBNGridResult`, `PBNColor`)
  and both renderer and UI depend on those shapes. Document types with JSDoc.
- **Testing:** Tests live in `__tests__/` directories next to the code they
  test. Use Vitest. Core must have thorough tests. Renderer tests focus on
  dimension calculations.
- **Formatting**: indent with 4 spaces, 120 max char line length
- **Naming**: favor snake_case in shell and python, for javascript: use single quotes and semicolons
- **Comments**: Only add comments when code is complex and requires context for future developers

## When Making Changes

1. Read the relevant spec in `specs/` before starting work.
2. Keep changes minimal and focused on the task at hand.
3. Do not add features, abstractions, or "improvements" beyond what is asked.
4. Run `npm test` to verify changes. All tests must pass.
5. Do not modify specs unless explicitly asked to update them.

## Verification

After any change, verify by running:

```bash
# In Docker
docker compose exec app npm test

# Or directly
npm test
```

## Commit Messages

- NO agent attribution
- NO "Generated with" footers
- Use conventional commits (feat:, fix:, etc.)
- First line under 72 characters followed by a blank line.

