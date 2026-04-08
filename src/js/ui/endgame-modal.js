import { t } from "../core/i18n.js";

export function renderEndgame(dom, result, state) {
  dom.endgameSummary.innerHTML = Object.entries(result.scores)
    .map(
      ([playerId, entry]) => `
        <article class="summary-row">
          <h3>${state.players.find((player) => player.id === playerId)?.name ?? playerId}</h3>
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
  heading.textContent = t("endgame.winner", { name: result.winnerName });
  dom.endgameSummary.prepend(heading);
  if (!dom.endgameModal.open) {
    dom.endgameModal.showModal();
  }
}
