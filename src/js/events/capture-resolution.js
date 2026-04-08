import { getCellState, setCellState } from "../core/state.js";

export function resolveCaptures(state, captureGroups, actingPlayer) {
  let converted = 0;
  for (const group of captureGroups) {
    for (const key of group) {
      const cell = getCellState(state, key);
      if (!cell) {
        continue;
      }
      setCellState(state, key, {
        owner: actingPlayer,
        captured: true,
        originalOwner: cell.originalOwner ?? cell.owner,
      });
      converted += 1;
    }
  }
  return converted;
}
