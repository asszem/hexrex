const AUTO_SAVE_KEY = "hexrex:auto-save";
const QUICK_SAVE_KEY = "hexrex:quick-save";

import { DEFAULT_GRID_SIZE, createDefaultPlayers } from "../core/constants.js";

export function serializeState(state) {
  return JSON.stringify({
    currentPlayer: state.currentPlayer,
    players: state.players,
    boardSize: state.boardSize,
    mode: state.mode,
    winner: state.winner,
    gameOver: state.gameOver,
    status: state.status,
    history: state.history.map((entry) => ({
      currentPlayer: entry.currentPlayer,
      mode: entry.mode,
      cells: Array.from(entry.cells.entries()),
    })),
    cells: Array.from(state.cells.entries()),
  });
}

export function deserializeState(payload) {
  const parsed = JSON.parse(payload);
  const players = parsed.players ?? createDefaultPlayers(2);
  return {
    currentPlayer: parsed.currentPlayer,
    players,
    boardSize: parsed.boardSize ?? DEFAULT_GRID_SIZE,
    mode: parsed.mode,
    winner: parsed.winner,
    gameOver: parsed.gameOver,
    status: parsed.status,
    preview: null,
    history: (parsed.history ?? []).map((entry) => ({
      currentPlayer: entry.currentPlayer,
      mode: entry.mode,
      cells: new Map(entry.cells.map(([key, value]) => [key, { ...value }])),
    })),
    cells: new Map(parsed.cells.map(([key, value]) => [key, { ...value }])),
  };
}

export function saveAuto(state) {
  localStorage.setItem(AUTO_SAVE_KEY, serializeState(state));
}

export function saveQuick(state) {
  const payload = serializeState(state);
  localStorage.setItem(QUICK_SAVE_KEY, payload);
  localStorage.setItem(AUTO_SAVE_KEY, payload);
}

export function loadAuto() {
  return loadByKey(AUTO_SAVE_KEY);
}

export function loadQuick() {
  return loadByKey(QUICK_SAVE_KEY);
}

export function clearAuto() {
  localStorage.removeItem(AUTO_SAVE_KEY);
}

function loadByKey(key) {
  const payload = localStorage.getItem(key);
  if (!payload) {
    return null;
  }

  try {
    return deserializeState(payload);
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}
