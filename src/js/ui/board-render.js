import { PLAYER_META } from "../core/constants.js";

export function renderBoard(dom, boardCells, state) {
  dom.board.innerHTML = "";
  dom.board.appendChild(buildGradients());
  const previewColor = PLAYER_META[state.currentPlayer].fill;

  for (const cell of boardCells) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.dataset.key = cell.id;

    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("points", cell.points);
    polygon.setAttribute("class", "hex-cell");
    polygon.dataset.key = cell.id;

    const marker = state.cells.get(cell.id);
    if (marker) {
      polygon.classList.add("occupied", marker.owner);
      if (marker.captured) {
        polygon.classList.add(PLAYER_META[marker.owner].captureClass);
      }
    }

    if (state.preview?.cells.includes(cell.id)) {
      polygon.classList.add(state.preview.valid ? "preview-valid" : "preview-invalid");
      polygon.style.setProperty("--preview-color", previewColor);
      polygon.style.setProperty("--preview-stroke", state.preview.valid ? "#fff4cc" : "#5c0b10");
    }

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", String(cell.x));
    label.setAttribute("y", String(cell.y + 4));
    label.setAttribute("class", "cell-label");
    label.textContent = cell.id;

    group.appendChild(polygon);
    group.appendChild(label);
    dom.board.appendChild(group);
  }
}

function buildGradients() {
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.appendChild(buildGradient("neutral-hex-gradient", ["#cfc1ac", "#a99881"]));
  defs.appendChild(buildGradient("player-a-gradient", ["#67c7ff", "#1f6feb"]));
  defs.appendChild(buildGradient("player-b-gradient", ["#8de3c4", "#2f9d7e"]));
  defs.appendChild(buildGradient("captured-a-gradient", ["#6dd0ff", "#1f6feb"]));
  defs.appendChild(buildGradient("captured-b-gradient", ["#a8efd8", "#2f9d7e"]));
  return defs;
}

function buildGradient(id, [first, second]) {
  const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
  gradient.id = id;
  gradient.setAttribute("x1", "0%");
  gradient.setAttribute("x2", "100%");
  gradient.setAttribute("y1", "0%");
  gradient.setAttribute("y2", "100%");

  const start = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  start.setAttribute("offset", "0%");
  start.setAttribute("stop-color", first);

  const end = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  end.setAttribute("offset", "100%");
  end.setAttribute("stop-color", second);

  gradient.appendChild(start);
  gradient.appendChild(end);
  return gradient;
}
