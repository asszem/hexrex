import { cloneState } from "../core/state.js";
import { buildPlacementPreview } from "../core/placement-rules.js";
import { buildRemovalPreview } from "../core/removal-rules.js";
import { placementCausesSelfCapture } from "../core/move-validation.js";
import { getScoreSummary, hasAnyLegalPlacement } from "../core/scoring.js";
import { applyResolvedMove } from "../core/apply-move.js";
import { t } from "../core/i18n.js";

export function chooseAiMove(state, player) {
  const moves = collectCandidateMoves(state);
  if (moves.length === 0 || !hasAnyLegalPlacement(state, player.id, buildPlacementPreview)) {
    return buildPassMove(state, player, t("status.noLegalPlacementPassing"));
  }

  if (player.difficulty === "easy") {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const scoredMoves = moves.map((move) => ({
    move,
    score: scoreMove(state, move, player),
  }));
  scoredMoves.sort((left, right) => right.score - left.score);
  if (shouldPass(player, scoredMoves[0]?.score ?? Number.NEGATIVE_INFINITY)) {
    return buildPassMove(state, player, t("status.playerPasses", { name: player.name }));
  }
  return scoredMoves[0].move;
}

function collectCandidateMoves(state) {
  const seen = new Set();
  const moves = [];

  for (let row = 0; row < state.boardSize; row += 1) {
    for (let col = 0; col < state.boardSize; col += 1) {
      const key = `${col},${row}`;
      const placement = buildPlacementPreview(state, key);
      if (placement.valid && !placementCausesSelfCapture(state, placement)) {
        pushMove(seen, moves, placement);
      }

      const removal = buildRemovalPreview(state, key);
      if (removal.valid) {
        pushMove(seen, moves, removal);
      }
    }
  }

  return moves;
}

function pushMove(seen, moves, move) {
  const signature = `${move.type}:${[...move.cells].sort().join("|")}`;
  if (seen.has(signature)) {
    return;
  }
  seen.add(signature);
  moves.push(move);
}

function scoreMove(state, move, player) {
  const simulated = cloneState(state);
  applyResolvedMove(simulated, move);
  const scores = getScoreSummary(simulated);
  const own = scores[player.id];
  const bestOpponent = Object.entries(scores)
    .filter(([id]) => id !== player.id)
    .reduce((best, [, value]) => Math.max(best, value.score), 0);

  let score = own.score * 10 - bestOpponent * 4 + own.captured * 6 + own.longestLine * 2;
  if (move.type === "remove") {
    score -= 3;
  }
  if (player.difficulty === "hard") {
    score += own.owned * 1.5;
  }
  return score;
}

function shouldPass(player, bestScore) {
  if (player.difficulty === "medium") {
    return bestScore < 6;
  }
  if (player.difficulty === "hard") {
    return bestScore < 2;
  }
  return false;
}

function buildPassMove(state, player, reason) {
  return {
    type: "pass",
    valid: true,
    cells: [],
    reason,
    playerId: player.id ?? state.currentPlayer,
  };
}
