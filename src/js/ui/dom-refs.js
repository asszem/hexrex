export function getDomRefs() {
  return {
    board: document.getElementById("board"),
    newGameButton: document.getElementById("new-game-button"),
    undoButton: document.getElementById("undo-button"),
    arenaTurnIndicator: document.getElementById("arena-turn-indicator"),
    turnPlayer: document.getElementById("turn-player"),
    statusMessage: document.getElementById("status-message"),
    scorePanel: document.getElementById("score-panel"),
    endgameModal: document.getElementById("endgame-modal"),
    endgameSummary: document.getElementById("endgame-summary"),
    toastRoot: document.getElementById("toast-root"),
  };
}
