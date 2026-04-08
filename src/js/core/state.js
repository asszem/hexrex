import { DEFAULT_GRID_SIZE, DEFAULT_RULES, createDefaultPlayers } from "./constants.js";
import { t } from "./i18n.js";

export function createInitialState(config = {}) {
  const players = (config.players ?? createDefaultPlayers(2)).map((player) => ({
    ...player,
    passedLastTurn: Boolean(player.passedLastTurn),
  }));
  return {
    currentPlayer: players[0].id,
    players,
    boardSize: config.boardSize ?? DEFAULT_GRID_SIZE,
    rules: { ...DEFAULT_RULES, ...(config.rules ?? {}) },
    mode: "place",
    cells: new Map(),
    history: [],
    consecutivePasses: 0,
    winner: null,
    gameOver: false,
    endgameDismissed: false,
    aiThinking: false,
    aiPaused: false,
    status: t("status.hoverPreview"),
    preview: null,
    hintCells: [],
  };
}

export function cloneState(state) {
  return {
    ...state,
    cells: new Map(
      Array.from(state.cells.entries(), ([key, value]) => [
        key,
        { ...value },
      ]),
    ),
    history: state.history.map((entry) => ({
      ...entry,
      players: entry.players.map((player) => ({ ...player })),
      cells: new Map(
        Array.from(entry.cells.entries(), ([key, value]) => [
          key,
          { ...value },
        ]),
      ),
    })),
    preview: state.preview
      ? {
          ...state.preview,
          cells: [...state.preview.cells],
        }
      : null,
    hintCells: [...(state.hintCells ?? [])],
    aiThinking: Boolean(state.aiThinking),
    aiPaused: Boolean(state.aiPaused),
    consecutivePasses: state.consecutivePasses ?? 0,
    endgameDismissed: Boolean(state.endgameDismissed),
  };
}

export function getCellState(state, key) {
  return state.cells.get(key) ?? null;
}

export function setCellState(state, key, value) {
  if (value) {
    state.cells.set(key, value);
    return;
  }
  state.cells.delete(key);
}

export function pushHistorySnapshot(state) {
  state.history.push({
    currentPlayer: state.currentPlayer,
    mode: state.mode,
    players: state.players.map((player) => ({ ...player })),
    boardSize: state.boardSize,
    rules: { ...state.rules },
    consecutivePasses: state.consecutivePasses ?? 0,
    endgameDismissed: Boolean(state.endgameDismissed),
    aiPaused: Boolean(state.aiPaused),
    cells: new Map(
      Array.from(state.cells.entries(), ([key, value]) => [
        key,
        { ...value },
      ]),
    ),
  });
}

export function popHistorySnapshot(state) {
  if (state.history.length === 0) {
    return false;
  }

  const snapshot = state.history.pop();
  state.currentPlayer = snapshot.currentPlayer;
  state.mode = snapshot.mode;
  state.players = snapshot.players.map((player) => ({ ...player }));
  state.boardSize = snapshot.boardSize;
  state.rules = { ...snapshot.rules };
  state.consecutivePasses = snapshot.consecutivePasses ?? 0;
  state.endgameDismissed = Boolean(snapshot.endgameDismissed);
  state.cells = new Map(
    Array.from(snapshot.cells.entries(), ([key, value]) => [
      key,
      { ...value },
    ]),
  );
  state.preview = null;
  state.hintCells = [];
  state.winner = null;
  state.gameOver = false;
  state.endgameDismissed = false;
  state.aiThinking = false;
  state.aiPaused = false;
  return true;
}
