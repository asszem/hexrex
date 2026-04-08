import { getScoreSummary } from "./scoring.js";
import { t } from "./i18n.js";

export function getForcedPassReason(state, playerId = state.currentPlayer) {
  const player = state.players.find((entry) => entry.id === playerId);
  if (!player) {
    return null;
  }

  if (state.cells.size > 0 && player.hasEnteredBoard && !playerOwnsAnyHex(state, playerId)) {
    return t("status.playerNoHexesMustPass", { name: player.name });
  }

  const activePlayers = state.players.filter((entry) => !entry.passedLastTurn);
  const passedPlayers = state.players.length - activePlayers.length;
  if (passedPlayers > 0 && activePlayers.length === 1 && activePlayers[0].id === playerId && state.players.length > 1) {
    return t("status.lastRemainingMustPass", { name: player.name });
  }

  return null;
}

export function evaluateGameOver(state, placementFn, removalFn) {
  if ((state.consecutivePasses ?? 0) < state.players.length) {
    return null;
  }

  const scores = getScoreSummary(state);
  const players = Object.keys(scores);
  players.sort((left, right) => comparePlayers(scores, right, left));

  const winnerId = comparePlayers(scores, players[0], players[1]) === 0 ? null : players[0];

  return {
    winnerId,
    winnerName: winnerId
      ? state.players.find((player) => player.id === winnerId)?.name ?? t("word.winner")
      : t("word.tie"),
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

function playerOwnsAnyHex(state, playerId) {
  for (const cell of state.cells.values()) {
    if (cell.owner === playerId) {
      return true;
    }
  }
  return false;
}
