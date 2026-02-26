// Глобальні змінні
let currentScreen = 'mainMenu';
let gameState = {
    board: [],
    currentPlayer: 'white',
    selectedPiece: null,
    selectedSquare: null,
    gameMode: 'classic',
    lobbyType: '1v1',
    players: [],
    capturedPieces: { white: [], black: [] },
    moveHistory: [],
    activeBuffs: [],
    timer: { white: 600, black: 600 },
    timerInterval: null
};

// Юнікоди шахових фігур
const PIECES = {
    white: {
        king: '♔',
        queen: '♕',
        rook: '♖',
        bishop: '♗',
        knight: '♘',
        pawn: '♙'
    },
    black: {
        king: '♚',
        queen: '♛',
        rook: '♜',
        bishop: '♝',
        knight: '♞',
        pawn: '♟'
    }
};

// Бафи для режиму Moded
const BUFFS = {
    shield: {
        name: 'Щит',
        description: 'Захищає фігуру від одного захоплення',
        duration: 3,
        icon: '🛡️'
    },
    power: {
        name: 'Сила',
        description: 'Фігура може рухатися на 2 клітинки далі',
        duration: 2,
        icon: '💪'
    },
    speed: {
        name: 'Швидкість',
        description: 'Додатковий хід цього гравця',
        duration: 1,
        icon: '⚡'
    },
    teleport: {
        name: 'Телепорт',
        description: 'Фігура може телепортуватися на будь-яку клітинку',
        duration: 1,
        icon: '🌀'
    }
};

// Ініціалізація гри
function initGame() {
    setupEventListeners();
    loadSettings();
    initializeBoard();
}

// Налаштування слухачів подій
function setupEventListeners() {
    // Клавіатурні скорочення
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (currentScreen !== 'mainMenu') {
                showScreen('mainMenu');
            }
        }
    });
}

// Завантаження налаштувань
function loadSettings() {
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
        document.getElementById('playerName').value = savedName;
    }
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.getElementById('theme').value = savedTheme;
        applyTheme(savedTheme);
    }
}

// Збереження налаштувань
function saveSettings() {
    const playerName = document.getElementById('playerName').value;
    const theme = document.getElementById('theme').value;
    const soundEffects = document.getElementById('soundEffects').checked;
    
    localStorage.setItem('playerName', playerName);
    localStorage.setItem('theme', theme);
    localStorage.setItem('soundEffects', soundEffects);
    
    applyTheme(theme);
}

// Застосування теми
function applyTheme(theme) {
    document.body.className = theme === 'dark' ? 'dark-theme' : '';
}

// Переключення екранів
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;
    
    if (screenId === 'gameScreen') {
        startTimer();
    } else {
        stopTimer();
    }
}

// Створення лобі
function createLobby(type) {
    gameState.lobbyType = type;
    const playerName = document.getElementById('playerName').value || 'Гравець 1';
    
    // Симуляція створення лобі
    const lobbyCode = generateLobbyCode();
    const lobby = {
        id: lobbyCode,
        type: type,
        host: playerName,
        players: [playerName],
        maxPlayers: type === '1v1' ? 2 : type === '2v2' ? 4 : 8,
        status: 'waiting'
    };
    
    // Зберегти лобі в localStorage для симуляції
    let lobbies = JSON.parse(localStorage.getItem('lobbies') || '[]');
    lobbies.push(lobby);
    localStorage.setItem('lobbies', JSON.stringify(lobbies));
    
    showLobbyScreen(lobby);
}

// Приєднання до лобі
function joinLobby() {
    const lobbyCode = prompt('Введіть код лобі:');
    if (!lobbyCode) return;
    
    const lobbies = JSON.parse(localStorage.getItem('lobbies') || '[]');
    const lobby = lobbies.find(l => l.id === lobbyCode);
    
    if (lobby) {
        const playerName = document.getElementById('playerName').value || 'Гравець 2';
        if (lobby.players.length < lobby.maxPlayers) {
            lobby.players.push(playerName);
            localStorage.setItem('lobbies', JSON.stringify(lobbies));
            showLobbyScreen(lobby);
        } else {
            alert('Лобі повне!');
        }
    } else {
        alert('Лобі не знайдено!');
    }
}

// Показати екран лобі
function showLobbyScreen(lobby) {
    // Створити тимчасовий екран лобі
    const lobbyScreen = document.createElement('div');
    lobbyScreen.className = 'screen active';
    lobbyScreen.innerHTML = `
        <div class="menu-container">
            <h2>Лобі ${lobby.id}</h2>
            <p>Тип: ${lobby.type}</p>
            <p>Гравці: ${lobby.players.length}/${lobby.maxPlayers}</p>
            <div class="players-list">
                ${lobby.players.map(p => `<div class="player-item">${p}</div>`).join('')}
            </div>
            <button class="btn btn-primary" onclick="startGameFromLobby('${lobby.id}')">
                Почати гру
            </button>
            <button class="btn btn-back" onclick="showScreen('lobbyMenu')">
                Назад
            </button>
        </div>
    `;
    
    document.getElementById('app').appendChild(lobbyScreen);
}

// Почати гру з лобі
function startGameFromLobby(lobbyId) {
    const lobbies = JSON.parse(localStorage.getItem('lobbies') || '[]');
    const lobby = lobbies.find(l => l.id === lobbyId);
    
    if (lobby) {
        gameState.players = lobby.players;
        gameState.lobbyType = lobby.type;
        showScreen('gameScreen');
        initializeBoard();
        renderBoard();
    }
}

// Генерація коду лобі
function generateLobbyCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Початок гри
function startGame(mode) {
    gameState.gameMode = mode;
    gameState.currentPlayer = 'white';
    gameState.moveHistory = [];
    gameState.capturedPieces = { white: [], black: [] };
    gameState.activeBuffs = [];
    
    showScreen('gameScreen');
    initializeBoard();
    renderBoard();
    
    if (mode === 'moded') {
        initializeBuffs();
    }
}

// Ініціалізація шахової дошки
function initializeBoard() {
    gameState.board = [
        ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
        ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
        ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']
    ];
}

// Відображення дошки
function renderBoard() {
    const boardElement = document.getElementById('chessBoard');
    boardElement.innerHTML = '';
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = `square ${(row + col) % 2 === 0 ? 'white' : 'black'}`;
            square.dataset.row = row;
            square.dataset.col = col;
            
            const piece = gameState.board[row][col];
            if (piece) {
                const pieceElement = document.createElement('span');
                pieceElement.className = 'piece';
                pieceElement.textContent = piece;
                square.appendChild(pieceElement);
            }
            
            square.addEventListener('click', () => handleSquareClick(row, col));
            boardElement.appendChild(square);
        }
    }
    
    updateGameInfo();
}

// Обробка кліку на клітинку
function handleSquareClick(row, col) {
    const piece = gameState.board[row][col];
    
    if (gameState.selectedPiece) {
        // Спроба зробити хід
        if (isValidMove(gameState.selectedSquare.row, gameState.selectedSquare.col, row, col)) {
            makeMove(gameState.selectedSquare.row, gameState.selectedSquare.col, row, col);
        }
        clearSelection();
    } else if (piece && isPieceOwnedByCurrentPlayer(piece)) {
        // Вибір фігури
        selectPiece(row, col);
    }
}

// Перевірка чи фігура належить поточному гравцю
function isPieceOwnedByCurrentPlayer(piece) {
    const whitePieces = ['♔', '♕', '♖', '♗', '♘', '♙'];
    const blackPieces = ['♚', '♛', '♜', '♝', '♞', '♟'];
    
    if (gameState.currentPlayer === 'white') {
        return whitePieces.includes(piece);
    } else {
        return blackPieces.includes(piece);
    }
}

// Вибір фігури
function selectPiece(row, col) {
    clearSelection();
    gameState.selectedPiece = gameState.board[row][col];
    gameState.selectedSquare = { row, col };
    
    const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    square.classList.add('selected');
    
    showPossibleMoves(row, col);
}

// Очищення вибору
function clearSelection() {
    gameState.selectedPiece = null;
    gameState.selectedSquare = null;
    
    document.querySelectorAll('.square').forEach(square => {
        square.classList.remove('selected', 'possible-move', 'possible-capture');
    });
}

// Показати можливі ходи
function showPossibleMoves(row, col) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (isValidMove(row, col, r, c)) {
                const square = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                if (gameState.board[r][c]) {
                    square.classList.add('possible-capture');
                } else {
                    square.classList.add('possible-move');
                }
            }
        }
    }
}

// Перевірка валідності ходу (спрощена версія)
function isValidMove(fromRow, fromCol, toRow, toCol) {
    const piece = gameState.board[fromRow][fromCol];
    const targetPiece = gameState.board[toRow][toCol];
    
    // Не можна ходити на свою фігуру
    if (targetPiece && isPieceOwnedByCurrentPlayer(targetPiece)) {
        return false;
    }
    
    // Базова логіка для кожного типу фігури
    switch (piece) {
        case '♙': // білий пішак
            return isValidPawnMove(fromRow, fromCol, toRow, toCol, 'white');
        case '♟': // чорний пішак
            return isValidPawnMove(fromRow, fromCol, toRow, toCol, 'black');
        case '♖': case '♜': // тура
            return isValidRookMove(fromRow, fromCol, toRow, toCol);
        case '♗': case '♝': // слон
            return isValidBishopMove(fromRow, fromCol, toRow, toCol);
        case '♘': case '♞': // кінь
            return isValidKnightMove(fromRow, fromCol, toRow, toCol);
        case '♕': case '♛': // ферзь
            return isValidQueenMove(fromRow, fromCol, toRow, toCol);
        case '♔': case '♚': // король
            return isValidKingMove(fromRow, fromCol, toRow, toCol);
        default:
            return false;
    }
}

// Валідні ходи для пішака
function isValidPawnMove(fromRow, fromCol, toRow, toCol, color) {
    const direction = color === 'white' ? -1 : 1;
    const startRow = color === 'white' ? 6 : 1;
    
    // Рух вперед на 1 клітинку
    if (fromCol === toCol && toRow === fromRow + direction && !gameState.board[toRow][toCol]) {
        return true;
    }
    
    // Рух вперед на 2 клітинки з початкової позиції
    if (fromCol === toCol && fromRow === startRow && toRow === fromRow + 2 * direction && 
        !gameState.board[toRow][toCol] && !gameState.board[fromRow + direction][fromCol]) {
        return true;
    }
    
    // Взяття по діагоналі
    if (Math.abs(fromCol - toCol) === 1 && toRow === fromRow + direction && gameState.board[toRow][toCol]) {
        return true;
    }
    
    return false;
}

// Валідні ходи для тури
function isValidRookMove(fromRow, fromCol, toRow, toCol) {
    if (fromRow !== toRow && fromCol !== toCol) return false;
    return isPathClear(fromRow, fromCol, toRow, toCol);
}

// Валідні ходи для слона
function isValidBishopMove(fromRow, fromCol, toRow, toCol) {
    if (Math.abs(fromRow - toRow) !== Math.abs(fromCol - toCol)) return false;
    return isPathClear(fromRow, fromCol, toRow, toCol);
}

// Валідні ходи для коня
function isValidKnightMove(fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(fromRow - toRow);
    const colDiff = Math.abs(fromCol - toCol);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
}

// Валідні ходи для ферзя
function isValidQueenMove(fromRow, fromCol, toRow, toCol) {
    return isValidRookMove(fromRow, fromCol, toRow, toCol) || 
           isValidBishopMove(fromRow, fromCol, toRow, toCol);
}

// Валідні ходи для короля
function isValidKingMove(fromRow, fromCol, toRow, toCol) {
    return Math.abs(fromRow - toRow) <= 1 && Math.abs(fromCol - toCol) <= 1;
}

// Перевірка чи шлях чистий
function isPathClear(fromRow, fromCol, toRow, toCol) {
    const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
    const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;
    
    let currentRow = fromRow + rowStep;
    let currentCol = fromCol + colStep;
    
    while (currentRow !== toRow || currentCol !== toCol) {
        if (gameState.board[currentRow][currentCol]) return false;
        currentRow += rowStep;
        currentCol += colStep;
    }
    
    return true;
}

// Зробити хід
function makeMove(fromRow, fromCol, toRow, toCol) {
    const piece = gameState.board[fromRow][fromCol];
    const capturedPiece = gameState.board[toRow][toCol];
    
    // Записати хід в історію
    const move = {
        from: { row: fromRow, col: fromCol },
        to: { row: toRow, col: toCol },
        piece: piece,
        captured: capturedPiece,
        player: gameState.currentPlayer
    };
    gameState.moveHistory.push(move);
    
    // Обробити захоплення
    if (capturedPiece) {
        const capturedColor = isPieceOwnedByCurrentPlayer(capturedPiece) ? 'black' : 'white';
        gameState.capturedPieces[capturedColor].push(capturedPiece);
    }
    
    // Перемістити фігуру
    gameState.board[toRow][toCol] = piece;
    gameState.board[fromRow][fromCol] = null;
    
    // Перемкнути гравця
    switchPlayer();
    
    // Оновити дошку
    renderBoard();
    
    // Перевірити на бафи в режимі Moded
    if (gameState.gameMode === 'moded') {
        checkForBuffTrigger();
    }
    
    // Перевірити умови перемоги
    checkWinCondition();
}

// Перемкнути гравця
function switchPlayer() {
    gameState.currentPlayer = gameState.currentPlayer === 'white' ? 'black' : 'white';
    updateGameStatus();
}

// Оновити статус гри
function updateGameStatus() {
    const statusElement = document.getElementById('gameStatus');
    statusElement.textContent = `Хід ${gameState.currentPlayer === 'white' ? 'білих' : 'чорних'}`;
    
    // Оновити активного гравця
    document.querySelectorAll('.player').forEach(player => {
        player.classList.remove('active');
    });
    
    const activePlayer = gameState.currentPlayer === 'white' ? 'player1' : 'player2';
    document.getElementById(activePlayer).classList.add('active');
}

// Оновити інформацію про гру
function updateGameInfo() {
    // Оновити захоплені фігури
    const capturedWhite = document.querySelector('.captured-white');
    const capturedBlack = document.querySelector('.captured-black');
    
    capturedWhite.innerHTML = gameState.capturedPieces.white.join(' ');
    capturedBlack.innerHTML = gameState.capturedPieces.black.join(' ');
    
    // Оновити історію ходів
    const movesList = document.querySelector('.moves-list');
    movesList.innerHTML = gameState.moveHistory.map((move, index) => {
        const fromSquare = String.fromCharCode(97 + move.from.col) + (8 - move.from.row);
        const toSquare = String.fromCharCode(97 + move.to.col) + (8 - move.to.row);
        return `<div class="move-item">${index + 1}. ${move.piece} ${fromSquare} → ${toSquare}</div>`;
    }).join('');
    
    updateGameStatus();
}

// Ініціалізація бафів
function initializeBuffs() {
    const buffsPanel = document.getElementById('buffsPanel');
    buffsPanel.style.display = 'block';
    
    // Додати випадковий баф кожні 5 ходів
    if (gameState.moveHistory.length % 5 === 0 && gameState.moveHistory.length > 0) {
        addRandomBuff();
    }
}

// Додати випадковий баф
function addRandomBuff() {
    const buffTypes = Object.keys(BUFFS);
    const randomBuff = buffTypes[Math.floor(Math.random() * buffTypes.length)];
    const buff = { ...BUFFS[randomBuff], type: randomBuff, player: gameState.currentPlayer };
    
    gameState.activeBuffs.push(buff);
    renderBuffs();
}

// Відобразити бафи
function renderBuffs() {
    const buffsList = document.querySelector('.buffs-list');
    buffsList.innerHTML = gameState.activeBuffs.map(buff => `
        <div class="buff-item">
            <span>${buff.icon}</span>
            <div>
                <strong>${buff.name}</strong>
                <small>${buff.description}</small>
            </div>
        </div>
    `).join('');
}

// Перевірити на спрацьовування бафів
function checkForBuffTrigger() {
    // Логіка спрацьовування бафів
    gameState.activeBuffs = gameState.activeBuffs.filter(buff => {
        buff.duration--;
        return buff.duration > 0;
    });
    
    renderBuffs();
}

// Перевірити умови перемоги
function checkWinCondition() {
    // Спрощена перевірка - чи є король
    let whiteKing = false;
    let blackKing = false;
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = gameState.board[row][col];
            if (piece === '♔') whiteKing = true;
            if (piece === '♚') blackKing = true;
        }
    }
    
    if (!whiteKing) {
        endGame('black');
    } else if (!blackKing) {
        endGame('white');
    }
}

// Закінчити гру
function endGame(winner) {
    stopTimer();
    const winnerName = winner === 'white' ? 'Білі' : 'Чорні';
    
    setTimeout(() => {
        if (confirm(`${winnerName} перемогли! Бажаєте зіграти ще?`)) {
            showScreen('mainMenu');
        }
    }, 100);
}

// Таймер
function startTimer() {
    if (gameState.timerInterval) return;
    
    gameState.timerInterval = setInterval(() => {
        gameState.timer[gameState.currentPlayer]--;
        updateTimerDisplay();
        
        if (gameState.timer[gameState.currentPlayer] <= 0) {
            endGame(gameState.currentPlayer === 'white' ? 'black' : 'white');
        }
    }, 1000);
}

function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

function updateTimerDisplay() {
    const player1Time = document.querySelector('#player1 .player-time');
    const player2Time = document.querySelector('#player2 .player-time');
    
    player1Time.textContent = formatTime(gameState.timer.white);
    player2Time.textContent = formatTime(gameState.timer.black);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Управління грою
function pauseGame() {
    if (gameState.timerInterval) {
        stopTimer();
        alert('Гра призупинена');
    } else {
        startTimer();
    }
}

function surrenderGame() {
    if (confirm('Ви впевнені, що хочете здатися?')) {
        const winner = gameState.currentPlayer === 'white' ? 'black' : 'white';
        endGame(winner);
    }
}

function exitGame() {
    if (confirm('Ви впевнені, що хочете вийти з гри?')) {
        stopTimer();
        showScreen('mainMenu');
    }
}

// Оновлення активних лобі
function updateActiveLobbies() {
    const lobbies = JSON.parse(localStorage.getItem('lobbies') || '[]');
    const lobbyList = document.querySelector('.lobby-list');
    
    if (lobbyList) {
        lobbyList.innerHTML = lobbies.map(lobby => `
            <div class="lobby-item" onclick="joinLobbyById('${lobby.id}')">
                <strong>${lobby.id}</strong> - ${lobby.type} (${lobby.players.length}/${lobby.maxPlayers})
                <br><small>Ведучий: ${lobby.host}</small>
            </div>
        `).join('');
    }
}

// Приєднатися до лобі за ID
function joinLobbyById(lobbyId) {
    const lobbies = JSON.parse(localStorage.getItem('lobbies') || '[]');
    const lobby = lobbies.find(l => l.id === lobbyId);
    
    if (lobby) {
        const playerName = document.getElementById('playerName').value || 'Гравець';
        if (lobby.players.length < lobby.maxPlayers) {
            lobby.players.push(playerName);
            localStorage.setItem('lobbies', JSON.stringify(lobbies));
            showLobbyScreen(lobby);
        } else {
            alert('Лобі повне!');
        }
    }
}

// Ініціалізація при завантаженні
document.addEventListener('DOMContentLoaded', () => {
    initGame();
    updateActiveLobbies();
    
    // Періодичне оновлення лобі
    setInterval(updateActiveLobbies, 5000);
});

// Зберегти налаштування при зміні
document.getElementById('playerName')?.addEventListener('change', saveSettings);
document.getElementById('theme')?.addEventListener('change', saveSettings);
document.getElementById('soundEffects')?.addEventListener('change', saveSettings);
