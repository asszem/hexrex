import { getNeighbors } from "./board.js";
import { cloneState, getCellState, setCellState } from "./state.js";

export function buildRemovalPreview(state, key) {
  if (!state.rules?.removeHex) {
    return invalidRemoval(key, "Remove Hex is disabled.");
  }

  const cell = getCellState(state, key);
  if (!cell || cell.owner !== state.currentPlayer) {
    return invalidRemoval(key, "You can only remove your own hex.");
  }

  const groupKeys = collectGroup(state, key, state.currentPlayer);
  if (groupKeys.length === 1) {
    return invalidRemoval(key, "A one-hex group cannot be removed to zero.");
  }

  const touchesEmpty = getNeighbors(key, state.boardSize).some((neighborKey) => !getCellState(state, neighborKey));
  if (!touchesEmpty) {
    return invalidRemoval(key, "Only edge hexes can be removed.");
  }

  const simulated = cloneState(state);
  setCellState(simulated, key, null);
  const remainingGroupStart = groupKeys.find((groupKey) => groupKey !== key);
  const connectedAfterRemoval = collectGroup(simulated, remainingGroupStart, state.currentPlayer);
  if (connectedAfterRemoval.length !== groupKeys.length - 1) {
    return invalidRemoval(key, "Removing this hex would split the group.");
  }

  return {
    type: "remove",
    valid: true,
    cells: [key],
    reason: cell.captured ? "Remove captured hex and lose its double value." : "Remove edge hex.",
  };
}

function collectGroup(state, startKey, owner) {
  const visited = new Set();
  const queue = [startKey];

  while (queue.length > 0) {
    const currentKey = queue.shift();
    if (!currentKey || visited.has(currentKey)) {
      continue;
    }
    const cell = getCellState(state, currentKey);
    if (!cell || cell.owner !== owner) {
      continue;
    }
    visited.add(currentKey);
    for (const neighborKey of getNeighbors(currentKey, state.boardSize)) {
      if (!visited.has(neighborKey)) {
        queue.push(neighborKey);
      }
    }
  }

  return [...visited];
}

function invalidRemoval(key, reason) {
  return {
    type: "remove",
    valid: false,
    cells: [key],
    reason,
  };
}
