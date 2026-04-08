import { getPreviewForMode, placementCausesSelfCapture } from "../core/move-validation.js";
import { t } from "../core/i18n.js";

export function updatePreview(state, key) {
  const preview = getPreviewForMode(state, key);
  if (preview.valid && preview.type === "place" && placementCausesSelfCapture(state, preview)) {
    state.preview = {
      ...preview,
      valid: false,
      reason: t("preview.selfCapture"),
    };
    return state.preview;
  }
  state.preview = preview;
  return preview;
}
