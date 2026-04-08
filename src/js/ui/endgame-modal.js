import { PLAYER_META } from "../core/constants.js";

export function renderEndgame(dom, result) {
  dom.endgameSummary.innerHTML = Object.entries(result.scores)
    .map(
      ([playerId, entry]) => `
        <article class="summary-row">
          <h3>${PLAYER_META[playerId].name}</h3>
          <p>Score: ${entry.score}</p>
          <p>Captured: ${entry.captured}</p>
          <p>Longest line: ${entry.longestLine}</p>
        </article>
      `,
    )
    .join("");

  const heading = document.createElement("p");
  heading.className = "winner-line";
  heading.textContent = `Winner: ${result.winnerName}`;
  dom.endgameSummary.prepend(heading);
  if (!dom.endgameModal.open) {
    dom.endgameModal.showModal();
  }
}
