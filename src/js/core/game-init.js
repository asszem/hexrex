import { createBoardCells } from "./board.js";
import { createDefaultPlayers, PLAYER_PALETTE } from "./constants.js";
import { createInitialState } from "./state.js";
import { resetGame } from "../io/new-game.js";
import { clearAuto, loadAuto, loadQuick, saveQuick } from "../io/storage.js";
import { getDomRefs } from "../ui/dom-refs.js";
import { renderBoard } from "../ui/board-render.js";
import { renderArenaTurnIndicator, renderTurnPanel } from "../ui/turn-panel.js";
import { renderScorePanel } from "../ui/score-panel.js";
import { renderStatusMessage } from "../ui/status-messages.js";
import { renderEndgame } from "../ui/endgame-modal.js";
import { createSetupDraft, renderSetupModal } from "../ui/setup-modal.js";
import { showToast } from "../ui/toast.js";
import { bindBoardInteraction } from "../ui/board-interaction.js";

const dom = getDomRefs();
const autoLoadedState = loadAuto();
const store = {
  state: autoLoadedState ?? createInitialState(),
};
let boardCells = createBoardCells(store.state.boardSize);
let setupDraft = createSetupDraft(store.state);
const viewport = {
  zoom: 1,
  minZoom: 0.6,
  maxZoom: 1.8,
  baseBoardWidth: 760,
};

function setZoom(nextZoom, anchor) {
  const clampedZoom = Math.max(viewport.minZoom, Math.min(viewport.maxZoom, Number(nextZoom.toFixed(2))));
  const previousZoom = viewport.zoom;
  if (clampedZoom === previousZoom) {
    return;
  }

  const wrapperRect = dom.boardWrapper.getBoundingClientRect();
  const relativeX = anchor ? anchor.clientX - wrapperRect.left + dom.boardWrapper.scrollLeft : dom.boardWrapper.clientWidth / 2 + dom.boardWrapper.scrollLeft;
  const relativeY = anchor ? anchor.clientY - wrapperRect.top + dom.boardWrapper.scrollTop : dom.boardWrapper.clientHeight / 2 + dom.boardWrapper.scrollTop;
  const contentX = relativeX / previousZoom;
  const contentY = relativeY / previousZoom;

  viewport.zoom = clampedZoom;
  renderApp();

  dom.boardWrapper.scrollLeft = contentX * viewport.zoom - (anchor ? anchor.clientX - wrapperRect.left : dom.boardWrapper.clientWidth / 2);
  dom.boardWrapper.scrollTop = contentY * viewport.zoom - (anchor ? anchor.clientY - wrapperRect.top : dom.boardWrapper.clientHeight / 2);
}

function renderApp() {
  if (boardCells.length !== store.state.boardSize * store.state.boardSize) {
    boardCells = createBoardCells(store.state.boardSize);
  }
  dom.board.setAttribute("viewBox", `0 0 ${boardCells.viewWidth} ${boardCells.viewHeight}`);
  dom.board.style.width = `${Math.round(viewport.baseBoardWidth * viewport.zoom)}px`;
  dom.zoomLevel.textContent = `Zoom ${Math.round(viewport.zoom * 100)}%`;
  renderBoard(dom, boardCells, store.state);
  renderTurnPanel(dom, store.state);
  renderArenaTurnIndicator(dom, store.state);
  renderScorePanel(dom, store.state);
  renderStatusMessage(dom, store.state);
  if (dom.undoButton) {
    dom.undoButton.disabled = store.state.history.length === 0;
  }

  if (store.state.winner) {
    renderEndgame(dom, store.state.winner, store.state);
  }
}

function openSetupModal() {
  setupDraft = createSetupDraft(store.state);
  renderSetupModal(dom, setupDraft);
  dom.newPlayerName.value = "";
  dom.setupModal.showModal();
}

dom.newGameButton.addEventListener("click", openSetupModal);

dom.setupGridSize.addEventListener("change", () => {
  setupDraft.boardSize = Number(dom.setupGridSize.value);
});

dom.setupPlayerList.addEventListener("input", (event) => {
  const input = event.target.closest(".setup-player-input");
  if (!input) {
    return;
  }
  const index = Number(input.dataset.playerIndex);
  setupDraft.players[index].name = input.value;
});

dom.setupPlayerList.addEventListener("change", (event) => {
  const select = event.target.closest(".setup-player-control");
  if (!select) {
    return;
  }
  const index = Number(select.dataset.playerIndex);
  setupDraft.players[index].controlType = select.value;
});

dom.confirmAddPlayer.addEventListener("click", () => {
  const name = dom.newPlayerName.value.trim();
  if (!name || setupDraft.players.length >= 6) {
    return;
  }
  const palette = PLAYER_PALETTE[setupDraft.players.length % PLAYER_PALETTE.length];
  setupDraft.players.push({
    id: `player${setupDraft.players.length + 1}`,
    name,
    controlType: "human",
    ...palette,
  });
  dom.newPlayerName.value = "";
  renderSetupModal(dom, setupDraft);
});

dom.confirmNewGame.addEventListener("click", () => {
  resetGame(store, {
    boardSize: setupDraft.boardSize,
    players: setupDraft.players.map((player) => ({ ...player })),
  });
  boardCells = createBoardCells(store.state.boardSize);
  clearAuto();
  dom.endgameModal.close();
  dom.setupModal.close();
  renderApp();
});

window.addEventListener("keydown", (event) => {
  if (event.code === "Numpad0") {
    event.preventDefault();
    setZoom(1);
    return;
  }

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
    boardCells = createBoardCells(store.state.boardSize);
    dom.endgameModal.close();
    store.state.status = "Quick save loaded.";
    showToast(dom, "Quick save loaded.");
    renderApp();
  }
});

dom.zoomResetButton.addEventListener("click", () => {
  setZoom(1);
});

dom.boardWrapper.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.1 : -0.1;
    setZoom(viewport.zoom + delta, { clientX: event.clientX, clientY: event.clientY });
  },
  { passive: false },
);

let dragState = null;

dom.boardWrapper.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) {
    return;
  }
  dragState = {
    x: event.clientX,
    y: event.clientY,
    left: dom.boardWrapper.scrollLeft,
    top: dom.boardWrapper.scrollTop,
    startedAt: performance.now(),
    active: false,
    pointerId: event.pointerId,
  };
});

dom.boardWrapper.addEventListener("pointermove", (event) => {
  if (!dragState || dragState.pointerId !== event.pointerId) {
    return;
  }
  const moved = Math.hypot(event.clientX - dragState.x, event.clientY - dragState.y);
  const held = performance.now() - dragState.startedAt;
  if (!dragState.active) {
    if (moved <= 8 && held <= 180) {
      return;
    }
    dragState.active = true;
    dom.boardWrapper.classList.add("dragging");
  }
  event.preventDefault();
  dom.boardWrapper.scrollLeft = dragState.left - (event.clientX - dragState.x);
  dom.boardWrapper.scrollTop = dragState.top - (event.clientY - dragState.y);
});

function stopDragging(event) {
  dragState = null;
  dom.boardWrapper.classList.remove("dragging");
}

dom.boardWrapper.addEventListener("pointerup", stopDragging);
dom.boardWrapper.addEventListener("pointercancel", stopDragging);

bindBoardInteraction(store, dom, renderApp);
renderApp();

if (autoLoadedState) {
  showToast(dom, "Auto-save loaded.");
}

window.render_game_to_text = function renderGameToText() {
  return JSON.stringify(
    {
      currentPlayer: store.state.currentPlayer,
      players: store.state.players,
      boardSize: store.state.boardSize,
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
