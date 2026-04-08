const AUTO_SAVE_KEY = "hexrex:auto-save";
const QUICK_SAVE_KEY = "hexrex:quick-save";

import { DEFAULT_GRID_SIZE, DEFAULT_RULES, createDefaultPlayers } from "../core/constants.js";

export function serializeState(state) {
  return JSON.stringify({
    currentPlayer: state.currentPlayer,
    players: state.players,
    boardSize: state.boardSize,
    rules: state.rules,
    mode: state.mode,
    consecutivePasses: state.consecutivePasses ?? 0,
    winner: state.winner,
    gameOver: state.gameOver,
    endgameDismissed: Boolean(state.endgameDismissed),
    status: state.status,
    history: state.history.map((entry) => ({
      currentPlayer: entry.currentPlayer,
      mode: entry.mode,
      players: entry.players,
      boardSize: entry.boardSize,
      rules: entry.rules,
      consecutivePasses: entry.consecutivePasses ?? 0,
      endgameDismissed: Boolean(entry.endgameDismissed),
      aiPaused: Boolean(entry.aiPaused),
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
    rules: { ...DEFAULT_RULES, ...(parsed.rules ?? {}) },
    mode: parsed.mode,
    consecutivePasses: parsed.consecutivePasses ?? 0,
    winner: parsed.winner,
    gameOver: parsed.gameOver,
    endgameDismissed: Boolean(parsed.endgameDismissed),
    status: parsed.status,
    preview: null,
    history: (parsed.history ?? []).map((entry) => ({
      currentPlayer: entry.currentPlayer,
      mode: entry.mode,
      players: (entry.players ?? players).map((player) => ({ ...player })),
      boardSize: entry.boardSize ?? parsed.boardSize ?? DEFAULT_GRID_SIZE,
      rules: { ...DEFAULT_RULES, ...(entry.rules ?? parsed.rules ?? {}) },
      consecutivePasses: entry.consecutivePasses ?? 0,
      endgameDismissed: Boolean(entry.endgameDismissed),
      aiPaused: Boolean(entry.aiPaused),
      cells: new Map(entry.cells.map(([key, value]) => [key, { ...value }])),
    })),
    cells: new Map(parsed.cells.map(([key, value]) => [key, { ...value }])),
  };
}

export function saveAuto(state) {
  if (typeof localStorage === "undefined" || typeof localStorage.setItem !== "function") {
    return;
  }
  localStorage.setItem(AUTO_SAVE_KEY, serializeState(state));
}

export function saveQuick(state) {
  if (typeof localStorage === "undefined" || typeof localStorage.setItem !== "function") {
    return;
  }
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
