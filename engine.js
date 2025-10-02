class Game {
  constructor(n, player1, player2) {
    if (!Number.isInteger(n) || n <= 2) throw new Error("N must be integer > 2");
    
    this.n = n;                                      // Размер доски
    this.board = Array.from({ length: n }, () => Array(n).fill('.'));  // Игровая доска
    this.players = [player1, player2];               // Массив игроков
    this.next = 0;                                   // Индекс следующего игрока (0 или 1)
    this.finished = false;                           // Флаг завершения игры
    this.winner = null;                              // Победитель ('W', 'B' или 'Draw')
  }

  //Создает копию текущей доски
  cloneBoard() {
    return this.board.map(row => row.slice());
  }

  //Проверяет, находится ли точка в пределах доски
  isInside(x, y) {
    return x >= 0 && y >= 0 && x < this.n && y < this.n;
  }

  //Выполняет ход на указанные координаты
  makeMove(x, y) {
    // Проверка возможности хода
    if (this.finished) return { ok: false, error: "Game already finished" };
    if (!this.isInside(x, y)) return { ok: false, error: "Out of board" };
    if (this.board[y][x] !== '.') return { ok: false, error: "Cell occupied" };

    // Получение текущего игрока и его цвета
    const player = this.players[this.next];
    const color = player.color;
    
    // Установка фишки на доску
    this.board[y][x] = color;

    // Проверка победы после хода
    if (this.checkWinForColor(color)) {
      this.finished = true;
      this.winner = color;
      return { ok: true, finished: true, winner: color };
    }

    // Проверка ничьи
    if (this.isFull()) {
      this.finished = true;
      this.winner = 'Draw';
      return { ok: true, finished: true, winner: 'Draw' };
    }

    // Переход хода к следующему игроку
    this.next = 1 - this.next;
    return { ok: true, finished: false };
  }

  //Проверяет, полностью ли заполнена доска
  isFull() {
    return this.board.every(row => row.every(c => c !== '.'));
  }

  /**
   * Проверяет, есть ли выигрышная комбинация для указанного цвета
   * Алгоритм ищет квадраты и ромбы из 4 фишек
   */
  checkWinForColor(color) {
    const n = this.n;
    const pts = [];  // Массив координат всех фишек указанного цвета
    
    // Сбор всех фишек нужного цвета
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (this.board[y][x] === color) pts.push([x, y]);
      }
    }
    
    // Set для быстрого поиска координат
    const set = new Set(pts.map(p => p[0] + ',' + p[1]));

    // Проверка всех пар точек для поиска квадратов
    for (let i = 0; i < pts.length; i++) {
      for (let j = 0; j < pts.length; j++) {
        if (i === j) continue;  // Пропускаем одинаковые точки
        
        const [x1, y1] = pts[i];
        const [x2, y2] = pts[j];
        const dx = x2 - x1;
        const dy = y2 - y1;

        // Поворот вектора на +90 градусов для поиска третьей и четвертой точек
        let cx = x1 - dy;
        let cy = y1 + dx;
        let dx2 = x2 - dy;
        let dy2 = y2 + dx;
        
        // Проверка существования квадрата при повороте +90
        if (this.isInside(cx, cy) && this.isInside(dx2, dy2)) {
          if (set.has(cx + ',' + cy) && set.has(dx2 + ',' + dy2)) 
            return true;
        }

        // Поворот вектора на -90 градусов
        cx = x1 + dy;
        cy = y1 - dx;
        dx2 = x2 + dy;
        dy2 = y2 - dx;
        
        // Проверка существования квадрата при повороте -90
        if (this.isInside(cx, cy) && this.isInside(dx2, dy2)) {
          if (set.has(cx + ',' + cy) && set.has(dx2 + ',' + dy2)) 
            return true;
        }
      }
    }
    return false;  // Выигрышная комбинация не найдена
  }

  //Находит оптимальный ход для компьютера
  findComputerMove(color) {
    if (this.finished) return null;
    const opponent = (color === 'W') ? 'B' : 'W';  // Цвет противника

    // Поиск выигрышного хода
    for (let y = 0; y < this.n; y++) {
      for (let x = 0; x < this.n; x++) {
        if (this.board[y][x] !== '.') continue;
        
        // Временная установка фишки и проверка победы
        this.board[y][x] = color;
        if (this.checkWinForColor(color)) {
          this.board[y][x] = '.';  // Откат временного хода
          return [x, y];
        }
        this.board[y][x] = '.';  // Откат временного хода
      }
    }

    // Блокировка выигрышного хода противника
    for (let y = 0; y < this.n; y++) {
      for (let x = 0; x < this.n; x++) {
        if (this.board[y][x] !== '.') continue;
        
        // Проверка, может ли противник выиграть на этой клетке
        this.board[y][x] = opponent;
        if (this.checkWinForColor(opponent)) {
          this.board[y][x] = '.';  // Откат временного хода
          return [x, y];  // Блокируем эту клетку
        }
        this.board[y][x] = '.';  // Откат временного хода
      }
    }

    // Ход в ближайшую к центру свободную клетку
    const cx = (this.n - 1) / 2;  // Центр по X
    const cy = (this.n - 1) / 2;  // Центр по Y
    let best = null;
    let bestDist = Infinity;
    
    for (let y = 0; y < this.n; y++) {
      for (let x = 0; x < this.n; x++) {
        if (this.board[y][x] !== '.') continue;
        
        // Вычисление расстояния до центра
        const dist = Math.hypot(x - cx, y - cy);
        if (dist < bestDist) {
          bestDist = dist;
          best = [x, y];
        }
      }
    }
    return best;
  }

  //Сериализует состояние игры для передачи клиенту
  serialize() {
    return {
      n: this.n,
      board: this.cloneBoard(),
      next: this.next,
      players: this.players,
      finished: this.finished,
      winner: this.winner
    };
  }
}

// Экспорт класса Game для использования в других модулях
module.exports = { Game };