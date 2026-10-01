const boardEl = document.querySelector("#board");
const statusEl = document.querySelector("#status");
const playerScoreEl = document.querySelector("#playerScore");
const npcScoreEl = document.querySelector("#npcScore");
const drawScoreEl = document.querySelector("#drawScore");
const newRoundBtn = document.querySelector("#newRound");
const resetScoreBtn = document.querySelector("#resetScore");

const HUMAN = "X";
const NPC = "O";
const WINNING_LINES = [
  [0,1,2], [3,4,5], [6,7,8],
  [0,3,6], [1,4,7], [2,5,8],
  [0,4,8], [2,4,6]
];

let board = Array(9).fill("");
let gameOver = false;
let thinking = false;
let scores = { player: 0, npc: 0, draw: 0 };

function render() {
  boardEl.innerHTML = "";
  board.forEach((value, index) => {
    const button = document.createElement("button");
    button.className = "cell";
    button.type = "button";
    button.setAttribute("role", "gridcell");
    button.setAttribute("aria-label", value ? `Casa ${index + 1}: ${value}` : `Casa ${index + 1}, vazia`);
    button.textContent = value;
    button.disabled = Boolean(value) || gameOver || thinking;
    if (value) button.classList.add(value.toLowerCase());
    button.addEventListener("click", () => playHuman(index));
    boardEl.appendChild(button);
  });

  playerScoreEl.textContent = scores.player;
  npcScoreEl.textContent = scores.npc;
  drawScoreEl.textContent = scores.draw;
}

function playHuman(index) {
  if (board[index] || gameOver || thinking) return;
  board[index] = HUMAN;

  const result = getResult(board);
  if (result) return finish(result);

  thinking = true;
  statusEl.textContent = "NPC pensando...";
  render();

  setTimeout(() => {
    const move = chooseNpcMove();
    if (move !== -1) board[move] = NPC;
    thinking = false;

    const npcResult = getResult(board);
    if (npcResult) return finish(npcResult);

    statusEl.textContent = "Sua vez — você é X";
    render();
  }, 450);
}

function chooseNpcMove() {
  // Tenta ganhar, depois bloquear, depois prioriza centro/cantos.
  const winningMove = findTacticalMove(NPC);
  if (winningMove !== -1) return winningMove;

  const blockingMove = findTacticalMove(HUMAN);
  if (blockingMove !== -1) return blockingMove;

  if (board[4] === "") return 4;

  const corners = [0, 2, 6, 8].filter(i => board[i] === "");
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];

  const empty = board.map((v, i) => v === "" ? i : -1).filter(i => i !== -1);
  return empty.length ? empty[Math.floor(Math.random() * empty.length)] : -1;
}

function findTacticalMove(mark) {
  for (const line of WINNING_LINES) {
    const values = line.map(i => board[i]);
    if (values.filter(v => v === mark).length === 2 && values.includes("")) {
      return line[values.indexOf("")];
    }
  }
  return -1;
}

function getResult(state) {
  for (const line of WINNING_LINES) {
    const [a,b,c] = line;
    if (state[a] && state[a] === state[b] && state[a] === state[c]) {
      return { winner: state[a], line };
    }
  }
  if (state.every(Boolean)) return { winner: "draw", line: [] };
  return null;
}

function finish(result) {
  gameOver = true;

  if (result.winner === HUMAN) {
    scores.player++;
    statusEl.textContent = "Você venceu! 🎉";
  } else if (result.winner === NPC) {
    scores.npc++;
    statusEl.textContent = "O NPC venceu!";
  } else {
    scores.draw++;
    statusEl.textContent = "Empate!";
  }

  render();

  result.line.forEach(index => {
    boardEl.children[index]?.classList.add("win");
  });
}

function newRound() {
  board = Array(9).fill("");
  gameOver = false;
  thinking = false;
  statusEl.textContent = "Sua vez — você é X";
  render();
}

function resetScore() {
  scores = { player: 0, npc: 0, draw: 0 };
  newRound();
}

newRoundBtn.addEventListener("click", newRound);
resetScoreBtn.addEventListener("click", resetScore);

render();
