import { getScoreSummary } from "../core/scoring.js";
import { t } from "../core/i18n.js";

export function renderScorePanel(dom, state) {
  const summary = getScoreSummary(state);
  dom.scorePanel.innerHTML = state.players
    .map((player) => {
      const entry = summary[player.id];
      return `
        <article class="score-row">
          <header class="score-row-header">
            <h3>
              <span class="score-player-name" style="color:${player.fill}">${formatPlayerLabel(player)}</span>
            </h3>
          </header>
          <div class="score-metrics">
            <span class="score-label">${t("score.ownedHexes")}</span>
            <strong class="score-value">${entry.owned}</strong>
            <span class="score-label">${t("score.capturedBonus")}</span>
            <strong class="score-value">${entry.captured}</strong>
            <span class="score-label">${t("score.longestLine")}</span>
            <strong class="score-value">${entry.longestLine}</strong>
          </div>
        </article>
      `;
    })
    .join("");
}

function formatPlayerLabel(player) {
  const passSuffix = player.passedLastTurn ? " PASS" : "";
  if (player.controlType === "ai") {
    return `${player.name} (${t("label.aiDifficulty", { difficulty: t(`difficulty.${player.difficulty ?? "medium"}`) })})${passSuffix ? ` ${t("label.pass")}` : ""}`;
  }
  return `${player.name}${passSuffix ? ` ${t("label.pass")}` : ""}`;
}
