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
- `todo` Create `index.html` app shell
- `todo` Create initial `src/js/` and `src/css/` folder structure
- `todo` Add CSS files in required load order
- `todo` Add bootstrap entry in `src/js/core/game-init.js`
- `todo` Verify empty 9x9 board renders

### Phase 2. Board model and geometry
- `todo` Define board coordinates and direction constants
- `todo` Implement neighbor lookup helpers
- `todo` Implement line-walking helpers
- `todo` Render clickable board cells with stable IDs
- `todo` Verify coordinate and neighbor behavior

### Phase 3. Game state and turn flow
- `todo` Implement game state container
- `todo` Implement current player and turn transitions
- `todo` Implement action mode handling
- `todo` Implement new game reset
- `todo` Verify valid action advances turn

### Phase 4. Placement rule engine
- `todo` Implement disconnected single-cell placement rule
- `todo` Implement adjacent-group placement length rule
- `todo` Implement straight-line preview generation
- `todo` Implement illegal move rejection
- `todo` Implement self-capture prevention for placement
- `todo` Verify preview and placement legality on representative cases

### Phase 5. Removal rule engine
- `todo` Implement owned edge-hex detection
- `todo` Implement group connectivity preservation check
- `todo` Prevent removal of last remaining hex in a group
- `todo` Implement removal behavior for captured-gradient hexes
- `todo` Verify legal and illegal removal cases

### Phase 6. Capture detection and resolution
- `todo` Implement enclosed-group detection
- `todo` Implement edge-reach search through empty cells
- `todo` Convert captured enemy hexes to capturer ownership
- `todo` Persist captured-origin metadata for scoring and styling
- `todo` Implement chain capture resolution until stable
- `todo` Verify simultaneous and chained capture cases

### Phase 7. Scoring and endgame
- `todo` Implement weighted scoring
- `todo` Implement no-legal-move end condition
- `todo` Implement tie-break ordering
- `todo` Build endgame summary UI
- `todo` Verify final score calculations

### Phase 8. UI polish and usability
- `todo` Add turn status and action messaging
- `todo` Add hover preview styling
- `todo` Add capture gradient styling
- `todo` Add score panel
- `todo` Add new game control styling
- `todo` Verify desktop usability flow

## Refactor compliance checklist
- `todo` Keep all new files within one-level-deep domain folders
- `todo` Keep files near 100-300 lines where practical
- `todo` Split files that approach 400+ lines at natural boundaries
- `todo` Update `index.html` CSS load order correctly
- `todo` Log structural file-splitting work in `docs/refactor/history/refactor-archive-YYYY-MM-DD.md`

## Review checkpoints
- After Phase 1: confirm structure and visual shell
- After Phase 4: confirm placement interpretation matches the spec
- After Phase 6: confirm capture behavior on visual scenarios
- After Phase 7: confirm scoring and tie-break behavior
