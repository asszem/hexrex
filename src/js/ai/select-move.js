import { cloneState } from "../core/state.js";
import { buildPlacementPreview } from "../core/placement-rules.js";
import { buildRemovalPreview } from "../core/removal-rules.js";
import { placementCausesSelfCapture } from "../core/move-validation.js";
import { getScoreSummary, hasAnyLegalPlacement } from "../core/scoring.js";
import { applyResolvedMove } from "../core/apply-move.js";
import { t } from "../core/i18n.js";

const COLLECTION_BATCH_SIZE = 36;
const SCORING_BATCH_SIZE = 8;

export async function chooseAiMove(state, player) {
  const maxMoves = getCandidateLimit(state, player);
  const moves = await collectCandidateMoves(state, maxMoves);
  if (moves.length === 0 || !hasAnyLegalPlacement(state, player.id, buildPlacementPreview)) {
    return buildPassMove(state, player, t("status.noLegalPlacementPassing"));
  }

  if (player.difficulty === "easy") {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  let bestMove = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (let index = 0; index < moves.length; index += 1) {
    const move = moves[index];
    const score = scoreMove(state, move, player);
    if (score > bestScore) {
      bestMove = move;
      bestScore = score;
    }
    if ((index + 1) % SCORING_BATCH_SIZE === 0) {
      await yieldToBrowser();
    }
  }

  if (shouldPass(player, bestScore)) {
    return buildPassMove(state, player, t("status.playerPasses", { name: player.name }));
  }
  return bestMove;
}

async function collectCandidateMoves(state, maxMoves) {
  const moves = [];
  let seenValidMoves = 0;

  for (let row = 0; row < state.boardSize; row += 1) {
    for (let col = 0; col < state.boardSize; col += 1) {
      const key = `${col},${row}`;
      const placement = buildPlacementPreview(state, key);
      if (placement.valid && !placementCausesSelfCapture(state, placement)) {
        seenValidMoves += 1;
        sampleMove(moves, placement, seenValidMoves, maxMoves);
      }

      const removal = buildRemovalPreview(state, key);
      if (removal.valid) {
        seenValidMoves += 1;
        sampleMove(moves, removal, seenValidMoves, maxMoves);
      }

      if ((row * state.boardSize + col + 1) % COLLECTION_BATCH_SIZE === 0) {
        await yieldToBrowser();
      }
    }
  }

  return moves;
}

function sampleMove(moves, move, seenValidMoves, maxMoves) {
  if (moves.length < maxMoves) {
    moves.push(move);
    return;
  }
  const replacementIndex = Math.floor(Math.random() * seenValidMoves);
  if (replacementIndex < maxMoves) {
    moves[replacementIndex] = move;
  }
}

function scoreMove(state, move, player) {
  const simulated = cloneState(state);
  applyResolvedMove(simulated, move, { persist: false });
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

function getCandidateLimit(state, player) {
  const boardArea = state.boardSize * state.boardSize;
  if (player.difficulty === "easy") {
    return Math.min(Math.max(24, Math.ceil(boardArea * 0.08)), 120);
  }
  if (player.difficulty === "medium") {
    return Math.min(Math.max(48, Math.ceil(boardArea * 0.12)), 220);
  }
  return Math.min(Math.max(72, Math.ceil(boardArea * 0.18)), 320);
}

function yieldToBrowser() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 0);
  });
}
