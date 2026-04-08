import { pushHistorySnapshot, setCellState } from "./state.js";
import { advanceTurn } from "./turn-engine.js";
import { evaluateGameOver } from "./game-over.js";
import { buildPlacementPreview } from "./placement-rules.js";
import { buildRemovalPreview } from "./removal-rules.js";
import { resolveCaptureChains } from "../events/chain-resolution.js";
import { saveAuto } from "../io/storage.js";

export function applyResolvedMove(state, preview) {
  if (!preview?.valid) {
    return false;
  }

  pushHistorySnapshot(state);

  if (preview.type === "place") {
    for (const key of preview.cells) {
      setCellState(state, key, {
        owner: state.currentPlayer,
        captured: false,
        originalOwner: state.currentPlayer,
      });
    }
    const converted = resolveCaptureChains(state, state.currentPlayer);
    state.status =
      converted > 0
        ? `Captured ${converted} hex${converted > 1 ? "es" : ""}.`
        : preview.reason;
  } else {
    setCellState(state, preview.cells[0], null);
    state.status = preview.reason;
  }

  advanceTurn(state);
  const gameOver = evaluateGameOver(state, buildPlacementPreview, buildRemovalPreview);
  if (gameOver) {
    state.gameOver = true;
    state.winner = gameOver;
    state.status = `${gameOver.winnerName} wins.`;
  }
  saveAuto(state);
  return true;
}
