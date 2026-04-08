import { advanceTurn } from "../core/turn-engine.js";
import { popHistorySnapshot, pushHistorySnapshot, setCellState } from "../core/state.js";
import { resolveCaptureChains } from "../events/chain-resolution.js";
import { evaluateGameOver } from "../core/game-over.js";
import { buildPlacementPreview } from "../core/placement-rules.js";
import { buildRemovalPreview } from "../core/removal-rules.js";
import { saveAuto } from "../io/storage.js";
import { updatePreview } from "./hover-preview.js";
import { clearPreview } from "./selection-state.js";

export function bindBoardInteraction(store, dom, renderApp) {
  function undoLastMove() {
    const undone = popHistorySnapshot(store.state);
    store.state.status = undone ? "Last move undone." : "No move to undo.";
    renderApp();
  }

  dom.board.addEventListener("mousemove", (event) => {
    const polygon = event.target.closest("polygon[data-key]");
    if (!polygon || store.state.gameOver) {
      return;
    }

    if (store.state.hoverKey === polygon.dataset.key) {
      return;
    }

    store.state.hoverKey = polygon.dataset.key;
    const preview = updatePreview(store.state, polygon.dataset.key);
    store.state.status = preview.reason;
    renderApp();
  });

  dom.board.addEventListener("mouseleave", () => {
    store.state.hoverKey = null;
    clearPreview(store.state);
    store.state.status = "Hover a cell to preview the move.";
    renderApp();
  });

  dom.board.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }

    const polygon = event.target.closest("polygon[data-key]");
    if (!polygon || store.state.gameOver) {
      return;
    }
    event.preventDefault();

    const preview = updatePreview(store.state, polygon.dataset.key);
    if (!preview.valid) {
      store.state.status = preview.reason;
      renderApp();
      return;
    }

    pushHistorySnapshot(store.state);

    if (preview.type === "place") {
      for (const key of preview.cells) {
        setCellState(store.state, key, {
          owner: store.state.currentPlayer,
          captured: false,
          originalOwner: store.state.currentPlayer,
        });
      }
      const converted = resolveCaptureChains(store.state, store.state.currentPlayer);
      store.state.status =
        converted > 0
          ? `Captured ${converted} hex${converted > 1 ? "es" : ""}.`
          : preview.reason;
    } else {
      setCellState(store.state, preview.cells[0], null);
      store.state.status = preview.reason;
    }

    advanceTurn(store.state);
    const gameOver = evaluateGameOver(store.state, buildPlacementPreview, buildRemovalPreview);
    if (gameOver) {
      store.state.gameOver = true;
      store.state.winner = gameOver;
      store.state.status = `${gameOver.winnerName} wins.`;
    }
    saveAuto(store.state);
    renderApp();
  });

  dom.board.addEventListener("contextmenu", (event) => {
    const polygon = event.target.closest("polygon[data-key]");
    if (!polygon) {
      return;
    }
    event.preventDefault();
    undoLastMove();
  });

  if (dom.undoButton) {
    dom.undoButton.addEventListener("click", () => {
      undoLastMove();
    });
  }
}
