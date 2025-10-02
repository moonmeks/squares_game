const express = require("express");
const bodyParser = require("body-parser");
const { Game } = require("./engine");

const app = express();

// Настройка middleware
app.use(bodyParser.json());          // Парсинг JSON в теле запросов
app.use(express.static("public"));   // Обслуживание статических файлов из папки public

let currentGame = null;  // Текущая активная игровая сессия

//Эндпоинт для создания новой игры
app.post("/newgame", async (req, res) => {
  const { n, players } = req.body; 

  try {
    currentGame = new Game(
      n,
      { type: players[0].type, color: "W" },
      { type: players[1].type, color: "B" }
    );

    // Если первый игрок - компьютер, выполняем его ход сразу
    await makeComputerMoves();

    // Возвращаем текущее состояние игры клиенту
    res.json(currentGame.serialize());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

//Эндпоинт для выполнения хода пользователя
app.post("/move", async (req, res) => {
  // Проверка наличия активной игры
  if (!currentGame) 
    return res.status(400).json({ error: "Game not started" });
  
  // Проверка что игра еще не завершена
  if (currentGame.finished) 
    return res.status(400).json({ error: "Game finished" });

  // Проверка что текущий игрок - пользователь 
  const player = currentGame.players[currentGame.next];
  if (player.type !== "user") 
    return res.status(400).json({ error: "It's not user's turn" });

  // Извлечение координат из тела запроса
  const { x, y } = req.body;
  
  // Выполнение хода пользователя
  const result = currentGame.makeMove(x, y);
  if (!result.ok) 
    return res.status(400).json({ error: result.error });

  // После хода пользователя выполняем ходы компьютера
  await makeComputerMoves();
  
  // Возвращаем обновленное состояние игры
  res.json(currentGame.serialize());
});

//Функция для выполнения ходов компьютера
async function makeComputerMoves() {
  while (!currentGame.finished && currentGame.players[currentGame.next].type === "comp") {
    const color = currentGame.players[currentGame.next].color;
    
    // Поиск оптимального хода для компьютера
    const move = currentGame.findComputerMove(color);
    if (!move) break;
    
    // Выполнение хода компьютера
    currentGame.makeMove(move[0], move[1]);
  }
}

//Эндпоинт для получения текущего состояния игры
app.get("/state", (req, res) => {
    if (!currentGame) {
        // Если игра не создана, возвращаем ошибку
        return res.status(404).json({ error: "No active game" });
    }
    // Возвращаем текущее состояние игры
    res.json(currentGame.serialize());
});

//Запуск сервера
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});