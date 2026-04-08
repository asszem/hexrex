import { findCaptures } from "./capture-detection.js";
import { resolveCaptures } from "./capture-resolution.js";

export function resolveCaptureChains(state, actingPlayer) {
  let totalConverted = 0;

  while (true) {
    const captures = findCaptures(state, actingPlayer);
    if (captures.length === 0) {
      break;
    }
    totalConverted += resolveCaptures(state, captures, actingPlayer);
  }

  return totalConverted;
}
