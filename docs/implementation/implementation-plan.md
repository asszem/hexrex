# HexRex Implementation Plan

## Scope and assumptions
The rules are mostly specified. One edge case remains intentionally deferred: whether a `remove` action can trigger capture. The implementation should keep that rule isolated so it can be enabled later without restructuring the app.

The refactor prompt is a hard constraint:
- one-level-deep folders only
- single-responsibility files
- target 100-300 lines per file
- split only at natural boundaries

## Target structure
```text
src/
  js/
    core/
      constants.js
      board.js
      state.js
      game-init.js
      turn-engine.js
      move-validation.js
      placement-rules.js
      removal-rules.js
      scoring.js
      game-over.js
    events/
      capture-detection.js
      capture-resolution.js
      chain-resolution.js
    ui/
      dom-refs.js
      board-render.js
      board-geometry.js
      board-interaction.js
      hover-preview.js
      selection-state.js
      turn-panel.js
      score-panel.js
      endgame-modal.js
      status-messages.js
    io/
      new-game.js
    ai/
      README.md
  css/
    core/
      variables.css
      reset.css
      layout.css
      buttons.css
      typography.css
    board/
      board-shell.css
      hex-cells.css
      hover-preview.css
      capture-gradient.css
    panels/
      sidebar.css
      scoreboard.css
      turn-status.css
    forms/
      modal.css
      endgame.css
index.html
docs/
  refactor/
    history/
```

## Delivery phases

### Phase 1. Foundation
Create the static app shell:
- `index.html` with board area, sidebar, status area, new-game button, and endgame modal container
- CSS load order aligned to the refactor prompt
- base JS bootstrap via `game-init.js`

Expected result:
- empty rendered 9x9 hex board
- stable file layout established first

### Phase 2. Board model and geometry
Implement:
- board coordinate system for a 9x9 hex grid
- neighbor lookup in 6 directions
- direction constants and line-walking helpers
- cell identity and occupancy shape

Primary files:
- `src/js/core/constants.js`
- `src/js/core/board.js`
- `src/js/ui/board-geometry.js`

Verification:
- render all cells consistently
- clicking a cell reports the correct coordinate
- neighbor traversal behaves correctly

### Phase 3. Game state and turn flow
Implement:
- player state
- owned cells and captured metadata
- current turn and action mode
- new game reset

Primary files:
- `src/js/core/state.js`
- `src/js/core/turn-engine.js`
- `src/js/io/new-game.js`

Verification:
- start and reset work
- active player flips only after valid actions

### Phase 4. Placement rule engine
Implement:
- free single-cell placement for disconnected placements
- adjacent-group-based placement
- opposite-direction contiguous owned count
- straight-line required placement preview
- illegal move detection for collisions and off-board overlap
- self-capture prevention on placement

Primary files:
- `src/js/core/placement-rules.js`
- `src/js/core/move-validation.js`
- `src/js/ui/hover-preview.js`
- `src/js/ui/selection-state.js`

Verification:
- hover preview shows exact cells that would be placed
- invalid previews are visually distinct
- no placement commits unless the full line is legal

### Phase 5. Removal rule engine
Implement:
- remove exactly one owned edge hex
- cannot remove if group would disconnect
- cannot remove the last hex of a group
- captured-gradient hexes are removable by current owner and lose double value when removed

Primary files:
- `src/js/core/removal-rules.js`
- `src/js/ui/board-interaction.js`

Verification:
- edge-only enforcement
- group connectivity preserved after legal removal
- singleton groups cannot be removed to zero

### Phase 6. Capture detection and resolution
Implement:
- path-to-board-edge search through empty cells
- detect enemy groups fully enclosed by current player after placement
- convert captured cells to capturer ownership
- mark captured-origin cells with gradient metadata
- continue capture resolution in chains until stable
- preserve outer-capturer precedence where simultaneous situations arise

Primary files:
- `src/js/events/capture-detection.js`
- `src/js/events/capture-resolution.js`
- `src/js/events/chain-resolution.js`

Open rule hook:
- capture after removal remains configurable and disabled until confirmed

Verification:
- single-capture scenarios
- chained conversion scenarios
- self-capture prevention before commit

### Phase 7. Scoring and endgame
Implement:
- total score = normal owned hexes + double value for captured-origin hexes
- end immediately when active player has no legal move
- tie-breaks:
  1. more captured cells
  2. longer straight-line chain in any of the 6 directions
  3. tie

Primary files:
- `src/js/core/scoring.js`
- `src/js/core/game-over.js`
- `src/js/ui/score-panel.js`
- `src/js/ui/endgame-modal.js`

Verification:
- endgame summary shows all requested info
- tie-break ordering is deterministic

### Phase 8. UI polish and usability
Implement:
- clear player colors
- capture gradient styling
- action affordances for place and remove
- hover preview
- status text for invalid and valid moves
- new game button

Primary files:
- `src/js/ui/status-messages.js`
- `src/js/ui/turn-panel.js`
- CSS files in `src/css/board/`, `src/css/panels/`, and `src/css/forms/`

Verification:
- desktop interaction complete
- owned vs captured-origin cells are visually distinct

## Testing strategy
Keep game rules in pure modules and keep DOM code thin.

Recommended tests:
```text
tests/placement-rules.test.js
tests/removal-rules.test.js
tests/capture-resolution.test.js
tests/scoring.test.js
tests/game-over.test.js
tests/ui-hover-preview.test.js
```

Focus:
- pure rules tests for placement, removal, capture, scoring, and endgame
- small UI smoke tests for rendering, preview, and turn switching

## Risk review
The main complexity is in the placement and capture rules. To control that, implement and verify the pure rules engine before layering in UI behaviors. Keep the unresolved `remove -> capture` rule behind a clear boundary so it can be decided later without rewriting the game flow.
