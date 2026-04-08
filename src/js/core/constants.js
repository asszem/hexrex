export const BOARD_SIZE = 9;
export const BOARD_VIEW_WIDTH = 960;
export const BOARD_VIEW_HEIGHT = 900;
export const HEX_RADIUS = 52;
export const HEX_WIDTH = HEX_RADIUS * Math.sqrt(3);
export const HEX_VERTICAL_STEP = HEX_RADIUS * 1.5;
export const PLAYER_ORDER = ["playerA", "playerB"];

export const PLAYER_META = {
  playerA: {
    id: "playerA",
    name: "Player 1",
    fill: "#1f6feb",
    preview: "rgba(31, 111, 235, 0.35)",
    captureClass: "captured-a",
  },
  playerB: {
    id: "playerB",
    name: "Player 2",
    fill: "#2f9d7e",
    preview: "rgba(47, 157, 126, 0.35)",
    captureClass: "captured-b",
  },
};

export const DIRECTIONS = [
  { key: "E", dq: 1, dr: 0 },
  { key: "W", dq: -1, dr: 0 },
  { key: "SE", dq: 0, dr: 1 },
  { key: "NW", dq: 0, dr: -1 },
  { key: "SW", dq: -1, dr: 1 },
  { key: "NE", dq: 1, dr: -1 },
];

export const OPPOSITE_DIRECTION = {
  E: "W",
  W: "E",
  SE: "NW",
  NW: "SE",
  SW: "NE",
  NE: "SW",
};
