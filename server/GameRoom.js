/**
 * GameRoom - Manages state for a single game room
 */

import { GameLogic } from './GameLogic.js';

export class GameRoom {
    constructor(roomCode, hostSocketId) {
        this.roomCode = roomCode;
        this.hostSocketId = hostSocketId;
        this.players = new Map(); // socketId -> PlayerState
        this.playerOrder = []; // Array of socketIds in turn order
        this.board = null;
        this.currentPlayerIndex = 0;
        this.gameState = 'lobby'; // lobby, character_select, playing, ended
        this.lastActivity = Date.now();
        this.pendingRoll = null; // Stores roll waiting for movement processing
        this.pendingEncounter = null; // Stores encounter waiting for resolution
        this.gameLogic = new GameLogic();
    }

    /**
     * Add a player to the room
     */
    addPlayer(socketId, playerName, isHost) {
        const playerNumber = this.players.size + 1;
        this.players.set(socketId, {
            socketId,
            playerNumber,
            playerName: playerName || `Player ${playerNumber}`,
            isHost,
            characterId: null,
            currentTile: 1,
            statusEffects: {
                stunned: false,
                slowed: false,
                reversed: false,
                burned: false
            },
            inventory: [],
            armorShards: 0,
            hasWon: false,
            connected: true,
            arcaneInsightUsed: false
        });
        this.playerOrder.push(socketId);
        this.lastActivity = Date.now();
        return playerNumber;
    }

    /**
     * Remove a player from the room
     */
    removePlayer(socketId) {
        const player = this.players.get(socketId);
        if (!player) return null;

        const playerNumber = player.playerNumber;
        this.players.delete(socketId);
        this.playerOrder = this.playerOrder.filter(id => id !== socketId);

        // Reassign host if needed
        if (player.isHost && this.playerOrder.length > 0) {
            const newHost = this.players.get(this.playerOrder[0]);
            if (newHost) newHost.isHost = true;
            this.hostSocketId = this.playerOrder[0];
        }

        this.lastActivity = Date.now();
        return playerNumber;
    }

    /**
     * Mark a player as disconnected (but keep their state for reconnection)
     */
    markDisconnected(socketId) {
        const player = this.players.get(socketId);
        if (player) {
            player.connected = false;
            this.lastActivity = Date.now();
            return player.playerNumber;
        }
        return null;
    }

    /**
     * Reconnect a player
     */
    reconnectPlayer(socketId, playerNumber) {
        // Find the disconnected player by number
        for (const [oldSocketId, player] of this.players) {
            if (player.playerNumber === playerNumber && !player.connected) {
                // Update socket ID
                player.socketId = socketId;
                player.connected = true;

                // Update maps
                this.players.delete(oldSocketId);
                this.players.set(socketId, player);

                // Update player order
                const orderIndex = this.playerOrder.indexOf(oldSocketId);
                if (orderIndex !== -1) {
                    this.playerOrder[orderIndex] = socketId;
                }

                this.lastActivity = Date.now();
                return { success: true };
            }
        }
        return { success: false, error: 'Player not found or already connected' };
    }

    /**
     * Select a character for a player
     */
    selectCharacter(socketId, characterId) {
        const player = this.players.get(socketId);
        if (!player) {
            return { success: false, error: 'Player not found' };
        }

        // Check if character is already taken
        for (const [id, p] of this.players) {
            if (id !== socketId && p.characterId === characterId) {
                return { success: false, error: 'Character already selected' };
            }
        }

        player.characterId = characterId;
        this.lastActivity = Date.now();

        return { success: true, playerNumber: player.playerNumber };
    }

    /**
     * Start the game
     */
    startGame(socketId) {
        const player = this.players.get(socketId);
        if (!player || !player.isHost) {
            return { success: false, error: 'Only host can start the game' };
        }

        if (this.players.size < 2) {
            return { success: false, error: 'Need at least 2 players' };
        }

        // Check all players have selected characters
        for (const [id, p] of this.players) {
            if (!p.characterId) {
                return { success: false, error: 'All players must select a character' };
            }
        }

        // Generate board with seed for synchronization
        this.board = this.gameLogic.generateBoard();
        this.gameState = 'playing';
        this.currentPlayerIndex = 0;
        this.lastActivity = Date.now();

        return {
            success: true,
            board: this.board
        };
    }

    /**
     * Handle dice roll
     */
    rollDice(socketId) {
        if (this.gameState !== 'playing') {
            return { success: false, error: 'Game not in progress' };
        }

        const currentSocketId = this.playerOrder[this.currentPlayerIndex];
        if (socketId !== currentSocketId) {
            return { success: false, error: 'Not your turn' };
        }

        const player = this.players.get(socketId);
        if (!player) {
            return { success: false, error: 'Player not found' };
        }

        // Check if stunned
        if (player.statusEffects.stunned) {
            player.statusEffects.stunned = false;
            this.advanceTurn();
            return {
                success: true,
                playerNumber: player.playerNumber,
                roll: 0,
                modifiedRoll: 0,
                modifiers: { stunned: true },
                skipped: true
            };
        }

        // Roll the dice (1-6)
        const roll = Math.floor(Math.random() * 6) + 1;
        let modifiedRoll = roll;
        const modifiers = {};

        // Apply status effects
        if (player.statusEffects.burned) {
            modifiedRoll = Math.max(1, roll - 1);
            modifiers.burned = true;
            player.statusEffects.burned = false;
        }

        if (player.statusEffects.slowed) {
            modifiedRoll = Math.ceil(modifiedRoll / 2);
            modifiers.slowed = true;
            player.statusEffects.slowed = false;
        }

        if (player.statusEffects.reversed) {
            modifiedRoll = -modifiedRoll;
            modifiers.reversed = true;
            player.statusEffects.reversed = false;
        }

        // Store pending roll for movement processing
        this.pendingRoll = {
            socketId,
            roll,
            modifiedRoll,
            modifiers
        };

        this.lastActivity = Date.now();

        return {
            success: true,
            playerNumber: player.playerNumber,
            roll,
            modifiedRoll,
            modifiers
        };
    }

    /**
     * Process movement after roll
     */
    processMovement(socketId, data) {
        if (!this.pendingRoll || this.pendingRoll.socketId !== socketId) {
            return { success: false, error: 'No pending roll' };
        }

        const player = this.players.get(socketId);
        if (!player) {
            return { success: false, error: 'Player not found' };
        }

        const { modifiedRoll } = this.pendingRoll;

        // Calculate new tile
        let newTile = player.currentTile + modifiedRoll;

        // Bounce back from end
        if (newTile > 100) {
            newTile = 100 - (newTile - 100);
        }
        if (newTile < 1) {
            newTile = 1;
        }

        player.currentTile = newTile;
        this.pendingRoll = null;

        // Check for win
        if (newTile === 100) {
            player.hasWon = true;
            this.gameState = 'ended';
            return {
                success: true,
                playerNumber: player.playerNumber,
                playerStates: this.getPlayerStates(),
                currentPlayerIndex: this.currentPlayerIndex,
                gameEnded: true,
                winner: player.playerNumber
            };
        }

        // Check for encounters
        const encounter = this.gameLogic.checkEncounter(newTile, this.board);
        if (encounter) {
            this.pendingEncounter = {
                socketId,
                encounter,
                tile: newTile
            };
            return {
                success: true,
                playerNumber: player.playerNumber,
                encounter,
                playerState: this.getPlayerState(socketId)
            };
        }

        // No encounter, advance turn
        this.advanceTurn();

        return {
            success: true,
            playerNumber: player.playerNumber,
            playerStates: this.getPlayerStates(),
            currentPlayerIndex: this.currentPlayerIndex,
            gameEnded: false
        };
    }

    /**
     * Resolve an encounter
     */
    resolveEncounter(socketId, data) {
        if (!this.pendingEncounter || this.pendingEncounter.socketId !== socketId) {
            return { success: false, error: 'No pending encounter' };
        }

        const player = this.players.get(socketId);
        if (!player) {
            return { success: false, error: 'Player not found' };
        }

        const { encounter } = this.pendingEncounter;
        const result = this.gameLogic.resolveEncounter(encounter, player, data, this.board);

        // Apply encounter effects
        if (result.newTile !== undefined) {
            player.currentTile = result.newTile;
        }
        if (result.statusEffect) {
            player.statusEffects[result.statusEffect] = true;
        }
        if (result.item) {
            if (player.inventory.length < 3) {
                player.inventory.push(result.item);
            }
        }
        if (result.armorShards !== undefined) {
            player.armorShards = Math.min(3, player.armorShards + result.armorShards);
        }

        this.pendingEncounter = null;

        // Check for win after encounter (e.g., knight boost)
        if (player.currentTile >= 100) {
            player.currentTile = 100;
            player.hasWon = true;
            this.gameState = 'ended';
            return {
                success: true,
                playerNumber: player.playerNumber,
                encounterSuccess: result.success,
                roll: result.roll,
                effect: result.effect,
                newTile: player.currentTile,
                playerStates: this.getPlayerStates(),
                currentPlayerIndex: this.currentPlayerIndex,
                gameEnded: true,
                winner: player.playerNumber
            };
        }

        // Advance turn
        this.advanceTurn();

        return {
            success: true,
            playerNumber: player.playerNumber,
            encounterSuccess: result.success,
            roll: result.roll,
            effect: result.effect,
            newTile: player.currentTile,
            playerStates: this.getPlayerStates(),
            currentPlayerIndex: this.currentPlayerIndex,
            gameEnded: false
        };
    }

    /**
     * Use an item
     */
    useItem(socketId, itemId) {
        const player = this.players.get(socketId);
        if (!player) {
            return { success: false, error: 'Player not found' };
        }

        const itemIndex = player.inventory.indexOf(itemId);
        if (itemIndex === -1) {
            return { success: false, error: 'Item not in inventory' };
        }

        const effect = this.gameLogic.useItem(itemId, player);
        player.inventory.splice(itemIndex, 1);

        this.lastActivity = Date.now();

        return {
            success: true,
            playerNumber: player.playerNumber,
            effect,
            playerState: this.getPlayerState(socketId)
        };
    }

    /**
     * Handle portal choice
     */
    handlePortalChoice(socketId, enter) {
        const player = this.players.get(socketId);
        if (!player) {
            return { success: false, error: 'Player not found' };
        }

        if (!enter) {
            // Player declined portal
            this.advanceTurn();
            return {
                success: true,
                playerNumber: player.playerNumber,
                newTile: player.currentTile,
                playerStates: this.getPlayerStates(),
                currentPlayerIndex: this.currentPlayerIndex,
                gameEnded: false
            };
        }

        // Process portal (simplified - would need portal type from pendingEncounter)
        const portalResult = this.gameLogic.usePortal(player.currentTile, this.board);
        player.currentTile = portalResult.newTile;

        // Check for win
        if (player.currentTile >= 100) {
            player.currentTile = 100;
            player.hasWon = true;
            this.gameState = 'ended';
        }

        this.advanceTurn();

        return {
            success: true,
            playerNumber: player.playerNumber,
            newTile: player.currentTile,
            portalType: portalResult.type,
            playerStates: this.getPlayerStates(),
            currentPlayerIndex: this.currentPlayerIndex,
            gameEnded: this.gameState === 'ended',
            winner: player.hasWon ? player.playerNumber : null
        };
    }

    /**
     * Handle reroll choice (spell scroll)
     */
    handleRerollChoice(socketId, reroll) {
        const player = this.players.get(socketId);
        if (!player) {
            return { success: false, error: 'Player not found' };
        }

        if (!reroll) {
            return { success: true, playerNumber: player.playerNumber };
        }

        // Remove spell scroll from inventory
        const scrollIndex = player.inventory.indexOf('spell_scroll');
        if (scrollIndex !== -1) {
            player.inventory.splice(scrollIndex, 1);
        }

        // New roll
        const roll = Math.floor(Math.random() * 6) + 1;
        this.pendingRoll = {
            socketId,
            roll,
            modifiedRoll: roll,
            modifiers: { reroll: true }
        };

        return {
            success: true,
            playerNumber: player.playerNumber,
            roll,
            modifiedRoll: roll
        };
    }

    /**
     * Advance to the next player's turn
     */
    advanceTurn() {
        let nextIndex = (this.currentPlayerIndex + 1) % this.playerOrder.length;
        let attempts = 0;

        // Skip disconnected players and winners
        while (attempts < this.playerOrder.length) {
            const nextSocketId = this.playerOrder[nextIndex];
            const nextPlayer = this.players.get(nextSocketId);

            if (nextPlayer && nextPlayer.connected && !nextPlayer.hasWon) {
                break;
            }

            nextIndex = (nextIndex + 1) % this.playerOrder.length;
            attempts++;
        }

        this.currentPlayerIndex = nextIndex;
        this.lastActivity = Date.now();
    }

    /**
     * Get player count
     */
    getPlayerCount() {
        return this.players.size;
    }

    /**
     * Get basic player info for lobby display
     */
    getPlayersInfo() {
        return Array.from(this.players.values()).map(p => ({
            playerNumber: p.playerNumber,
            playerName: p.playerName,
            isHost: p.isHost,
            characterId: p.characterId,
            connected: p.connected
        }));
    }

    /**
     * Get a single player's full state
     */
    getPlayerState(socketId) {
        const player = this.players.get(socketId);
        if (!player) return null;

        return {
            playerNumber: player.playerNumber,
            currentTile: player.currentTile,
            statusEffects: { ...player.statusEffects },
            inventory: [...player.inventory],
            armorShards: player.armorShards,
            hasWon: player.hasWon
        };
    }

    /**
     * Get all players' states for sync
     */
    getPlayerStates() {
        return Array.from(this.players.values()).map(p => ({
            playerNumber: p.playerNumber,
            characterId: p.characterId,
            currentTile: p.currentTile,
            statusEffects: { ...p.statusEffects },
            inventory: [...p.inventory],
            armorShards: p.armorShards,
            hasWon: p.hasWon,
            connected: p.connected
        }));
    }
}
