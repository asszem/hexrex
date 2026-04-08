import { createBoardCells } from "./board.js";
import { createDefaultPlayers, PLAYER_PALETTE, getMaxPlayers } from "./constants.js";
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
import { evaluateGameOver, getForcedPassReason } from "./game-over.js";
import { buildPlacementPreview } from "./placement-rules.js";
import { buildRemovalPreview } from "./removal-rules.js";
import { getAvailablePlacementKeys } from "./move-validation.js";
import { hasAnyLegalPlacement } from "./scoring.js";
import { initI18n, setLanguage, getLanguage, t } from "./i18n.js";

const dom = getDomRefs();
await initI18n();
const autoLoadedState = loadAuto();
const store = {
  state: autoLoadedState ?? createInitialState(),
};
let boardCells = createBoardCells(store.state.boardSize);
let lastStartedSetup = createSetupDraft(autoLoadedState ?? createInitialState());
let setupDraft = createSetupDraft(lastStartedSetup);
let aiTurnTimer = null;
let aiTurnToken = 0;
let aiReplayTimer = null;
let aiQueueWorkerActive = false;
let queuedAiStates = [];
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
    store.state.aiThinking = !store.state.aiPaused && queuedAiStates.length === 0;
    store.state.preview = null;
    store.state.hoverKey = null;
  }
  if (!store.state.gameOver) {
    const gameOver = evaluateGameOver(store.state, buildPlacementPreview, buildRemovalPreview);
    if (gameOver) {
      store.state.gameOver = true;
      store.state.winner = gameOver;
      store.state.status = t("status.wins", { name: gameOver.winnerName });
    }
  }
  if (!store.state.gameOver) {
    const forcedPassReason = getForcedPassReason(store.state);
    if (forcedPassReason) {
      const currentPlayer = store.state.players.find((entry) => entry.id === store.state.currentPlayer);
      applyResolvedMove(store.state, {
        type: "pass",
        valid: true,
        cells: [],
        reason: forcedPassReason,
        playerId: currentPlayer?.id,
      });
      renderApp();
      return;
    }
  }
  dom.board.setAttribute("viewBox", `0 0 ${boardCells.viewWidth} ${boardCells.viewHeight}`);
  dom.board.style.width = `${Math.round(viewport.baseBoardWidth * viewport.zoom)}px`;
  dom.boardWrapper.classList.toggle("ai-thinking", Boolean(store.state.aiThinking));
  applyStaticTranslations();
  dom.zoomLevel.textContent = t("zoom.level", { percent: Math.round(viewport.zoom * 100) });
  dom.hintButton.textContent = store.state.hintCells?.length ? t("button.hide") : t("button.hint");
  dom.pauseAiButton.textContent = store.state.aiPaused ? t("button.resume") : t("button.pause");
  dom.pauseAiButton.disabled = store.state.gameOver || !aiTurnActive;
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

function applyStaticTranslations() {
  document.title = t("app.title");
  document.documentElement.lang = getLanguage();
  dom.board.setAttribute("aria-label", t("app.boardAriaLabel"));
  dom.langHuButton.setAttribute("aria-label", t("aria.langHungarian"));
  dom.langEnButton.setAttribute("aria-label", t("aria.langEnglish"));
  dom.langHuButton.closest(".language-switcher")?.setAttribute("aria-label", t("aria.languageSelector"));
  dom.langHuButton.querySelector("img")?.setAttribute("alt", t("aria.flagHungarian"));
  dom.langEnButton.querySelector("img")?.setAttribute("alt", t("aria.flagEnglish"));
  dom.hintButton.textContent = store.state.hintCells?.length ? t("button.hide") : t("button.hint");
  dom.passButton.textContent = t("button.pass");
  dom.pauseAiButton.textContent = store.state.aiPaused ? t("button.resume") : t("button.pause");
  dom.newGameButton.textContent = t("button.newGame");
  dom.zoomResetButton.textContent = t("button.resetZoom");
  dom.playerStatusLabel.textContent = t("panel.playerStatus");
  dom.rulesLabel.textContent = t("panel.rules");
  dom.matchResultLabel.textContent = t("panel.matchResult");
  dom.endgameTitle.textContent = t("endgame.title");
  dom.setupTitle.textContent = t("setup.title");
  dom.setupGridSizeLabel.textContent = t("setup.gridSize");
  dom.setupRulesLabel.textContent = t("setup.rules");
  dom.setupPlayersLabel.textContent = t("setup.players");
  dom.setupExtensionLabel.textContent = t("setup.extension");
  dom.setupBorderProtectionLabel.textContent = t("setup.borderProtection");
  dom.setupRemoveHexLabel.textContent = t("setup.removeHex");
  dom.confirmAddPlayer.textContent = t("button.add");
  dom.confirmNewGame.textContent = t("button.startGame");
  dom.endgameModal.querySelector(".endgame-actions button").textContent = t("button.close");
  dom.setupModal.querySelector(".setup-actions form button").textContent = t("button.cancel");
  dom.setupModal.querySelectorAll(".setup-rule-option-on").forEach((node) => {
    node.textContent = t("setup.toggle.on");
  });
  dom.setupModal.querySelectorAll(".setup-rule-option-off").forEach((node) => {
    node.textContent = t("setup.toggle.off");
  });
  dom.langHuButton.classList.toggle("active", getLanguage() === "hu");
  dom.langEnButton.classList.toggle("active", getLanguage() === "en");
}

dom.newGameButton.addEventListener("click", openSetupModal);
if (dom.passButton) {
  dom.passButton.addEventListener("click", applyPassTurn);
}
dom.pauseAiButton.addEventListener("click", toggleAiPause);
dom.langHuButton.addEventListener("click", async () => {
  await setLanguage("hu");
  renderSetupModal(dom, setupDraft);
  renderApp();
});
dom.langEnButton.addEventListener("click", async () => {
  await setLanguage("en");
  renderSetupModal(dom, setupDraft);
  renderApp();
});

dom.hintButton.addEventListener("click", () => {
  if (store.state.hintCells?.length) {
    store.state.hintCells = [];
  } else {
    store.state.hintCells = getAvailablePlacementKeys(store.state);
  }
  renderApp();
});

dom.setupGridSize.addEventListener("input", () => {
  setupDraft.boardSize = normalizeBoardSize(dom.setupGridSize.value);
  syncSetupPlayerLimit();
  dom.setupGridSize.value = String(setupDraft.boardSize);
  dom.setupGridSizeValue.textContent = t("setup.gridSizeValue", { size: setupDraft.boardSize });
  renderSetupModal(dom, setupDraft);
});

dom.setupGridSize.addEventListener("change", () => {
  setupDraft.boardSize = normalizeBoardSize(dom.setupGridSize.value);
  syncSetupPlayerLimit();
  dom.setupGridSize.value = String(setupDraft.boardSize);
  dom.setupGridSizeValue.textContent = t("setup.gridSizeValue", { size: setupDraft.boardSize });
  renderSetupModal(dom, setupDraft);
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

dom.setupPlayerList.addEventListener("focusin", (event) => {
  const input = event.target.closest(".setup-player-input");
  if (!input) {
    return;
  }
  window.requestAnimationFrame(() => input.select());
});

dom.setupPlayerList.addEventListener("click", (event) => {
  const input = event.target.closest(".setup-player-input");
  if (!input) {
    return;
  }
  input.select();
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

dom.setupPlayerList.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".setup-player-remove");
  if (!removeButton) {
    return;
  }
  const index = Number(removeButton.dataset.playerIndex);
  const minPlayers = getMaxPlayers(setupDraft.boardSize) === 1 ? 1 : 2;
  if (setupDraft.players.length <= minPlayers || Number.isNaN(index)) {
    return;
  }
  setupDraft.players.splice(index, 1);
  renderSetupModal(dom, setupDraft);
});

dom.confirmAddPlayer.addEventListener("click", () => {
  const name = dom.newPlayerName.value.trim();
  if (setupDraft.players.length >= getMaxPlayers(setupDraft.boardSize)) {
    return;
  }
  const playerNumber = setupDraft.players.length + 1;
  const palette = PLAYER_PALETTE[setupDraft.players.length % PLAYER_PALETTE.length];
  const previousPlayer = setupDraft.players.at(-1);
  setupDraft.players.push({
    id: `player${playerNumber}`,
    name: (name || t("player.defaultName", { number: playerNumber })).slice(0, 10),
    controlType: previousPlayer?.controlType ?? "human",
    difficulty: previousPlayer?.difficulty ?? "easy",
    ...palette,
  });
  dom.newPlayerName.value = "";
  renderSetupModal(dom, setupDraft);
});

dom.confirmNewGame.addEventListener("click", () => {
  clearAiAsyncWork();
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
  const forcedPassReason = getForcedPassReason(store.state);
  applyResolvedMove(store.state, {
    type: "pass",
    valid: true,
    cells: [],
    reason: forcedPassReason ?? (hasAnyLegalPlacement(store.state, store.state.currentPlayer, buildPlacementPreview)
      ? t("status.playerPasses", { name: player?.name ?? t("status.currentPlayer") })
      : t("status.playerMustPass", { name: player?.name ?? t("status.currentPlayer") })),
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
    store.state.status = t("status.quickSaveCreated");
    showToast(dom, t("status.quickSaveCreated"));
    renderApp();
    return;
  }

  if (event.key === "F9") {
    event.preventDefault();
    const quickState = loadQuick();
    if (!quickState) {
      store.state.status = t("status.noQuickSave");
      renderApp();
      return;
    }
    clearAiAsyncWork();
    store.state = quickState;
    lastStartedSetup = createSetupDraft(quickState);
    boardCells = createBoardCells(store.state.boardSize);
    store.state.hintCells = [];
    dom.endgameModal.close();
    store.state.status = t("status.quickSaveLoaded");
    showToast(dom, t("status.quickSaveLoaded"));
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
const activeBoardPointers = new Map();
let pinchState = null;

dom.boardWrapper.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) {
    return;
  }
  activeBoardPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (activeBoardPointers.size === 2) {
    const [first, second] = [...activeBoardPointers.values()];
    pinchState = {
      distance: distanceBetweenPoints(first, second),
      zoom: viewport.zoom,
      anchor: midpointBetweenPoints(first, second),
    };
    dragState = null;
    dom.boardWrapper.classList.remove("dragging");
    return;
  }
  if (activeBoardPointers.size > 1) {
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
  if (activeBoardPointers.has(event.pointerId)) {
    activeBoardPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  }
  if (activeBoardPointers.size >= 2 && pinchState) {
    const [first, second] = [...activeBoardPointers.values()];
    const nextDistance = distanceBetweenPoints(first, second);
    if (nextDistance > 0) {
      const scale = nextDistance / pinchState.distance;
      setZoom(pinchState.zoom * scale, pinchState.anchor);
    }
    event.preventDefault();
    return;
  }
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
  activeBoardPointers.delete(event.pointerId);
  if (activeBoardPointers.size < 2) {
    pinchState = null;
  }
  dragState = null;
  dom.boardWrapper.classList.remove("dragging");
}

dom.boardWrapper.addEventListener("pointerup", stopDragging);
dom.boardWrapper.addEventListener("pointercancel", stopDragging);

function distanceBetweenPoints(first, second) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function midpointBetweenPoints(first, second) {
  return {
    clientX: (first.x + second.x) / 2,
    clientY: (first.y + second.y) / 2,
  };
}

bindBoardInteraction(store, dom, renderApp);
renderApp();

if (autoLoadedState) {
  showToast(dom, t("status.autoSaveLoaded"));
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
  if (aiReplayTimer) {
    window.clearTimeout(aiReplayTimer);
    aiReplayTimer = null;
  }
  aiTurnToken += 1;
  const currentToken = aiTurnToken;

  if (store.state.gameOver) {
    store.state.aiThinking = false;
    return;
  }

  const player = store.state.players.find((entry) => entry.id === store.state.currentPlayer);
  if (!player || player.controlType !== "ai") {
    store.state.aiThinking = false;
    store.state.aiPaused = false;
    queuedAiStates = [];
    return;
  }

  if (store.state.aiPaused) {
    store.state.aiThinking = false;
    store.state.status = t("status.aiPaused", { name: player.name });
    if (allPlayersAreAi(store.state)) {
      queueAiPausedStates(currentToken);
    }
    return;
  }

  if (queuedAiStates.length > 0) {
    replayQueuedAiStates(currentToken);
    return;
  }

  store.state.aiThinking = true;
  store.state.preview = null;
  store.state.hoverKey = null;
  store.state.hintCells = [];
  store.state.status = t("status.aiThinking", { name: player.name });

  aiTurnTimer = window.setTimeout(async () => {
    const activePlayer = store.state.players.find((entry) => entry.id === store.state.currentPlayer);
    if (!activePlayer || activePlayer.controlType !== "ai" || store.state.gameOver || currentToken !== aiTurnToken) {
      store.state.aiThinking = false;
      return;
    }
    const move = await chooseAiMove(store.state, activePlayer, {
      shouldAbort: () => currentToken !== aiTurnToken || store.state.aiPaused || store.state.gameOver,
    });
    if (!move || currentToken !== aiTurnToken) {
      store.state.aiThinking = false;
      return;
    }
    const latestPlayer = store.state.players.find((entry) => entry.id === store.state.currentPlayer);
    if (!latestPlayer || latestPlayer.id !== activePlayer.id || store.state.gameOver) {
      store.state.aiThinking = false;
      return;
    }
    applyResolvedMove(store.state, move);
    store.state.aiThinking = false;
    store.state.hintCells = [];
    renderApp();
  }, 260);
}

function replayQueuedAiStates(token) {
  aiReplayTimer = window.setTimeout(() => {
    if (token !== aiTurnToken || store.state.aiPaused || queuedAiStates.length === 0) {
      return;
    }
    store.state = queuedAiStates.shift();
    store.state.aiPaused = false;
    store.state.aiThinking = false;
    renderApp();
  }, 90);
}

async function queueAiPausedStates(token) {
  if (aiQueueWorkerActive || queuedAiStates.length >= 24) {
    return;
  }

  aiQueueWorkerActive = true;
  const simulated = cloneQueuedState(queuedAiStates.at(-1) ?? store.state);

  try {
    while (token === aiTurnToken && store.state.aiPaused && allPlayersAreAi(store.state) && queuedAiStates.length < 24 && !simulated.gameOver) {
      const activePlayer = simulated.players.find((entry) => entry.id === simulated.currentPlayer);
      if (!activePlayer || activePlayer.controlType !== "ai") {
        break;
      }
      const move = await chooseAiMove(simulated, activePlayer, {
        shouldAbort: () => token !== aiTurnToken || !store.state.aiPaused || !allPlayersAreAi(store.state) || queuedAiStates.length >= 24,
      });
      if (!move) {
        break;
      }
      applyResolvedMove(simulated, move, { persist: false });
      queuedAiStates.push(cloneQueuedState(simulated));
    }
  } finally {
    aiQueueWorkerActive = false;
  }
}

function cloneQueuedState(state) {
  return {
    ...state,
    players: state.players.map((player) => ({ ...player })),
    cells: new Map(Array.from(state.cells.entries(), ([key, value]) => [key, { ...value }])),
    history: state.history.map((entry) => ({
      ...entry,
      players: (entry.players ?? state.players).map((player) => ({ ...player })),
      cells: new Map(Array.from((entry.cells ?? state.cells).entries(), ([key, value]) => [key, { ...value }])),
    })),
    preview: null,
    hintCells: [],
    aiThinking: false,
    aiPaused: false,
  };
}

function allPlayersAreAi(state) {
  return state.players.every((player) => player.controlType === "ai");
}

function clearAiAsyncWork() {
  queuedAiStates = [];
  aiQueueWorkerActive = false;
  aiTurnToken += 1;
  if (aiTurnTimer) {
    window.clearTimeout(aiTurnTimer);
    aiTurnTimer = null;
  }
  if (aiReplayTimer) {
    window.clearTimeout(aiReplayTimer);
    aiReplayTimer = null;
  }
}

function toggleAiPause() {
  const activePlayer = store.state.players.find((entry) => entry.id === store.state.currentPlayer);
  if (!activePlayer || activePlayer.controlType !== "ai" || store.state.gameOver) {
    return;
  }

  store.state.aiPaused = !store.state.aiPaused;
  aiTurnToken += 1;
  if (aiTurnTimer) {
    window.clearTimeout(aiTurnTimer);
    aiTurnTimer = null;
  }
  store.state.aiThinking = false;
  store.state.preview = null;
  store.state.hoverKey = null;
  store.state.hintCells = [];
  store.state.status = store.state.aiPaused
    ? t("status.aiPaused", { name: activePlayer.name })
    : t("status.aiThinking", { name: activePlayer.name });
  renderApp();
}

function buildRuleLines(rules) {
  return [
    t("rules.placeOneAction"),
    rules.extension ? t("rules.extension.on") : t("rules.extension.off"),
    rules.borderProtection ? t("rules.borderProtection.on") : t("rules.borderProtection.off"),
    rules.removeHex ? t("rules.removeHex.on") : t("rules.removeHex.off"),
    t("rules.passAllowed"),
    t("rules.forcedPasses"),
    t("rules.allPassEnd"),
    t("rules.capturedDouble"),
  ];
}

function normalizeBoardSize(value) {
  const numeric = Number.parseInt(value, 10);
  const clamped = Math.max(1, Math.min(99, Number.isNaN(numeric) ? 11 : numeric));
  return clamped % 2 === 0 ? Math.min(99, clamped + 1) : clamped;
}

function syncSetupPlayerLimit() {
  const maxPlayers = getMaxPlayers(setupDraft.boardSize);
  if (setupDraft.players.length <= maxPlayers) {
    return;
  }
  setupDraft.players = setupDraft.players.slice(0, maxPlayers);
}
