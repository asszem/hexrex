import { getScoreSummary } from "../core/scoring.js";

export function renderScorePanel(dom, state) {
  const summary = getScoreSummary(state);
  dom.scorePanel.innerHTML = state.players
    .map((player) => {
      const entry = summary[player.id];
      return `
        <article class="score-row">
          <header class="score-row-header">
            <span class="score-player-dot" style="background:${player.fill}"></span>
            <h3 style="color:${player.fill}">${player.name}</h3>
            <strong class="score-total">${entry.score}</strong>
          </header>
          <div class="score-metrics">
            <span class="score-label">Owned</span>
            <strong class="score-value">${entry.owned}</strong>
            <span class="score-label">Bonus</span>
            <strong class="score-value">${entry.captured}</strong>
            <span class="score-label">Longest</span>
            <strong class="score-value">${entry.longestLine}</strong>
          </div>
        </article>
      `;
    })
    .join("");
}
