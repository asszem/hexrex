import { PLAYER_PALETTE, getMaxPlayers } from "../core/constants.js";
import { t } from "../core/i18n.js";

export function createSetupDraft(state) {
  return {
    boardSize: state.boardSize,
    rules: { ...state.rules },
    players: state.players.map((player) => ({
      ...player,
      passedLastTurn: false,
      hasEnteredBoard: false,
    })),
  };
}

export function renderSetupModal(dom, draft) {
  const maxPlayers = getMaxPlayers(draft.boardSize);
  const minPlayers = maxPlayers === 1 ? 1 : 2;
  dom.setupGridPreset.value = getPresetValue(draft.boardSize);
  dom.setupGridSize.value = String(draft.boardSize);
  if (draft.boardSize < 15) {
    dom.setupGridSize.value = "15";
  }
  dom.setupGridSizeValue.textContent = t("setup.gridSizeValue", { size: draft.boardSize });
  dom.setupExtension.checked = Boolean(draft.rules.extension);
  dom.setupBorderProtection.checked = Boolean(draft.rules.borderProtection);
  dom.setupRemoveHex.checked = Boolean(draft.rules.removeHex);
  dom.setupKeepConnected.checked = Boolean(draft.rules.keepConnected);
  dom.setupExtensionState.textContent = draft.rules.extension ? t("setup.toggle.on") : t("setup.toggle.off");
  dom.setupBorderProtectionState.textContent = draft.rules.borderProtection ? t("setup.toggle.on") : t("setup.toggle.off");
  dom.setupRemoveHexState.textContent = draft.rules.removeHex ? t("setup.toggle.on") : t("setup.toggle.off");
  dom.setupKeepConnectedState.textContent = draft.rules.keepConnected ? t("setup.toggle.on") : t("setup.toggle.off");
  dom.setupExtensionDesc.textContent = draft.rules.extension
    ? t("setup.rule.extension.on")
    : t("setup.rule.extension.off");
  dom.setupBorderProtectionDesc.textContent = draft.rules.borderProtection
    ? t("setup.rule.borderProtection.on")
    : t("setup.rule.borderProtection.off");
  dom.setupRemoveHexDesc.textContent = draft.rules.removeHex
    ? t("setup.rule.removeHex.on")
    : t("setup.rule.removeHex.off");
  dom.setupKeepConnectedDesc.textContent = draft.rules.keepConnected
    ? t("setup.rule.keepConnected.on")
    : t("setup.rule.keepConnected.off");

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
          <div class="setup-player-mode-group" data-player-index="${index}">
            ${renderModeOption(index, "human", player.controlType !== "ai", t("setup.mode.human"))}
            ${renderModeOption(index, "easy", player.controlType === "ai" && player.difficulty === "easy", t("setup.mode.aiWeak"))}
            ${renderModeOption(index, "medium", player.controlType === "ai" && player.difficulty === "medium", t("setup.mode.aiMedium"))}
            ${renderModeOption(index, "hard", player.controlType === "ai" && player.difficulty === "hard", t("setup.mode.aiStrong"))}
          </div>
          <select class="setup-player-mode setup-player-mode-select" data-player-index="${index}">
            <option value="human" ${player.controlType !== "ai" ? "selected" : ""}>${t("setup.mode.human")}</option>
            <option value="easy" ${player.controlType === "ai" && player.difficulty === "easy" ? "selected" : ""}>${t("setup.mode.aiWeak")}</option>
            <option value="medium" ${player.controlType === "ai" && player.difficulty === "medium" ? "selected" : ""}>${t("setup.mode.aiMedium")}</option>
            <option value="hard" ${player.controlType === "ai" && player.difficulty === "hard" ? "selected" : ""}>${t("setup.mode.aiStrong")}</option>
          </select>
          <button
            class="setup-player-remove"
            data-player-index="${index}"
            type="button"
            aria-label="${t("button.removePlayer")}"
            ${draft.players.length <= minPlayers ? "disabled" : ""}
          >×</button>
        </article>
      `,
    )
    .join("");
  dom.confirmAddPlayer.disabled = draft.players.length >= maxPlayers;
  dom.newPlayerName.disabled = draft.players.length >= maxPlayers;
  dom.newPlayerName.placeholder = t("setup.placeholder.playerName");
  const nextPalette = PLAYER_PALETTE[draft.players.length % PLAYER_PALETTE.length];
  dom.newPlayerSwatch.style.background = nextPalette.fill;
  dom.newPlayerSwatch.style.opacity = draft.players.length >= maxPlayers ? "0.38" : "1";
}

function getPresetValue(boardSize) {
  if ([5, 9, 11, 15].includes(boardSize)) {
    return String(boardSize);
  }
  return "custom";
}

function escapeAttribute(value) {
  return value.replaceAll("&", "&amp;").replaceAll("\"", "&quot;").replaceAll("<", "&lt;");
}

function renderModeOption(index, value, checked, label) {
  return `
    <label class="setup-player-mode-option ${checked ? "active" : ""}">
      <input
        class="setup-player-mode"
        data-player-index="${index}"
        type="radio"
        name="setup-player-mode-${index}"
        value="${value}"
        ${checked ? "checked" : ""}
      />
      <span>${label}</span>
    </label>
  `;
}
