import { GRID_SIZE_OPTIONS, MAX_PLAYERS } from "../core/constants.js";

export function createSetupDraft(state) {
  return {
    boardSize: state.boardSize,
    rules: { ...state.rules },
    players: state.players.map((player) => ({ ...player })),
  };
}

export function renderSetupModal(dom, draft) {
  dom.setupGridSize.innerHTML = GRID_SIZE_OPTIONS.map(
    (size) => `<option value="${size}" ${size === draft.boardSize ? "selected" : ""}>${size} x ${size}</option>`,
  ).join("");
  dom.setupExtension.checked = Boolean(draft.rules.extension);
  dom.setupBorderProtection.checked = Boolean(draft.rules.borderProtection);
  dom.setupRemoveHex.checked = Boolean(draft.rules.removeHex);
  dom.setupExtensionState.textContent = draft.rules.extension ? "ON" : "OFF";
  dom.setupBorderProtectionState.textContent = draft.rules.borderProtection ? "ON" : "OFF";
  dom.setupRemoveHexState.textContent = draft.rules.removeHex ? "ON" : "OFF";
  dom.setupExtensionDesc.textContent = draft.rules.extension
    ? "If the target touches one of your lines, the move must continue that line by the same length on the opposite side."
    : "Each move places exactly one hex on any unoccupied cell.";
  dom.setupBorderProtectionDesc.textContent = draft.rules.borderProtection
    ? "Groups touching the border are protected from capture."
    : "Groups can be captured even against the border.";
  dom.setupRemoveHexDesc.textContent = draft.rules.removeHex
    ? "Players may remove owned edge hexes."
    : "Hexes cannot be removed after placement.";

  dom.setupPlayerList.innerHTML = draft.players
    .map(
      (player, index) => `
        <article class="setup-player-row">
          <span class="player-swatch" style="background:${player.fill}"></span>
          <input
            class="setup-player-input"
            data-player-index="${index}"
            type="text"
            maxlength="10"
            value="${escapeAttribute(player.name)}"
          />
          <select class="setup-player-mode" data-player-index="${index}">
            <option value="human" ${player.controlType !== "ai" ? "selected" : ""}>Human</option>
            <option value="hard" ${player.controlType === "ai" && player.difficulty === "hard" ? "selected" : ""}>Strong AI</option>
            <option value="medium" ${player.controlType === "ai" && player.difficulty === "medium" ? "selected" : ""}>Medium AI</option>
            <option value="easy" ${player.controlType === "ai" && player.difficulty === "easy" ? "selected" : ""}>Weak AI</option>
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
