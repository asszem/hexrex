import { createBoardCells } from "./board.js";
import { createInitialState } from "./state.js";
import { resetGame } from "../io/new-game.js";
import { clearAuto, loadAuto, loadQuick, saveQuick } from "../io/storage.js";
import { getDomRefs } from "../ui/dom-refs.js";
import { renderBoard } from "../ui/board-render.js";
import { renderArenaTurnIndicator, renderTurnPanel } from "../ui/turn-panel.js";
import { renderScorePanel } from "../ui/score-panel.js";
import { renderStatusMessage } from "../ui/status-messages.js";
import { renderEndgame } from "../ui/endgame-modal.js";
import { showToast } from "../ui/toast.js";
import { bindBoardInteraction } from "../ui/board-interaction.js";

const dom = getDomRefs();
const boardCells = createBoardCells();
const autoLoadedState = loadAuto();
const store = {
  state: autoLoadedState ?? createInitialState(),
};

function renderApp() {
  renderBoard(dom, boardCells, store.state);
  renderTurnPanel(dom, store.state);
  renderArenaTurnIndicator(dom, store.state);
  renderScorePanel(dom, store.state);
  renderStatusMessage(dom, store.state);
  if (dom.undoButton) {
    dom.undoButton.disabled = store.state.history.length === 0;
  }

  if (store.state.winner) {
    renderEndgame(dom, store.state.winner);
  }
}

dom.newGameButton.addEventListener("click", () => {
  resetGame(store);
  clearAuto();
  dom.endgameModal.close();
  renderApp();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "F5") {
    event.preventDefault();
    saveQuick(store.state);
    store.state.status = "Quick save created.";
    showToast(dom, "Quick save created.");
    renderApp();
    return;
  }

  if (event.key === "F9") {
    event.preventDefault();
    const quickState = loadQuick();
    if (!quickState) {
      store.state.status = "No quick save found.";
      renderApp();
      return;
    }
    store.state = quickState;
    dom.endgameModal.close();
    store.state.status = "Quick save loaded.";
    showToast(dom, "Quick save loaded.");
    renderApp();
  }
});

bindBoardInteraction(store, dom, renderApp);
renderApp();

if (autoLoadedState) {
  showToast(dom, "Auto-save loaded.");
}

window.render_game_to_text = function renderGameToText() {
  return JSON.stringify(
    {
      currentPlayer: store.state.currentPlayer,
      mode: store.state.mode,
      status: store.state.status,
      preview: store.state.preview,
      cells: Array.from(store.state.cells.entries()).map(([key, value]) => ({ key, ...value })),
      historyLength: store.state.history.length,
      gameOver: store.state.gameOver,
    },
    null,
    2,
  );
};

window.advanceTime = function advanceTime() {
  renderApp();
};
