import { GRID_SIZE_OPTIONS, MAX_PLAYERS } from "../core/constants.js";

export function createSetupDraft(state) {
  return {
    boardSize: state.boardSize,
    players: state.players.map((player) => ({ ...player })),
  };
}

export function renderSetupModal(dom, draft) {
  dom.setupGridSize.innerHTML = GRID_SIZE_OPTIONS.map(
    (size) => `<option value="${size}" ${size === draft.boardSize ? "selected" : ""}>${size} x ${size}</option>`,
  ).join("");

  dom.setupPlayerList.innerHTML = draft.players
    .map(
      (player, index) => `
        <article class="setup-player-row">
          <span class="player-swatch" style="background:${player.fill}"></span>
          <input
            class="setup-player-input"
            data-player-index="${index}"
            type="text"
            maxlength="20"
            value="${escapeAttribute(player.name)}"
          />
          <select class="setup-player-control" data-player-index="${index}">
            <option value="human" ${player.controlType !== "ai" ? "selected" : ""}>Human</option>
            <option value="ai" ${player.controlType === "ai" ? "selected" : ""}>AI</option>
          </select>
        </article>
      `,
    )
    .join("");
  dom.confirmAddPlayer.disabled = draft.players.length >= MAX_PLAYERS;
  dom.newPlayerName.disabled = draft.players.length >= MAX_PLAYERS;
}

function escapeAttribute(value) {
  return value.replaceAll("&", "&amp;").replaceAll("\"", "&quot;").replaceAll("<", "&lt;");
}
