let currentGame = null;

// Получить текущее состояние игры с сервера
async function fetchGameState() {
    try {
        const resp = await fetch('/state');
        if (resp.ok) {
            const data = await resp.json();
            currentGame = data;
            drawBoard(data.board);
            updateInfo();
        }
    } catch (error) {
        console.error('Error fetching game state:', error);
    }
}

// Создаём пустую доску
function createEmptyBoard(n) {
    return Array.from({ length: n }, () => Array(n).fill('.'));
}

// Рисуем доску
function drawBoard(board) {
    const boardDiv = document.getElementById('board');
    boardDiv.innerHTML = '';

    if (!board) return;

    board.forEach((row, y) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'row';

        row.forEach((cell, x) => {
            const div = document.createElement('div');
            div.className = 'cell';

            if (cell === '.') {
                div.classList.add('empty');
                div.onclick = () => makeMove(x, y);
            } else {
                const piece = document.createElement('div');
                piece.className = 'piece ' + (cell === 'W' ? 'white' : 'black');
                div.appendChild(piece);
            }

            rowDiv.appendChild(div);
        });

        boardDiv.appendChild(rowDiv);
    });
}

// Обновляем информацию о ходе и победителе
function updateInfo() {
    const infoDiv = document.getElementById('info');

    if (!currentGame) {
        infoDiv.innerText = 'No active game';
        return;
    }

    if (currentGame.finished) {
        if (currentGame.winner === 'Draw') {
            infoDiv.innerText = 'Game finished. Draw';
        } else {
            infoDiv.innerText = `Game finished. ${currentGame.winner} wins!`;
        }
    } else {
        const currentPlayer = currentGame.players[currentGame.next];
        infoDiv.innerText = `Current turn: ${currentPlayer.color} (${currentPlayer.type})`;
    }
}

// Запуск новой игры
async function newGame() {
    const n = parseInt(document.getElementById('n').value);
    const p1Type = document.getElementById('p1').value;
    const p2Type = document.getElementById('p2').value;

    const resp = await fetch('/newgame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            n,
            players: [
                { type: p1Type, color: 'W' },
                { type: p2Type, color: 'B' },
            ],
        }),
    });

    const data = await resp.json();
    currentGame = data;
    drawBoard(data.board);
    updateInfo();
}

// Сделать ход пользователя
async function makeMove(x, y) {
    if (!currentGame || currentGame.finished) 
      return;

    const nextPlayer = currentGame.players[currentGame.next];
    if (nextPlayer.type !== 'user') {
        alert("It's computer's turn!");
        return;
    }

    const resp = await fetch('/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y }),
    });

    if (resp.ok) {
        const data = await resp.json();
        currentGame = data;
        drawBoard(data.board);
        updateInfo();
        
        // Если следующий ход компьютера, ждем немного и обновляем
        if (!data.finished && data.players[data.next].type === 'comp') {
            setTimeout(fetchGameState, 1000);
        }
    } else {
        alert('Invalid move!');
    }
}

// Обновляем состояние каждые 2 секунды
setInterval(fetchGameState, 2000);

// При загрузке страницы создаём пустую доску по умолчанию
const defaultN = parseInt(document.getElementById('n').value) || 6;
drawBoard(createEmptyBoard(defaultN));

// Привязка кнопки
document.getElementById('newgame').onclick = newGame;
