import { createInitialState } from "../core/state.js";

export function resetGame(store, config) {
  store.state = createInitialState(config);
  return store.state;
}
