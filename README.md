# PBN-Grid

Convert images into grid-based, printable paint-by-number puzzles.

🌐 **Live app:** https://mjeffe.github.io/pbn-grid

---

> ⚠️ **Disclaimer:** This is an experimental project, built just for fun using
> my [ralph-loop](https://github.com/mjeffe/ralph-loop) iterative LLM agent
> project. Expect rough edges!

---

## What It Does

Upload any image (JPG, PNG, etc.), choose a grid size and number of colors, and
PBN-Grid generates a printable paint-by-number puzzle. The grid uses square
cells, each labeled with a number that corresponds to a color in the generated
palette. Print it out and paint!

## Usage

1. Open the [live app](https://mjeffe.github.io/pbn-grid).
2. Upload an image.
3. Choose your options:
   - **Color count** — how many colors in the palette (default: 10).
   - **Constrain by** — set the grid width or height.
   - **Cell count** — number of cells along the chosen dimension (default: 30).
4. Click **Generate**.
5. **Download** the puzzle as a PNG, or **Print** it directly from your browser.

## Development

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and
  [Docker Compose](https://docs.docker.com/compose/install/)

### Getting Started

```bash
# Start the dev server
docker compose up

# The app is available at:
# http://localhost:5173
```

### Running Tests

```bash
# Run tests once
docker compose exec app npm test

# Run tests in watch mode
docker compose exec app npm run test:watch
```

### Without Docker

If you prefer to run locally without Docker, you'll need Node.js (LTS):

```bash
npm install
npm run dev          # Start dev server at http://localhost:5173
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
```

## Project Structure

```
src/
├── index.html               # Web page
├── style.css                # Styles
├── app.js                   # UI logic
├── pbn-grid-core/           # Core library (pure data, no DOM)
│   ├── index.js
│   ├── quantize.js          # Color quantization
│   ├── grid.js              # Grid generation
│   └── __tests__/
└── pbn-grid-renderer/       # Canvas rendering library
    ├── index.js
    ├── grid-renderer.js
    ├── legend-renderer.js
    └── __tests__/
```

See [`specs/`](specs/) for detailed specifications.

## Todo

- add a `random` options with pre-generated grids so the user does not know what the image will be.

## License

See [LICENSE](LICENSE).
