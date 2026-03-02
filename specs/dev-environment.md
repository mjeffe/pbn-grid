# PBN-Grid Development Environment

## Project Structure

```
pbn-grid/
├── AGENTS.md                  # LLM agent guidance
├── README.md                  # Project documentation
├── LICENSE
├── .gitignore
├── package.json               # Project config, scripts, dev dependencies
├── vitest.config.js           # Vitest configuration
├── vite.config.js             # Vite dev server configuration
├── Dockerfile                 # Docker image for local dev
├── docker-compose.yml         # Docker Compose for local dev
├── specs/                     # Specification documents
│   ├── overview.md
│   ├── pbn-grid-core.md
│   ├── pbn-grid-renderer.md
│   ├── web-ui.md
│   ├── dev-environment.md
│   ├── ci-cd.md
│   └── pre-generated-puzzles.md
├── scripts/
│   └── generate-puzzles.js    # Node.js script to generate puzzle JSON from images
├── puzzles/
│   └── source-images/         # Source images for generation (gitignored)
└── src/
    ├── index.html             # Main web page
    ├── style.css              # Web page styles
    ├── app.js                 # Web page UI logic
    ├── puzzles/               # Generated puzzle data (committed, deployed)
    │   ├── manifest.json      # Puzzle manifest
    │   ├── 1.json             # PBNGridResult for puzzle #1
    │   └── ...
    ├── pbn-grid-core/         # Core library (no DOM dependencies)
    │   ├── index.js           # Public API: generatePBNGrid, quantizeColors, buildGrid
    │   ├── quantize.js        # Median-cut color quantization
    │   ├── grid.js            # Grid generation logic
    │   └── __tests__/         # Vitest tests
    │       ├── quantize.test.js
    │       └── grid.test.js
    └── pbn-grid-renderer/     # Renderer library (canvas-based)
        ├── index.js           # Public API: renderPBNGrid, getCanvasDimensions
        ├── grid-renderer.js   # Grid + number rendering
        ├── legend-renderer.js # Legend rendering
        └── __tests__/
            └── dimensions.test.js
```

## Docker Setup

### Dockerfile

- Base image: `node:lts-slim` (or similar lightweight Node image)
- Working directory: `/app`
- Install dependencies via `npm install`
- Expose port 5173 (Vite's default dev server port)
- Default command: `npm run dev`

### docker-compose.yml

- Single service: `app`
- Build from `Dockerfile`
- Mount the project root as a volume at `/app` (for live editing)
- Mount a separate anonymous volume for `node_modules` (so host and container
  don't conflict)
- Port mapping: `5173:5173`
- Forward the Vite `--host` flag so the dev server is accessible from the host

### Usage

```bash
# Start the dev server
docker compose up

# Run tests
docker compose exec app npm test

# Run tests in watch mode
docker compose exec app npm run test:watch
```

## Vite Dev Server

Vite serves the `src/` directory as a static site with hot module reload. It is
a **dev dependency only** — the production app does not require Vite.

The dev server is configured to:

- Serve `src/index.html` as the entry point.
- Support ES module imports.
- Provide hot reload on file changes.

## Vitest

Vitest is used for unit testing, primarily for `pbn-grid-core`.

### npm Scripts

| Script             | Command                              | Description                        |
| ------------------ | ------------------------------------ | ---------------------------------- |
| `dev`              | `vite`                               | Start the Vite dev server          |
| `test`             | `vitest run`                         | Run all tests once                 |
| `test:watch`       | `vitest`                             | Run tests in watch mode            |
| `generate-puzzles` | `node scripts/generate-puzzles.js`   | Generate puzzle JSON from source images |

## Dependencies

### Dev Dependencies Only

- `vite` — Dev server
- `vitest` — Test runner
- `sharp` — Image decoding for the puzzle generation script (Node.js only)

### Production Dependencies

None. The app is plain HTML, CSS, and JavaScript.
