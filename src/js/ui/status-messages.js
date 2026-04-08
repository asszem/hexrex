export function renderStatusMessage(dom, state) {
  if (dom.statusMessage) {
    dom.statusMessage.textContent = state.status;
  }

  if (!dom.footerTurnInfo) {
    return;
  }

  if (state.gameOver) {
    dom.footerTurnInfo.textContent = `Game Over - ${state.status}`;
    return;
  }

  const player = state.players.find((entry) => entry.id === state.currentPlayer);
  const label = formatPlayerLabel(player);
  dom.footerTurnInfo.innerHTML = `<span style="color:${player?.fill ?? "inherit"}">${escapeHtml(label)}</span> - ${escapeHtml(state.status)}`;
}

function formatPlayerLabel(player) {
  if (!player) {
    return "Current Player";
  }
  if (player.controlType === "ai") {
    return `${player.name} (AI - ${capitalize(player.difficulty ?? "medium")})`;
  }
  return player.name;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}
