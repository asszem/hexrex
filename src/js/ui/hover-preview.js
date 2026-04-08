import { getPreviewForMode, placementCausesSelfCapture } from "../core/move-validation.js";

export function updatePreview(state, key) {
  const preview = getPreviewForMode(state, key);
  if (preview.valid && preview.type === "place" && placementCausesSelfCapture(state, preview)) {
    state.preview = {
      ...preview,
      valid: false,
      reason: "This placement would immediately self-capture.",
    };
    return state.preview;
  }
  state.preview = preview;
  return preview;
}
