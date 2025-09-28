# Repository Guidelines

## Project Structure & Module Organization
- `src/index.ts` exposes the package entry points and exports crawler utilities.
- `src/PttCrawler.ts` contains the core crawler implementation and helper functions for parsing PTT pages.
- `src/example/example.ts` demonstrates end-to-end usage of the crawler; translate new examples here when adding features.
- Generated JavaScript lives in `dist/` after builds; this directory is ignored in Git to keep the tree clean.

## Build, Test, and Development Commands
- `npm install` installs runtime (`axios`, `cheerio`) and TypeScript toolchain dependencies.
- `npm run build` compiles TypeScript to CommonJS artifacts in `dist/` using the settings in `tsconfig.json`.
- `npm start` runs the compiled example script from `dist/example/example.js`; ensure you build before running.

## Coding Style & Naming Conventions
- Prefer TypeScript and keep files in `src/`; compiled output should never be checked in.
- Use 2-space indentation, camelCase for variables/functions, PascalCase for classes, and descriptive names for crawler options.
- Keep exports small and composable—group related helpers near their consumer in `PttCrawler.ts`.
- Run `npm run build` before sending changes to verify the code compiles without type errors.

## Testing Guidelines
- No automated tests exist yet; add new tests under `src/__tests__/` using your preferred TypeScript-friendly test runner (Jest or Vitest recommended).
- Mirror source structure in the test directory (e.g., `src/__tests__/PttCrawler.spec.ts`).
- Aim for coverage on crawler parsing logic and HTTP integration boundaries; mock network calls where possible.

## Commit & Pull Request Guidelines
- Write commits in the imperative mood (e.g., `Add list parsing for push counts`) and keep them focused on a single concern.
- Reference related issues in commit bodies or pull request descriptions using `Fixes #123` when applicable.
- Pull requests should summarize changes, list manual or automated verification steps, and include screenshots when output formatting changes.
- Request review once `npm run build` passes and tests (when present) succeed locally.
