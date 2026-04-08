export function renderTurnPanel(dom, state) {
  if (!dom.turnPlayer) {
    return;
  }
  if (state.gameOver) {
    dom.turnPlayer.textContent = "Game Over";
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
        <span>Game Over</span>
      </article>
    `;
    return;
  }
  const player = state.players.find((entry) => entry.id === state.currentPlayer);
  dom.arenaTurnIndicator.innerHTML = `
    <article class="player-chip active arena-player-chip">
      <span style="color:${player.fill}">${formatPlayerLabel(player)}</span>
    </article>
  `;
}

function formatPlayerLabel(player) {
  if (player.controlType === "ai") {
    return `${player.name} (AI - ${capitalize(player.difficulty ?? "medium")})`;
  }
  return player.name;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
