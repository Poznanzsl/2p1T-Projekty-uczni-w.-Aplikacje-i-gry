const DIFFICULTY = {
    easy: { rows: 9, cols: 9, mines: 10 },
    medium: { rows: 16, cols: 16, mines: 40 },
    hard: { rows: 16, cols: 30, mines: 99 },
    custom: { rows: 10, cols: 10, mines: 10 } // Domyślne wartości dla custom
};

let board = [];
let rows = DIFFICULTY.easy.rows;
let cols = DIFFICULTY.easy.cols;
let mines = DIFFICULTY.easy.mines;

let gameOver = false;
let flags = 0;
let timer = 0;
let timerInterval = null;
let revealedCellsCount = 0; // Licznik odkrytych bezpiecznych komórek

// Elementy DOM (zainicjalizowane w window.onload)
let boardElement, timeElement, minesRemainingElement, difficultySelect, customDifficultyDiv, rowsInput, colsInput, minesInput, gameOverDiv, winDiv;

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

    // Ustawienie domyślnych wartości dla custom difficulty w polach input
    rowsInput.value = DIFFICULTY.custom.rows;
    colsInput.value = DIFFICULTY.custom.cols;
    minesInput.value = DIFFICULTY.custom.mines;

    // Listener dla zmiany poziomu trudności
    difficultySelect.addEventListener('change', function () {
        if (this.value === 'custom') {
            customDifficultyDiv.style.display = 'block';
        } else {
            customDifficultyDiv.style.display = 'none';
        }
        // Opcjonalnie: od razu zaktualizuj grę po zmianie, jeśli chcesz
        // updateGameSettings(); // Można by to dodać, ale przycisk Start jest bardziej jawny
    });

    // Rozpocznij grę z domyślnymi ustawieniami
    startGame();

    // Obsługa kliknięć
    boardElement.addEventListener('contextmenu', function (e) {
        e.preventDefault(); // Blokuj domyślne menu kontekstowe
    });

    boardElement.addEventListener('mousedown', function (e) {
        if (gameOver) return; // Nie rób nic, jeśli gra się zakończyła

        const cellElement = e.target.closest('div[data-row]'); // Upewnij się, że kliknięto na komórkę
        if (!cellElement) return; // Ignoruj kliknięcia spoza komórek

        const row = Number(cellElement.dataset.row);
        const col = Number(cellElement.dataset.col);

        if (e.button === 0) { // Lewy przycisk myszy
            console.log('Lewy klik na', row, col);

            if (cellElement.classList.contains('flagged')) {
                return; // Nie rób nic, jeśli komórka jest oflagowana
            }

            if (cellElement.classList.contains('revealed')) {
                // Logika "chording" - odkrywanie sąsiadów, jeśli liczba flag się zgadza
                if (board[row][col] > 0 && board[row][col] === countAdjacentFlags(row, col)) {
                    clearAdjacentCells(row, col);
                    if (!gameOver) checkWinCondition(); // Sprawdź wygraną, jeśli gra nie zakończyła się miną
                }
                return;
            }

            // Odkrywanie nowej komórki
            cellElement.classList.add('revealed');

            if (board[row][col] === -1) { // Trafiono na minę
                cellElement.innerText = '💣';
                cellElement.style.backgroundColor = 'red'; // Podświetl klikniętą minę
                triggerGameOver();
            } else {
                revealedCellsCount++;
                if (board[row][col] === 0) {
                    cellElement.innerText = ''; // Dla 0 nie pokazuj liczby
                    clearAdjacentCells(row, col);
                } else {
                    cellElement.innerText = board[row][col];
                    cellElement.style.color = colorNumber(board[row][col]);
                }
                if (!gameOver) checkWinCondition();
            }

        } else if (e.button === 2) { // Prawy przycisk myszy
            if (cellElement.classList.contains('revealed')) return; // Nie oznaczaj odkrytych komórek

            if (cellElement.classList.contains('flagged')) {
                cellElement.classList.remove('flagged');
                cellElement.innerText = '';
                flags--;
            } else {
                // Można dodać limit flag równy liczbie min, jeśli chcesz
                // if (flags >= mines) return; 
                cellElement.classList.add('flagged');
                cellElement.innerText = '🚩';
                flags++;
            }
            updateMinesRemainingDisplay();
            console.log('Prawy klik na', row, col, 'Flags:', flags);
        }
    });
};

function updateGameSettings() {
    const selectedDifficulty = difficultySelect.value;
    if (selectedDifficulty === 'custom') {
        rows = parseInt(rowsInput.value) || 10;
        cols = parseInt(colsInput.value) || 10;
        mines = parseInt(minesInput.value) || 10;

        // Walidacja wartości niestandardowych
        rows = Math.max(1, Math.min(rows, 50)); // Ograniczenie do 50x50 max
        cols = Math.max(1, Math.min(cols, 50));
        rowsInput.value = rows;
        colsInput.value = cols;
        
        if (mines < 1) mines = 1;
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

function updateMinesRemainingDisplay() {
    minesRemainingElement.innerText = mines - flags;
}

function showAllMines() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c] === -1) {
                const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                if (cell && !cell.classList.contains('flagged')) { // Pokaż miny, które nie są oflagowane
                    cell.classList.add('revealed'); // Użyj revealed dla spójności stylu
                    cell.innerText = '💣';
                } else if (cell && cell.classList.contains('flagged') && board[r][c] !== -1) {
                    // Opcjonalnie: oznacz błędnie postawione flagi
                    // cell.style.backgroundColor = 'orange'; 
                }
            }
        }
    }
}

function colorNumber(num) {
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

function createBoard() {
    board = []; // Wyczyść tablicę board przed nowym tworzeniem
    for (let row = 0; row < rows; row++) {
        board[row] = [];
        for (let col = 0; col < cols; col++) {
            board[row][col] = 0;
        }
    }
    console.log('Utworzono plansze');
}

function placeMines() {
    let mineCount = 0;
    while (mineCount < mines) {
        let row = Math.floor(Math.random() * rows);
        let col = Math.floor(Math.random() * cols);
        if (board[row][col] !== -1) {
            board[row][col] = -1;
            mineCount++;
        }
    }
    console.log('Rozlozono miny');
}

function countAdjacentMines(row, col) {
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

function countAdjacentFlags(row, col) {
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

function cellNums() {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (board[row][col] !== -1) {
                board[row][col] = countAdjacentMines(row, col);
            }
        }
    }
    console.log('Zliczono miny wokół komórek');
}

function renderBoard() {
    boardElement.innerHTML = ''; // Wyczyść planszę przed renderowaniem
    boardElement.style.gridTemplateColumns = `repeat(${cols}, 30px)`;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cell = document.createElement('div');
            // cell.className = row.toString() + '-' + col.toString(); // Można usunąć, jeśli nie używane
            cell.dataset.row = row;
            cell.dataset.col = col;
            boardElement.appendChild(cell);
        }
    }
    console.log('Render planszy');
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval); // Wyczyść poprzedni interwał
    timer = 0;
    timeElement.innerText = timer;
    timerInterval = setInterval(() => {
        timer++;
        timeElement.innerText = timer;
    }, 1000);
    console.log('Start timera');
}

function clearAdjacentCells(row, col) {
    for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
        for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
            if (r === row && c === col) continue; // Nie przetwarzaj samej siebie ponownie
            if (gameOver) return; // Jeśli gra się zakończyła, przerwij

            const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
            if (cell && !cell.classList.contains('revealed') && !cell.classList.contains('flagged')) {
                cell.classList.add('revealed');

                if (board[r][c] === -1) { // To nie powinno się zdarzyć przy normalnym clear, ale przy "chording" tak
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

function triggerGameOver() { // Zmieniono nazwę z gameOverScreen na triggerGameOver dla jasności
    if (gameOver) return; // Zapobiegaj wielokrotnemu wywołaniu
    gameOver = true;
    clearInterval(timerInterval);
    showAllMines();
    gameOverDiv.classList.remove('hidden');
    console.log('Koniec gry!');
}

function triggerWin() {
    if (gameOver) return; // Zapobiegaj wielokrotnemu wywołaniu (np. jeśli ostatni klik to mina)
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
    console.log('Gratulacje! Wygrałeś!');
}

function checkWinCondition() {
    if (gameOver) return;
    if (revealedCellsCount === (rows * cols) - mines) {
        triggerWin();
    }
}

// Funkcja globalna, aby przyciski w HTML mogły ją wywołać
window.resetGame = function() {
    clearInterval(timerInterval);
    timerInterval = null;
    timer = 0;
    timeElement.innerText = '0';

    flags = 0;
    // updateGameSettings(); // Pobierz aktualne ustawienia, żeby poprawnie wyświetlić miny
    // updateMinesRemainingDisplay(); // Wyświetl `mines - flags`

    // Aby minesRemainingElement pokazywał prawidłową liczbę min dla aktualnie wybranego poziomu trudności:
    const selectedDifficulty = difficultySelect.value;
    let currentMines = 0;
    if (selectedDifficulty === 'custom') {
        currentMines = parseInt(minesInput.value) || DIFFICULTY.custom.mines;
    } else {
        currentMines = DIFFICULTY[selectedDifficulty].mines;
    }
    minesRemainingElement.innerText = currentMines;


    boardElement.innerHTML = ''; // Wyczyść wizualną planszę
    
    gameOver = false;
    revealedCellsCount = 0;
    board = []; // Wyczyść logiczną planszę

    gameOverDiv.classList.add('hidden');
    winDiv.classList.add('hidden');
    
    console.log('Gra zresetowana. Kliknij Start, aby zagrać.');
}

// Funkcja globalna
window.startGame = function() {
    // Najpierw zatrzymaj i wyczyść poprzednią grę, jeśli była
    if (timerInterval) clearInterval(timerInterval);
    boardElement.innerHTML = '';
    gameOverDiv.classList.add('hidden');
    winDiv.classList.add('hidden');

    // Ustaw parametry gry
    updateGameSettings();
    
    // Sprawdzenie, czy liczba min nie jest zbyt duża po aktualizacji
    if (mines >= rows * cols && rows * cols > 0) {
        alert(`Liczba min (${mines}) jest zbyt duża dla planszy ${rows}x${cols}. Ustawiono na ${Math.max(1, rows * cols - 1)}.`);
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


    // Zainicjuj zmienne stanu gry
    gameOver = false;
    flags = 0;
    revealedCellsCount = 0;
    timer = 0; // Resetuj wartość timera, nie tylko interwał
    
    // Zaktualizuj UI
    updateMinesRemainingDisplay();
    timeElement.innerText = '0';

    // Stwórz i wyrenderuj nową grę
    createBoard();
    placeMines();
    cellNums();
    renderBoard();
    startTimer();
    console.log('Gra rozpoczęta.');
}

// Funkcja globalna
window.restartFullGame = function() {
    console.log('Restart gry...');
    // resetGame(); // startGame teraz zawiera logikę resetu
    startGame();
}