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
import { chooseAiMove } from "../ai/select-move.js";
import { applyResolvedMove } from "./apply-move.js";
import { evaluateGameOver } from "./game-over.js";
import { buildPlacementPreview } from "./placement-rules.js";
import { buildRemovalPreview } from "./removal-rules.js";
import { getAvailablePlacementKeys } from "./move-validation.js";
import { hasAnyLegalPlacement } from "./scoring.js";

const dom = getDomRefs();
const autoLoadedState = loadAuto();
const store = {
  state: autoLoadedState ?? createInitialState(),
};
let boardCells = createBoardCells(store.state.boardSize);
let lastStartedSetup = createSetupDraft(autoLoadedState ?? createInitialState());
let setupDraft = createSetupDraft(lastStartedSetup);
let aiTurnTimer = null;
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

function centerBoardInArena() {
  window.requestAnimationFrame(() => {
    const maxLeft = Math.max(0, dom.boardWrapper.scrollWidth - dom.boardWrapper.clientWidth);
    const maxTop = Math.max(0, dom.boardWrapper.scrollHeight - dom.boardWrapper.clientHeight);
    dom.boardWrapper.scrollLeft = maxLeft / 2;
    dom.boardWrapper.scrollTop = maxTop / 2;
  });
}

function renderApp() {
  if (boardCells.length !== store.state.boardSize * store.state.boardSize) {
    boardCells = createBoardCells(store.state.boardSize);
  }
  const activePlayer = store.state.players.find((entry) => entry.id === store.state.currentPlayer);
  const aiTurnActive = Boolean(activePlayer && activePlayer.controlType === "ai" && !store.state.gameOver);
  if (aiTurnActive) {
    store.state.aiThinking = true;
    store.state.preview = null;
    store.state.hoverKey = null;
  }
  if (!store.state.gameOver) {
    const gameOver = evaluateGameOver(store.state, buildPlacementPreview, buildRemovalPreview);
    if (gameOver) {
      store.state.gameOver = true;
      store.state.winner = gameOver;
      store.state.status = `${gameOver.winnerName} wins.`;
    }
  }
  dom.board.setAttribute("viewBox", `0 0 ${boardCells.viewWidth} ${boardCells.viewHeight}`);
  dom.board.style.width = `${Math.round(viewport.baseBoardWidth * viewport.zoom)}px`;
  dom.boardWrapper.classList.toggle("ai-thinking", Boolean(store.state.aiThinking));
  dom.zoomLevel.textContent = `Zoom ${Math.round(viewport.zoom * 100)}%`;
  dom.hintButton.textContent = store.state.hintCells?.length ? "Hide" : "Hint";
  if (dom.passButton) {
    dom.passButton.disabled = store.state.gameOver || store.state.aiThinking;
  }
  dom.ruleList.innerHTML = buildRuleLines(store.state.rules).map((line) => `<li>${line}</li>`).join("");
  renderBoard(dom, boardCells, store.state);
  renderTurnPanel(dom, store.state);
  renderArenaTurnIndicator(dom, store.state);
  renderScorePanel(dom, store.state);
  renderStatusMessage(dom, store.state);
  if (dom.undoButton) {
    dom.undoButton.disabled = store.state.history.length === 0;
  }

  if (store.state.winner) {
    if (!store.state.endgameDismissed) {
    renderEndgame(dom, store.state.winner, store.state);
    }
  }

  scheduleAiTurn();
}

function openSetupModal() {
  setupDraft = createSetupDraft(lastStartedSetup);
  renderSetupModal(dom, setupDraft);
  dom.newPlayerName.value = "";
  dom.setupModal.showModal();
}

dom.newGameButton.addEventListener("click", openSetupModal);
if (dom.passButton) {
  dom.passButton.addEventListener("click", applyPassTurn);
}

dom.hintButton.addEventListener("click", () => {
  if (store.state.hintCells?.length) {
    store.state.hintCells = [];
  } else {
    store.state.hintCells = getAvailablePlacementKeys(store.state);
  }
  renderApp();
});

dom.setupGridSize.addEventListener("change", () => {
  setupDraft.boardSize = Number(dom.setupGridSize.value);
});

dom.setupExtension.addEventListener("change", () => {
  setupDraft.rules.extension = dom.setupExtension.checked;
  renderSetupModal(dom, setupDraft);
});

dom.setupBorderProtection.addEventListener("change", () => {
  setupDraft.rules.borderProtection = dom.setupBorderProtection.checked;
  renderSetupModal(dom, setupDraft);
});

dom.setupRemoveHex.addEventListener("change", () => {
  setupDraft.rules.removeHex = dom.setupRemoveHex.checked;
  renderSetupModal(dom, setupDraft);
});

dom.setupPlayerList.addEventListener("input", (event) => {
  const input = event.target.closest(".setup-player-input");
  if (!input) {
    return;
  }
  const index = Number(input.dataset.playerIndex);
  setupDraft.players[index].name = input.value.slice(0, 10);
  if (input.value !== setupDraft.players[index].name) {
    input.value = setupDraft.players[index].name;
  }
});

dom.setupPlayerList.addEventListener("change", (event) => {
  const mode = event.target.closest(".setup-player-mode");
  if (!mode) {
    return;
  }
  const index = Number(mode.dataset.playerIndex);
  if (mode.value === "human") {
    setupDraft.players[index].controlType = "human";
    setupDraft.players[index].difficulty = "easy";
  } else {
    setupDraft.players[index].controlType = "ai";
    setupDraft.players[index].difficulty = mode.value;
  }
  renderSetupModal(dom, setupDraft);
});

dom.confirmAddPlayer.addEventListener("click", () => {
  const name = dom.newPlayerName.value.trim();
  if (!name || setupDraft.players.length >= 6) {
    return;
  }
  const palette = PLAYER_PALETTE[setupDraft.players.length % PLAYER_PALETTE.length];
  setupDraft.players.push({
    id: `player${setupDraft.players.length + 1}`,
    name: name.slice(0, 10),
    controlType: "human",
    difficulty: "easy",
    ...palette,
  });
  dom.newPlayerName.value = "";
  renderSetupModal(dom, setupDraft);
});

dom.confirmNewGame.addEventListener("click", () => {
  lastStartedSetup = createSetupDraft(setupDraft);
  resetGame(store, {
    boardSize: setupDraft.boardSize,
    rules: { ...setupDraft.rules },
    players: setupDraft.players.map((player) => ({ ...player })),
  });
  boardCells = createBoardCells(store.state.boardSize);
  store.state.hintCells = [];
  clearAuto();
  dom.endgameModal.close();
  dom.setupModal.close();
  renderApp();
  centerBoardInArena();
});

dom.endgameModal.addEventListener("close", () => {
  if (store.state.gameOver) {
    store.state.endgameDismissed = true;
  }
});

function applyPassTurn() {
  if (store.state.gameOver || store.state.aiThinking) {
    return;
  }
  const player = store.state.players.find((entry) => entry.id === store.state.currentPlayer);
  applyResolvedMove(store.state, {
    type: "pass",
    valid: true,
    cells: [],
    reason: hasAnyLegalPlacement(store.state, store.state.currentPlayer, buildPlacementPreview)
      ? `${player?.name ?? "Player"} passes.`
      : `${player?.name ?? "Player"} has no legal placement and must pass.`,
  });
  renderApp();
}

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
    lastStartedSetup = createSetupDraft(quickState);
    boardCells = createBoardCells(store.state.boardSize);
    store.state.hintCells = [];
    dom.endgameModal.close();
    store.state.status = "Quick save loaded.";
    showToast(dom, "Quick save loaded.");
    renderApp();
    return;
  }

  if (event.code === "Space" && !dom.setupModal.open && !dom.endgameModal.open) {
    event.preventDefault();
    applyPassTurn();
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
      rules: store.state.rules,
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

function scheduleAiTurn() {
  if (aiTurnTimer) {
    window.clearTimeout(aiTurnTimer);
    aiTurnTimer = null;
  }

  if (store.state.gameOver) {
    store.state.aiThinking = false;
    return;
  }

  const player = store.state.players.find((entry) => entry.id === store.state.currentPlayer);
  if (!player || player.controlType !== "ai") {
    store.state.aiThinking = false;
    return;
  }

  store.state.aiThinking = true;
  store.state.preview = null;
  store.state.hoverKey = null;
  store.state.hintCells = [];
  store.state.status = `${player.name} is thinking...`;

  aiTurnTimer = window.setTimeout(() => {
    const activePlayer = store.state.players.find((entry) => entry.id === store.state.currentPlayer);
    if (!activePlayer || activePlayer.controlType !== "ai" || store.state.gameOver) {
      store.state.aiThinking = false;
      return;
    }
    const move = chooseAiMove(store.state, activePlayer);
    if (!move) {
      store.state.aiThinking = false;
      return;
    }
    applyResolvedMove(store.state, move);
    store.state.aiThinking = false;
    store.state.hintCells = [];
    renderApp();
  }, 260);
}

function buildRuleLines(rules) {
  return [
    "Place one action per turn.",
    rules.extension
      ? "If a move touches your existing line, it must continue that line by the same length on the opposite side."
      : "One hex can be placed on any unoccupied cell.",
    rules.borderProtection
      ? "Reaching the border prevents capture."
      : "Groups can be captured on the border.",
    rules.removeHex
      ? "Owned edge hexes may be removed."
      : "Hexes can only be added.",
    "A player may pass instead of moving.",
    "If all players pass consecutively, the game ends.",
    "Captured cells convert and score double.",
  ];
}
