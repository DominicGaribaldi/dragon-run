/**
 * Unit tests for CharacterData.js
 */

import { describe, it, expect } from 'vitest';
import { CharacterData } from '../mocks/globals.js';

describe('CharacterData', () => {
    describe('characters', () => {
        it('should have 6 characters defined', () => {
            const characters = Object.values(CharacterData.characters);
            expect(characters).toHaveLength(6);
        });

        it('should have all required character ids', () => {
            const ids = Object.keys(CharacterData.characters);
            expect(ids).toContain('reginald');
            expect(ids).toContain('elara');
            expect(ids).toContain('kaelen');
            expect(ids).toContain('aurelia');
            expect(ids).toContain('grizelda');
            expect(ids).toContain('pippin');
        });
    });

    describe('character properties', () => {
        it('each character should have required properties', () => {
            const characters = CharacterData.getAllCharacters();
            characters.forEach(char => {
                expect(char.id).toBeDefined();
                expect(char.name).toBeDefined();
                expect(char.title).toBeDefined();
                expect(char.description).toBeDefined();
                expect(char.color).toBeDefined();
                expect(char.preferredStat).toBeDefined();
                expect(char.passive).toBeDefined();
                expect(char.stats).toBeDefined();
            });
        });

        it('each character should have 6 stats', () => {
            const characters = CharacterData.getAllCharacters();
            characters.forEach(char => {
                expect(Object.keys(char.stats)).toHaveLength(6);
                expect(char.stats.defense).toBeDefined();
                expect(char.stats.magic).toBeDefined();
                expect(char.stats.agility).toBeDefined();
                expect(char.stats.charisma).toBeDefined();
                expect(char.stats.engineering).toBeDefined();
                expect(char.stats.luck).toBeDefined();
            });
        });

        it('each character should have balanced stats (all same total)', () => {
            const characters = CharacterData.getAllCharacters();
            const totals = characters.map(char =>
                Object.values(char.stats).reduce((a, b) => a + b, 0)
            );
            // All characters should have the same stat total
            const firstTotal = totals[0];
            totals.forEach(total => {
                expect(total).toBe(firstTotal);
            });
        });
    });

    describe('Sir Reginald', () => {
        const char = CharacterData.characters.reginald;

        it('should be The Brave Knight', () => {
            expect(char.name).toBe('Sir Reginald');
            expect(char.title).toBe('The Brave Knight');
        });

        it('should have Ironclad passive', () => {
            expect(char.passive.name).toBe('Ironclad');
        });

        it('should have defense as preferred stat (5)', () => {
            expect(char.preferredStat).toBe('defense');
            expect(char.stats.defense).toBe(5);
        });
    });

    describe('Elara', () => {
        const char = CharacterData.characters.elara;

        it('should be The Clever Wizard', () => {
            expect(char.name).toBe('Elara');
            expect(char.title).toBe('The Clever Wizard');
        });

        it('should have Arcane Insight passive with 2 uses per game', () => {
            expect(char.passive.name).toBe('Arcane Insight');
            expect(char.passive.usesRemaining).toBe(2);
        });

        it('should have magic as preferred stat (5)', () => {
            expect(char.preferredStat).toBe('magic');
            expect(char.stats.magic).toBe(5);
        });
    });

    describe('Kaelen', () => {
        const char = CharacterData.characters.kaelen;

        it('should be The Rogue Archer', () => {
            expect(char.name).toBe('Kaelen');
            expect(char.title).toBe('The Rogue Archer');
        });

        it('should have Parkour passive', () => {
            expect(char.passive.name).toBe('Parkour');
        });

        it('should have agility as preferred stat (5)', () => {
            expect(char.preferredStat).toBe('agility');
            expect(char.stats.agility).toBe(5);
        });
    });

    describe('Princess Aurelia', () => {
        const char = CharacterData.characters.aurelia;

        it('should be The Royal', () => {
            expect(char.name).toBe('Princess Aurelia');
            expect(char.title).toBe('The Royal');
        });

        it('should have Royal Tax passive', () => {
            expect(char.passive.name).toBe('Royal Tax');
        });

        it('should have charisma as preferred stat (5)', () => {
            expect(char.preferredStat).toBe('charisma');
            expect(char.stats.charisma).toBe(5);
        });
    });

    describe('Grizelda', () => {
        const char = CharacterData.characters.grizelda;

        it('should be Dwarf Engineer', () => {
            expect(char.name).toBe('Grizelda');
            expect(char.title).toBe('Dwarf Engineer');
        });

        it('should have Shortcuts passive', () => {
            expect(char.passive.name).toBe('Shortcuts');
        });

        it('should have engineering as preferred stat (5)', () => {
            expect(char.preferredStat).toBe('engineering');
            expect(char.stats.engineering).toBe(5);
        });
    });

    describe('Pippin', () => {
        const char = CharacterData.characters.pippin;

        it('should be Mischievous Bard', () => {
            expect(char.name).toBe('Pippin');
            expect(char.title).toBe('Mischievous Bard');
        });

        it('should have Distraction passive', () => {
            expect(char.passive.name).toBe('Distraction');
        });

        it('should have luck as preferred stat (5)', () => {
            expect(char.preferredStat).toBe('luck');
            expect(char.stats.luck).toBe(5);
        });
    });

    describe('getCharacter', () => {
        it('should return reginald by id', () => {
            const char = CharacterData.getCharacter('reginald');
            expect(char).not.toBeNull();
            expect(char.name).toBe('Sir Reginald');
        });

        it('should return elara by id', () => {
            const char = CharacterData.getCharacter('elara');
            expect(char).not.toBeNull();
            expect(char.name).toBe('Elara');
        });

        it('should return null for unknown id', () => {
            const char = CharacterData.getCharacter('unknown');
            expect(char).toBeNull();
        });

        it('should return null for empty id', () => {
            const char = CharacterData.getCharacter('');
            expect(char).toBeNull();
        });
    });

    describe('getAllCharacters', () => {
        it('should return all characters as array', () => {
            const characters = CharacterData.getAllCharacters();
            expect(Array.isArray(characters)).toBe(true);
            expect(characters).toHaveLength(6);
        });

        it('should return character objects with all properties', () => {
            const characters = CharacterData.getAllCharacters();
            characters.forEach(char => {
                expect(typeof char).toBe('object');
                expect(char.id).toBeDefined();
            });
        });
    });

    describe('getCharacterIds', () => {
        it('should return all character ids', () => {
            const ids = CharacterData.getCharacterIds();
            expect(ids).toHaveLength(6);
            expect(ids).toContain('reginald');
            expect(ids).toContain('elara');
            expect(ids).toContain('kaelen');
            expect(ids).toContain('aurelia');
            expect(ids).toContain('grizelda');
            expect(ids).toContain('pippin');
        });

        it('should return array of strings', () => {
            const ids = CharacterData.getCharacterIds();
            ids.forEach(id => {
                expect(typeof id).toBe('string');
            });
        });
    });

    describe('character colors', () => {
        it('each character should have a unique color', () => {
            const characters = CharacterData.getAllCharacters();
            const colors = characters.map(c => c.color);
            const uniqueColors = new Set(colors);
            expect(uniqueColors.size).toBe(characters.length);
        });

        it('colors should be valid hex values', () => {
            const characters = CharacterData.getAllCharacters();
            characters.forEach(char => {
                expect(typeof char.color).toBe('number');
                expect(char.color).toBeGreaterThanOrEqual(0);
                expect(char.color).toBeLessThanOrEqual(0xFFFFFF);
            });
        });
    });

    describe('passive abilities', () => {
        it('each passive should have name and description', () => {
            const characters = CharacterData.getAllCharacters();
            characters.forEach(char => {
                expect(char.passive.name).toBeDefined();
                expect(typeof char.passive.name).toBe('string');
                expect(char.passive.description).toBeDefined();
                expect(typeof char.passive.description).toBe('string');
            });
        });

        it('each passive should have an icon', () => {
            const characters = CharacterData.getAllCharacters();
            characters.forEach(char => {
                expect(char.passive.icon).toBeDefined();
            });
        });
    });
});
