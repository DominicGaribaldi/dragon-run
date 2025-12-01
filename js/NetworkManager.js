/**
 * NetworkManager - Client-side Socket.io wrapper for multiplayer
 */
class NetworkManager {
    constructor() {
        this.socket = null;
        this.roomCode = null;
        this.isHost = false;
        this.myPlayerNumber = null;
        this.playerName = 'Player';
        this.callbacks = {};
        this.connected = false;
        // Auto-detect server URL: use same host in production, localhost for dev
        this.serverUrl = this.detectServerUrl();
    }

    /**
     * Detect the correct server URL based on environment
     */
    detectServerUrl() {
        // If running from a deployed server, connect to same origin
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            return window.location.origin;
        }
        // Local development - connect to local server
        return 'http://localhost:3001';
    }

    /**
     * Connect to the game server
     */
    connect(serverUrl = null) {
        if (serverUrl) {
            this.serverUrl = serverUrl;
        }

        return new Promise((resolve, reject) => {
            try {
                this.socket = io(this.serverUrl, {
                    transports: ['websocket', 'polling'],
                    timeout: 10000
                });

                this.socket.on('connect', () => {
                    console.log('[NetworkManager] Connected to server');
                    this.connected = true;
                    this.setupEventHandlers();
                    resolve();
                });

                this.socket.on('connect_error', (error) => {
                    console.error('[NetworkManager] Connection error:', error);
                    this.connected = false;
                    reject(error);
                });

                this.socket.on('disconnect', (reason) => {
                    console.log('[NetworkManager] Disconnected:', reason);
                    this.connected = false;
                    this.emit('disconnected', { reason });
                });

            } catch (error) {
                console.error('[NetworkManager] Failed to connect:', error);
                reject(error);
            }
        });
    }

    /**
     * Setup event handlers for server messages
     */
    setupEventHandlers() {
        // Room events
        this.socket.on('room_created', (data) => {
            this.roomCode = data.roomCode;
            this.myPlayerNumber = data.playerNumber;
            this.isHost = data.isHost;
            this.saveSession();
            this.emit('roomCreated', data);
        });

        this.socket.on('room_joined', (data) => {
            this.roomCode = data.roomCode;
            this.myPlayerNumber = data.playerNumber;
            this.isHost = data.isHost;
            this.saveSession();
            this.emit('roomJoined', data);
        });

        this.socket.on('player_joined', (data) => {
            this.emit('playerJoined', data);
        });

        this.socket.on('player_left', (data) => {
            this.emit('playerLeft', data);
        });

        this.socket.on('player_disconnected', (data) => {
            this.emit('playerDisconnected', data);
        });

        this.socket.on('player_reconnected', (data) => {
            this.emit('playerReconnected', data);
        });

        // Character selection
        this.socket.on('character_selected', (data) => {
            this.emit('characterSelected', data);
        });

        // Game start
        this.socket.on('game_started', (data) => {
            this.emit('gameStarted', data);
        });

        // Turn events
        this.socket.on('roll_result', (data) => {
            this.emit('rollResult', data);
        });

        this.socket.on('turn_complete', (data) => {
            this.emit('turnComplete', data);
        });

        // Encounter events
        this.socket.on('encounter_triggered', (data) => {
            this.emit('encounterTriggered', data);
        });

        this.socket.on('encounter_result', (data) => {
            this.emit('encounterResult', data);
        });

        // Item events
        this.socket.on('item_used', (data) => {
            this.emit('itemUsed', data);
        });

        // Portal events
        this.socket.on('portal_result', (data) => {
            this.emit('portalResult', data);
        });

        // Game end
        this.socket.on('game_ended', (data) => {
            this.emit('gameEnded', data);
        });

        // Error handling
        this.socket.on('error', (data) => {
            console.error('[NetworkManager] Server error:', data.message);
            this.emit('error', data);
        });

        // Reconnection
        this.socket.on('reconnected', (data) => {
            this.roomCode = data.roomCode;
            this.myPlayerNumber = data.playerNumber;
            this.emit('reconnected', data);
        });

        this.socket.on('reconnect_failed', (data) => {
            this.clearSession();
            this.emit('reconnectFailed', data);
        });
    }

    // ==================== Outbound Methods ====================

    /**
     * Create a new room
     */
    createRoom(playerName = 'Player 1') {
        this.playerName = playerName;
        this.socket.emit('create_room', { playerName });
    }

    /**
     * Join an existing room
     */
    joinRoom(roomCode, playerName = 'Player') {
        this.playerName = playerName;
        this.socket.emit('join_room', { roomCode: roomCode.toUpperCase(), playerName });
    }

    /**
     * Select a character
     */
    selectCharacter(characterId) {
        this.socket.emit('select_character', { characterId });
    }

    /**
     * Start the game (host only)
     */
    startGame() {
        this.socket.emit('start_game');
    }

    /**
     * Roll the dice
     */
    rollDice() {
        this.socket.emit('roll_dice');
    }

    /**
     * Process movement after roll animation
     */
    processMovement(data = {}) {
        this.socket.emit('process_movement', data);
    }

    /**
     * Send encounter choice
     */
    encounterChoice(choice) {
        this.socket.emit('encounter_choice', { choice });
    }

    /**
     * Use an item
     */
    useItem(itemId) {
        this.socket.emit('use_item', { itemId });
    }

    /**
     * Portal choice
     */
    portalChoice(enter) {
        this.socket.emit('portal_choice', { enter });
    }

    /**
     * Reroll choice (spell scroll)
     */
    rerollChoice(reroll) {
        this.socket.emit('reroll_choice', { reroll });
    }

    /**
     * Leave the room
     */
    leaveRoom() {
        this.socket.emit('leave_room');
        this.clearSession();
        this.roomCode = null;
        this.myPlayerNumber = null;
        this.isHost = false;
    }

    /**
     * Disconnect from server
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.connected = false;
        this.clearSession();
    }

    // ==================== Session Management ====================

    /**
     * Save session for reconnection
     */
    saveSession() {
        if (this.roomCode && this.myPlayerNumber) {
            localStorage.setItem('dragonRunSession', JSON.stringify({
                roomCode: this.roomCode,
                playerNumber: this.myPlayerNumber,
                playerName: this.playerName
            }));
        }
    }

    /**
     * Clear saved session
     */
    clearSession() {
        localStorage.removeItem('dragonRunSession');
    }

    /**
     * Attempt to reconnect to previous session
     */
    attemptReconnect() {
        const saved = localStorage.getItem('dragonRunSession');
        if (saved) {
            const session = JSON.parse(saved);
            this.socket.emit('reconnect_attempt', {
                roomCode: session.roomCode,
                playerNumber: session.playerNumber
            });
            return true;
        }
        return false;
    }

    /**
     * Check if there's a saved session
     */
    hasSavedSession() {
        return localStorage.getItem('dragonRunSession') !== null;
    }

    // ==================== Event Subscription ====================

    /**
     * Subscribe to an event
     */
    on(event, callback) {
        if (!this.callbacks[event]) {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push(callback);
    }

    /**
     * Unsubscribe from an event
     */
    off(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
        }
    }

    /**
     * Emit an event to subscribers
     */
    emit(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[NetworkManager] Error in ${event} callback:`, error);
                }
            });
        }
    }

    // ==================== Helpers ====================

    /**
     * Check if it's this player's turn
     */
    isMyTurn(currentPlayerIndex, players) {
        return this.myPlayerNumber === currentPlayerIndex + 1;
    }

    /**
     * Get connection status
     */
    isConnected() {
        return this.connected && this.socket && this.socket.connected;
    }
}

// Make available globally
window.NetworkManager = NetworkManager;
