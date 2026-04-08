import { DIRECTIONS, OPPOSITE_DIRECTION } from "./constants.js";
import { getCellState } from "./state.js";
import { getNeighborKey, walkDirection } from "./board.js";

export function buildPlacementPreview(state, anchorKey) {
  if (getCellState(state, anchorKey)) {
    return invalidPreview(anchorKey, "Cell is already occupied.");
  }

  const touchingOwnNeighbors = DIRECTIONS
    .map((direction) => ({ direction, key: getNeighborKey(anchorKey, direction) }))
    .filter(({ key }) => key && getCellState(state, key)?.owner === state.currentPlayer);

  if (touchingOwnNeighbors.length === 0) {
    return {
      type: "place",
      valid: true,
      cells: [anchorKey],
      reason: "Disconnected placement creates a single-cell group.",
    };
  }

  const requiredCells = new Set([anchorKey]);
  for (const { direction } of touchingOwnNeighbors) {
    const outwardDirection = DIRECTIONS.find((entry) => entry.key === OPPOSITE_DIRECTION[direction.key]);
    const requiredCount = countOwnedRun(
      state,
      anchorKey,
      direction,
      state.currentPlayer,
    );

    const placementCells = [anchorKey];
    const extension = walkDirection(anchorKey, outwardDirection, requiredCount - 1);
    if (!extension) {
      return invalidPreview(anchorKey, `Placement must also extend toward ${outwardDirection.key}.`);
    }
    placementCells.push(...extension);

    const blocked = placementCells.some((key) => getCellState(state, key));
    if (blocked) {
      return invalidPreview(anchorKey, `Placement line toward ${outwardDirection.key} is blocked.`);
    }
    for (const key of placementCells) {
      requiredCells.add(key);
    }
  }

  const mergedCells = [...requiredCells];
  return {
    type: "place",
    valid: true,
    cells: mergedCells,
    reason: `Place ${mergedCells.length} hex${mergedCells.length > 1 ? "es" : ""} to satisfy all touching lines.`,
  };
}

function countOwnedRun(state, fromKey, direction, owner) {
  let currentKey = getNeighborKey(fromKey, direction);
  let count = 0;

  while (currentKey && getCellState(state, currentKey)?.owner === owner) {
    count += 1;
    currentKey = getNeighborKey(currentKey, direction);
  }

  return Math.max(1, count);
}

function invalidPreview(anchorKey, reason) {
  return {
    type: "place",
    valid: false,
    cells: [anchorKey],
    reason,
  };
}
