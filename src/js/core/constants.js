import { t } from "./i18n.js";

export const DEFAULT_GRID_SIZE = 11;
export const DEFAULT_RULES = {
  extension: true,
  borderProtection: true,
  removeHex: true,
};
export const MAX_PLAYERS = 10;
export const BOARD_VIEW_WIDTH = 960;
export const BOARD_VIEW_HEIGHT = 900;
export const HEX_RADIUS = 52;
export const HEX_WIDTH = HEX_RADIUS * Math.sqrt(3);
export const HEX_VERTICAL_STEP = HEX_RADIUS * 1.5;

export const PLAYER_PALETTE = [
  { fill: "#1f6feb", gradientStart: "#67c7ff", captureStart: "#6dd0ff", glow: "rgba(103, 199, 255, 0.22)" },
  { fill: "#2f9d7e", gradientStart: "#8de3c4", captureStart: "#a8efd8", glow: "rgba(141, 227, 196, 0.2)" },
  { fill: "#c96b1d", gradientStart: "#ffca86", captureStart: "#ffd8a8", glow: "rgba(255, 202, 134, 0.2)" },
  { fill: "#b144b7", gradientStart: "#ebb0ef", captureStart: "#f2c2f5", glow: "rgba(235, 176, 239, 0.22)" },
  { fill: "#9a2e4f", gradientStart: "#ef8aa8", captureStart: "#f3a6bc", glow: "rgba(239, 138, 168, 0.2)" },
  { fill: "#2c8a5a", gradientStart: "#90e2b7", captureStart: "#afeccc", glow: "rgba(144, 226, 183, 0.22)" },
];

export function createDefaultPlayers(count = 2) {
  return Array.from({ length: count }, (_, index) => {
    const palette = PLAYER_PALETTE[index % PLAYER_PALETTE.length];
    return {
      id: `player${index + 1}`,
      name: t("player.defaultName", { number: index + 1 }),
      controlType: index === 0 ? "human" : index === 1 ? "ai" : "human",
      difficulty: index === 1 ? "medium" : "easy",
      ...palette,
    };
  });
}

export function getMaxPlayers(boardSize) {
  if (boardSize > 5) {
    return MAX_PLAYERS;
  }
  return Math.max(1, boardSize * boardSize);
}

export function getPlayerMap(players) {
  return Object.fromEntries(players.map((player) => [player.id, player]));
}

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
