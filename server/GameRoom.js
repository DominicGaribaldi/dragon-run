/**
 * GameRoom - Manages state for a single game room
 */

import { GameLogic } from './GameLogic.js';
import { randomInt, randomBytes } from 'crypto';

// Server-authoritative dice. Use crypto.randomInt so an attacker who observes
// past rolls cannot predict future ones (Math.random() is a Mersenne Twister
// variant that's trivially recoverable from ~624 outputs).
function rollDie() {
    return randomInt(1, 7); // returns 1..6 inclusive
}

// Active items can only be used by the current player. Passive items
// (armor_shard, holy_shield) auto-trigger on the relevant encounter.
const ACTIVE_ITEM_IDS = new Set(['speed_potion', 'spell_scroll', 'smoke_bomb']);

// Auto-resolve any pending action this many ms after it's set. Without this
// a disconnected or unresponsive client wedges the room forever.
const PENDING_STATE_TIMEOUT_MS = 60_000;

export class GameRoom {
    constructor(roomCode, hostSocketId, io = null) {
        this.roomCode = roomCode;
        this.hostSocketId = hostSocketId;
        // Optional Socket.io reference for broadcasting timeout-driven events.
        // RoomManager passes it through; tests can omit it.
        this.io = io;
        this.players = new Map(); // socketId -> PlayerState
        this.playerOrder = []; // Array of socketIds in turn order
        this.board = null;
        this.currentPlayerIndex = 0;
        this.gameState = 'lobby'; // lobby, character_select, playing, ended
        this.lastActivity = Date.now();
        this.pendingRoll = null; // Stores roll waiting for movement processing
        this.pendingEncounter = null; // Stores encounter waiting for resolution
        this.pendingTimer = null; // Timer that fires if pendingRoll/Encounter sits too long
        this.gameLogic = new GameLogic();
    }

    // ---- Pending-state timer ------------------------------------------------
    // Whenever we set pendingRoll or pendingEncounter, start a timer. If the
    // owning client never responds (disconnected, crashed, malicious) we
    // auto-resolve and advance the turn so the room doesn't wedge.

    _armPendingTimer(reason) {
        this._clearPendingTimer();
        this.pendingTimer = setTimeout(() => this._handlePendingTimeout(reason), PENDING_STATE_TIMEOUT_MS);
    }

    _clearPendingTimer() {
        if (this.pendingTimer) {
            clearTimeout(this.pendingTimer);
            this.pendingTimer = null;
        }
    }

    _handlePendingTimeout(reason) {
        // Auto-resolve: drop pending state, advance turn, broadcast.
        this.pendingTimer = null;
        const expiredSocketId = this.pendingRoll?.socketId || this.pendingEncounter?.socketId;
        const expiredPlayer = expiredSocketId ? this.players.get(expiredSocketId) : null;
        this.pendingRoll = null;
        this.pendingEncounter = null;
        const advanced = this.advanceTurn();

        if (this.io && expiredPlayer) {
            this.io.to(this.roomCode).emit('turn_timeout', {
                playerNumber: expiredPlayer.playerNumber,
                reason
            });
            this.io.to(this.roomCode).emit('turn_complete', {
                playerStates: this.getPlayerStates(),
                currentPlayerIndex: this.currentPlayerIndex,
                gameEnded: !advanced || this.gameState === 'ended',
                winner: null
            });
        }
    }

    /**
     * Add a player to the room. Generates a one-time reconnectToken that
     * must be supplied by the client to reclaim this seat after a disconnect —
     * without it, anyone who knows the room code + player number could
     * hijack the seat (and inventory) of a disconnected player.
     */
    addPlayer(socketId, playerName, isHost) {
        const playerNumber = this.players.size + 1;
        const reconnectToken = randomBytes(16).toString('hex');
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
            arcaneInsightUsed: false,
            // Modifiers stashed by useItem(), consumed at the next relevant
            // event (e.g. roll_bonus is consumed by the next rollDice).
            pendingModifiers: [],
            reconnectToken
        });
        this.playerOrder.push(socketId);
        this.lastActivity = Date.now();
        return { playerNumber, reconnectToken };
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
     * Reconnect a player. Requires the original reconnectToken issued at
     * addPlayer time — without it, the request is rejected even when the
     * player number is correct. This closes the seat-hijack vector where
     * anyone with a room code + player number could take over a disconnected
     * player's session.
     */
    reconnectPlayer(socketId, playerNumber, reconnectToken) {
        if (typeof reconnectToken !== 'string' || reconnectToken.length === 0) {
            return { success: false, error: 'Reconnect token required' };
        }
        // Find the disconnected player by number
        for (const [oldSocketId, player] of this.players) {
            if (player.playerNumber !== playerNumber || player.connected) continue;
            // Constant-time comparison would be ideal, but reconnectToken is
            // hex-encoded 16-byte random so timing leaks are immaterial here.
            if (player.reconnectToken !== reconnectToken) {
                return { success: false, error: 'Invalid reconnect token' };
            }

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
        return { success: false, error: 'Player not found or already connected' };
    }

    /**
     * Select a character for a player
     */
    selectCharacter(socketId, characterId) {
        // Only allow character selection while the room is in the lobby.
        // Mid-game re-selection would mutate identity (and thus passive
        // abilities) under the rest of the game state.
        if (this.gameState !== 'lobby') {
            return { success: false, error: 'Cannot change character mid-game' };
        }

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

        // Roll the dice (1-6, crypto-strong)
        const roll = rollDie();
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

        // Consume any roll_bonus modifiers stashed by useItem() (e.g. Speed
        // Potion). We previously discarded these — Speed Potion's +2 was a
        // silent no-op server-side.
        if (player.pendingModifiers && player.pendingModifiers.length > 0) {
            const remaining = [];
            for (const mod of player.pendingModifiers) {
                if (mod && mod.type === 'roll_bonus' && typeof mod.value === 'number') {
                    modifiedRoll += mod.value;
                    modifiers.itemBonus = (modifiers.itemBonus || 0) + mod.value;
                } else {
                    remaining.push(mod);
                }
            }
            player.pendingModifiers = remaining;
        }

        // Store pending roll for movement processing
        this.pendingRoll = {
            socketId,
            roll,
            modifiedRoll,
            modifiers
        };
        this._armPendingTimer('roll');

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

        // Calculate new tile. modifiedRoll may be negative when the player is
        // reversed; addition handles both cases (50 + (-3) = 47).
        let newTile = player.currentTile + modifiedRoll;

        // Crossing the finish line wins — no exact-roll requirement. Without
        // this clamp the previous bounce-back left a player at 96 unable to
        // win on a roll of 5 (101 -> 99), which was confusing and fought the
        // documented spec.
        const isWin = newTile >= 100;
        if (isWin) newTile = 100;
        if (newTile < 1) newTile = 1;

        player.currentTile = newTile;
        this.pendingRoll = null;
        this._clearPendingTimer();

        // Check for win
        if (isWin) {
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
            this._armPendingTimer('encounter');
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
            gameEnded: this.gameState === 'ended'
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
        this._clearPendingTimer();

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
     * Use an item. Active items (Speed Potion, Spell Scroll, Smoke Bomb)
     * are turn-modifying and may only be played by the current player.
     * Passive items (Armor Shard, Holy Shield) auto-trigger and don't go
     * through this path.
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

        if (ACTIVE_ITEM_IDS.has(itemId)) {
            const currentSocketId = this.playerOrder[this.currentPlayerIndex];
            if (socketId !== currentSocketId) {
                return { success: false, error: 'Active items can only be used on your turn' };
            }
        }

        const result = this.gameLogic.useItem(itemId, player);
        player.inventory.splice(itemIndex, 1);

        // Persist any returned modifier on the player so it can be consumed
        // by the next relevant event (e.g. roll_bonus is read by rollDice).
        if (result && result.modifier) {
            player.pendingModifiers = player.pendingModifiers || [];
            player.pendingModifiers.push(result.modifier);
        }

        this.lastActivity = Date.now();

        return {
            success: true,
            playerNumber: player.playerNumber,
            effect: result,
            playerState: this.getPlayerState(socketId)
        };
    }

    /**
     * Handle portal choice. Requires a matching pendingEncounter — without
     * the ownership check a malicious client could spam portal_choice
     * out-of-turn and (via advanceTurn) skip another player's turn.
     */
    handlePortalChoice(socketId, enter) {
        const player = this.players.get(socketId);
        if (!player) {
            return { success: false, error: 'Player not found' };
        }

        if (!this.pendingEncounter || this.pendingEncounter.socketId !== socketId) {
            return { success: false, error: 'No pending portal choice' };
        }
        const isPortal = this.pendingEncounter.encounter
            && (this.pendingEncounter.encounter.type === 'portal'
                || this.pendingEncounter.encounter.kind === 'portal');
        if (!isPortal) {
            return { success: false, error: 'Pending encounter is not a portal' };
        }

        this.pendingEncounter = null;
        this._clearPendingTimer();

        if (!enter) {
            // Player declined portal
            this.advanceTurn();
            return {
                success: true,
                playerNumber: player.playerNumber,
                newTile: player.currentTile,
                playerStates: this.getPlayerStates(),
                currentPlayerIndex: this.currentPlayerIndex,
                gameEnded: this.gameState === 'ended'
            };
        }

        // Process portal
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
     * Handle reroll choice (spell scroll). Requires a matching pendingRoll
     * AND that the player actually owns a spell_scroll — without these checks
     * a client without the item could spam reroll_choice and replace any
     * roll, and a non-current player could mess with the active player's roll.
     */
    handleRerollChoice(socketId, reroll) {
        const player = this.players.get(socketId);
        if (!player) {
            return { success: false, error: 'Player not found' };
        }

        if (!this.pendingRoll || this.pendingRoll.socketId !== socketId) {
            return { success: false, error: 'No pending roll to reroll' };
        }

        if (!reroll) {
            return { success: true, playerNumber: player.playerNumber };
        }

        const scrollIndex = player.inventory.indexOf('spell_scroll');
        if (scrollIndex === -1) {
            return { success: false, error: 'No spell scroll in inventory' };
        }
        player.inventory.splice(scrollIndex, 1);

        // New roll (crypto-strong) — replaces the existing pending roll and
        // re-arms its timeout.
        const roll = rollDie();
        this.pendingRoll = {
            socketId,
            roll,
            modifiedRoll: roll,
            modifiers: { reroll: true }
        };
        this._armPendingTimer('reroll');

        return {
            success: true,
            playerNumber: player.playerNumber,
            roll,
            modifiedRoll: roll
        };
    }

    /**
     * Advance to the next player's turn. Returns true if an eligible player
     * was found, false if every remaining player is disconnected or has won
     * (in which case the game ends rather than spinning on an unreachable
     * currentPlayerIndex).
     */
    advanceTurn() {
        if (this.playerOrder.length === 0) {
            this.gameState = 'ended';
            return false;
        }

        let nextIndex = (this.currentPlayerIndex + 1) % this.playerOrder.length;
        let attempts = 0;
        let found = false;

        // Skip disconnected players and winners
        while (attempts < this.playerOrder.length) {
            const nextSocketId = this.playerOrder[nextIndex];
            const nextPlayer = this.players.get(nextSocketId);

            if (nextPlayer && nextPlayer.connected && !nextPlayer.hasWon) {
                found = true;
                break;
            }

            nextIndex = (nextIndex + 1) % this.playerOrder.length;
            attempts++;
        }

        if (!found) {
            // Nobody can take a turn (everyone disconnected or already won).
            // End the game instead of leaving the room wedged.
            this.gameState = 'ended';
            this.lastActivity = Date.now();
            return false;
        }

        this.currentPlayerIndex = nextIndex;
        this.lastActivity = Date.now();
        return true;
    }

    /**
     * Handle a player disconnecting. If they were the active player or held
     * pending state, clear the pending state and advance the turn so the room
     * doesn't wedge. Returns whether the turn was advanced (callers should
     * broadcast turn_complete in that case).
     */
    handlePlayerDisconnect(socketId) {
        const player = this.players.get(socketId);
        if (!player) return { advanced: false };

        player.connected = false;
        this.lastActivity = Date.now();

        if (this.gameState !== 'playing') {
            return { advanced: false, playerNumber: player.playerNumber };
        }

        const wasCurrent = this.playerOrder[this.currentPlayerIndex] === socketId;
        const ownsPendingRoll = this.pendingRoll && this.pendingRoll.socketId === socketId;
        const ownsPendingEncounter = this.pendingEncounter && this.pendingEncounter.socketId === socketId;

        if (ownsPendingRoll || ownsPendingEncounter) {
            this.pendingRoll = null;
            this.pendingEncounter = null;
            this._clearPendingTimer();
        }

        let advanced = false;
        if (wasCurrent || ownsPendingRoll || ownsPendingEncounter) {
            advanced = this.advanceTurn();
        }

        return { advanced, playerNumber: player.playerNumber };
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
