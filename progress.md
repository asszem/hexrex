Original prompt: execute implementation

2026-04-08
- Created the project scaffold for a static browser implementation.
- Preserved the one-level-deep domain layout from the refactor prompt.
- Implemented the first full playable slice as plain HTML/CSS/JS modules without a build step.
- Kept `remove -> capture` behavior isolated so it can be decided later.
- The spec file is no longer present in the workspace, so implementation follows the clarified rules captured in the conversation and plan docs.
- Corrected the placement-direction logic so multi-hex extension grows away from the anchor group.
- Added SVG gradients for captured cells and basic endgame rendering.
- Ran pure-module verification with `node --input-type=module` for placement, removal, capture, and scoring helpers.

Open TODOs
- Confirm the final rule for whether removal can ever trigger capture.
- Add automated tests once a package/tooling choice is established.
- Add more visual simulation helpers for difficult capture edge cases.
- Run browser-level interaction verification once Playwright or another browser automation dependency is available in the repo.
