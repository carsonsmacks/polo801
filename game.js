// Game state
const gameState = {
    players: {},
    items: [],
    isHost: false,
    playerId: null,
    peer: null,
    conn: null,
    currentPlayer: null
};

// Initialize
function init() {
    document.getElementById('host-btn').addEventListener('click', hostGame);
    document.getElementById('join-btn').addEventListener('click', joinGame);
    document.getElementById('restart-btn').addEventListener('click', restartGame);
}

// Host a new game
function hostGame() {
    const playerName = document.getElementById('player-name').value || 'Player';
    const playerColor = document.getElementById('player-color').value;
    
    gameState.isHost = true;
    gameState.playerId = `player-${Math.floor(Math.random() * 10000)}`;
    gameState.players[gameState.playerId] = createPlayer(playerName, playerColor, 0, 0);
    
    setupPeerConnection(true);
    initGameBoard();
    
    // Add initial items
    for (let i = 0; i < 5; i++) addRandomItem();
    
    gameState.currentPlayer = gameState.players[gameState.playerId];
    showGameUI();
    updateUI();
}

// Join a game
function joinGame() {
    const playerName = document.getElementById('player-name').value || 'Player';
    const playerColor = document.getElementById('player-color').value;
    
    gameState.isHost = false;
    gameState.playerId = `player-${Math.floor(Math.random() * 10000)}`;
    gameState.players[gameState.playerId] = createPlayer(playerName, playerColor, 9, 9);
    
    const hostId = prompt("Enter Host's Peer ID:");
    if (!hostId) return;
    
    setupPeerConnection(false, hostId);
    initGameBoard();
    showGameUI();
}

// Create a player object
function createPlayer(name, color, x, y) {
    return {
        id: gameState.playerId,
        name,
        color,
        x,
        y,
        score: 0
    };
}

// Set up PeerJS connection
function setupPeerConnection(isHost, hostId = null) {
    const statusEl = document.getElementById('connection-status');
    
    gameState.peer = new Peer(gameState.playerId);
    
    gameState.peer.on('open', (id) => {
        statusEl.textContent = isHost ? `Hosting (ID: ${id})` : 'Connecting...';
        statusEl.className = 'connected';
        
        if (isHost) {
            document.getElementById('peer-id-display').textContent = `Share this ID: ${id}`;
            document.getElementById('peer-id-display').style.display = 'block';
            
            gameState.peer.on('connection', (conn) => {
                gameState.conn = conn;
                conn.on('data', handleIncomingData);
                conn.on('open', () => sendGameState());
            });
        } else {
            const conn = gameState.peer.connect(hostId);
            conn.on('data', handleIncomingData);
            conn.on('open', () => {
                gameState.conn = conn;
                conn.send({ type: 'requestState' });
            });
        }
    });
    
    gameState.peer.on('error', (err) => {
        console.error('PeerJS error:', err);
        statusEl.textContent = `Error: ${err.type}`;
        statusEl.className = '';
    });
}

// Handle incoming data
function handleIncomingData(data) {
    switch (data.type) {
        case 'gameState':
            Object.assign(gameState, data.data);
            updateUI();
            break;
        case 'requestState':
            if (gameState.isHost) sendGameState();
            break;
    }
}

// Send game state to other player
function sendGameState() {
    if (gameState.conn && gameState.conn.open) {
        gameState.conn.send({
            type: 'gameState',
            data: {
                players: gameState.players,
                items: gameState.items,
                currentPlayer: gameState.currentPlayer
            }
        });
    }
}

// Rest of your existing functions (initGameBoard, updateUI, handleCellClick, etc.)
// ... (Keep all the other functions from your original game.js)

// Initialize the game
init();
