# AGENTS.md — PBN-Grid

## Project Overview

PBN-Grid is a client-side web app that converts images into grid-based,
printable paint-by-number puzzles. Read the specs in `specs/` for full details.

## Architecture

The codebase has three layers. Respect their boundaries:

1. **`src/pbn-grid-core/`** — Pure data-processing library. NO DOM or browser
   APIs. Must work in Node.js and the browser. All color quantization and grid
   generation logic lives here.

2. **`src/pbn-grid-renderer/`** — Canvas rendering library. Takes the output of
   core and renders to an `HTMLCanvasElement`. Depends on core's data types but
   never calls core directly — it receives data, it doesn't fetch it.

3. **`src/app.js`, `src/index.html`, `src/style.css`** — Web UI. Orchestrates
   core and renderer. This is the only layer that should handle user
   interaction, file uploads, and export (PNG download, print).

## Key Rules

- **No frameworks.** Plain HTML, CSS, and JavaScript only. No React, Vue,
  Angular, jQuery, etc.
- **No external runtime dependencies.** The app has zero production
  dependencies. Everything is implemented from scratch or uses browser built-in
  APIs.
- **ES modules.** Use `import`/`export` syntax. No CommonJS (`require`).
- **Dev dependencies are dev-only.** Vite and Vitest are for development. The
  production app is plain static files served from `src/`.
- **No build step for production.** The `src/` directory is deployed as-is.

## Conventions

- **File naming:** Lowercase with hyphens (e.g., `grid-renderer.js`).
- **Module exports:** Each subdirectory has an `index.js` that serves as the
  public API. Internal modules should not be imported directly by other layers.
- **Data types:** Core defines the data structures (`PBNGridResult`, `PBNColor`)
  and both renderer and UI depend on those shapes. Document types with JSDoc.
- **Testing:** Tests live in `__tests__/` directories next to the code they
  test. Use Vitest. Core must have thorough tests. Renderer tests focus on
  dimension calculations.

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
