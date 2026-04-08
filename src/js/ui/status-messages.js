import { t } from "../core/i18n.js";

export function renderStatusMessage(dom, state) {
  if (dom.statusMessage) {
    dom.statusMessage.textContent = state.status;
  }

  if (!dom.footerTurnInfo) {
    return;
  }

  if (state.gameOver) {
    dom.footerTurnInfo.textContent = t("footer.gameOver", { status: state.status });
    return;
  }

  const player = state.players.find((entry) => entry.id === state.currentPlayer);
  const label = formatPlayerLabel(player);
  dom.footerTurnInfo.innerHTML = `<span style="color:${player?.fill ?? "inherit"}">${escapeHtml(label)}</span> - ${escapeHtml(state.status)}`;
}

function formatPlayerLabel(player) {
  if (!player) {
    return t("status.currentPlayer");
  }
  if (player.controlType === "ai") {
    return `${player.name} (${t("label.aiDifficulty", { difficulty: t(`difficulty.${player.difficulty ?? "medium"}`) })})`;
  }
  return player.name;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}
