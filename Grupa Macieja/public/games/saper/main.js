// Konfiguracja planszy     DO ZROBIENIA DIFFICULTY!!!!
let board = [];
let rows = 9;
let cols = 9;
let mines = 10;

// Zmienne do zarządzania grą
let gameOver = false;
let flags = 0;  
let timer = 0;
let timerInterval = null;

window.onload = function() {
    // Wygenerowanie planszy
    createBoard();
    placeMines();
    cellNums(); 
    renderBoard();
    startTimer();

    // Obsługa kliknięć   DO ZROBIENIA!!!!
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
            if (board[row][col] === 1) {
                // Odkryj minę
                console.log('Koniec gry!');
                gameOver = true;
            } else {
                // Odkryj pole
                cell.classList.add('revealed');
                cell.innerText = board[row][col]; // Dodać później liczbę min wokół
            }
        } 
        else if (e.button === 2) { // Prawy przycisk myszy
            console.log('Prawy klik na', row, col);
        }
    });
    
};



// Funkcje pomocnicze
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


