import { popHistorySnapshot } from "../core/state.js";
import { updatePreview } from "./hover-preview.js";
import { clearPreview } from "./selection-state.js";
import { applyResolvedMove } from "../core/apply-move.js";

export function bindBoardInteraction(store, dom, renderApp) {
  let pendingTap = null;

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
    pendingTap = {
      key: polygon.dataset.key,
      x: event.clientX,
      y: event.clientY,
      startedAt: performance.now(),
      pointerId: event.pointerId,
    };
  });

  window.addEventListener("pointermove", (event) => {
    if (!pendingTap || pendingTap.pointerId !== event.pointerId) {
      return;
    }
    const moved = Math.hypot(event.clientX - pendingTap.x, event.clientY - pendingTap.y);
    if (moved > 8) {
      pendingTap = null;
    }
  });

  window.addEventListener("pointerup", (event) => {
    if (!pendingTap || pendingTap.pointerId !== event.pointerId) {
      return;
    }

    const duration = performance.now() - pendingTap.startedAt;
    const moved = Math.hypot(event.clientX - pendingTap.x, event.clientY - pendingTap.y);
    const polygon = document.elementFromPoint(event.clientX, event.clientY)?.closest("polygon[data-key]");
    const tapKey = pendingTap.key;
    pendingTap = null;

    if (duration > 180 || moved > 8 || !polygon || polygon.dataset.key !== tapKey || store.state.gameOver) {
      return;
    }

    const preview = updatePreview(store.state, tapKey);
    if (!preview.valid) {
      store.state.status = preview.reason;
      renderApp();
      return;
    }

    applyResolvedMove(store.state, preview);
    renderApp();
  });

  window.addEventListener("pointercancel", () => {
    pendingTap = null;
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
