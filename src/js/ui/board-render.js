export function renderBoard(dom, boardCells, state) {
  dom.board.innerHTML = "";
  const playerMap = Object.fromEntries(state.players.map((player) => [player.id, player]));
  dom.board.appendChild(buildGradients(state.players));
  const previewColor = playerMap[state.currentPlayer].fill;

  for (const cell of boardCells) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.dataset.key = cell.id;

    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("points", cell.points);
    polygon.setAttribute("class", "hex-cell");
    polygon.dataset.key = cell.id;

    const marker = state.cells.get(cell.id);
    if (marker) {
      const owner = playerMap[marker.owner];
      polygon.classList.add("occupied");
      polygon.style.fill = marker.captured ? `url(#captured-${owner.id})` : `url(#piece-${owner.id})`;
      polygon.style.filter = `drop-shadow(0 0 8px ${owner.glow})`;
      if (marker.captured) {
        polygon.dataset.captured = "true";
      }
    }

    if (state.preview?.cells.includes(cell.id)) {
      polygon.classList.add(state.preview.valid ? "preview-valid" : "preview-invalid");
      polygon.style.setProperty("--preview-color", previewColor);
      polygon.style.setProperty("--preview-stroke", state.preview.valid ? "#fff4cc" : "#5c0b10");
    }

    group.appendChild(polygon);
    dom.board.appendChild(group);
  }
}

function buildGradients(players) {
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.appendChild(buildGradient("neutral-hex-gradient", ["#cfc1ac", "#a99881"]));
  for (const player of players) {
    defs.appendChild(buildGradient(`piece-${player.id}`, [player.gradientStart, player.fill]));
    defs.appendChild(buildGradient(`captured-${player.id}`, [player.captureStart, player.fill]));
  }
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
