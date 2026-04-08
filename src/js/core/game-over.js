import { PLAYER_META } from "./constants.js";
import { getScoreSummary, hasAnyLegalMove } from "./scoring.js";

export function evaluateGameOver(state, placementFn, removalFn) {
  if (hasAnyLegalMove(state, state.currentPlayer, placementFn, removalFn)) {
    return null;
  }

  const scores = getScoreSummary(state);
  const players = Object.keys(scores);
  players.sort((left, right) => comparePlayers(scores, right, left));

  const winnerId = comparePlayers(scores, players[0], players[1]) === 0 ? null : players[0];

  return {
    winnerId,
    winnerName: winnerId ? PLAYER_META[winnerId].name : "Tie",
    scores,
  };
}

function comparePlayers(scores, leftId, rightId) {
  const left = scores[leftId];
  const right = scores[rightId];
  if (left.score !== right.score) {
    return left.score - right.score;
  }
  if (left.captured !== right.captured) {
    return left.captured - right.captured;
  }
  if (left.longestLine !== right.longestLine) {
    return left.longestLine - right.longestLine;
  }
  return 0;
}
