import { getScoreSummary } from "../core/scoring.js";

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
            <span class="score-label">Owned hexes</span>
            <strong class="score-value">${entry.owned}</strong>
            <span class="score-label">Captured Hex Bonus</span>
            <strong class="score-value">${entry.captured}</strong>
            <span class="score-label">Longest Line</span>
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
    return `${player.name} (AI - ${capitalize(player.difficulty ?? "medium")})${passSuffix}`;
  }
  return `${player.name}${passSuffix}`;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
