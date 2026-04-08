import { DIRECTIONS } from "./constants.js";
import { getNeighborKey } from "./board.js";
import { getCellState } from "./state.js";

export function getScoreSummary(state) {
  const summary = {};

  for (const player of state.players) {
    const playerId = player.id;
    summary[playerId] = {
      owned: 0,
      captured: 0,
      score: 0,
      longestLine: 0,
    };
  }

  for (const [key, cell] of state.cells.entries()) {
    const bucket = summary[cell.owner];
    bucket.owned += 1;
    if (cell.captured) {
      bucket.captured += 1;
      bucket.score += 2;
    } else {
      bucket.score += 1;
    }
    bucket.longestLine = Math.max(bucket.longestLine, measureLine(state, key, cell.owner));
  }

  return summary;
}

function measureLine(state, key, owner) {
  const axes = [
    ["E", "W"],
    ["SE", "NW"],
    ["SW", "NE"],
  ];

  return axes.reduce((best, axis) => {
    const length =
      1 +
      axis.reduce(
        (sum, directionKey) =>
          sum + countRun(state, key, owner, DIRECTIONS.find((direction) => direction.key === directionKey)),
        0,
      );
    return Math.max(best, length);
  }, 1);
}

function countRun(state, originKey, owner, direction) {
  let nextKey = getNeighborKey(originKey, direction, state.boardSize);
  let count = 0;

  while (nextKey && getCellState(state, nextKey)?.owner === owner) {
    count += 1;
    nextKey = getNeighborKey(nextKey, direction, state.boardSize);
  }

  return count;
}

export function hasAnyLegalMove(state, playerId, placementFn, removalFn) {
  for (let row = 0; row < state.boardSize; row += 1) {
    for (let col = 0; col < state.boardSize; col += 1) {
      const key = `${col},${row}`;
      if (placementFn({ ...state, currentPlayer: playerId }, key).valid) {
        return true;
      }
    }
  }
  return false;
}
