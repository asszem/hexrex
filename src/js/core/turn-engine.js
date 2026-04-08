import { PLAYER_ORDER } from "./constants.js";

export function getNextPlayer(playerId) {
  const index = PLAYER_ORDER.indexOf(playerId);
  return PLAYER_ORDER[(index + 1) % PLAYER_ORDER.length];
}

export function advanceTurn(state) {
  state.currentPlayer = getNextPlayer(state.currentPlayer);
  state.preview = null;
}

export function toggleMode(state) {
  state.mode = state.mode === "place" ? "remove" : "place";
  state.preview = null;
}
