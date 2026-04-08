# Code Refactor Prompt — AI-Optimized File Splitting

## Goal
Split large source files into small, single-responsibility files organized in a one-level-deep folder structure. Target: 100–300 lines per file.

## Why
AI agents have limited context windows. Small, semantically named files allow an agent to:
- Read only the relevant file instead of scanning thousands of lines
- Use glob patterns to target a domain (`src/css/forms/*.css`, `src/js/ui/*.js`)
- Edit with confidence — no risk of touching unrelated code

## Target structure

```
src/<type>/
  <domain>/
    <component>.<ext>
```

One folder per domain. One file per component or closely related group. No nesting beyond one level.

## File naming rules
- Folder name replaces the common prefix: `forms/modal-base.css` not `forms/forms-modal-base.css`
- Use kebab-case for all file and folder names
- Name should answer "what does this do?" without opening the file

## Split criteria
- Split when a file exceeds ~400 lines
- Split at natural boundaries: section comments, class definitions, exported function groups
- Keep tightly coupled code together (a class and its direct helpers in one file)
- Do NOT split arbitrarily — a 250-line file is fine as-is

## Current folder maps

### CSS — `src/css/`

| Folder | Domain |
|---|---|
| `core/` | CSS variables, reset, global utilities (toast, buttons, header, game area) |
| `board/` | SVG hex board rendering |
| `panels/` | Right sidebar and all panel sub-components |
| `forms/` | Modal dialogs and their contents |

CSS load order matters. In `index.html`:
1. `core/variables.css` first — all others depend on it
2. `core/reset.css`
3. Remaining `core/` files
4. `board/` → `panels/` → `forms/`

### JS — `src/js/`

| Folder | Domain |
|---|---|
| `core/` | Game engine, state, turn/phase logic |
| `ui/` | DOM rendering and UI updates |
| `events/` | Event resolution and dispatch |
| `ai/` | AI player logic |
| `io/` | Save/load, import/export |

## When adding new code
- Find the matching folder by domain
- If the component fits an existing file (< 300 lines after addition), add it there
- If it's a new distinct component, create a new file in the appropriate folder
- For JS: update any barrel/index file or import references as needed
- For CSS: add the `<link>` tag to `index.html` in the correct section

## Refactoring an existing large file
1. Read the full file
2. Identify natural split boundaries (section comments, class/function groups)
3. Map each section to a target file name and folder
4. Write each new file — copy code exactly, no logic changes
5. Update all import/require references or `index.html` `<link>` tags
6. Delete the old file
7. Verify nothing broke (run the app or tests if available)
8. Log the event in `docs/refactor/history/refactor-archive-YYYY-MM-DD.md`

## Log entry format

```markdown
## <Type> file splitting — <short description>

### Motivation
<why the file was too large or poorly organized>

### Old files (deleted)
- `path/to/old-file.ext` — N lines

### New files created
- `path/to/new/file.ext` — what it contains

### Zero behavioral change
<confirm nothing was modified, only moved>
```
