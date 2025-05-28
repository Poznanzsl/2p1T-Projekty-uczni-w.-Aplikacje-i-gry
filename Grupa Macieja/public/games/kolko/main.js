const board = document.getElementById("board");
const message = document.getElementById("message");
let currentPlayer = "X";

function createBoard() {
  board.innerHTML = ""; // Reset planszy przed wygenerowaniem nowych elementów
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");

    // Obsługa najechania kursorem
    cell.addEventListener("mouseover", () => {
      if (!cell.textContent && !cell.classList.contains("taken")) {
        cell.style.backgroundColor =
          currentPlayer === "X" ? "rgb(255, 201, 201)" : "rgb(192, 195, 255)";
      }
    });

    cell.addEventListener("mouseout", () => {
      if (!cell.textContent && !cell.classList.contains("taken")) {
        cell.style.backgroundColor = ""; // Powrót do domyślnego koloru
      }
    });

    cell.addEventListener("click", () => makeMove(cell));
    board.appendChild(cell);
  }
}

function makeMove(cell) {
  if (!cell.textContent && !cell.classList.contains("taken")) {
    cell.textContent = currentPlayer;
    cell.classList.add("taken", currentPlayer); // Dodaj klasę X lub O
    if (checkWinner()) {
      message.textContent = `Gracz ${currentPlayer} wygrał!`;
      board.querySelectorAll(".cell").forEach((c) => c.classList.add("taken"));
    } else {
      currentPlayer = currentPlayer === "X" ? "O" : "X";
      message.textContent = `Tura gracza: ${currentPlayer}`;
    }
  }
}

function checkWinner() {
  const cells = Array.from(board.children);
  const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // Wiersze
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // Kolumny
    [0, 4, 8],
    [2, 4, 6], // Przekątne
  ];

  return winningCombinations.some((combination) =>
    combination.every((index) => cells[index].textContent === currentPlayer)
  );
}

createBoard();
