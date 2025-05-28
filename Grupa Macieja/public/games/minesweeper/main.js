// SAPER 

// --- Konfiguracja ---
// Poziomy trudności
const DIFFICULTY = {
    easy: { rows: 9, cols: 9, mines: 10 },
    medium: { rows: 16, cols: 16, mines: 40 },
    hard: { rows: 16, cols: 30, mines: 99 },
    custom: { rows: 10, cols: 10, mines: 10 } // Domyślne wartości dla custom
};

// Plansza 
let board = [];
let rows = DIFFICULTY.easy.rows;
let cols = DIFFICULTY.easy.cols;
let mines = DIFFICULTY.easy.mines;

// Zmienne do zarządzania grą
let gameOver = false;
let flags = 0;
let timer = 0;
let timerInterval = null;
let revealedCellsCount = 0; // Licznik odkrytych komórek

// Elementy DOM
let boardElement, timeElement, minesRemainingElement, difficultySelect, customDifficultyDiv, rowsInput, colsInput, minesInput, gameOverDiv, winDiv;



// --- Inicjalizacja gry ---
window.onload = function() {
    // Inicjalizacja elementów DOM
    boardElement = document.getElementById('board');
    timeElement = document.getElementById('time');
    minesRemainingElement = document.getElementById('mines-remaining');
    difficultySelect = document.getElementById('difficulty');
    customDifficultyDiv = document.getElementById('custom-difficulty');
    rowsInput = document.getElementById('rows');
    colsInput = document.getElementById('cols');
    minesInput = document.getElementById('mines');
    gameOverDiv = document.getElementById('game-over');
    winDiv = document.getElementById('win');

    // Domyślne wartości dla custom difficulty
    rowsInput.value = DIFFICULTY.custom.rows;
    colsInput.value = DIFFICULTY.custom.cols;
    minesInput.value = DIFFICULTY.custom.mines;

    // Listener dla zmiany poziomu trudności
    difficultySelect.addEventListener('change', function () {
        if (this.value === 'custom') {
            customDifficultyDiv.style.display = 'block'; // Pokaż niestandardowe ustawienia
        } else {
            customDifficultyDiv.style.display = 'none';
        }
    });

    // Rozpoczęcie gry
    startGame();

    // Obsługa kliknięć
    boardElement.addEventListener('contextmenu', function (e) {
        e.preventDefault(); // Blokowanie lewego przycisku myszy
    });

    boardElement.addEventListener('mousedown', function (e) {
        if (gameOver) return; // Nie rób nic, jeśli gra się zakończyła

        const clickedCell = e.target.closest('div[data-row]'); // Upewnij się, że kliknięto na komórkę
        if (!clickedCell) return; // Ignorowanie kliknięć poza komórkami

        // Pobranie współrzędnych klikniętej komórki
        const row = Number(clickedCell.dataset.row); 
        const col = Number(clickedCell.dataset.col);

        if (e.button === 0) { // Lewy przycisk myszy

            if (clickedCell.classList.contains('flagged')) return; // Nie rób nic, jeśli komórka ma już flagę

            if (clickedCell.classList.contains('revealed')) {
                // Odkrywanie sąsiednich komórek (jeśli liczba flag wokół jest równa liczbie min)
                if (board[row][col] > 0 && board[row][col] === countAdjacentFlags(row, col)) {
                    clearAdjacentCells(row, col);
                    if (!gameOver) checkWinCondition(); // Sprawdź wygraną, jeśli gra nie zakończyła się miną
                }
                return;
            }

            // Odkrywanie nowej komórki
            clickedCell.classList.add('revealed');

            if (board[row][col] === -1) { // Trafienie na minę
                clickedCell.innerText = '💣';
                clickedCell.style.backgroundColor = 'red'; // Podświetl klikniętą minę
                triggerGameOver();
            } else {
                revealedCellsCount++;
                if (board[row][col] === 0) {
                    clickedCell.innerText = ''; // Dla zera min nie pokazuj liczby
                    clearAdjacentCells(row, col); // Rekurencyjne odkrywanie sąsiednich komórek
                } else {
                    clickedCell.innerText = board[row][col]; // Pokaż liczbę min wokół
                    clickedCell.style.color = colorNumber(board[row][col]); // Kolorowanie liczby
                }
                if (!gameOver) checkWinCondition();
            }

        } else if (e.button === 2) { // Prawy przycisk myszy
            if (clickedCell.classList.contains('revealed')) return; // Nie oznaczaj odkrytych komórek

            if (clickedCell.classList.contains('flagged')) { // Usunięcie flagi
                clickedCell.classList.remove('flagged');
                clickedCell.innerText = '';
                flags--;
            } else { // Dodanie flagi
                clickedCell.classList.add('flagged');
                clickedCell.innerText = '🚩';
                flags++;
            }
            updateMinesRemainingDisplay();
        }
    });
};



// --- Funkcje pomocnicze ---
function updateGameSettings() { // Aktualizacja ustawień gry
    const selectedDifficulty = difficultySelect.value;
    if (selectedDifficulty === 'custom') {
        rows = parseInt(rowsInput.value) || 10;
        cols = parseInt(colsInput.value) || 10;
        mines = parseInt(minesInput.value) || 10;

        // Zapewnienie, że wartości są w odpowiednich zakresach
        rows = Math.max(1, Math.min(rows, 50)); // Max 50x50
        cols = Math.max(1, Math.min(cols, 50));
        rowsInput.value = rows;
        colsInput.value = cols;
        
        if (mines < 1) mines = 1; // Co najmniej jedna mina
        if (mines >= rows * cols) {
            mines = Math.max(1, rows * cols - 1); // Co najmniej jedno pole bez miny
        }
        minesInput.value = mines;

    } else {
        rows = DIFFICULTY[selectedDifficulty].rows;
        cols = DIFFICULTY[selectedDifficulty].cols;
        mines = DIFFICULTY[selectedDifficulty].mines;
    }
}

function updateMinesRemainingDisplay() { // Aktualizacja wyświetlania pozostałych min
    minesRemainingElement.innerText = mines - flags;
}

function showAllMines() { // Odkryj wszystkie miny na planszy po zakończeniu gry
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c] === -1) {
                const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                if (cell && !cell.classList.contains('flagged')) { // Pokaż miny, które nie są oflagowane
                    cell.classList.add('revealed');
                    cell.innerText = '💣';
                } else if (cell && cell.classList.contains('flagged') && board[r][c] !== -1) {
                    cell.style.backgroundColor = 'orange'; // Błędne postawione flagi
                }
            }
        }
    }
}

function colorNumber(num) { // Kolorowanie liczb
    switch (num) {
        case 1: return 'blue';
        case 2: return 'green';
        case 3: return 'red';
        case 4: return 'darkblue'; // Zmieniono purple dla lepszej czytelności
        case 5: return 'brown';
        case 6: return 'cyan';
        case 7: return 'black'; // Zmieniono gray
        case 8: return 'darkgray'; // Zmieniono black
        default: return 'white';
    }
}

function createBoard() { // Uworzenie planszy
    board = []; // Wyczyść tablicę board przed nowym tworzeniem
    for (let row = 0; row < rows; row++) {
        board[row] = [];
        for (let col = 0; col < cols; col++) {
            board[row][col] = 0;
        }
    }
}

function placeMines() { // Rozmieszczenie min na planszy
    let mineCount = 0;
    while (mineCount < mines) {
        let row = Math.floor(Math.random() * rows);
        let col = Math.floor(Math.random() * cols);
        if (board[row][col] !== -1) {
            board[row][col] = -1;
            mineCount++;
        }
    }
}

function countAdjacentMines(row, col) { // Zliczanie min wokół danej komórki
    let count = 0;
    for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
        for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
            if (board[r][c] === -1) {
                count++;
            }
        }
    }
    return count;
}

function countAdjacentFlags(row, col) { // Zliczanie flag wokół danej komórki
    let count = 0;
    for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
        for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
            if (r === row && c === col) continue; // Nie licz samej siebie
            const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
            if (cell && cell.classList.contains('flagged')) {
                count++;
            }
        }
    }
    return count;
}

function cellNums() { // Liczba min wokół komórek (dla planszy board[])
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (board[row][col] !== -1) {
                board[row][col] = countAdjacentMines(row, col);
            }
        }
    }
}

function renderBoard() { // Renderowanie planszy w HTML
    boardElement.innerHTML = ''; // Wyczyść planszę przed renderowaniem
    boardElement.style.gridTemplateColumns = `repeat(${cols}, 30px)`; // Ustawienie kolumn w CSS
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cell = document.createElement('div');
            // cell.className = row.toString() + '-' + col.toString(); // Stara wersja
            cell.dataset.row = row;
            cell.dataset.col = col;
            boardElement.appendChild(cell);
        }
    }
}

function startTimer() { // Rozpoczęcie timera
    if (timerInterval) clearInterval(timerInterval); // Wyczyść poprzedni interwał
    timer = 0;
    timeElement.innerText = timer;
    timerInterval = setInterval(() => {
        timer++;
        timeElement.innerText = timer;
    }, 1000);
}

function clearAdjacentCells(row, col) { // Odkrywanie sąsiednich komórek (rekurencyjnie)
    for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
        for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
            if (r === row && c === col) continue; // Nie przetwarzaj samej siebie ponownie
            if (gameOver) return; // Jeśli gra się zakończyła, przerwij

            const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
            if (cell && !cell.classList.contains('revealed') && !cell.classList.contains('flagged')) {
                cell.classList.add('revealed');

                if (board[r][c] === -1) { 
                    cell.innerText = '💣';
                    cell.style.backgroundColor = 'red';
                    triggerGameOver();
                    return; // Zatrzymaj dalsze odkrywanie
                }
                
                revealedCellsCount++;

                if (board[r][c] === 0) {
                    cell.innerText = '';
                    clearAdjacentCells(r, c); // Rekurencja
                    if (gameOver) return; // Sprawdź po rekurencji
                } else {
                    cell.innerText = board[r][c];
                    cell.style.color = colorNumber(board[r][c]);
                }
            }
        }
    }
}

function triggerGameOver() { // Zakończenie gry
    if (gameOver) return; // Tylko jedno wywołanie
    gameOver = true;
    clearInterval(timerInterval);
    showAllMines();
    gameOverDiv.classList.remove('hidden');
}

function triggerWin() { // Wygrana
    if (gameOver) return; // Tylko jedno wywołanie
    gameOver = true;
    clearInterval(timerInterval);
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c] === -1 && !document.querySelector(`[data-row="${r}"][data-col="${c}"]`).classList.contains('flagged')) {
                document.querySelector(`[data-row="${r}"][data-col="${c}"]`).classList.add('flagged');
                document.querySelector(`[data-row="${r}"][data-col="${c}"]`).innerText = '🚩';
            }
        }
    }
    flags = mines; // Uaktualnij liczbę flag
    updateMinesRemainingDisplay();

    winDiv.classList.remove('hidden');
}

function checkWinCondition() { // Sprawdzenie warunku wygranej
    if (gameOver) return;
    if (revealedCellsCount === (rows * cols) - mines) {
        triggerWin();
    }
}

window.resetGame = function() { // Resetowanie gry
    clearInterval(timerInterval);
    timerInterval = null;
    timer = 0;
    timeElement.innerText = '0';

    flags = 0;
    updateGameSettings(); // Pobierz aktualne ustawienia, żeby poprawnie wyświetlić miny
    updateMinesRemainingDisplay(); // Wyświetlanie pozostałych min

    // Aby minesRemainingElement pokazywał prawidłową liczbę min dla aktualnie wybranego poziomu trudności:
    const selectedDifficulty = difficultySelect.value;
    let currentMines = 0;
    if (selectedDifficulty === 'custom') {
        currentMines = parseInt(minesInput.value) || DIFFICULTY.custom.mines;
    } else {
        currentMines = DIFFICULTY[selectedDifficulty].mines;
    }
    minesRemainingElement.innerText = currentMines;

    boardElement.innerHTML = ''; // Wyczyszczenie planszy
    
    gameOver = false;
    revealedCellsCount = 0;
    board = []; // Wyczyszczenie zmiennej planszy

    gameOverDiv.classList.add('hidden');
    winDiv.classList.add('hidden');
}

window.startGame = function() { // Rozpoczęcie gry
    // Zatrzymaj i wyczyść poprzednią grę, jeśli była
    if (timerInterval) clearInterval(timerInterval);
    boardElement.innerHTML = '';
    gameOverDiv.classList.add('hidden');
    winDiv.classList.add('hidden');

    // Ustaw parametry gry
    updateGameSettings();
    
    // Sprawdzenie, czy liczba min nie jest zbyt duża po aktualizacji
    if (mines >= rows * cols && rows * cols > 0) {
        mines = Math.max(1, rows * cols - 1);
        if (difficultySelect.value === 'custom') {
            minesInput.value = mines;
        }
    }
     if (rows <= 0 || cols <= 0) {
        alert("Wymiary planszy muszą być większe od zera.");
        boardElement.innerHTML = '<p style="color:red;">Błąd konfiguracji planszy.</p>';
        return;
    }


    // Zmienne stanu gry
    gameOver = false;
    flags = 0;
    revealedCellsCount = 0;
    timer = 0;
    
    // Zaktualizuj UI
    updateMinesRemainingDisplay();
    timeElement.innerText = '0';

    // Stwórz i wyrenderuj nową grę
    createBoard();
    placeMines();
    cellNums();
    renderBoard();
    startTimer();
}

window.restartFullGame = function() { // Restart pełnej gry
    console.log('Restart gry...');
    resetGame(); 
    startGame();
}