const DIFFICULTY = {
    easy: { rows: 9, cols: 9, mines: 10 },
    medium: { rows: 16, cols: 16, mines: 40 },
    hard: { rows: 16, cols: 30, mines: 99 },
    custom: { rows: 0, cols: 0, mines: 0 } // Użytkownik ustawia własne wartości
};
// Konfiguracja planszy     DO ZROBIENIA DIFFICULTY I KOLORY!!!! 
let board = [];
let rows = 9; // Liczba wierszy
let cols = 9; // Liczba kolumn  
let mines = 10; // Liczba min

// Zmienne do zarządzania grą
let gameOver = false;
let flags = 0;  
let timer = 0;
let timerInterval = null;

window.onload = function() {
    // Wygenerowanie planszy
    startGame(); // Rozpocznij grę

    // Obsługa kliknięć
    document.getElementById('board').addEventListener('contextmenu', function (e) {
        e.preventDefault(); // Blokuj domyślne menu kontekstowe
    });

    document.getElementById('board').addEventListener('mousedown', function (e) {
        const cell = e.target;
        if (!cell.matches('div')) return; // Ignoruj kliknięcia spoza komórek

        const row = Number(cell.dataset.row);
        const col = Number(cell.dataset.col);

        if (e.button === 0) { // Lewy przycisk myszy
            console.log('Lewy klik na', row, col);

            if (board[row][col] === -1) {
                cell.classList.add('revealed');
                gameOverScreen(); // Zakończ grę
            }

            else if (board[row][col] === 0) {
                // Odkryj pole i sąsiednie komórki
                cell.classList.add('revealed');
                cell.innerText = board[row][col]; // Dodać później liczbę min wokół
                cell.style.color = colorNumber(board[row][col]); // Kolorowanie liczb
                clearAdjacentCells(row, col); // Odkryj sąsiednie komórki
            } 

            else if (cell.classList.contains('revealed')) {
                if (board[row][col] > 0 && board[row][col] == countAdjecentFlags(row, col)) { // Jeśli odkryta liczba jest równa liczbie flag wokół
                    clearAdjacentCells(row, col); // Odkryj sąsiednie komórki
                }
                else return;
            } // Nie odkrywaj odkrytych komórek

            else if (cell.classList.contains('flagged')) return; // Nie odkrywaj oznaczonych komórek

            else {
                // Odkryj pole
                cell.classList.add('revealed');
                cell.style.color = colorNumber(board[row][col]);
                cell.innerText = board[row][col]; // Dodać później liczbę min wokół
            }

        } 
        else if (e.button === 2) { // Prawy przycisk myszy
            if (cell.classList.contains('revealed')) return; // Nie oznaczaj odkrytych komórek
            if (cell.classList.contains('flagged')) {
                cell.classList.remove('flagged');
                cell.innerText = ''; // Usuń flagę
                flags--;
            }
            else {
                cell.classList.add('flagged');
                cell.innerText = '🚩'; // Dodaj flagę
                flags++;
            }
            console.log('Prawy klik na', row, col);
        }
    });
    
};



// Funkcje pomocnicze
function showAllMines() { // Odkryj wszystkie miny na planszy
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (board[row][col] === -1) {
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                cell.classList.add('revealed');
                cell.innerText = '💣'; 
                cell.style.backgroundColor = 'rgb(100, 100, 100)'; 
                cell.style.borderColor = 'rgb(100, 100, 100)';
            }
        }
    }
}

function colorNumber(num) { // Kolorowanie liczb w zależności od wartości
    switch (num) {
        case 1: return 'blue';
        case 2: return 'green';
        case 3: return 'red';
        case 4: return 'purple';
        case 5: return 'brown';
        case 6: return 'cyan';
        case 7: return 'gray';
        case 8: return 'black';
        default: return 'white'; // Domyślny kolor dla innych wartości
    }
}

function consoleLogBoard() { // Podgląd planszy w konsoli
    console.log('Plansza: ');
    for (let row = 0; row < rows; row++) {
        let rowString = '';
        for (let col = 0; col < cols; col++) {
            rowString += board[row][col] + ' ';
        }
        console.log(rowString);
    }
}

function createBoard() { // Tworzenie planszy (na początek pusta plansza)
    for (let row = 0; row < rows; row++) {
        board[row] = [];
        for (let col = 0; col < cols; col++) {
            board[row][col] = 0; // Wszystkie komórki jako puste
        }
    }
    console.log('Utworzono plansze');
}

function placeMines() { // Rozmieszczanie min na planszy
    let mineCount = 0;
    while (mineCount < mines) {
        let row = Math.floor(Math.random() * rows); // Losowy wiersz
        let col = Math.floor(Math.random() * cols); // Losowa kolumna
        if (board[row][col] !== -1) { // Sprawdź, czy nie ma już miny w tym miejscu
            board[row][col] = -1;
            mineCount++;
        }
    }
    console.log('Rozlozono miny');
    consoleLogBoard();
}

function countAdjacentMines(row, col) { // Zliczanie min wokół danej komórki
    let count = 0;
    for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
            if ((r >= 0 && r < rows) && (c >= 0 && c < cols) && board[r][c] === -1) { // Sprawdź granice planszy oraz miny
                count++;
            }
        }
    }
    return count;
}

function countAdjecentFlags(row, col) { // Zliczanie flag wokół danej komórki
    let count = 0;
    for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
            if (r >= 0 && r < rows && c >= 0 && c < cols) {
                const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                if (cell && cell.classList.contains('flagged')) {
                    count++;
                }
            }
        }
    }
    return count;
}

function cellNums(){ // Plansza z liczbami min wokół
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) { 
            if (board[row][col] != -1) { // Policz tylko dla komórek bez miny
                board[row][col] = countAdjacentMines(row, col); // Komórki z liczbą min wokół
            }
        }
    }
    console.log('Zliczono miny wokół komórek');
    consoleLogBoard();
}

function renderBoard() {
    const boardElement = document.getElementById('board');
    boardElement.style.gridTemplateColumns = `repeat(${cols}, 30px)`;
    boardElement.innerHTML = ''; // Clear the board before rendering
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cell = document.createElement('div');
            cell.className = row.toString() + '-' + col.toString();
            cell.dataset.row = row;
            cell.dataset.col = col;
            boardElement.appendChild(cell);
        }
    }
    console.log('Render planszy');
}

function startTimer() {

    console.log('Start timera');
}

function clearAdjacentCells(row, col) { // Odkrywanie sąsiednich komórek
    for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
            if ((r >= 0 && r < rows) && (c >= 0 && c < cols)) { // Sprawdź granice planszy
                const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                if (!cell.classList.contains('revealed') && !cell.classList.contains('flagged')) { // Sprawdź, czy komórka nie jest już odkryta lub oznaczona
                    cell.classList.add('revealed');
                    cell.innerText = board[r][c]; // Dodać później liczbę min wokół
                    if (board[r][c] === 0) { // Jeśli pole jest puste, odkryj sąsiednie komórki
                        clearAdjacentCells(r, c); // Rekurencyjnie odkryj sąsiednie komórki
                    } else {
                        cell.style.color = colorNumber(board[r][c]); // Kolorowanie liczb
                    }
                    if (board[r][c] === -1) { // Jeśli odkryto minę, zakończ grę
                        gameOver = true;
                        gameOverScreen(); // Zakończ grę
                    }
                }
            }
        }
    }
}

function gameOverScreen() { // Zakończenie gry
    clearInterval(timerInterval); // Zatrzymaj timer
    showAllMines(); // Odkryj wszystkie miny
    alert('Koniec gry!');
    console.log('Koniec gry!');
    gameOver = true;
}

function win() {
    clearInterval(timerInterval); // Zatrzymaj timer
    alert('Gratulacje! Wygrałeś!');
    console.log('Gratulacje! Wygrałeś!');
    gameOver = true;
}

function resetGame() { // Resetowanie gry
    clearInterval(timerInterval); // Zatrzymaj timer
    board = []; // Reset planszy
    gameOver = false; // Reset stanu gry
    flags = 0; // Reset liczby flag
    timer = 0; // Reset timera
    timerInterval = null; // Reset timera
    document.getElementById('board').innerHTML = ''; // Wyczyść planszę
    document.getElementById('timer').innerText = '0'; // Wyczyść timer

}

function startGame() {
    createBoard();
    placeMines();
    cellNums(); 
    renderBoard();
    startTimer();
}