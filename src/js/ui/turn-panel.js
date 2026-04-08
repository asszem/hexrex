export function renderTurnPanel(dom, state) {
  const player = state.players.find((entry) => entry.id === state.currentPlayer);
  dom.turnPlayer.textContent = player.name;
  dom.turnPlayer.style.color = player.fill;
}

export function renderArenaTurnIndicator(dom, state) {
  const player = state.players.find((entry) => entry.id === state.currentPlayer);
  dom.arenaTurnIndicator.innerHTML = `
    <article class="player-chip active arena-player-chip">
      <span class="player-swatch" style="background:${player.fill}"></span>
      <span>${player.name}</span>
    </article>
  `;
}
