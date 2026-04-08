import { PLAYER_META } from "../core/constants.js";

export function renderTurnPanel(dom, state) {
  dom.turnPlayer.textContent = PLAYER_META[state.currentPlayer].name;
  dom.turnPlayer.style.color = PLAYER_META[state.currentPlayer].fill;
}

export function renderArenaTurnIndicator(dom, state) {
  const player = PLAYER_META[state.currentPlayer];
  dom.arenaTurnIndicator.innerHTML = `
    <article class="player-chip active arena-player-chip">
      <span class="player-swatch" style="background:${player.fill}"></span>
      <span>${player.name}</span>
    </article>
  `;
}
