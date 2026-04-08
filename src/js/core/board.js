import {
  DIRECTIONS,
  HEX_RADIUS,
  HEX_VERTICAL_STEP,
  HEX_WIDTH,
} from "./constants.js";

export function createBoardCells(boardSize) {
  const cells = [];
  const padding = HEX_RADIUS + 20;
  const xOffset = padding + HEX_WIDTH / 2;
  const yOffset = padding + HEX_RADIUS;

  for (let row = 0; row < boardSize; row += 1) {
    const rowOffset = row % 2 === 0 ? 0 : HEX_WIDTH / 2;
    for (let col = 0; col < boardSize; col += 1) {
      const x = xOffset + rowOffset + col * HEX_WIDTH;
      const y = yOffset + row * HEX_VERTICAL_STEP;
      cells.push({
        id: `${col},${row}`,
        col,
        row,
        x,
        y,
        points: buildHexPoints(x, y),
      });
    }
  }

  cells.viewWidth = Math.ceil(padding * 2 + HEX_WIDTH * boardSize + HEX_WIDTH / 2);
  cells.viewHeight = Math.ceil(padding * 2 + HEX_RADIUS * 2 + HEX_VERTICAL_STEP * (boardSize - 1));

  return cells;
}

function buildHexPoints(centerX, centerY) {
  const points = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = ((60 * i - 30) * Math.PI) / 180;
    const x = centerX + HEX_RADIUS * Math.cos(angle);
    const y = centerY + HEX_RADIUS * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  return points.join(" ");
}

export function cellKey(col, row) {
  return `${col},${row}`;
}

export function parseCellKey(key) {
  const [col, row] = key.split(",").map(Number);
  return { col, row };
}

export function isInsideBoard(col, row, boardSize) {
  return col >= 0 && col < boardSize && row >= 0 && row < boardSize;
}

export function getNeighborKey(key, direction, boardSize) {
  const { col, row } = parseCellKey(key);
  const axial = offsetToAxial(col, row);
  const nextAxial = {
    q: axial.q + direction.dq,
    r: axial.r + direction.dr,
  };
  const { col: nextCol, row: nextRow } = axialToOffset(nextAxial.q, nextAxial.r);
  return isInsideBoard(nextCol, nextRow, boardSize) ? cellKey(nextCol, nextRow) : null;
}

export function getNeighbors(key, boardSize) {
  return DIRECTIONS.map((direction) => getNeighborKey(key, direction, boardSize)).filter(Boolean);
}

export function walkDirection(startKey, direction, count, boardSize) {
  const visited = [];
  let currentKey = startKey;
  for (let step = 0; step < count; step += 1) {
    currentKey = getNeighborKey(currentKey, direction, boardSize);
    if (!currentKey) {
      return null;
    }
    visited.push(currentKey);
  }
  return visited;
}

export function edgeReachableKeys(boardSize) {
  const keys = [];
  for (let row = 0; row < boardSize; row += 1) {
    for (let col = 0; col < boardSize; col += 1) {
      if (row === 0 || col === 0 || row === boardSize - 1 || col === boardSize - 1) {
        keys.push(cellKey(col, row));
      }
    }
  }
  return keys;
}

function offsetToAxial(col, row) {
  return {
    q: col - ((row - (row & 1)) / 2),
    r: row,
  };
}

function axialToOffset(q, r) {
  return {
    col: q + ((r - (r & 1)) / 2),
    row: r,
  };
}
