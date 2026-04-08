# Repository Guidelines

## Project Structure & Module Organization
This repository is currently in an early refactor/setup phase. The active architectural target is documented in [`refactor/REFACTOR-PROMPT.md`](./refactor/REFACTOR-PROMPT.md). Build new code under `src/` using a shallow, domain-based layout:

- `src/js/core/`, `src/js/ui/`, `src/js/events/`, `src/js/ai/`, `src/js/io/`
- `src/css/core/`, `src/css/board/`, `src/css/panels/`, `src/css/forms/`

Keep folders one level deep and files focused on a single responsibility. Target roughly 100-300 lines per file; split files when they exceed about 400 lines at natural boundaries.

## Build, Test, and Development Commands
There is no committed build toolchain yet. When adding one, document the exact commands in `package.json` and keep them stable. Expected examples for a web app:

- `npm install` — install dependencies
- `npm run dev` — start the local development server
- `npm test` — run automated tests
- `npm run build` — produce a production bundle

If you introduce a command, update this guide in the same change.

## Coding Style & Naming Conventions
Use kebab-case for file and folder names: `turn-panel.js`, `modal-base.css`. Folder names should represent domains; file names should describe the component or behavior inside them.

Prefer small, single-purpose modules. Preserve behavior during refactors unless the task explicitly asks for logic changes. For CSS, maintain load order in `index.html`: `core/variables.css`, `core/reset.css`, remaining `core/`, then `board/`, `panels/`, and `forms/`.

## Testing Guidelines
Place tests near the feature they validate or under a top-level `tests/` folder once the suite exists. Name tests after behavior, for example `turn-resolution.test.js` or `modal-submit.spec.js`.

Before merging, run the relevant test or smoke-check path for every changed area. If you split files without changing logic, verify that imports and browser loading still work.

## Commit & Pull Request Guidelines
The repository has no commit history yet, so use short imperative commit subjects such as `Add turn panel styles` or `Split event engine into ui modules`.

Pull requests should include:

- A brief summary of the change
- Any affected paths, such as `src/js/ui/` or `src/css/forms/`
- Screenshots for UI changes
- Notes on verification performed

When performing structural refactors, add an entry to `docs/refactor/history/refactor-archive-YYYY-MM-DD.md`.
