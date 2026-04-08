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

  const ownCaptures = findCaptures(simulated, getOpponent(simulated.currentPlayer));
  return ownCaptures.some((group) =>
    group.some((key) => getCellState(simulated, key)?.owner === simulated.currentPlayer),
  );
}

function getOpponent(playerId) {
  return playerId === "playerA" ? "playerB" : "playerA";
}
