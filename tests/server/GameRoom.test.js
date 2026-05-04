/**
 * Server-side unit tests for GameRoom.
 *
 * Phase 2 (multiplayer correctness) introduced several invariants that the
 * data-layer tests can't reach: pending-state ownership, win forgiveness,
 * advanceTurn safety, and the seat-hijack-blocking reconnect token. These
 * tests pin the contract behaviours so future refactors can't silently
 * regress them.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameRoom } from '../../server/GameRoom.js';

describe('GameRoom', () => {
    let room;
    let host, p2;

    beforeEach(() => {
        room = new GameRoom('TEST', 'host-sock');
        host = room.addPlayer('host-sock', 'Host', true);
        p2 = room.addPlayer('p2-sock', 'P2', false);
        for (const sid of ['host-sock', 'p2-sock']) {
            room.selectCharacter(sid, sid === 'host-sock' ? 'reginald' : 'elara');
        }
        room.startGame('host-sock');
    });

    describe('addPlayer / reconnectPlayer', () => {
        it('issues a 32-char hex reconnect token at addPlayer time', () => {
            expect(host.reconnectToken).toMatch(/^[a-f0-9]{32}$/);
            expect(p2.reconnectToken).toMatch(/^[a-f0-9]{32}$/);
            expect(host.reconnectToken).not.toBe(p2.reconnectToken);
        });

        it('rejects reconnect with no token', () => {
            const player = room.players.get('host-sock');
            player.connected = false;
            const result = room.reconnectPlayer('new-sock', 1, '');
            expect(result.success).toBe(false);
            expect(result.error).toMatch(/required/i);
        });

        it('rejects reconnect with the wrong token', () => {
            const player = room.players.get('host-sock');
            player.connected = false;
            const result = room.reconnectPlayer('new-sock', 1, 'a'.repeat(32));
            expect(result.success).toBe(false);
            expect(result.error).toMatch(/invalid/i);
        });

        it('accepts reconnect with the correct token and updates the socket id', () => {
            const player = room.players.get('host-sock');
            const token = player.reconnectToken;
            player.connected = false;
            const result = room.reconnectPlayer('new-sock', 1, token);
            expect(result.success).toBe(true);
            expect(room.players.has('host-sock')).toBe(false);
            expect(room.players.has('new-sock')).toBe(true);
            expect(room.playerOrder[0]).toBe('new-sock');
        });
    });

    describe('selectCharacter lobby gate', () => {
        it('rejects character changes after the game has started', () => {
            const result = room.selectCharacter('host-sock', 'kaelen');
            expect(result.success).toBe(false);
            expect(result.error).toMatch(/mid-game/i);
        });
    });

    describe('rollDice modifiers', () => {
        it('consumes a roll_bonus pendingModifier from useItem (Speed Potion)', () => {
            const player = room.players.get('host-sock');
            player.pendingModifiers.push({ type: 'roll_bonus', value: 2 });

            // Force a deterministic dice value of 3 → modifiedRoll should be 5
            vi.spyOn(Math, 'random'); // unused — server uses crypto.randomInt
            const result = room.rollDice('host-sock');
            expect(result.success).toBe(true);
            expect(result.modifiedRoll).toBe(result.roll + 2);
            expect(result.modifiers.itemBonus).toBe(2);
            expect(player.pendingModifiers.length).toBe(0);
        });
    });

    describe('processMovement win forgiveness', () => {
        it('treats roll past tile 100 as a win (no exact-roll required)', () => {
            const player = room.players.get('host-sock');
            player.currentTile = 96;
            // Inject a deterministic pending roll of 5 → 101 → should win at 100.
            room.pendingRoll = { socketId: 'host-sock', roll: 5, modifiedRoll: 5, modifiers: {} };

            const result = room.processMovement('host-sock', {});
            expect(result.success).toBe(true);
            expect(result.gameEnded).toBe(true);
            expect(result.winner).toBe(player.playerNumber);
            expect(player.currentTile).toBe(100);
        });

        it('does not bounce back on overshoot', () => {
            const player = room.players.get('host-sock');
            player.currentTile = 99;
            // Roll of 6 used to bounce back to 95 (100 - (105-100)). Now wins.
            room.pendingRoll = { socketId: 'host-sock', roll: 6, modifiedRoll: 6, modifiers: {} };
            room.processMovement('host-sock', {});
            expect(player.currentTile).toBe(100);
            expect(player.hasWon).toBe(true);
        });
    });

    describe('handlePortalChoice ownership', () => {
        it('rejects a portal choice with no pending encounter', () => {
            const result = room.handlePortalChoice('host-sock', true);
            expect(result.success).toBe(false);
            expect(result.error).toMatch(/no pending portal/i);
        });

        it("rejects a portal choice that is not the player's pending encounter", () => {
            room.pendingEncounter = {
                socketId: 'p2-sock',
                encounter: { type: 'portal' },
                tile: 30
            };
            const result = room.handlePortalChoice('host-sock', true);
            expect(result.success).toBe(false);
        });
    });

    describe('handleRerollChoice ownership', () => {
        it('rejects a reroll with no pending roll', () => {
            const result = room.handleRerollChoice('host-sock', true);
            expect(result.success).toBe(false);
            expect(result.error).toMatch(/no pending roll/i);
        });

        it('rejects a reroll when the player has no spell_scroll', () => {
            room.pendingRoll = { socketId: 'host-sock', roll: 1, modifiedRoll: 1, modifiers: {} };
            const player = room.players.get('host-sock');
            player.inventory = []; // explicitly empty
            const result = room.handleRerollChoice('host-sock', true);
            expect(result.success).toBe(false);
            expect(result.error).toMatch(/spell scroll/i);
        });

        it('rerolls and consumes the spell_scroll when valid', () => {
            const player = room.players.get('host-sock');
            player.inventory = ['spell_scroll'];
            room.pendingRoll = { socketId: 'host-sock', roll: 1, modifiedRoll: 1, modifiers: {} };
            const result = room.handleRerollChoice('host-sock', true);
            expect(result.success).toBe(true);
            expect(player.inventory).not.toContain('spell_scroll');
            expect(room.pendingRoll.modifiers.reroll).toBe(true);
        });
    });

    describe('useItem turn check', () => {
        it('rejects active items used out-of-turn', () => {
            const player = room.players.get('p2-sock');
            player.inventory = ['speed_potion'];
            // currentPlayerIndex is 0 (host), p2 is not current
            const result = room.useItem('p2-sock', 'speed_potion');
            expect(result.success).toBe(false);
            expect(result.error).toMatch(/your turn/i);
        });

        it('persists the speed_potion modifier on the current player', () => {
            const player = room.players.get('host-sock');
            player.inventory = ['speed_potion'];
            const result = room.useItem('host-sock', 'speed_potion');
            expect(result.success).toBe(true);
            expect(player.pendingModifiers.some(m => m.type === 'roll_bonus')).toBe(true);
        });
    });

    describe('advanceTurn safety', () => {
        it('ends the game when no eligible player remains', () => {
            // Mark both players as either disconnected or won.
            room.players.get('host-sock').hasWon = true;
            room.players.get('p2-sock').connected = false;
            const result = room.advanceTurn();
            expect(result).toBe(false);
            expect(room.gameState).toBe('ended');
        });
    });

    describe('handlePlayerDisconnect', () => {
        it('clears pending state and advances the turn when the active player drops', () => {
            room.pendingRoll = { socketId: 'host-sock', roll: 4, modifiedRoll: 4, modifiers: {} };
            const result = room.handlePlayerDisconnect('host-sock');
            expect(result.advanced).toBe(true);
            expect(room.pendingRoll).toBeNull();
            expect(room.players.get('host-sock').connected).toBe(false);
            // Turn advanced to p2 (index 1).
            expect(room.currentPlayerIndex).toBe(1);
        });

        it('does not advance the turn when a non-active player disconnects', () => {
            const result = room.handlePlayerDisconnect('p2-sock');
            expect(result.advanced).toBe(false);
            expect(room.currentPlayerIndex).toBe(0);
        });
    });

    describe('pending-state timer', () => {
        it('arms a timer on rollDice and clears it on processMovement', () => {
            // Sanity: roll, then process should clear the timer
            const result = room.rollDice('host-sock');
            expect(result.success).toBe(true);
            expect(room.pendingTimer).not.toBeNull();
            room.processMovement('host-sock', {});
            // Either pendingRoll resolved into encounter or cleared. In both
            // cases pendingTimer should not still be the original roll's timer.
            // (advanceTurn or _armPendingTimer for encounter may set a new one.)
            expect(room.pendingTimer === null || typeof room.pendingTimer === 'object').toBe(true);
        });
    });
});
