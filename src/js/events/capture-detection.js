import { edgeReachableKeys, getNeighbors } from "../core/board.js";
import { getCellState } from "../core/state.js";

export function findCaptures(state, actingPlayer) {
  const opponentGroups = collectOpponentGroups(state, actingPlayer);
  return opponentGroups.filter((group) => isCapturedGroup(state, group));
}

function collectOpponentGroups(state, actingPlayer) {
  const visited = new Set();
  const groups = [];

  for (const [key, value] of state.cells.entries()) {
    if (value.owner === actingPlayer || visited.has(key)) {
      continue;
    }
    const group = [];
    const queue = [key];
    while (queue.length > 0) {
      const currentKey = queue.shift();
      if (visited.has(currentKey)) {
        continue;
      }
      const current = getCellState(state, currentKey);
      if (!current || current.owner === actingPlayer) {
        continue;
      }
      visited.add(currentKey);
      group.push(currentKey);
      for (const neighborKey of getNeighbors(currentKey, state.boardSize)) {
        if (!visited.has(neighborKey)) {
          queue.push(neighborKey);
        }
      }
    }
    groups.push(group);
  }

  return groups;
}

function isCapturedGroup(state, group) {
  const groupSet = new Set(group);
  const queue = [];
  const visited = new Set();

  for (const key of group) {
    for (const neighborKey of getNeighbors(key, state.boardSize)) {
      if (!groupSet.has(neighborKey) && !getCellState(state, neighborKey)) {
        queue.push(neighborKey);
      }
    }
  }

  const edgeSet = new Set(edgeReachableKeys(state.boardSize));
  while (queue.length > 0) {
    const currentKey = queue.shift();
    if (visited.has(currentKey) || groupSet.has(currentKey) || getCellState(state, currentKey)) {
      continue;
    }
    if (edgeSet.has(currentKey)) {
      return false;
    }
    visited.add(currentKey);
    for (const neighborKey of getNeighbors(currentKey, state.boardSize)) {
      if (!visited.has(neighborKey)) {
        queue.push(neighborKey);
      }
    }
  }

  return true;
}
