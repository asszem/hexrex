import { t } from "../core/i18n.js";

export function renderEndgame(dom, result, state) {
  const playerMap = Object.fromEntries(
    state.players.map((player) => [player.id, player]),
  );
  const rankedPlayers = Object.entries(result.scores)
    .sort(([leftId, left], [rightId, right]) => compareSummaryEntries(right, left))
    .map(
      ([playerId, entry]) => `
        <article class="summary-row" style="border-color:${withAlpha(playerMap[playerId]?.fill, 0.28)}; box-shadow: 0 0 0 1px ${withAlpha(playerMap[playerId]?.fill, 0.08)} inset;">
          <h3 style="color:${playerMap[playerId]?.fill ?? "inherit"}">${formatPlayerLabel(playerMap[playerId])}</h3>
          <dl class="summary-metrics">
            <div>
              <dt>${t("endgame.score")}</dt>
              <dd>${entry.score}</dd>
            </div>
            <div>
              <dt>${t("endgame.captured")}</dt>
              <dd>${entry.captured}</dd>
            </div>
            <div>
              <dt>${t("endgame.longestLine")}</dt>
              <dd>${entry.longestLine}</dd>
            </div>
          </dl>
        </article>
      `,
    )
    .join("");

  const heading = document.createElement("p");
  heading.className = "winner-line";
  heading.textContent = t("endgame.winner", {
    name: result.winnerId ? formatPlayerLabel(playerMap[result.winnerId]) : result.winnerName,
  });
  dom.endgameSummary.prepend(heading);
  if (!dom.endgameModal.open) {
    dom.endgameModal.showModal();
  }
}

function formatPlayerLabel(player) {
  if (!player) {
    return t("word.winner");
  }
  if (player.controlType === "ai") {
    return `${player.name} (${t("label.aiDifficulty", { difficulty: t(`difficulty.${player.difficulty ?? "medium"}`) })})`;
  }
  return player.name;
}

function compareSummaryEntries(left, right) {
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

function withAlpha(hex, alpha) {
  if (!hex || !hex.startsWith("#") || (hex.length !== 7 && hex.length !== 4)) {
    return `rgba(64, 77, 83, ${alpha})`;
  }
  const normalized = hex.length === 4
    ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex;
  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
