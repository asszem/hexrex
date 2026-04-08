export function renderTurnPanel(dom, state) {
  const player = state.players.find((entry) => entry.id === state.currentPlayer);
  dom.turnPlayer.textContent = formatPlayerLabel(player);
  dom.turnPlayer.style.color = player.fill;
}

export function renderArenaTurnIndicator(dom, state) {
  const player = state.players.find((entry) => entry.id === state.currentPlayer);
  dom.arenaTurnIndicator.innerHTML = `
    <article class="player-chip active arena-player-chip">
      <span class="player-swatch" style="background:${player.fill}"></span>
      <span>${formatPlayerLabel(player)}</span>
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
