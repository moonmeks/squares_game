const readline = require('readline');
const { Game } = require('./engine');

// Настройка интерфейса для чтения пользовательского ввода
const rl = readline.createInterface({ 
    input: process.stdin, 
    output: process.stdout, 
    prompt: '> '
});

//Выводит справку по доступным командам
function help() {
    console.log("Commands:");
    console.log("GAME N, TYPE1 C1, TYPE2 C2    - start new game");
    console.log("MOVE X, Y                     - make move");
    console.log("HELP                          - this help");
    console.log("EXIT                          - exit program");
    console.log("Examples:");
    console.log("GAME 6, user W, comp B");
    console.log("MOVE 0, 0");
}

let game = null;  // Текущая игровая сессия

//Парсит команду создания новой игры

function parseGameCommand(line) {
    // Регулярное выражение для разбора команды GAME
    const m = line.trim().match(/^GAME\s+(\d+)\s*,\s*(user|comp)\s+([WB])\s*,\s*(user|comp)\s+([WB])$/i);
    if (!m) return null;
    
    const N = parseInt(m[1],10);  // Размер доски
    const p1 = { 
        type: m[2].toLowerCase(),  
        color: m[3].toUpperCase()   
    };
    const p2 = { 
        type: m[4].toLowerCase(),   
        color: m[5].toUpperCase()  
    };
    return { N, p1, p2 };
}

//Парсит команду выполнения хода
function parseMoveCommand(line) {
    // Регулярное выражение для разбора команды MOVE
    const m = line.trim().match(/^MOVE\s+(-?\d+)\s*,\s*(-?\d+)$/i);
    if (!m) return null;
    
    return { 
        x: parseInt(m[1],10),
        y: parseInt(m[2],10)
    };
}

//Выводит игровую доску в консоль в читаемом формате
function printBoard(b) {
    const n = b.length;  // Размер поля
    
    // Вывод заголовка с координатами X
    console.log('   ' + Array.from({length:n}, (_,i)=>i.toString().padStart(2,' ')).join(' '));
    
    // Вывод строк поля с координатами Y
    for (let y=0; y<n; y++){
        // Преобразование массива клеток в строку
        let row = b[y].map(c => (c==='.'?'.':c)).join('  ');
        console.log(y.toString().padStart(2,' ') + ' ' + row);
    }
}

//Выполняет ходы компьютера
function doComputerMoveIfNeeded() {
    while (game && !game.finished && game.players[game.next].type === 'comp') {
        const color = game.players[game.next].color;
        
        // Поиск оптимального хода для компьютера
        const mv = game.findComputerMove(color);
        if (!mv) {
            console.log("No move found for computer");
            break;
        }
        
        // Выполнение хода
        const [x,y] = mv;
        const res = game.makeMove(x,y);
        
        // Вывод информации о ходе
        console.log(`${color} (${x}, ${y})`);
        printBoard(game.board);
        
        // Проверка завершения игры после хода
        if (res.finished) {
            if (res.winner === 'Draw') {
                console.log("Game finished. Draw");
            } else {
                console.log(`Game finished. ${res.winner} wins!`);
            }
            break;
        }
        // Цикл продолжается, если следующий игрок тоже компьютер
    }
}

// Начало работы программы
console.log("Type HELP for commands");
rl.prompt();  // Вывод приглашения для ввода

//Обработчик ввода пользователя
rl.on('line', (line) => {
    const input = line.trim();
    
    // Пропуск пустых строк
    if (!input) { 
        rl.prompt(); 
        return; 
    }

    // Извлечение первой команды для определения типа запроса
    const u = input.split(/\s+/)[0].toUpperCase();
    
    // Обработка команды HELP
    if (u === 'HELP') {
        help();
        rl.prompt();
        return;
    }
    
    // Обработка команды EXIT
    if (u === 'EXIT') {
        console.log("End");
        process.exit(0);
    }
    
    // Обработка команды GAME
    if (u === 'GAME') {
        const parsed = parseGameCommand(input);
        if (!parsed) {
            console.log("Incorrect command");
            rl.prompt();
            return;
        }
        
        // Проверка что игроки имеют разные цвета
        if (parsed.p1.color === parsed.p2.color) {
            console.log("Incorrect command: players must have different colors");
            rl.prompt();
            return;
        }
        
        try {
            // Создание новой игры
            game = new Game(parsed.N, parsed.p1, parsed.p2);
            console.log("New game started");
            printBoard(game.board);
            
            // Если первый игрок - компьютер, выполняем его ход(ы)
            doComputerMoveIfNeeded();
        } catch (e) {
            console.log("Error: " + e.message);
        }
        rl.prompt();
        return;
    }
    
    // Обработка команды MOVE
    if (u === 'MOVE') {
        // Проверка что игра создана
        if (!game) { 
            console.log("Incorrect command"); 
            rl.prompt(); 
            return; 
        }
        
        const parsed = parseMoveCommand(input);
        if (!parsed) { 
            console.log("Incorrect command"); 
            rl.prompt(); 
            return; 
        }
        
        // Проверка что сейчас ход пользователя
        const nextPlayer = game.players[game.next];
        if (nextPlayer.type !== 'user') {
            console.log("Incorrect command");
            rl.prompt();
            return;
        }
        
        // Выполнение хода пользователя
        const res = game.makeMove(parsed.x, parsed.y);
        if (!res.ok) {
            console.log("Incorrect command");
            rl.prompt();
            return;
        }
        
        // Отображение обновленной доски
        printBoard(game.board);
        
        // Проверка завершения игры
        if (res.finished) {
            if (res.winner === 'Draw') {
                console.log("Game finished. Draw");
            } else {
                console.log(`Game finished. ${res.winner} wins!`);
            }
            rl.prompt();
            return;
        }
        
        // Выполнение ходов компьютера, если это его очередь
        doComputerMoveIfNeeded();
        rl.prompt();
        return;
    }

    // Обработка неизвестной команды
    console.log("Incorrect command");
    rl.prompt();
}).on('close', () => {
    // Завершение программы при закрытии интерфейса
    console.log('End');
    process.exit(0);
});