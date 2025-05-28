// input_file_0.js

const GRID_SIZE = 9;
const BOX_SIZE = 3;

let currentBoard = [];
let solutionBoard = [];
let initialBoard = [];

let selectedCell = null;
let mistakes = 0;
let timerInterval = null;
let secondsElapsed = 0;

const difficultySettings = {
    'bardzo-latwy': { cellsToRemove: 30, name: 'Bardzo Łatwy' },
    'latwy': { cellsToRemove: 40, name: 'Łatwy' },
    'sredni': { cellsToRemove: 50, name: 'Średni' },
    'trudny': { cellsToRemove: 55, name: 'Trudny' }
};
let currentDifficulty = 'sredni';

// --- Deklaracje globalnych zmiennych dla elementów DOM ---
let boardDiv;
let mistakesSpan;
let gameMessageDiv;
let digitsPadDiv; // Dodana globalna deklaracja
let timerSpan;    // Dodana globalna deklaracja (używana w updateTimerDisplay)
let difficultySelectorDiv; // Dodana globalna deklaracja (używana w setupDifficultyButtons)


let hintsUsed = 0;

// --- Inicjalizacja Gry ---
window.onload = function() {
    // --- Przypisanie wartości do zmiennych DOM po załadowaniu strony ---
    boardDiv = document.getElementById('sudoku-board');
    mistakesSpan = document.getElementById('mistakes-count');
    gameMessageDiv = document.getElementById('game-message');
    digitsPadDiv = document.getElementById('digits-pad'); // Przypisanie do globalnej zmiennej
    timerSpan = document.getElementById('timer');       // Przypisanie
    difficultySelectorDiv = document.getElementById('difficulty-selector'); // Przypisanie

    // Sprawdzenie, czy kluczowe elementy DOM zostały znalezione
    if (!boardDiv || !digitsPadDiv || !difficultySelectorDiv) {
        console.error("Krytyczny błąd: Nie znaleziono podstawowych elementów DOM (plansza, panel cyfr, selektor trudności). Sprawdź ID w HTML.");
        if (gameMessageDiv) { // Spróbuj wyświetlić błąd użytkownikowi
            gameMessageDiv.textContent = "Błąd krytyczny aplikacji. Nie można załadować gry.";
        } else if (document.body) {
            const errorP = document.createElement('p');
            errorP.style.color = 'red';
            errorP.style.fontWeight = 'bold';
            errorP.textContent = "Błąd krytyczny aplikacji. Nie można załadować gry. Sprawdź konsolę.";
            document.body.prepend(errorP);
        }
        return;
    }

    setupControlButtons();
    setupDifficultyButtons();
    setupNumberPad();
    startGame(currentDifficulty);
};

function setupControlButtons() {
    document.getElementById('new-game-btn')?.addEventListener('click', () => startGame(currentDifficulty));
    //document.getElementById('validate-btn')?.addEventListener('click', validateUserSolution); // Było wykomentowane
    document.getElementById('hint-btn')?.addEventListener('click', getHint);
    document.getElementById('hint-btn').innerHTML = `Podpowiedź (${3-hintsUsed})`; 
    //document.getElementById('solve-btn')?.addEventListener('click', showSolution);
    document.getElementById('reset-btn')?.addEventListener('click', resetCurrentBoard);
    document.addEventListener('keydown', handleKeyPress);
}

function setupDifficultyButtons() {
    if (difficultySelectorDiv) {
        difficultySelectorDiv.innerHTML = ''; 
        Object.keys(difficultySettings).forEach(level => {
            const button = document.createElement('button');
            button.textContent = difficultySettings[level].name;
            button.dataset.difficulty = level;
            button.addEventListener('click', () => {
                currentDifficulty = level;
                startGame(level);
                difficultySelectorDiv.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
            difficultySelectorDiv.appendChild(button);
        });
        const activeBtn = difficultySelectorDiv.querySelector(`button[data-difficulty="${currentDifficulty}"]`);
        if (activeBtn) activeBtn.classList.add('active');
    } else {
        console.warn("Element #difficulty-selector nie został znaleziony.");
    }
}

function setupNumberPad() {
    if (!digitsPadDiv) {
        console.warn("Element #digits-pad nie został znaleziony.");
        return;
    }
    digitsPadDiv.innerHTML = '';
    for (let i = 1; i <= 9; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.dataset.number = i;
        btn.addEventListener('click', () => handleNumberInput(i));
        digitsPadDiv.appendChild(btn);
    }
    const eraseBtn = document.createElement('button');
    eraseBtn.textContent = 'X';
    eraseBtn.id = 'erase-btn';
    eraseBtn.addEventListener('click', eraseNumberFromCell);
    digitsPadDiv.appendChild(eraseBtn);
}

function updateNumberPadAvailability() {
    if (!digitsPadDiv) return;
    if (!currentBoard || currentBoard.length === 0) {
        return;
    }
    for (let i = 1; i <= 9; i++) {
        const btn = digitsPadDiv.querySelector(`button[data-number="${i}"]`);
        if (btn) {
            if (checkAllInstancesOfNumberPlaced(i)) {
                btn.disabled = true;
                btn.classList.add('disabled-digit');
            } else {
                btn.disabled = false;
                btn.classList.remove('disabled-digit');
            }
        }
    }
}

function startGame(difficulty) {
    currentDifficulty = difficulty;
    hintsUsed = 0; // Resetuj licznik podpowiedzi
    document.getElementById('hint-btn').innerHTML = `Podpowiedź (${3-hintsUsed})`;
    const puzzleData = generateSudokuPuzzle(difficulty);
    if (!puzzleData) {
        console.error("Nie udało się wygenerować Sudoku.");
        if (gameMessageDiv) gameMessageDiv.textContent = "Błąd generatora. Spróbuj ponownie.";
        return;
    }
    currentBoard = puzzleData.puzzle;
    solutionBoard = puzzleData.solution;
    initialBoard = JSON.parse(JSON.stringify(currentBoard));

    mistakes = 0;
    selectedCell = null;
    updateMistakesDisplay();
    resetTimer();
    startTimer();
    renderBoard();
    updateNumberPadAvailability(); 
    console.log("Rozpoczęto nową grę. Poziom:", difficultySettings[difficulty].name);
    if (gameMessageDiv) gameMessageDiv.textContent = `Nowa gra: ${difficultySettings[difficulty].name}`;
}
// --- Logika Generowania Sudoku ---
function createEmptyBoardArray() {
    return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
}

function isValidPlacement(board, num, row, col) {
    for (let i = 0; i < GRID_SIZE; i++) {
        if (board[row][i] === num || board[i][col] === num) return false;
    }
    const boxStartRow = row - (row % BOX_SIZE);
    const boxStartCol = col - (col % BOX_SIZE);
    for (let r = 0; r < BOX_SIZE; r++) {
        for (let c = 0; c < BOX_SIZE; c++) {
            if (board[boxStartRow + r][boxStartCol + c] === num) return false;
        }
    }
    return true;
}

function findEmptyCell(board) {
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (board[r][c] === 0) return [r, c];
        }
    }
    return null;
}

function solveSudokuForGeneration(board) {
    const emptyCell = findEmptyCell(board);
    if (!emptyCell) return true;
    const [row, col] = emptyCell;

    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = numbers.length - 1; i > 0; i--) { // Fisher-Yates shuffle
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    for (const num of numbers) {
        if (isValidPlacement(board, num, row, col)) {
            board[row][col] = num;
            if (solveSudokuForGeneration(board)) return true;
            board[row][col] = 0; // Backtrack
        }
    }
    return false;
}

function generateSudokuPuzzle(difficultyKey) {
    const fullBoard = createEmptyBoardArray();
    if (!solveSudokuForGeneration(fullBoard)) {
        return null; 
    }

    const puzzleBoard = JSON.parse(JSON.stringify(fullBoard)); 
    const { cellsToRemove } = difficultySettings[difficultyKey];
    let removedCount = 0;
    let attempts = cellsToRemove * 3; 

    while (removedCount < cellsToRemove && attempts > 0) {
        const row = Math.floor(Math.random() * GRID_SIZE);
        const col = Math.floor(Math.random() * GRID_SIZE);

        if (puzzleBoard[row][col] !== 0) {
            puzzleBoard[row][col] = 0;
            removedCount++;
        }
        attempts--;
    }
    if (removedCount < cellsToRemove) console.warn(`Usunięto ${removedCount} z ${cellsToRemove} komórek.`);


    return { puzzle: puzzleBoard, solution: fullBoard };
}

// --- Renderowanie Planszy ---
function renderBoard() {
    if (!boardDiv) return;
    boardDiv.innerHTML = '';

    // Usuń podświetlenie tych samych numerów przed ponownym renderowaniem
    document.querySelectorAll('.sudoku-cell.highlight-same-number').forEach(cell => {
        cell.classList.remove('highlight-same-number');
    });

    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('sudoku-cell');
            cell.dataset.row = r;
            cell.dataset.col = c;

            if (currentBoard[r][c] !== 0) {
                cell.textContent = currentBoard[r][c];
                if (initialBoard[r][c] !== 0) {
                    cell.classList.add('initial-cell');
                } else {
                    if (currentBoard[r][c] !== solutionBoard[r][c]) {
                        cell.classList.add('incorrect-cell');
                    } else {
                        cell.classList.add('user-correct-cell');
                    }
                }
            }

            
            // Dodaj linie poziome i pionowe co BOX_SIZE
            for (let i = 0; i <= GRID_SIZE / BOX_SIZE; i++) {
                const hLine = document.createElement('div');
                hLine.classList.add('sudoku-grid-line', 'sudoku-horizontal');
                hLine.style.top = `${(i * 100 / BOX_SIZE)}%`;
                boardDiv.appendChild(hLine);

                const vLine = document.createElement('div');
                vLine.classList.add('sudoku-grid-line', 'sudoku-vertical');
                vLine.style.left = `${(i * 100 / BOX_SIZE)}%`;
                boardDiv.appendChild(vLine);
            }

            cell.addEventListener('click', () => handleCellClick(r, c));
            boardDiv.appendChild(cell);
        }
    }
    if (selectedCell) {
        highlightSelected(selectedCell.row, selectedCell.col);
        if (currentBoard[selectedCell.row][selectedCell.col] !== 0) {
            highlightSameNumbers(currentBoard[selectedCell.row][selectedCell.col]);
        }
    }
}

function highlightSameNumbers(number) {
    if (number === 0) return; 
    document.querySelectorAll('.sudoku-cell').forEach(cell => {
        if (parseInt(cell.textContent) === number) {
            cell.classList.add('highlight-same-number');
        }
    });
}

function highlightSelected(row, col) {
    document.querySelectorAll('.sudoku-cell').forEach(c => c.classList.remove('selected-cell', 'highlight-rcb'));

    const cell = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
    if (cell) cell.classList.add('selected-cell');

    for (let i = 0; i < GRID_SIZE; i++) {
        document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${i}"]`)?.classList.add('highlight-rcb');
        document.querySelector(`.sudoku-cell[data-row="${i}"][data-col="${col}"]`)?.classList.add('highlight-rcb');
    }
    const boxStartRow = row - (row % BOX_SIZE);
    const boxStartCol = col - (col % BOX_SIZE);
    for (let r_offset = 0; r_offset < BOX_SIZE; r_offset++) {
        for (let c_offset = 0; c_offset < BOX_SIZE; c_offset++) {
            document.querySelector(`.sudoku-cell[data-row="${boxStartRow + r_offset}"][data-col="${boxStartCol + c_offset}"]`)?.classList.add('highlight-rcb');
        }
    }
    if (cell) cell.classList.add('selected-cell'); 
}


// --- Obsługa Interakcji Użytkownika ---
function handleCellClick(row, col) {
    document.querySelectorAll('.sudoku-cell.highlight-same-number').forEach(cell => {
        cell.classList.remove('highlight-same-number');
    });

    if (initialBoard[row][col] !== 0 ||
        (currentBoard[row][col] !== 0 && currentBoard[row][col] === solutionBoard[row][col] && initialBoard[row][col] === 0)
       ) {
        selectedCell = { row, col }; 
        renderBoard(); e
        return;
    }

    selectedCell = { row, col };
    renderBoard();
    if (currentBoard[row][col] !== 0) {
        highlightSameNumbers(currentBoard[row][col]);
    }
}

function handleKeyPress(event) {
    if (!selectedCell) return;

    const num = parseInt(event.key);
    if (num >= 1 && num <= 9) {
        handleNumberInput(num);
    } else if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') {
        eraseNumberFromCell();
    }
}

function handleNumberInput(num) {
    if (checkAllInstancesOfNumberPlaced(num)) {
        if (gameMessageDiv) gameMessageDiv.textContent = `Wszystkie cyfry '${num}' są już na planszy.`;
        console.log(`Wszystkie cyfry '${num}' są już na planszy.`);
        if (digitsPadDiv) { 
            const digitButton = digitsPadDiv.querySelector(`button[data-number="${num}"]`);
            if (digitButton) {
                digitButton.classList.add('shake-blocked-animation');
                setTimeout(() => digitButton.classList.remove('shake-blocked-animation'), 300);
            }
        }
        return; // Nie pozwól wpisać
    }

    if (!selectedCell) return;

    const { row, col } = selectedCell;

    if (initialBoard[row][col] !== 0) return;

    if (currentBoard[row][col] !== 0 && currentBoard[row][col] === solutionBoard[row][col] && initialBoard[row][col] === 0) {
        if (gameMessageDiv) gameMessageDiv.textContent = "Ta komórka jest już poprawnie wypełniona.";
        const cellElement = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
        if(cellElement) {
            cellElement.classList.add('shake-blocked-animation');
            setTimeout(() => cellElement.classList.remove('shake-blocked-animation'), 300);
        }
        return;
    }

    if (currentBoard[row][col] === num && num !== solutionBoard[row][col]) {
        if (gameMessageDiv) gameMessageDiv.textContent = "Ta błędna liczba już tu jest. Wybierz inną lub wymaż.";
        const cellElement = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
        if(cellElement) {
            cellElement.classList.add('shake-blocked-animation');
            setTimeout(() => cellElement.classList.remove('shake-blocked-animation'), 300);
        }
        return;
    }

    const previousValue = currentBoard[row][col];
    currentBoard[row][col] = num;

    const cellElement = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);

    if (num !== solutionBoard[row][col]) {
        if (previousValue !== num || previousValue === 0) {
             mistakes++;
             updateMistakesDisplay();
        }
        if (cellElement) {
            cellElement.classList.add('incorrect-animation');
            setTimeout(() => cellElement.classList.remove('incorrect-animation'), 500);
        }
    } else {
        if (cellElement) cellElement.classList.remove('incorrect-cell');
    }

    renderBoard();
    highlightSameNumbers(num);
    updateNumberPadAvailability(); 
    checkWinCondition();
}

function eraseNumberFromCell() {
    if (!selectedCell) return;
    const { row, col } = selectedCell;

    if (initialBoard[row][col] !== 0) return;

    if (currentBoard[row][col] !== 0 && currentBoard[row][col] === solutionBoard[row][col] && initialBoard[row][col] === 0) {
        if (gameMessageDiv) gameMessageDiv.textContent = "Nie można wymazać poprawnie wypełnionej komórki.";
        const cellElement = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
        if(cellElement) {
            cellElement.classList.add('shake-blocked-animation');
            setTimeout(() => cellElement.classList.remove('shake-blocked-animation'), 300);
        }
        return;
    }

    const erasedNumber = currentBoard[selectedCell.row][selectedCell.col]; 
    currentBoard[selectedCell.row][selectedCell.col] = 0;
    renderBoard();
    document.querySelectorAll('.sudoku-cell.highlight-same-number').forEach(cell => {
        cell.classList.remove('highlight-same-number');
    });

    if (erasedNumber !== 0) {
        updateNumberPadAvailability();
    }
}

function checkAllInstancesOfNumberPlaced(number) {
    let count = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (currentBoard[r][c] === number) {
                count++;
            }
        }
    }
    return count === GRID_SIZE;
}

// --- Funkcje Pomocnicze Gry ---
function updateMistakesDisplay() {
    if (mistakesSpan) { 
        mistakesSpan.textContent = mistakes;
    }
}

function startTimer() {
    stopTimer();
    secondsElapsed = 0;
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        secondsElapsed++;
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function resetTimer() {
    stopTimer();
    secondsElapsed = 0;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    if (!timerSpan) return; 
    const minutes = Math.floor(secondsElapsed / 60);
    const seconds = secondsElapsed % 60;
    timerSpan.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function checkWinCondition() {
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (currentBoard[r][c] === 0 || currentBoard[r][c] !== solutionBoard[r][c]) {
                return false; 
            }
        }
    }
    // Wygrana!
    stopTimer();
    const messageDiv = document.getElementById('game-message');
    if(messageDiv) messageDiv.textContent = `Gratulacje! Rozwiązałeś Sudoku w ${secondsElapsed}s z ${mistakes} błędami.`;
    console.log("Sudoku rozwiązane!");
    selectedCell = null; 
    renderBoard();
    return true;
}

function validateUserSolution() {
    let allCorrect = true;
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (currentBoard[r][c] !== 0 && currentBoard[r][c] !== solutionBoard[r][c]) {
                allCorrect = false;
                const cellElem = document.querySelector(`.sudoku-cell[data-row="${r}"][data-col="${c}"]`);
                cellElem?.classList.add('permanently-incorrect');
            } else if (currentBoard[r][c] !== 0 && currentBoard[r][c] === solutionBoard[r][c]) {
                 const cellElem = document.querySelector(`.sudoku-cell[data-row="${r}"][data-col="${c}"]`);
                 cellElem?.classList.remove('permanently-incorrect'); 
            }
        }
    }
    const messageDiv = document.getElementById('game-message');

    if (allCorrect) {
        if(messageDiv) messageDiv.textContent = "Wszystkie dotychczasowe wpisy są poprawne!";
        if(checkWinCondition()) return; 
    } else {
        if(messageDiv) messageDiv.textContent = "Znaleziono błędy. Popraw je.";
        mistakes++; 
        updateMistakesDisplay();
    }
    renderBoard(); 
}

function getHint() {
    if (hintsUsed >= 3) {
        const messageDiv = document.getElementById('game-message');
        messageDiv.innerHTML = "Przekroczono limit podpowiedzi (3).";
        return;
    }
    hintsUsed++;
    document.getElementById('hint-btn').innerHTML = `Podpowiedź (${3-hintsUsed})`;
    const emptyUserCells = [];
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (currentBoard[r][c] === 0) { 
                emptyUserCells.push({ row: r, col: c });
            }
        }
    }

    if (emptyUserCells.length === 0) {
        const messageDiv = document.getElementById('game-message');
        if(messageDiv) messageDiv.textContent = "Brak pustych komórek do podpowiedzi.";
        return;
    }

    const randomHintCell = emptyUserCells[Math.floor(Math.random() * emptyUserCells.length)];
    const { row, col } = randomHintCell;

    currentBoard[row][col] = solutionBoard[row][col];
    
    const cellElement = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
    if (cellElement) {
        cellElement.classList.add('hint-cell'); 
    }
    renderBoard();
    checkWinCondition();
}

function showSolution() {
    currentBoard = JSON.parse(JSON.stringify(solutionBoard));
    initialBoard = JSON.parse(JSON.stringify(solutionBoard));
    stopTimer();
    selectedCell = null;
    renderBoard();
    updateNumberPadAvailability(); 
    if (gameMessageDiv) gameMessageDiv.textContent = "Rozwiązanie Sudoku zostało pokazane.";
}

function resetCurrentBoard() {
    currentBoard = JSON.parse(JSON.stringify(initialBoard));
    
    mistakes = 0;
    updateMistakesDisplay();
    selectedCell = null;
    resetTimer();
    startTimer();
    renderBoard();
    updateNumberPadAvailability(); 
    if (gameMessageDiv) gameMessageDiv.textContent = "Plansza zresetowana. Możesz zacząć od nowa.";
}