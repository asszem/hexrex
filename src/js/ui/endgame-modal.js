export function renderEndgame(dom, result, state) {
  dom.endgameSummary.innerHTML = Object.entries(result.scores)
    .map(
      ([playerId, entry]) => `
        <article class="summary-row">
          <h3>${state.players.find((player) => player.id === playerId)?.name ?? playerId}</h3>
          <dl class="summary-metrics">
            <div>
              <dt>Score</dt>
              <dd>${entry.score}</dd>
            </div>
            <div>
              <dt>Captured</dt>
              <dd>${entry.captured}</dd>
            </div>
            <div>
              <dt>Longest line</dt>
              <dd>${entry.longestLine}</dd>
            </div>
          </dl>
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
