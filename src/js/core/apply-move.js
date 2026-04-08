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
  state.endgameDismissed = false;
  const activePlayer = state.players.find((player) => player.id === state.currentPlayer);

  if (preview.type === "place") {
    if (activePlayer) {
      activePlayer.passedLastTurn = false;
    }
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
    state.consecutivePasses = 0;
  } else if (preview.type === "pass") {
    if (activePlayer) {
      activePlayer.passedLastTurn = true;
    }
    state.status = preview.reason;
    state.consecutivePasses = (state.consecutivePasses ?? 0) + 1;
  } else {
    if (activePlayer) {
      activePlayer.passedLastTurn = false;
    }
    setCellState(state, preview.cells[0], null);
    state.status = preview.reason;
    state.consecutivePasses = 0;
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
