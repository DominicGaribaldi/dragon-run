/**
 * Unit tests for EncounterData.js
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EncounterData, CharacterData } from '../mocks/globals.js';

describe('EncounterData', () => {
    describe('dragons', () => {
        it('should have 3 dragons defined', () => {
            const dragons = Object.values(EncounterData.dragons);
            expect(dragons).toHaveLength(3);
        });

        it('should have Slime-Tooth at head tile 32, tail tile 6', () => {
            const dragon = EncounterData.dragons.slimetooth;
            expect(dragon.headTile).toBe(32);
            expect(dragon.tailTile).toBe(6);
            expect(dragon.name).toBe('Slime-Tooth');
        });

        it('should have Frost-Fang at head tile 62, tail tile 19', () => {
            const dragon = EncounterData.dragons.frostfang;
            expect(dragon.headTile).toBe(62);
            expect(dragon.tailTile).toBe(19);
        });

        it('should have Ignis at head tile 98, tail tile 75', () => {
            const dragon = EncounterData.dragons.ignis;
            expect(dragon.headTile).toBe(98);
            expect(dragon.tailTile).toBe(75);
        });
    });

    describe('getDragonAtTile', () => {
        it('should return Slime-Tooth for tile 32', () => {
            const dragon = EncounterData.getDragonAtTile(32);
            expect(dragon).not.toBeNull();
            expect(dragon.id).toBe('slimetooth');
        });

        it('should return Frost-Fang for tile 62', () => {
            const dragon = EncounterData.getDragonAtTile(62);
            expect(dragon).not.toBeNull();
            expect(dragon.id).toBe('frostfang');
        });

        it('should return null for non-dragon head tile', () => {
            const dragon = EncounterData.getDragonAtTile(50);
            expect(dragon).toBeNull();
        });

        it('should return null for dragon tail tile (not head)', () => {
            const dragon = EncounterData.getDragonAtTile(6);
            expect(dragon).toBeNull();
        });
    });

    describe('getDragonZoneAtTile', () => {
        it('should return dragon info when on head tile', () => {
            const result = EncounterData.getDragonZoneAtTile(32);
            expect(result).not.toBeNull();
            expect(result.dragon.id).toBe('slimetooth');
            expect(result.isHead).toBe(true);
            expect(result.isTail).toBe(false);
        });

        it('should return dragon info when on tail tile', () => {
            const result = EncounterData.getDragonZoneAtTile(6);
            expect(result).not.toBeNull();
            expect(result.dragon.id).toBe('slimetooth');
            expect(result.isHead).toBe(false);
            expect(result.isTail).toBe(true);
        });

        it('should return dragon info when in middle of dragon zone', () => {
            const result = EncounterData.getDragonZoneAtTile(20);
            expect(result).not.toBeNull();
            expect(result.dragon.id).toBe('slimetooth');
            expect(result.isHead).toBe(false);
            expect(result.isTail).toBe(false);
        });

        it('should return null when outside all dragon zones', () => {
            const result = EncounterData.getDragonZoneAtTile(5);
            expect(result).toBeNull();
        });
    });

    describe('knights', () => {
        it('should have 3 knights defined', () => {
            const knights = Object.values(EncounterData.knights);
            expect(knights).toHaveLength(3);
        });

        it('should have Hedge Knight at base 9, destination 22', () => {
            const knight = EncounterData.knights.hedge;
            expect(knight.baseTile).toBe(9);
            expect(knight.destinationTile).toBe(22);
        });

        it('should have Griffin Rider at base 45, destination 66', () => {
            const knight = EncounterData.knights.griffin;
            expect(knight.baseTile).toBe(45);
            expect(knight.destinationTile).toBe(66);
        });

        it('should have Champion at base 80, destination 99', () => {
            const knight = EncounterData.knights.champion;
            expect(knight.baseTile).toBe(80);
            expect(knight.destinationTile).toBe(99);
        });
    });

    describe('getKnightAtTile', () => {
        it('should return Hedge Knight for tile 9', () => {
            const knight = EncounterData.getKnightAtTile(9);
            expect(knight).not.toBeNull();
            expect(knight.id).toBe('hedge');
        });

        it('should return null for non-knight tile', () => {
            const knight = EncounterData.getKnightAtTile(10);
            expect(knight).toBeNull();
        });

        it('should return null for knight destination tile', () => {
            const knight = EncounterData.getKnightAtTile(22);
            expect(knight).toBeNull();
        });
    });

    describe('monsters', () => {
        it('should have 6 monsters defined', () => {
            const monsters = Object.values(EncounterData.monsters);
            expect(monsters).toHaveLength(6);
        });

        it('should have Milk Baby at tile 14', () => {
            const monster = EncounterData.monsters.milkbaby;
            expect(monster.tile).toBe(14);
        });

        it('should have Tax Goblin at tile 28', () => {
            const monster = EncounterData.monsters.taxgoblin;
            expect(monster.tile).toBe(28);
        });
    });

    describe('getMonsterAtTile', () => {
        it('should return Milk Baby for tile 14', () => {
            const monster = EncounterData.getMonsterAtTile(14);
            expect(monster).not.toBeNull();
            expect(monster.id).toBe('milkbaby');
        });

        it('should return Hypno-Toad for tile 58', () => {
            const monster = EncounterData.getMonsterAtTile(58);
            expect(monster).not.toBeNull();
            expect(monster.id).toBe('hypnotoad');
        });

        it('should return null for non-monster tile', () => {
            const monster = EncounterData.getMonsterAtTile(15);
            expect(monster).toBeNull();
        });
    });

    describe('performCheck', () => {
        describe('standard threshold checks', () => {
            it('should succeed when roll >= successMin', () => {
                const dragon = EncounterData.getDragonAtTile(32);
                const result = EncounterData.performCheck(dragon, 4);
                expect(result.success).toBe(true);
                expect(result.roll).toBe(4);
            });

            it('should succeed when roll equals successMin exactly', () => {
                const dragon = EncounterData.getDragonAtTile(32);
                const result = EncounterData.performCheck(dragon, 4);
                expect(result.success).toBe(true);
            });

            it('should fail when roll < successMin', () => {
                // Slime-Tooth has successMin=3, so roll of 2 should fail
                const dragon = EncounterData.getDragonAtTile(32);
                const result = EncounterData.performCheck(dragon, 2);
                expect(result.success).toBe(false);
                expect(result.message).toBe('The acid burns! You slide down to safety...');
            });

            it('should succeed on roll 6 for any standard check', () => {
                const dragon = EncounterData.getDragonAtTile(32);
                const result = EncounterData.performCheck(dragon, 6);
                expect(result.success).toBe(true);
            });

            it('should fail on roll 1 for standard threshold checks', () => {
                const dragon = EncounterData.getDragonAtTile(32);
                const result = EncounterData.performCheck(dragon, 1);
                expect(result.success).toBe(false);
            });
        });

        describe('even/odd checks', () => {
            it('should succeed on even roll for even-type check', () => {
                const vampires = EncounterData.getMonsterAtTile(66);
                expect(vampires.encounterCheck.type).toBe('even');

                expect(EncounterData.performCheck(vampires, 2).success).toBe(true);
                expect(EncounterData.performCheck(vampires, 4).success).toBe(true);
                expect(EncounterData.performCheck(vampires, 6).success).toBe(true);
            });

            it('should fail on odd roll for even-type check', () => {
                const vampires = EncounterData.getMonsterAtTile(66);

                expect(EncounterData.performCheck(vampires, 1).success).toBe(false);
                expect(EncounterData.performCheck(vampires, 3).success).toBe(false);
                expect(EncounterData.performCheck(vampires, 5).success).toBe(false);
            });

            it('should succeed on odd roll for odd-type check', () => {
                const hypnotoad = EncounterData.getMonsterAtTile(58);
                expect(hypnotoad.encounterCheck.type).toBe('odd');

                expect(EncounterData.performCheck(hypnotoad, 1).success).toBe(true);
                expect(EncounterData.performCheck(hypnotoad, 3).success).toBe(true);
                expect(EncounterData.performCheck(hypnotoad, 5).success).toBe(true);
            });

            it('should fail on even roll for odd-type check', () => {
                const hypnotoad = EncounterData.getMonsterAtTile(58);

                expect(EncounterData.performCheck(hypnotoad, 2).success).toBe(false);
                expect(EncounterData.performCheck(hypnotoad, 4).success).toBe(false);
                expect(EncounterData.performCheck(hypnotoad, 6).success).toBe(false);
            });
        });

        describe('Pippin ability (Distraction)', () => {
            const pippinCharacter = { id: 'pippin' };

            it('should lower threshold by 1 for monster encounters with Pippin', () => {
                const taxgoblin = EncounterData.getMonsterAtTile(28);
                // Normal threshold is 4, with Pippin it's 3
                const result = EncounterData.performCheck(taxgoblin, 3, pippinCharacter);
                expect(result.success).toBe(true);
            });

            it('should not affect dragon encounters with Pippin', () => {
                // Frost-Fang has defenseCheck (not encounterCheck) with successMin=4.
                // Without Pippin: roll 3 < 4 = fail. With Pippin's bonus erroneously
                // applied: threshold would drop to 2 and roll 3 would pass.
                // Asserting fail proves Pippin's monsterBonus is gated on encounterCheck.
                const dragon = EncounterData.getDragonAtTile(62);
                const result = EncounterData.performCheck(dragon, 3, pippinCharacter);
                expect(result.success).toBe(false);
            });

            it('should lower threshold by 2 (not 1) for monster encounters with Pippin', () => {
                // Tax Goblin has encounterCheck with successMin=4. With Pippin: 4-2=2.
                // Roll 2 should pass with Pippin; without Pippin would fail.
                const taxgoblin = EncounterData.getMonsterAtTile(28);
                expect(EncounterData.performCheck(taxgoblin, 2, pippinCharacter).success).toBe(true);
                expect(EncounterData.performCheck(taxgoblin, 2).success).toBe(false);
            });

            it('should have minimum threshold of 2 with Pippin', () => {
                const hillgiant = EncounterData.getMonsterAtTile(42);
                // Hill giant has successMin of 2, with Pippin bonus should cap at 2
                expect(hillgiant.encounterCheck.successMin).toBe(2);
            });
        });

        describe('encounters without checks', () => {
            it('should return success for encounters without defenseCheck or encounterCheck', () => {
                const knight = EncounterData.getKnightAtTile(9);
                const result = EncounterData.performCheck(knight, 1);
                expect(result.success).toBe(true);
            });
        });
    });

    describe('portals', () => {
        it('should have 3 portal types', () => {
            const portals = EncounterData.getAllPortals();
            expect(portals).toHaveLength(3);
        });

        it('should have balanced portal with correct effects count', () => {
            const portal = EncounterData.special.portalBalanced;
            expect(portal.portalType).toBe('balanced');
            expect(portal.effects.length).toBeGreaterThan(0);
        });

        it('should have risky portal with high-risk effects', () => {
            const portal = EncounterData.special.portalRisky;
            expect(portal.portalType).toBe('risky');
            // Risky portal should have some big moves
            const bigMoves = portal.effects.filter(e => e.type === 'move' && Math.abs(e.value) >= 8);
            expect(bigMoves.length).toBeGreaterThan(0);
        });

        it('should have chaotic portal with swap/teleport effects', () => {
            const portal = EncounterData.special.portalChaotic;
            expect(portal.portalType).toBe('chaotic');
            const chaosEffects = portal.effects.filter(e =>
                e.type === 'swap_player' ||
                e.type === 'teleport_random' ||
                e.type === 'move_to'
            );
            expect(chaosEffects.length).toBeGreaterThan(0);
        });
    });

    describe('getPortalAtTile', () => {
        // Portal tiles are populated dynamically by Board.js during procedural placement.
        // Set them explicitly for unit tests so we don't rely on Board ordering.
        beforeEach(() => {
            EncounterData.special.portalBalanced.tiles = [42];
            EncounterData.special.portalRisky.tiles = [60];
            EncounterData.special.portalChaotic.tiles = [78];
        });

        it('should return balanced portal at its tile', () => {
            const portal = EncounterData.getPortalAtTile(42);
            expect(portal).not.toBeNull();
            expect(portal.portalType).toBe('balanced');
        });

        it('should return risky portal at its tile', () => {
            const portal = EncounterData.getPortalAtTile(60);
            expect(portal).not.toBeNull();
            expect(portal.portalType).toBe('risky');
        });

        it('should return chaotic portal at its tile', () => {
            const portal = EncounterData.getPortalAtTile(78);
            expect(portal).not.toBeNull();
            expect(portal.portalType).toBe('chaotic');
        });

        it('should return null for non-portal tile', () => {
            const portal = EncounterData.getPortalAtTile(1);
            expect(portal).toBeNull();
        });
    });

    describe('rollPortalEffect', () => {
        it('should return an effect from the portal effects array', () => {
            const portal = EncounterData.special.portalBalanced;
            const effect = EncounterData.rollPortalEffect(portal);
            expect(effect).not.toBeNull();
            expect(portal.effects).toContainEqual(effect);
        });

        it('should return null for null portal', () => {
            const effect = EncounterData.rollPortalEffect(null);
            expect(effect).toBeNull();
        });

        it('should return null for portal without effects', () => {
            const effect = EncounterData.rollPortalEffect({ name: 'Empty' });
            expect(effect).toBeNull();
        });
    });

    describe('Pippin portalBonus (Distraction reroll-on-bad)', () => {
        const pippinCharacter = CharacterData.characters.pippin;
        let randomSpy;

        afterEach(() => {
            if (randomSpy) randomSpy.mockRestore();
        });

        it('should reroll when first effect is bad and use second effect', () => {
            const portal = EncounterData.special.portalRisky;
            // Risky effects total weight = 10. Sequence: bad (retreat_8 at weight ~5)
            // then good (advance_10 at weight 0-2). Force first roll to land on first
            // effect (advance_10 weight 2 -> good), then second roll different.
            //
            // Easier: use a custom portal with known effect ordering.
            const customPortal = {
                effects: [
                    { id: 'bad_move', weight: 1, type: 'move', value: -5, message: 'bad' },
                    { id: 'good_move', weight: 1, type: 'move', value: 5, message: 'good' }
                ]
            };
            // First Math.random() < 0.5 -> picks first effect (bad).
            // Second Math.random() >= 0.5 -> picks second effect (good).
            const sequence = [0.1, 0.9];
            let callCount = 0;
            randomSpy = vi.spyOn(Math, 'random').mockImplementation(() => sequence[callCount++]);

            const effect = EncounterData.rollPortalEffect(customPortal, pippinCharacter);
            expect(effect.id).toBe('good_move');
            expect(callCount).toBe(2); // verified Pippin rerolled
        });

        it('should not reroll when first effect is already good', () => {
            const customPortal = {
                effects: [
                    { id: 'good_move', weight: 1, type: 'move', value: 5, message: 'good' },
                    { id: 'bad_move', weight: 1, type: 'move', value: -5, message: 'bad' }
                ]
            };
            // First Math.random() < 0.5 -> picks first effect (good). No reroll.
            const sequence = [0.1, 0.9];
            let callCount = 0;
            randomSpy = vi.spyOn(Math, 'random').mockImplementation(() => sequence[callCount++]);

            const effect = EncounterData.rollPortalEffect(customPortal, pippinCharacter);
            expect(effect.id).toBe('good_move');
            expect(callCount).toBe(1); // single roll, no reroll
        });

        it('should not reroll for non-Pippin characters', () => {
            const customPortal = {
                effects: [
                    { id: 'bad_move', weight: 1, type: 'move', value: -5, message: 'bad' },
                    { id: 'good_move', weight: 1, type: 'move', value: 5, message: 'good' }
                ]
            };
            const sequence = [0.1, 0.9];
            let callCount = 0;
            randomSpy = vi.spyOn(Math, 'random').mockImplementation(() => sequence[callCount++]);

            const elaraCharacter = CharacterData.characters.elara;
            const effect = EncounterData.rollPortalEffect(customPortal, elaraCharacter);
            expect(effect.id).toBe('bad_move'); // no reroll, sticks with bad
            expect(callCount).toBe(1);
        });

        it('classifies bad effects correctly', () => {
            expect(EncounterData._isPortalEffectBad({ type: 'move', value: -3 })).toBe(true);
            expect(EncounterData._isPortalEffectBad({ type: 'move', value: 3 })).toBe(false);
            expect(EncounterData._isPortalEffectBad({ type: 'lose_item' })).toBe(true);
            expect(EncounterData._isPortalEffectBad({ type: 'lose_armor' })).toBe(true);
            expect(EncounterData._isPortalEffectBad({ type: 'lose_all_items' })).toBe(true);
            expect(EncounterData._isPortalEffectBad({ type: 'status', effect: 'stunned' })).toBe(true);
            expect(EncounterData._isPortalEffectBad({ type: 'all_status' })).toBe(true);
            expect(EncounterData._isPortalEffectBad({ type: 'move_to', value: 1 })).toBe(true);
            expect(EncounterData._isPortalEffectBad({ type: 'move_to', value: 50 })).toBe(false);
            expect(EncounterData._isPortalEffectBad({ type: 'loot' })).toBe(false);
            expect(EncounterData._isPortalEffectBad({ type: 'armor' })).toBe(false);
            expect(EncounterData._isPortalEffectBad({ type: 'cleanse' })).toBe(false);
            expect(EncounterData._isPortalEffectBad({ type: 'none', id: 'nothing_bad' })).toBe(true);
            expect(EncounterData._isPortalEffectBad({ type: 'none', id: 'nothing_good' })).toBe(false);
        });
    });

    describe('getEncounterAtTile', () => {
        it('should return dragon for dragon head tile', () => {
            const encounter = EncounterData.getEncounterAtTile(32);
            expect(encounter).not.toBeNull();
            expect(encounter.id).toBe('slimetooth');
        });

        it('should return knight for knight base tile', () => {
            const encounter = EncounterData.getEncounterAtTile(9);
            expect(encounter).not.toBeNull();
            expect(encounter.id).toBe('hedge');
        });

        it('should return monster for monster tile', () => {
            const encounter = EncounterData.getEncounterAtTile(14);
            expect(encounter).not.toBeNull();
            expect(encounter.id).toBe('milkbaby');
        });

        it('should return special for special tile', () => {
            const encounter = EncounterData.getEncounterAtTile(50);
            expect(encounter).not.toBeNull();
            expect(encounter.id).toBe('rustyAnvil');
        });

        it('should return null for empty tile', () => {
            const encounter = EncounterData.getEncounterAtTile(2);
            expect(encounter).toBeNull();
        });
    });

    describe('special tiles', () => {
        it('should have Rusty Anvil at tile 50', () => {
            const special = EncounterData.special.rustyAnvil;
            expect(special.tile).toBe(50);
            expect(special.effect.type).toBe('gain_armor');
        });

        it('should have treasure chests at multiple tiles', () => {
            const lootChest = EncounterData.special.lootChest;
            expect(lootChest.tiles).toContain(15);
            expect(lootChest.tiles).toContain(35);
            expect(lootChest.tiles).toContain(55);
        });
    });

    describe('getSpecialAtTile', () => {
        it('should return Rusty Anvil for tile 50', () => {
            const special = EncounterData.getSpecialAtTile(50);
            expect(special).not.toBeNull();
            expect(special.id).toBe('rustyAnvil');
        });

        it('should return Loot Chest for tile 15', () => {
            const special = EncounterData.getSpecialAtTile(15);
            expect(special).not.toBeNull();
            expect(special.id).toBe('lootChest');
        });

        it('should return null for non-special tile', () => {
            const special = EncounterData.getSpecialAtTile(3);
            expect(special).toBeNull();
        });
    });
});
