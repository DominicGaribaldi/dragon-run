/**
 * MultiplayerUI - Lobby and room management UI
 */
class MultiplayerUI {
    constructor(scene) {
        this.scene = scene;
        this.elements = [];
        this.networkManager = null;
        this.onModeSelected = null;
        this.onGameReady = null;
        // Track NetworkManager subscriptions so we can detach them on screen
        // transitions. Without this, every visit to the lobby stacks another
        // copy of the same handler — a slow leak that also causes duplicate
        // calls (e.g. updateLobbyPlayers fired 4 times for one event).
        this._netListeners = [];
    }

    /**
     * Set the network manager reference
     */
    setNetworkManager(networkManager) {
        this.networkManager = networkManager;
    }

    /**
     * Subscribe to a NetworkManager event and remember the binding so we can
     * detach on clearElements(). Use this in place of networkManager.on(...).
     */
    _addNetListener(event, handler) {
        if (!this.networkManager) return;
        this.networkManager.on(event, handler);
        this._netListeners.push({ event, handler });
    }

    /**
     * Detach every NetworkManager subscription added via _addNetListener.
     */
    _clearNetListeners() {
        if (!this._netListeners || !this.networkManager) return;
        for (const { event, handler } of this._netListeners) {
            this.networkManager.off(event, handler);
        }
        this._netListeners = [];
    }

    /**
     * Show main menu with Local/Online options
     */
    showMainMenu(onModeSelected) {
        this.onModeSelected = onModeSelected;
        this.clearElements();

        const width = this.scene.scale.width;
        const height = this.scene.scale.height;
        const centerX = width / 2;
        const centerY = height / 2;

        // Panel dimensions
        const panelW = 450;
        const panelH = 350;

        // Outer glow
        const glow = this.scene.add.graphics();
        glow.fillStyle(0xc9a227, 0.15);
        glow.fillRoundedRect(centerX - panelW/2 - 15, centerY - panelH/2 - 15, panelW + 30, panelH + 30, 24);
        glow.fillStyle(0xc9a227, 0.08);
        glow.fillRoundedRect(centerX - panelW/2 - 25, centerY - panelH/2 - 25, panelW + 50, panelH + 50, 32);
        glow.setDepth(101).setScrollFactor(0);
        this.elements.push(glow);

        // Panel background
        const panel = this.scene.add.graphics();
        panel.fillStyle(0x0d0d1a, 1);
        panel.fillRoundedRect(centerX - panelW/2, centerY - panelH/2, panelW, panelH, 16);
        panel.fillStyle(0x1a1a2e, 0.5);
        panel.fillRoundedRect(centerX - panelW/2 + 4, centerY - panelH/2 + 4, panelW - 8, panelH/3, 14);
        panel.lineStyle(3, 0xc9a227, 1);
        panel.strokeRoundedRect(centerX - panelW/2, centerY - panelH/2, panelW, panelH, 16);
        panel.lineStyle(1, 0xc9a227, 0.3);
        panel.strokeRoundedRect(centerX - panelW/2 + 6, centerY - panelH/2 + 6, panelW - 12, panelH - 12, 12);
        panel.setDepth(102).setScrollFactor(0);
        this.elements.push(panel);

        // Title
        const title = this.scene.add.text(centerX, centerY - panelH/2 + 50, 'DRAGON RUN', {
            fontSize: '36px',
            fontFamily: 'Georgia, serif',
            color: '#c9a227',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(103).setScrollFactor(0);
        this.elements.push(title);

        // Subtitle
        const subtitle = this.scene.add.text(centerX, centerY - panelH/2 + 90, 'Choose Game Mode', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#aaaaaa'
        }).setOrigin(0.5).setDepth(103).setScrollFactor(0);
        this.elements.push(subtitle);

        // Local Play Button
        this.createMenuButton(centerX, centerY - 20, 'LOCAL GAME', 'Play on this device', () => {
            this.clearElements();
            this.onModeSelected('local');
        });

        // Online Play Button
        this.createMenuButton(centerX, centerY + 70, 'ONLINE GAME', 'Play with friends online', () => {
            this.clearElements();
            this.showOnlineMenu();
        });
    }

    /**
     * Show online menu (Create/Join)
     */
    showOnlineMenu() {
        this.clearElements();

        const width = this.scene.scale.width;
        const height = this.scene.scale.height;
        const centerX = width / 2;
        const centerY = height / 2;

        const panelW = 450;
        const panelH = 400;

        // Panel
        const glow = this.scene.add.graphics();
        glow.fillStyle(0xc9a227, 0.15);
        glow.fillRoundedRect(centerX - panelW/2 - 15, centerY - panelH/2 - 15, panelW + 30, panelH + 30, 24);
        glow.setDepth(101).setScrollFactor(0);
        this.elements.push(glow);

        const panel = this.scene.add.graphics();
        panel.fillStyle(0x0d0d1a, 1);
        panel.fillRoundedRect(centerX - panelW/2, centerY - panelH/2, panelW, panelH, 16);
        panel.lineStyle(3, 0xc9a227, 1);
        panel.strokeRoundedRect(centerX - panelW/2, centerY - panelH/2, panelW, panelH, 16);
        panel.setDepth(102).setScrollFactor(0);
        this.elements.push(panel);

        // Title
        const title = this.scene.add.text(centerX, centerY - panelH/2 + 50, 'ONLINE PLAY', {
            fontSize: '28px',
            fontFamily: 'Georgia, serif',
            color: '#c9a227',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(103).setScrollFactor(0);
        this.elements.push(title);

        // Create Room Button
        this.createMenuButton(centerX, centerY - 40, 'CREATE ROOM', 'Start a new game room', () => {
            this.createRoom();
        });

        // Join Room Button
        this.createMenuButton(centerX, centerY + 50, 'JOIN ROOM', 'Enter a room code', () => {
            this.showJoinRoomInput();
        });

        // Back Button
        this.createMenuButton(centerX, centerY + 140, 'BACK', 'Return to main menu', () => {
            this.showMainMenu(this.onModeSelected);
        }, 0x666666);
    }

    /**
     * Show join room input
     */
    showJoinRoomInput() {
        this.clearElements();

        const width = this.scene.scale.width;
        const height = this.scene.scale.height;
        const centerX = width / 2;
        const centerY = height / 2;

        const panelW = 400;
        const panelH = 300;

        // Panel
        const panel = this.scene.add.graphics();
        panel.fillStyle(0x0d0d1a, 1);
        panel.fillRoundedRect(centerX - panelW/2, centerY - panelH/2, panelW, panelH, 16);
        panel.lineStyle(3, 0xc9a227, 1);
        panel.strokeRoundedRect(centerX - panelW/2, centerY - panelH/2, panelW, panelH, 16);
        panel.setDepth(102).setScrollFactor(0);
        this.elements.push(panel);

        // Title
        const title = this.scene.add.text(centerX, centerY - panelH/2 + 40, 'JOIN ROOM', {
            fontSize: '24px',
            fontFamily: 'Georgia, serif',
            color: '#c9a227'
        }).setOrigin(0.5).setDepth(103).setScrollFactor(0);
        this.elements.push(title);

        // Instructions
        const instructions = this.scene.add.text(centerX, centerY - 40, 'Enter 4-character room code:', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#aaaaaa'
        }).setOrigin(0.5).setDepth(103).setScrollFactor(0);
        this.elements.push(instructions);

        // Create HTML input for room code
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 4;
        input.placeholder = 'XXXX';
        input.style.cssText = `
            position: fixed;
            left: ${centerX - 80}px;
            top: ${centerY}px;
            width: 160px;
            height: 50px;
            font-size: 32px;
            text-align: center;
            text-transform: uppercase;
            font-family: monospace;
            background: #1a1a2e;
            border: 2px solid #c9a227;
            border-radius: 8px;
            color: #ffffff;
            outline: none;
        `;
        document.body.appendChild(input);
        input.focus();

        // Store input reference for cleanup
        this.htmlInput = input;

        // Join Button
        this.createMenuButton(centerX, centerY + 80, 'JOIN', 'Connect to room', () => {
            const code = input.value.toUpperCase();
            if (code.length === 4) {
                this.joinRoom(code);
            }
        });

        // Back Button
        this.createMenuButton(centerX - 80, centerY + 80, 'BACK', '', () => {
            this.showOnlineMenu();
        }, 0x666666, 100);

        // Handle enter key
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && input.value.length === 4) {
                this.joinRoom(input.value.toUpperCase());
            }
        });
    }

    /**
     * Create a room
     */
    async createRoom() {
        this.showConnecting();

        try {
            await this.networkManager.connect();

            this._addNetListener('roomCreated', (data) => {
                this.showLobby(data.roomCode, [], true);
            });

            this._addNetListener('error', (data) => {
                this.showError(data.message);
            });

            this.networkManager.createRoom('Host');
        } catch (error) {
            this.showError('Failed to connect to server');
        }
    }

    /**
     * Join a room
     */
    async joinRoom(code) {
        this.showConnecting();

        try {
            await this.networkManager.connect();

            this._addNetListener('roomJoined', (data) => {
                this.showLobby(data.roomCode, data.players, false);
            });

            this._addNetListener('error', (data) => {
                this.showError(data.message);
            });

            this.networkManager.joinRoom(code, 'Player');
        } catch (error) {
            this.showError('Failed to connect to server');
        }
    }

    /**
     * Show connecting screen
     */
    showConnecting() {
        this.clearElements();

        const centerX = this.scene.scale.width / 2;
        const centerY = this.scene.scale.height / 2;

        const text = this.scene.add.text(centerX, centerY, 'Connecting...', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#c9a227'
        }).setOrigin(0.5).setDepth(103).setScrollFactor(0);
        this.elements.push(text);
    }

    /**
     * Show lobby screen
     */
    showLobby(roomCode, players, isHost) {
        this.clearElements();

        const width = this.scene.scale.width;
        const height = this.scene.scale.height;
        const centerX = width / 2;
        const centerY = height / 2;

        const panelW = 500;
        const panelH = 450;

        // Panel
        const glow = this.scene.add.graphics();
        glow.fillStyle(0xc9a227, 0.15);
        glow.fillRoundedRect(centerX - panelW/2 - 15, centerY - panelH/2 - 15, panelW + 30, panelH + 30, 24);
        glow.setDepth(101).setScrollFactor(0);
        this.elements.push(glow);

        const panel = this.scene.add.graphics();
        panel.fillStyle(0x0d0d1a, 1);
        panel.fillRoundedRect(centerX - panelW/2, centerY - panelH/2, panelW, panelH, 16);
        panel.lineStyle(3, 0xc9a227, 1);
        panel.strokeRoundedRect(centerX - panelW/2, centerY - panelH/2, panelW, panelH, 16);
        panel.setDepth(102).setScrollFactor(0);
        this.elements.push(panel);

        // Title
        const title = this.scene.add.text(centerX, centerY - panelH/2 + 40, 'GAME LOBBY', {
            fontSize: '28px',
            fontFamily: 'Georgia, serif',
            color: '#c9a227',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(103).setScrollFactor(0);
        this.elements.push(title);

        // Room Code Display
        const codeLabel = this.scene.add.text(centerX, centerY - panelH/2 + 90, 'ROOM CODE', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#888888'
        }).setOrigin(0.5).setDepth(103).setScrollFactor(0);
        this.elements.push(codeLabel);

        const codeText = this.scene.add.text(centerX, centerY - panelH/2 + 125, roomCode, {
            fontSize: '48px',
            fontFamily: 'monospace',
            color: '#ffffff',
            stroke: '#c9a227',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(103).setScrollFactor(0);
        this.elements.push(codeText);

        // Copy hint
        const copyHint = this.scene.add.text(centerX, centerY - panelH/2 + 160, 'Share this code with friends!', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#666666'
        }).setOrigin(0.5).setDepth(103).setScrollFactor(0);
        this.elements.push(copyHint);

        // Player list header
        const playersLabel = this.scene.add.text(centerX - panelW/2 + 30, centerY - 60, 'Players:', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#c9a227'
        }).setDepth(103).setScrollFactor(0);
        this.elements.push(playersLabel);

        // Player list (will be updated by updateLobbyPlayers)
        this.playerListY = centerY - 30;
        this.playerListX = centerX - panelW/2 + 30;
        this.updateLobbyPlayers(players);

        // Setup listeners for player updates (auto-detached on next clearElements)
        this._addNetListener('playerJoined', (data) => {
            this.updateLobbyPlayers(data.players);
        });

        this._addNetListener('playerLeft', (data) => {
            this.updateLobbyPlayers(data.players);
        });

        this._addNetListener('characterSelected', (data) => {
            this.updateLobbyPlayers(data.players);
        });

        this._addNetListener('gameStarted', (data) => {
            this.clearElements();
            if (this.onGameReady) {
                this.onGameReady(data);
            }
        });

        // Start Game Button (host only)
        if (isHost) {
            this.createMenuButton(centerX, centerY + panelH/2 - 100, 'START GAME', 'Begin the adventure!', () => {
                this.networkManager.startGame();
            });
        } else {
            const waitText = this.scene.add.text(centerX, centerY + panelH/2 - 100, 'Waiting for host to start...', {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#888888'
            }).setOrigin(0.5).setDepth(103).setScrollFactor(0);
            this.elements.push(waitText);
        }

        // Leave Button
        this.createMenuButton(centerX, centerY + panelH/2 - 40, 'LEAVE', 'Exit the lobby', () => {
            this.networkManager.leaveRoom();
            this.showMainMenu(this.onModeSelected);
        }, 0x666666);
    }

    /**
     * Update player list in lobby
     */
    updateLobbyPlayers(players) {
        // Remove old player list elements
        this.elements = this.elements.filter(el => {
            if (el.isPlayerListItem) {
                el.destroy();
                return false;
            }
            return true;
        });

        // Add player entries
        players.forEach((player, index) => {
            const y = this.playerListY + (index * 35);

            const playerText = this.scene.add.text(this.playerListX, y,
                `${player.playerNumber}. ${player.playerName}${player.isHost ? ' (Host)' : ''}`, {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: player.connected ? '#ffffff' : '#666666'
            }).setDepth(103).setScrollFactor(0);
            playerText.isPlayerListItem = true;
            this.elements.push(playerText);

            // Character indicator
            if (player.characterId) {
                const charText = this.scene.add.text(this.playerListX + 280, y, `[${player.characterId}]`, {
                    fontSize: '14px',
                    fontFamily: 'Arial',
                    color: '#c9a227'
                }).setDepth(103).setScrollFactor(0);
                charText.isPlayerListItem = true;
                this.elements.push(charText);
            }
        });
    }

    /**
     * Show error message
     */
    showError(message) {
        this.clearElements();

        const centerX = this.scene.scale.width / 2;
        const centerY = this.scene.scale.height / 2;

        const panelW = 400;
        const panelH = 200;

        const panel = this.scene.add.graphics();
        panel.fillStyle(0x1a0d0d, 1);
        panel.fillRoundedRect(centerX - panelW/2, centerY - panelH/2, panelW, panelH, 16);
        panel.lineStyle(3, 0xcc3333, 1);
        panel.strokeRoundedRect(centerX - panelW/2, centerY - panelH/2, panelW, panelH, 16);
        panel.setDepth(102).setScrollFactor(0);
        this.elements.push(panel);

        const title = this.scene.add.text(centerX, centerY - 40, 'ERROR', {
            fontSize: '24px',
            fontFamily: 'Georgia, serif',
            color: '#cc3333'
        }).setOrigin(0.5).setDepth(103).setScrollFactor(0);
        this.elements.push(title);

        const errorText = this.scene.add.text(centerX, centerY, message, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
            wordWrap: { width: panelW - 40 }
        }).setOrigin(0.5).setDepth(103).setScrollFactor(0);
        this.elements.push(errorText);

        this.createMenuButton(centerX, centerY + 60, 'OK', '', () => {
            this.showOnlineMenu();
        });
    }

    /**
     * Create a styled menu button
     */
    createMenuButton(x, y, text, description, callback, color = 0xc9a227, width = 220) {
        const btnW = width;
        const btnH = description ? 60 : 45;

        const bg = this.scene.add.graphics();
        bg.fillStyle(0x0a0a12, 1);
        bg.fillRoundedRect(x - btnW/2, y - btnH/2, btnW, btnH, 10);
        bg.fillStyle(color, 0.2);
        bg.fillRoundedRect(x - btnW/2 + 2, y - btnH/2 + 2, btnW - 4, btnH - 4, 8);
        bg.lineStyle(2, color, 1);
        bg.strokeRoundedRect(x - btnW/2, y - btnH/2, btnW, btnH, 10);
        bg.setDepth(103).setScrollFactor(0);
        this.elements.push(bg);

        const labelY = description ? y - 8 : y;
        const label = this.scene.add.text(x, labelY, text, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(104).setScrollFactor(0);
        this.elements.push(label);

        if (description) {
            const desc = this.scene.add.text(x, y + 12, description, {
                fontSize: '11px',
                fontFamily: 'Arial',
                color: '#888888'
            }).setOrigin(0.5).setDepth(104).setScrollFactor(0);
            this.elements.push(desc);
        }

        const hitArea = this.scene.add.rectangle(x, y, btnW, btnH, 0x000000, 0);
        hitArea.setDepth(105).setScrollFactor(0);
        hitArea.setInteractive({ useHandCursor: true });
        this.elements.push(hitArea);

        hitArea.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x1a1a24, 1);
            bg.fillRoundedRect(x - btnW/2, y - btnH/2, btnW, btnH, 10);
            bg.fillStyle(color, 0.4);
            bg.fillRoundedRect(x - btnW/2 + 2, y - btnH/2 + 2, btnW - 4, btnH - 4, 8);
            bg.lineStyle(3, color, 1);
            bg.strokeRoundedRect(x - btnW/2, y - btnH/2, btnW, btnH, 10);
            label.setScale(1.05);
        });

        hitArea.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x0a0a12, 1);
            bg.fillRoundedRect(x - btnW/2, y - btnH/2, btnW, btnH, 10);
            bg.fillStyle(color, 0.2);
            bg.fillRoundedRect(x - btnW/2 + 2, y - btnH/2 + 2, btnW - 4, btnH - 4, 8);
            bg.lineStyle(2, color, 1);
            bg.strokeRoundedRect(x - btnW/2, y - btnH/2, btnW, btnH, 10);
            label.setScale(1);
        });

        hitArea.on('pointerdown', callback);
    }

    /**
     * Clear all UI elements and detach any NetworkManager subscriptions
     * registered for this screen.
     */
    clearElements() {
        this._clearNetListeners();

        this.elements.forEach(el => {
            if (el && el.destroy) {
                el.destroy();
            }
        });
        this.elements = [];

        // Remove HTML input if exists
        if (this.htmlInput) {
            this.htmlInput.remove();
            this.htmlInput = null;
        }
    }

    /**
     * Set callback for when game is ready to start
     */
    setOnGameReady(callback) {
        this.onGameReady = callback;
    }
}

// Make available globally
window.MultiplayerUI = MultiplayerUI;
