/**
 * Unit tests for ItemData.js
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ItemData } from '../mocks/globals.js';

describe('ItemData', () => {
    describe('items', () => {
        it('should have 5 items defined', () => {
            const items = Object.values(ItemData.items);
            expect(items).toHaveLength(5);
        });

        it('should have armor_shard as a passive item', () => {
            const item = ItemData.items.armor_shard;
            expect(item.id).toBe('armor_shard');
            expect(item.type).toBe('passive');
            expect(item.effect.type).toBe('auto_save_dragon');
        });

        it('should have speed_potion as an active before_roll item', () => {
            const item = ItemData.items.speed_potion;
            expect(item.id).toBe('speed_potion');
            expect(item.type).toBe('active');
            expect(item.timing).toBe('before_roll');
            expect(item.effect.value).toBe(3);
        });

        it('should have spell_scroll as an active after_roll item', () => {
            const item = ItemData.items.spell_scroll;
            expect(item.type).toBe('active');
            expect(item.timing).toBe('after_roll');
            expect(item.effect.type).toBe('reroll');
        });

        it('should have smoke_bomb as an active during_encounter item', () => {
            const item = ItemData.items.smoke_bomb;
            expect(item.type).toBe('active');
            expect(item.timing).toBe('during_encounter');
            expect(item.effect.type).toBe('escape_encounter');
        });

        it('should have holy_shield as a passive item', () => {
            const item = ItemData.items.holy_shield;
            expect(item.type).toBe('passive');
            expect(item.effect.type).toBe('block_debuff');
            expect(item.rarity).toBe('rare');
        });

        it('should have all items with consumed flag set', () => {
            Object.values(ItemData.items).forEach(item => {
                expect(item.effect.consumed).toBe(true);
            });
        });
    });

    describe('getItem', () => {
        it('should return armor_shard by id', () => {
            const item = ItemData.getItem('armor_shard');
            expect(item).not.toBeNull();
            expect(item.name).toBe('Armor Shard');
        });

        it('should return speed_potion by id', () => {
            const item = ItemData.getItem('speed_potion');
            expect(item).not.toBeNull();
            expect(item.name).toBe('Speed Potion');
        });

        it('should return null for unknown id', () => {
            const item = ItemData.getItem('unknown_item');
            expect(item).toBeNull();
        });

        it('should return null for empty id', () => {
            const item = ItemData.getItem('');
            expect(item).toBeNull();
        });

        it('should return null for undefined id', () => {
            const item = ItemData.getItem(undefined);
            expect(item).toBeNull();
        });
    });

    describe('getAllItems', () => {
        it('should return all items as array', () => {
            const items = ItemData.getAllItems();
            expect(Array.isArray(items)).toBe(true);
            expect(items).toHaveLength(5);
        });

        it('should include all item types', () => {
            const items = ItemData.getAllItems();
            const ids = items.map(i => i.id);
            expect(ids).toContain('armor_shard');
            expect(ids).toContain('speed_potion');
            expect(ids).toContain('spell_scroll');
            expect(ids).toContain('smoke_bomb');
            expect(ids).toContain('holy_shield');
        });
    });

    describe('getRandomItem', () => {
        it('should return a valid item', () => {
            const item = ItemData.getRandomItem();
            expect(item).not.toBeNull();
            expect(item.id).toBeDefined();
            expect(item.name).toBeDefined();
        });

        it('should return items based on rarity weights', () => {
            // Run many times and check distribution roughly matches weights
            const counts = { common: 0, uncommon: 0, rare: 0 };
            const iterations = 1000;

            for (let i = 0; i < iterations; i++) {
                const item = ItemData.getRandomItem();
                counts[item.rarity]++;
            }

            // Common items (50 weight) should appear most often
            // Uncommon items (35 weight) should appear less
            // Rare items (15 weight) should appear least
            expect(counts.common).toBeGreaterThan(counts.uncommon);
            expect(counts.uncommon).toBeGreaterThan(counts.rare);
        });

        it('should never return undefined', () => {
            for (let i = 0; i < 100; i++) {
                const item = ItemData.getRandomItem();
                expect(item).not.toBeUndefined();
            }
        });
    });

    describe('getItemsByType', () => {
        it('should return only passive items', () => {
            const passiveItems = ItemData.getItemsByType('passive');
            expect(passiveItems).toHaveLength(2);
            passiveItems.forEach(item => {
                expect(item.type).toBe('passive');
            });
        });

        it('should return only active items', () => {
            const activeItems = ItemData.getItemsByType('active');
            expect(activeItems).toHaveLength(3);
            activeItems.forEach(item => {
                expect(item.type).toBe('active');
            });
        });

        it('should return empty array for unknown type', () => {
            const items = ItemData.getItemsByType('unknown');
            expect(items).toHaveLength(0);
        });
    });

    describe('item rarities', () => {
        it('should have common items', () => {
            const items = ItemData.getAllItems().filter(i => i.rarity === 'common');
            expect(items.length).toBeGreaterThan(0);
        });

        it('should have uncommon items', () => {
            const items = ItemData.getAllItems().filter(i => i.rarity === 'uncommon');
            expect(items.length).toBeGreaterThan(0);
        });

        it('should have rare items', () => {
            const items = ItemData.getAllItems().filter(i => i.rarity === 'rare');
            expect(items.length).toBeGreaterThan(0);
        });

        it('should have armor_shard and speed_potion as common', () => {
            expect(ItemData.items.armor_shard.rarity).toBe('common');
            expect(ItemData.items.speed_potion.rarity).toBe('common');
        });

        it('should have spell_scroll and smoke_bomb as uncommon', () => {
            expect(ItemData.items.spell_scroll.rarity).toBe('uncommon');
            expect(ItemData.items.smoke_bomb.rarity).toBe('uncommon');
        });

        it('should have holy_shield as rare', () => {
            expect(ItemData.items.holy_shield.rarity).toBe('rare');
        });
    });
});
