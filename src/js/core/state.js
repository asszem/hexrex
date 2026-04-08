import { DEFAULT_GRID_SIZE, createDefaultPlayers } from "./constants.js";

export function createInitialState(config = {}) {
  const players = config.players ?? createDefaultPlayers(2);
  return {
    currentPlayer: players[0].id,
    players,
    boardSize: config.boardSize ?? DEFAULT_GRID_SIZE,
    mode: "place",
    cells: new Map(),
    history: [],
    winner: null,
    gameOver: false,
    status: "Hover a cell to preview the move.",
    preview: null,
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
  state.cells = new Map(
    Array.from(snapshot.cells.entries(), ([key, value]) => [
      key,
      { ...value },
    ]),
  );
  state.preview = null;
  state.winner = null;
  state.gameOver = false;
  return true;
}
