import { createInitialState } from "../core/state.js";

export function resetGame(store) {
  store.state = createInitialState();
  return store.state;
}
