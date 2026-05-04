/**
 * RoomManager - Manages game rooms and player connections
 */

import { GameRoom } from './GameRoom.js';
import { randomInt } from 'crypto';

export class RoomManager {
    constructor(io) {
        this.io = io;
        this.rooms = new Map(); // roomCode -> GameRoom
        this.socketToRoom = new Map(); // socketId -> roomCode
    }

    /**
     * Generate a unique 4-character room code using crypto-strong RNG.
     * Math.random() is predictable from a few outputs; an attacker who can
     * observe a couple of room codes should not be able to predict the next.
     */
    generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars (0,O,1,I)
        let code;
        let attempts = 0;
        do {
            code = '';
            for (let i = 0; i < 4; i++) {
                code += chars[randomInt(0, chars.length)];
            }
            attempts++;
        } while (this.rooms.has(code) && attempts < 100);

        return code;
    }

    /**
     * Create a new room
     */
    createRoom(hostSocketId, playerName) {
        // Check if player is already in a room
        if (this.socketToRoom.has(hostSocketId)) {
            return { success: false, error: 'Already in a room' };
        }

        const roomCode = this.generateRoomCode();
        const room = new GameRoom(roomCode, hostSocketId, this.io);
        const { reconnectToken } = room.addPlayer(hostSocketId, playerName, true);

        this.rooms.set(roomCode, room);
        this.socketToRoom.set(hostSocketId, roomCode);

        return { success: true, roomCode, reconnectToken };
    }

    /**
     * Join an existing room
     */
    joinRoom(roomCode, socketId, playerName) {
        // Check if player is already in a room
        if (this.socketToRoom.has(socketId)) {
            return { success: false, error: 'Already in a room' };
        }

        const room = this.rooms.get(roomCode);
        if (!room) {
            return { success: false, error: 'Room not found' };
        }

        if (room.gameState !== 'lobby') {
            return { success: false, error: 'Game already in progress' };
        }

        if (room.getPlayerCount() >= 4) {
            return { success: false, error: 'Room is full' };
        }

        const { playerNumber, reconnectToken } = room.addPlayer(socketId, playerName, false);
        this.socketToRoom.set(socketId, roomCode);

        return {
            success: true,
            roomCode,
            playerNumber,
            reconnectToken,
            players: room.getPlayersInfo(),
            gameState: room.gameState
        };
    }

    /**
     * Select a character for a player
     */
    selectCharacter(socketId, characterId) {
        const roomCode = this.socketToRoom.get(socketId);
        if (!roomCode) {
            return { success: false, error: 'Not in a room' };
        }

        const room = this.rooms.get(roomCode);
        if (!room) {
            return { success: false, error: 'Room not found' };
        }

        const result = room.selectCharacter(socketId, characterId);
        if (result.success) {
            return {
                success: true,
                roomCode,
                playerNumber: result.playerNumber,
                players: room.getPlayersInfo()
            };
        }

        return result;
    }

    /**
     * Start the game (host only)
     */
    startGame(socketId) {
        const roomCode = this.socketToRoom.get(socketId);
        if (!roomCode) {
            return { success: false, error: 'Not in a room' };
        }

        const room = this.rooms.get(roomCode);
        if (!room) {
            return { success: false, error: 'Room not found' };
        }

        const result = room.startGame(socketId);
        if (result.success) {
            return {
                success: true,
                roomCode,
                board: result.board,
                players: room.getPlayersInfo()
            };
        }

        return result;
    }

    /**
     * Handle dice roll
     */
    rollDice(socketId) {
        const roomCode = this.socketToRoom.get(socketId);
        if (!roomCode) {
            return { success: false, error: 'Not in a room' };
        }

        const room = this.rooms.get(roomCode);
        if (!room) {
            return { success: false, error: 'Room not found' };
        }

        const result = room.rollDice(socketId);
        if (result.success) {
            return {
                success: true,
                roomCode,
                ...result
            };
        }

        return result;
    }

    /**
     * Process movement after dice roll
     */
    processMovement(socketId, data) {
        const roomCode = this.socketToRoom.get(socketId);
        if (!roomCode) {
            return { success: false, error: 'Not in a room' };
        }

        const room = this.rooms.get(roomCode);
        if (!room) {
            return { success: false, error: 'Room not found' };
        }

        const result = room.processMovement(socketId, data);
        if (result.success) {
            return {
                success: true,
                roomCode,
                ...result
            };
        }

        return result;
    }

    /**
     * Resolve encounter
     */
    resolveEncounter(socketId, data) {
        const roomCode = this.socketToRoom.get(socketId);
        if (!roomCode) {
            return { success: false, error: 'Not in a room' };
        }

        const room = this.rooms.get(roomCode);
        if (!room) {
            return { success: false, error: 'Room not found' };
        }

        const result = room.resolveEncounter(socketId, data);
        if (result.success) {
            return {
                success: true,
                roomCode,
                ...result
            };
        }

        return result;
    }

    /**
     * Use an item
     */
    useItem(socketId, itemId) {
        const roomCode = this.socketToRoom.get(socketId);
        if (!roomCode) {
            return { success: false, error: 'Not in a room' };
        }

        const room = this.rooms.get(roomCode);
        if (!room) {
            return { success: false, error: 'Room not found' };
        }

        const result = room.useItem(socketId, itemId);
        if (result.success) {
            return {
                success: true,
                roomCode,
                ...result
            };
        }

        return result;
    }

    /**
     * Handle portal choice
     */
    handlePortalChoice(socketId, enter) {
        const roomCode = this.socketToRoom.get(socketId);
        if (!roomCode) {
            return { success: false, error: 'Not in a room' };
        }

        const room = this.rooms.get(roomCode);
        if (!room) {
            return { success: false, error: 'Room not found' };
        }

        const result = room.handlePortalChoice(socketId, enter);
        if (result.success) {
            return {
                success: true,
                roomCode,
                ...result
            };
        }

        return result;
    }

    /**
     * Handle reroll choice (spell scroll)
     */
    handleRerollChoice(socketId, reroll) {
        const roomCode = this.socketToRoom.get(socketId);
        if (!roomCode) {
            return { success: false, error: 'Not in a room' };
        }

        const room = this.rooms.get(roomCode);
        if (!room) {
            return { success: false, error: 'Room not found' };
        }

        const result = room.handleRerollChoice(socketId, reroll);
        if (result.success) {
            return {
                success: true,
                roomCode,
                ...result
            };
        }

        return result;
    }

    /**
     * Leave a room
     */
    leaveRoom(socketId) {
        const roomCode = this.socketToRoom.get(socketId);
        if (!roomCode) {
            return { success: false };
        }

        const room = this.rooms.get(roomCode);
        if (!room) {
            this.socketToRoom.delete(socketId);
            return { success: false };
        }

        const playerNumber = room.removePlayer(socketId);
        this.socketToRoom.delete(socketId);

        // Delete room if empty
        if (room.getPlayerCount() === 0) {
            this.rooms.delete(roomCode);
            console.log(`[RoomManager] Room ${roomCode} deleted (empty)`);
        }

        return {
            success: true,
            roomCode,
            playerNumber,
            players: room.getPlayersInfo()
        };
    }

    /**
     * Handle disconnect. If the disconnected player held the active turn or
     * pending state, GameRoom.handlePlayerDisconnect will advance the turn
     * for us; we surface that via `turnAdvanced` so the caller can broadcast
     * turn_complete (otherwise the room wedges with nobody able to act).
     */
    handleDisconnect(socketId) {
        const roomCode = this.socketToRoom.get(socketId);
        if (!roomCode) {
            return { roomCode: null };
        }

        const room = this.rooms.get(roomCode);
        if (!room) {
            this.socketToRoom.delete(socketId);
            return { roomCode: null };
        }

        let playerNumber = null;
        let turnAdvanced = false;
        let playerStates = null;
        let currentPlayerIndex = null;
        let gameEnded = false;

        if (room.gameState === 'lobby') {
            playerNumber = room.markDisconnected(socketId);
            // In lobby: remove the seat entirely.
            room.removePlayer(socketId);
            if (room.getPlayerCount() === 0) {
                this.rooms.delete(roomCode);
                console.log(`[RoomManager] Room ${roomCode} deleted (empty)`);
            }
        } else {
            // Mid-game: mark disconnected, clear any pending state they held,
            // and advance the turn if they were holding it.
            const result = room.handlePlayerDisconnect(socketId);
            playerNumber = result.playerNumber;
            turnAdvanced = result.advanced;
            if (turnAdvanced) {
                playerStates = room.getPlayerStates();
                currentPlayerIndex = room.currentPlayerIndex;
                gameEnded = room.gameState === 'ended';
            }
        }

        this.socketToRoom.delete(socketId);

        return {
            roomCode,
            playerNumber,
            players: room.getPlayersInfo(),
            turnAdvanced,
            playerStates,
            currentPlayerIndex,
            gameEnded
        };
    }

    /**
     * Handle reconnection attempt. The reconnectToken is required — it was
     * issued at addPlayer time and is the only way to prove ownership of a
     * disconnected player's seat.
     */
    handleReconnect(socketId, roomCode, playerNumber, reconnectToken) {
        const room = this.rooms.get(roomCode);
        if (!room) {
            return { success: false, error: 'Room not found' };
        }

        const result = room.reconnectPlayer(socketId, playerNumber, reconnectToken);
        if (result.success) {
            this.socketToRoom.set(socketId, roomCode);
            return {
                success: true,
                gameState: room.gameState,
                players: room.getPlayersInfo(),
                board: room.board,
                currentPlayerIndex: room.currentPlayerIndex
            };
        }

        return result;
    }

    /**
     * Cleanup rooms that have been inactive for too long
     */
    cleanupStaleRooms() {
        const now = Date.now();
        const maxAge = 60 * 60 * 1000; // 1 hour

        for (const [roomCode, room] of this.rooms) {
            if (now - room.lastActivity > maxAge) {
                // Remove all socket mappings for this room
                for (const [socketId, code] of this.socketToRoom) {
                    if (code === roomCode) {
                        this.socketToRoom.delete(socketId);
                    }
                }
                this.rooms.delete(roomCode);
                console.log(`[RoomManager] Room ${roomCode} cleaned up (stale)`);
            }
        }
    }

    /**
     * Get total room count
     */
    getRoomCount() {
        return this.rooms.size;
    }
}
