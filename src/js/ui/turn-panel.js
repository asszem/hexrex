import { t } from "../core/i18n.js";

export function renderTurnPanel(dom, state) {
  if (!dom.turnPlayer) {
    return;
  }
  if (state.gameOver) {
    dom.turnPlayer.textContent = t("status.gameOver");
    dom.turnPlayer.style.color = "";
    return;
  }
  const player = state.players.find((entry) => entry.id === state.currentPlayer);
  dom.turnPlayer.textContent = formatPlayerLabel(player);
  dom.turnPlayer.style.color = player.fill;
}

export function renderArenaTurnIndicator(dom, state) {
  if (state.gameOver) {
    dom.arenaTurnIndicator.innerHTML = `
      <article class="player-chip active arena-player-chip">
        <span>${t("status.gameOver")}</span>
      </article>
    `;
    return;
  }
  const player = state.players.find((entry) => entry.id === state.currentPlayer);
  dom.arenaTurnIndicator.innerHTML = `
    <article class="player-chip active arena-player-chip" style="background:${player.fill}; box-shadow: 0 0 18px ${player.glow}, inset 0 0 0 1px rgba(255,255,255,0.14);">
      <span class="arena-player-label">${formatPlayerLabel(player)}</span>
    </article>
  `;
}

function formatPlayerLabel(player) {
  if (player.controlType === "ai") {
    return `${player.name} (${t("label.aiDifficulty", { difficulty: t(`difficulty.${player.difficulty ?? "medium"}`) })})`;
  }
  return player.name;
}
