# PBN-Grid – Project Overview

## Summary

PBN-Grid is a client-side web application that converts an uploaded image into a
grid-based, printable paint-by-number puzzle. The grid uses square cells, each
labeled with a number corresponding to a color in a generated palette.

This is **not** a contour-based paint-by-number — it is a literal grid where
every cell is a square and contains a number.

## Goals

- Allow a user to upload an image, choose grid size and color count, and
  generate a printable paint-by-number grid.
- All processing happens in the browser — no server required.
- The app is a static site (plain HTML, CSS, JavaScript) with no build step
  required for production.
- The core library (`pbn-grid`) is standalone and reusable outside the web UI.

## Tech Stack

| Layer          | Technology                              |
| -------------- | --------------------------------------- |
| Language       | Plain JavaScript (ES modules)           |
| UI             | HTML + CSS (no framework)               |
| Rendering      | `<canvas>` API                          |
| Dev server     | Vite (dev dependency only)              |
| Testing        | Vitest                                  |
| Local dev      | Docker + docker-compose                 |
| CI/CD          | GitHub Actions → GitHub Pages           |

## Browser Support

Modern evergreen browsers only:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

No Internet Explorer or legacy browser support. This may be revisited later.

## Image Input

- Accepts any browser-supported image format (JPG, PNG, GIF, WebP, etc.).
- Images are loaded into a `<canvas>` to extract pixel data for processing.

## Constraints

- **No server-side processing.**
- **No frameworks or runtime dependencies.** Plain HTML, CSS, and JavaScript
  only. No React, Vue, Angular, jQuery, etc. The app has zero production
  dependencies.
- **ES modules only.** Use `import`/`export` syntax. No CommonJS (`require`).
- **Relative import paths only.** Use paths like `./quantize.js` or
  `../pbn-grid-core/index.js`. No bare specifiers — there is no bundler in
  production.
- **No build step.** The `src/` directory is deployed as-is to GitHub Pages.
- **Dev dependencies are dev-only.** Vite and Vitest are for development. The
  production app is plain static files servable by any web server, CDN, or
  file host.
