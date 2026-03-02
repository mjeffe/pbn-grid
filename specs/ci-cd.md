# PBN-Grid CI/CD

## Overview

CI/CD is handled via GitHub Actions. The pipeline runs tests on all pushes and
pull requests, and deploys to GitHub Pages only on pushes to `main` with passing
tests.

## GitHub Actions Workflow

### Trigger Rules

| Event              | Tests | Deploy |
| ------------------ | ----- | ------ |
| Push to `main`     | ✅    | ✅ (if tests pass) |
| Push to any branch | ✅    | ❌     |
| Pull request       | ✅    | ❌     |

### Workflow Steps

1. **Checkout** — Clone the repository.
2. **Setup Node** — Install Node.js (LTS version).
3. **Install dependencies** — `npm ci`
4. **Run tests** — `npm test`
5. **Deploy** (main only, if tests pass):
   - Copy the `src/` directory as the deployable static site.
   - Deploy to GitHub Pages using the `actions/deploy-pages` action (or
     equivalent).

### Workflow File

Location: `.github/workflows/ci.yml`

## GitHub Pages Configuration

- **Source:** GitHub Actions (not branch-based deployment).
- **Deployed content:** The `src/` directory, which contains `index.html`,
  `style.css`, `app.js`, and the library modules.
- Since the app uses ES modules with bare import paths relative to `src/`, no
  build step is needed — the files are served as-is.

## Notes

- There is no build/bundle step. The app is plain static files.
- The deploy step simply publishes the `src/` directory contents.
- If a build step is added in the future (e.g., bundling, minification), the
  deploy step should be updated to publish the build output instead.
