/**
 * Dragon Run Multiplayer Server
 * Express + Socket.io server for online multiplayer
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './RoomManager.js';

const app = express();
const server = createServer(app);

// Configure CORS for Socket.io
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || '*',
        methods: ['GET', 'POST']
    }
});

// Express middleware
app.use(cors());
app.use(express.json());

// Serve static files in production
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serve the game client files from the root directory
app.use(express.static(join(__dirname, '..')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', rooms: roomManager.getRoomCount() });
});

// Room manager instance
const roomManager = new RoomManager(io);

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`[Server] Client connected: ${socket.id}`);

    // Room creation
    socket.on('create_room', (data) => {
        const result = roomManager.createRoom(socket.id, data?.playerName || 'Player 1');
        if (result.success) {
            socket.join(result.roomCode);
            socket.emit('room_created', {
                roomCode: result.roomCode,
                playerNumber: 1,
                isHost: true
            });
            console.log(`[Server] Room created: ${result.roomCode} by ${socket.id}`);
        } else {
            socket.emit('error', { message: result.error });
        }
    });

    // Room joining
    socket.on('join_room', (data) => {
        const { roomCode, playerName } = data;
        const result = roomManager.joinRoom(roomCode?.toUpperCase(), socket.id, playerName || 'Player');

        if (result.success) {
            socket.join(roomCode.toUpperCase());

            // Notify the joining player
            socket.emit('room_joined', {
                roomCode: result.roomCode,
                playerNumber: result.playerNumber,
                isHost: false,
                players: result.players,
                gameState: result.gameState
            });

            // Notify other players in the room
            socket.to(roomCode.toUpperCase()).emit('player_joined', {
                playerNumber: result.playerNumber,
                playerName: playerName || 'Player',
                players: result.players
            });

            console.log(`[Server] Player joined room ${roomCode}: ${socket.id} as Player ${result.playerNumber}`);
        } else {
            socket.emit('error', { message: result.error });
        }
    });

    // Character selection
    socket.on('select_character', (data) => {
        const result = roomManager.selectCharacter(socket.id, data.characterId);
        if (result.success) {
            io.to(result.roomCode).emit('character_selected', {
                playerNumber: result.playerNumber,
                characterId: data.characterId,
                players: result.players
            });
        } else {
            socket.emit('error', { message: result.error });
        }
    });

    // Start game (host only)
    socket.on('start_game', () => {
        const result = roomManager.startGame(socket.id);
        if (result.success) {
            io.to(result.roomCode).emit('game_started', {
                board: result.board,
                players: result.players,
                currentPlayerIndex: 0
            });
            console.log(`[Server] Game started in room ${result.roomCode}`);
        } else {
            socket.emit('error', { message: result.error });
        }
    });

    // Roll dice
    socket.on('roll_dice', () => {
        const result = roomManager.rollDice(socket.id);
        if (result.success) {
            // Send roll result to all players
            io.to(result.roomCode).emit('roll_result', {
                playerNumber: result.playerNumber,
                roll: result.roll,
                modifiedRoll: result.modifiedRoll,
                modifiers: result.modifiers
            });
        } else {
            socket.emit('error', { message: result.error });
        }
    });

    // Process movement (after roll animation completes on client)
    socket.on('process_movement', (data) => {
        const result = roomManager.processMovement(socket.id, data);
        if (result.success) {
            if (result.encounter) {
                // Encounter triggered - wait for player choice
                io.to(result.roomCode).emit('encounter_triggered', {
                    playerNumber: result.playerNumber,
                    encounter: result.encounter,
                    playerState: result.playerState
                });
            } else {
                // No encounter, turn complete
                io.to(result.roomCode).emit('turn_complete', {
                    playerStates: result.playerStates,
                    currentPlayerIndex: result.currentPlayerIndex,
                    gameEnded: result.gameEnded,
                    winner: result.winner
                });
            }
        } else {
            socket.emit('error', { message: result.error });
        }
    });

    // Encounter choice
    socket.on('encounter_choice', (data) => {
        const result = roomManager.resolveEncounter(socket.id, data);
        if (result.success) {
            // Send encounter result
            io.to(result.roomCode).emit('encounter_result', {
                playerNumber: result.playerNumber,
                success: result.encounterSuccess,
                roll: result.roll,
                effect: result.effect,
                newTile: result.newTile
            });

            // Then complete the turn
            io.to(result.roomCode).emit('turn_complete', {
                playerStates: result.playerStates,
                currentPlayerIndex: result.currentPlayerIndex,
                gameEnded: result.gameEnded,
                winner: result.winner
            });
        } else {
            socket.emit('error', { message: result.error });
        }
    });

    // Use item
    socket.on('use_item', (data) => {
        const result = roomManager.useItem(socket.id, data.itemId);
        if (result.success) {
            io.to(result.roomCode).emit('item_used', {
                playerNumber: result.playerNumber,
                itemId: data.itemId,
                effect: result.effect,
                playerState: result.playerState
            });
        } else {
            socket.emit('error', { message: result.error });
        }
    });

    // Portal choice
    socket.on('portal_choice', (data) => {
        const result = roomManager.handlePortalChoice(socket.id, data.enter);
        if (result.success) {
            io.to(result.roomCode).emit('portal_result', {
                playerNumber: result.playerNumber,
                entered: data.enter,
                newTile: result.newTile,
                portalType: result.portalType
            });

            // Complete turn
            io.to(result.roomCode).emit('turn_complete', {
                playerStates: result.playerStates,
                currentPlayerIndex: result.currentPlayerIndex,
                gameEnded: result.gameEnded,
                winner: result.winner
            });
        } else {
            socket.emit('error', { message: result.error });
        }
    });

    // Reroll choice (spell scroll)
    socket.on('reroll_choice', (data) => {
        const result = roomManager.handleRerollChoice(socket.id, data.reroll);
        if (result.success) {
            if (data.reroll) {
                io.to(result.roomCode).emit('roll_result', {
                    playerNumber: result.playerNumber,
                    roll: result.roll,
                    modifiedRoll: result.modifiedRoll,
                    isReroll: true
                });
            }
        } else {
            socket.emit('error', { message: result.error });
        }
    });

    // Leave room
    socket.on('leave_room', () => {
        const result = roomManager.leaveRoom(socket.id);
        if (result.success) {
            socket.leave(result.roomCode);
            socket.to(result.roomCode).emit('player_left', {
                playerNumber: result.playerNumber,
                players: result.players
            });
            console.log(`[Server] Player ${result.playerNumber} left room ${result.roomCode}`);
        }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
        const result = roomManager.handleDisconnect(socket.id);
        if (result.roomCode) {
            io.to(result.roomCode).emit('player_disconnected', {
                playerNumber: result.playerNumber,
                players: result.players
            });
            console.log(`[Server] Client disconnected: ${socket.id} from room ${result.roomCode}`);
        } else {
            console.log(`[Server] Client disconnected: ${socket.id}`);
        }
    });

    // Reconnection attempt
    socket.on('reconnect_attempt', (data) => {
        const { roomCode, playerNumber } = data;
        const result = roomManager.handleReconnect(socket.id, roomCode, playerNumber);
        if (result.success) {
            socket.join(roomCode);
            socket.emit('reconnected', {
                roomCode,
                playerNumber,
                gameState: result.gameState,
                players: result.players,
                board: result.board,
                currentPlayerIndex: result.currentPlayerIndex
            });
            socket.to(roomCode).emit('player_reconnected', {
                playerNumber,
                players: result.players
            });
            console.log(`[Server] Player ${playerNumber} reconnected to room ${roomCode}`);
        } else {
            socket.emit('reconnect_failed', { message: result.error });
        }
    });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`[Server] Dragon Run multiplayer server running on port ${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Cleanup stale rooms periodically (every 5 minutes)
setInterval(() => {
    roomManager.cleanupStaleRooms();
}, 5 * 60 * 1000);
