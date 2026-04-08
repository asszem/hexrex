import { cloneState, getCellState, setCellState } from "./state.js";
import { buildPlacementPreview } from "./placement-rules.js";
import { buildRemovalPreview } from "./removal-rules.js";
import { findCaptures } from "../events/capture-detection.js";

export function getPreviewForMode(state, key) {
  const cell = getCellState(state, key);
  if (cell?.owner === state.currentPlayer) {
    return buildRemovalPreview(state, key);
  }
  return buildPlacementPreview(state, key);
}

export function placementCausesSelfCapture(state, preview) {
  if (!preview.valid || preview.type !== "place") {
    return false;
  }

  const simulated = cloneState(state);
  for (const key of preview.cells) {
    setCellState(simulated, key, {
      owner: simulated.currentPlayer,
      captured: false,
      originalOwner: simulated.currentPlayer,
    });
  }

  return simulated.players
    .filter((player) => player.id !== simulated.currentPlayer)
    .some((player) =>
      findCaptures(simulated, player.id).some((group) =>
        group.some((key) => getCellState(simulated, key)?.owner === simulated.currentPlayer),
      ),
    );
}

export function getAvailablePlacementKeys(state) {
  const keys = [];
  for (let row = 0; row < state.boardSize; row += 1) {
    for (let col = 0; col < state.boardSize; col += 1) {
      const key = `${col},${row}`;
      const preview = buildPlacementPreview(state, key);
      if (preview.valid && !placementCausesSelfCapture(state, preview)) {
        keys.push(key);
      }
    }
  }
  return keys;
}
