# HexRex Implementation Tracker

## Status legend
- `todo` not started
- `in-progress` currently active
- `blocked` waiting on rule clarification
- `done` completed and verified

## Open rule dependency
- `blocked`: clarify whether a `remove` action can ever trigger capture
- current implementation plan assumption: capture checks run after placement only

## Phase tracker

### Phase 1. Foundation
- `done` Create `index.html` app shell
- `done` Create initial `src/js/` and `src/css/` folder structure
- `done` Add CSS files in required load order
- `done` Add bootstrap entry in `src/js/core/game-init.js`
- `done` Verify local server serves the app shell

### Phase 2. Board model and geometry
- `done` Define board coordinates and direction constants
- `done` Implement neighbor lookup helpers
- `done` Implement line-walking helpers
- `done` Render clickable board cells with stable IDs
- `done` Verify coordinate and neighbor behavior

### Phase 3. Game state and turn flow
- `done` Implement game state container
- `done` Implement current player and turn transitions
- `done` Implement action mode handling
- `done` Implement new game reset
- `done` Verify valid action advances turn in local logic flow

### Phase 4. Placement rule engine
- `done` Implement disconnected single-cell placement rule
- `done` Implement adjacent-group placement length rule
- `done` Implement straight-line preview generation
- `done` Implement illegal move rejection
- `done` Implement self-capture prevention for placement
- `done` Verify preview and placement legality on representative cases

### Phase 5. Removal rule engine
- `done` Implement owned edge-hex detection
- `done` Implement group connectivity preservation check
- `done` Prevent removal of last remaining hex in a group
- `done` Implement removal behavior for captured-gradient hexes
- `done` Verify legal and illegal removal cases

### Phase 6. Capture detection and resolution
- `done` Implement enclosed-group detection
- `done` Implement edge-reach search through empty cells
- `done` Convert captured enemy hexes to capturer ownership
- `done` Persist captured-origin metadata for scoring and styling
- `done` Implement chain capture resolution until stable
- `done` Verify representative chained capture case in local logic

### Phase 7. Scoring and endgame
- `done` Implement weighted scoring
- `done` Implement no-legal-move end condition
- `done` Implement tie-break ordering
- `done` Build endgame summary UI
- `done` Verify final score calculations in pure-module simulation

### Phase 8. UI polish and usability
- `done` Add turn status and action messaging
- `done` Add hover preview styling
- `done` Add capture gradient styling
- `done` Add score panel
- `done` Add new game control styling
- `blocked` Verify desktop usability flow in a real browser session

## Refactor compliance checklist
- `done` Keep all new files within one-level-deep domain folders
- `done` Keep files near 100-300 lines where practical
- `done` Split files that approach 400+ lines at natural boundaries
- `done` Update `index.html` CSS load order correctly
- `todo` Log structural file-splitting work in `docs/refactor/history/refactor-archive-YYYY-MM-DD.md`

## Review checkpoints
- After Phase 1: confirm structure and visual shell
- After Phase 4: confirm placement interpretation matches the spec
- After Phase 6: confirm capture behavior on visual scenarios
- After Phase 7: confirm scoring and tie-break behavior
