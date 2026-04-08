export function getNextPlayer(state, playerId) {
  const order = state.players.map((player) => player.id);
  const index = order.indexOf(playerId);
  return order[(index + 1) % order.length];
}

export function advanceTurn(state) {
  state.currentPlayer = getNextPlayer(state, state.currentPlayer);
  state.preview = null;
}

export function toggleMode(state) {
  state.mode = state.mode === "place" ? "remove" : "place";
  state.preview = null;
}
