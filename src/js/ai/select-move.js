import { cloneState } from "../core/state.js";
import { buildPlacementPreview } from "../core/placement-rules.js";
import { buildRemovalPreview } from "../core/removal-rules.js";
import { placementCausesSelfCapture } from "../core/move-validation.js";
import { getScoreSummary } from "../core/scoring.js";
import { applyResolvedMove } from "../core/apply-move.js";
import { t } from "../core/i18n.js";
import { getNeighbors } from "../core/board.js";
import { getForcedPassReason } from "../core/game-over.js";

const COLLECTION_BATCH_SIZE = 24;
const SCORING_BATCH_SIZE = 8;

export async function chooseAiMove(state, player, options = {}) {
  const forcedPassReason = getForcedPassReason(state, player.id);
  if (forcedPassReason) {
    return buildPassMove(state, player, forcedPassReason);
  }

  const maxMoves = getCandidateLimit(state, player);
  const moves = await collectCandidateMoves(state, maxMoves, options);
  if (moves.length === 0) {
    return buildPassMove(state, player, t("status.noLegalPlacementPassing"));
  }

  if (player.difficulty === "easy") {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  let bestMove = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (let index = 0; index < moves.length; index += 1) {
    if (options.shouldAbort?.()) {
      return null;
    }
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

async function collectCandidateMoves(state, maxMoves, options = {}) {
  const moves = [];
  const candidateKeys = buildCandidateKeys(state, maxMoves);

  for (let index = 0; index < candidateKeys.length; index += 1) {
    if (options.shouldAbort?.()) {
      return [];
    }

    const key = candidateKeys[index];
    const placement = buildPlacementPreview(state, key);
    if (placement.valid && !placementCausesSelfCapture(state, placement)) {
      pushUniqueMove(moves, placement, maxMoves);
    }

    const removal = buildRemovalPreview(state, key);
    if (removal.valid) {
      pushUniqueMove(moves, removal, maxMoves);
    }

    if ((index + 1) % COLLECTION_BATCH_SIZE === 0) {
      await yieldToBrowser();
    }
  }

  return moves;
}

function pushUniqueMove(moves, move, maxMoves) {
  const signature = `${move.type}:${[...move.cells].sort().join("|")}`;
  if (moves.some((entry) => `${entry.type}:${[...entry.cells].sort().join("|")}` === signature)) {
    return;
  }
  if (moves.length < maxMoves) {
    moves.push(move);
    return;
  }
  const replacementIndex = Math.floor(Math.random() * maxMoves);
  moves[replacementIndex] = move;
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

function buildCandidateKeys(state, maxMoves) {
  const keys = new Set();
  const boardArea = state.boardSize * state.boardSize;
  const playerCells = Array.from(state.cells.entries())
    .filter(([, cell]) => cell.owner === state.currentPlayer)
    .map(([key]) => key);

  addCenterKeys(keys, state.boardSize);
  addRandomEmptyKeys(state, keys, Math.min(maxMoves, boardArea));

  if (playerCells.length === 0 || !state.rules?.extension) {
    return [...keys];
  }

  for (const key of playerCells) {
    keys.add(key);
    for (const neighborKey of getNeighbors(key, state.boardSize)) {
      keys.add(neighborKey);
    }
  }

  addRandomEmptyKeys(state, keys, Math.max(12, Math.floor(maxMoves / 3)));
  return [...keys];
}

function addCenterKeys(keys, boardSize) {
  const center = Math.floor(boardSize / 2);
  for (let row = Math.max(0, center - 1); row <= Math.min(boardSize - 1, center + 1); row += 1) {
    for (let col = Math.max(0, center - 1); col <= Math.min(boardSize - 1, center + 1); col += 1) {
      keys.add(`${col},${row}`);
    }
  }
}

function addRandomEmptyKeys(state, keys, attempts) {
  for (let index = 0; index < attempts; index += 1) {
    const col = Math.floor(Math.random() * state.boardSize);
    const row = Math.floor(Math.random() * state.boardSize);
    const key = `${col},${row}`;
    if (!state.cells.has(key)) {
      keys.add(key);
    }
  }
}

function yieldToBrowser() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 0);
  });
}
