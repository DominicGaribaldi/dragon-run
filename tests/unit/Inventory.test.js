/**
 * Unit tests for Inventory.js
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Inventory, ItemData } from '../mocks/globals.js';

describe('Inventory', () => {
    let inventory;

    beforeEach(() => {
        inventory = new Inventory(3);
    });

    describe('constructor', () => {
        it('should create inventory with default 3 slots', () => {
            const inv = new Inventory();
            expect(inv.maxSlots).toBe(3);
            expect(inv.items).toHaveLength(0);
        });

        it('should create inventory with custom slot count', () => {
            const inv = new Inventory(5);
            expect(inv.maxSlots).toBe(5);
        });
    });

    describe('hasSpace', () => {
        it('should return true when empty', () => {
            expect(inventory.hasSpace()).toBe(true);
        });

        it('should return true when partially full', () => {
            inventory.addItem('armor_shard');
            inventory.addItem('speed_potion');
            expect(inventory.hasSpace()).toBe(true);
        });

        it('should return false when full', () => {
            inventory.addItem('armor_shard');
            inventory.addItem('speed_potion');
            inventory.addItem('spell_scroll');
            expect(inventory.hasSpace()).toBe(false);
        });
    });

    describe('emptySlots', () => {
        it('should return maxSlots when empty', () => {
            expect(inventory.emptySlots()).toBe(3);
        });

        it('should return correct count when partially full', () => {
            inventory.addItem('armor_shard');
            expect(inventory.emptySlots()).toBe(2);
        });

        it('should return 0 when full', () => {
            inventory.addItem('armor_shard');
            inventory.addItem('speed_potion');
            inventory.addItem('spell_scroll');
            expect(inventory.emptySlots()).toBe(0);
        });
    });

    describe('addItem', () => {
        it('should add valid item to inventory', () => {
            const result = inventory.addItem('armor_shard');
            expect(result).toBe(true);
            expect(inventory.items).toContain('armor_shard');
        });

        it('should add multiple items', () => {
            inventory.addItem('armor_shard');
            inventory.addItem('speed_potion');
            expect(inventory.items).toHaveLength(2);
        });

        it('should return false when inventory is full', () => {
            inventory.addItem('armor_shard');
            inventory.addItem('speed_potion');
            inventory.addItem('spell_scroll');
            const result = inventory.addItem('smoke_bomb');
            expect(result).toBe(false);
            expect(inventory.items).toHaveLength(3);
        });

        it('should return false for unknown item', () => {
            const result = inventory.addItem('unknown_item');
            expect(result).toBe(false);
        });

        it('should allow duplicate items', () => {
            inventory.addItem('armor_shard');
            inventory.addItem('armor_shard');
            expect(inventory.items.filter(i => i === 'armor_shard')).toHaveLength(2);
        });

        // Regression: addItem requires the item ID *string*, not the item object.
        // Two call sites in game.js were passing ItemData.items.armor_shard, which
        // silently failed (Aurelia's starting armor + Grizelda's Reinforced ability).
        it('should reject an item object (must be a string ID)', () => {
            const itemObject = ItemData.items.armor_shard;
            const result = inventory.addItem(itemObject);
            expect(result).toBe(false);
            expect(inventory.items).toHaveLength(0);
        });

        it('should accept the armor_shard string ID and store it', () => {
            const result = inventory.addItem('armor_shard');
            expect(result).toBe(true);
            expect(inventory.items).toContain('armor_shard');
        });
    });

    describe('addRandomItem', () => {
        it('should add a random item when space available', () => {
            const item = inventory.addRandomItem();
            expect(item).not.toBeNull();
            expect(inventory.items).toHaveLength(1);
        });

        it('should return null when inventory is full', () => {
            inventory.addItem('armor_shard');
            inventory.addItem('speed_potion');
            inventory.addItem('spell_scroll');
            const item = inventory.addRandomItem();
            expect(item).toBeNull();
        });

        it('should return the item that was added', () => {
            const item = inventory.addRandomItem();
            expect(inventory.items).toContain(item.id);
        });
    });

    describe('removeItem', () => {
        it('should remove item from inventory', () => {
            inventory.addItem('armor_shard');
            const result = inventory.removeItem('armor_shard');
            expect(result).toBe(true);
            expect(inventory.items).not.toContain('armor_shard');
        });

        it('should return false if item not in inventory', () => {
            const result = inventory.removeItem('armor_shard');
            expect(result).toBe(false);
        });

        it('should only remove one instance of duplicate items', () => {
            inventory.addItem('armor_shard');
            inventory.addItem('armor_shard');
            inventory.removeItem('armor_shard');
            expect(inventory.items.filter(i => i === 'armor_shard')).toHaveLength(1);
        });
    });

    describe('removeRandomItem', () => {
        it('should return null when inventory is empty', () => {
            const item = inventory.removeRandomItem();
            expect(item).toBeNull();
        });

        it('should remove and return an item', () => {
            inventory.addItem('armor_shard');
            const item = inventory.removeRandomItem();
            expect(item).not.toBeNull();
            expect(inventory.items).toHaveLength(0);
        });

        it('should return the item data object', () => {
            inventory.addItem('speed_potion');
            const item = inventory.removeRandomItem();
            expect(item.id).toBe('speed_potion');
            expect(item.name).toBe('Speed Potion');
        });
    });

    describe('hasItem', () => {
        it('should return true if item exists', () => {
            inventory.addItem('armor_shard');
            expect(inventory.hasItem('armor_shard')).toBe(true);
        });

        it('should return false if item does not exist', () => {
            expect(inventory.hasItem('armor_shard')).toBe(false);
        });

        it('should return true even after using one of duplicates', () => {
            inventory.addItem('armor_shard');
            inventory.addItem('armor_shard');
            inventory.removeItem('armor_shard');
            expect(inventory.hasItem('armor_shard')).toBe(true);
        });
    });

    describe('getItems', () => {
        it('should return empty array when empty', () => {
            expect(inventory.getItems()).toHaveLength(0);
        });

        it('should return full item data objects', () => {
            inventory.addItem('armor_shard');
            inventory.addItem('speed_potion');
            const items = inventory.getItems();
            expect(items).toHaveLength(2);
            expect(items[0].name).toBe('Armor Shard');
            expect(items[1].name).toBe('Speed Potion');
        });
    });

    describe('getItemsByType', () => {
        it('should return only passive items', () => {
            inventory.addItem('armor_shard');
            inventory.addItem('speed_potion');
            inventory.addItem('holy_shield');
            const passives = inventory.getItemsByType('passive');
            expect(passives).toHaveLength(2);
            passives.forEach(item => {
                expect(item.type).toBe('passive');
            });
        });

        it('should return only active items', () => {
            inventory.addItem('armor_shard');
            inventory.addItem('speed_potion');
            const actives = inventory.getItemsByType('active');
            expect(actives).toHaveLength(1);
            expect(actives[0].type).toBe('active');
        });
    });

    describe('getItemsForTiming', () => {
        it('should return before_roll items', () => {
            inventory.addItem('speed_potion');
            inventory.addItem('spell_scroll');
            const items = inventory.getItemsForTiming('before_roll');
            expect(items).toHaveLength(1);
            expect(items[0].id).toBe('speed_potion');
        });

        it('should return after_roll items', () => {
            inventory.addItem('speed_potion');
            inventory.addItem('spell_scroll');
            const items = inventory.getItemsForTiming('after_roll');
            expect(items).toHaveLength(1);
            expect(items[0].id).toBe('spell_scroll');
        });

        it('should return during_encounter items', () => {
            inventory.addItem('smoke_bomb');
            const items = inventory.getItemsForTiming('during_encounter');
            expect(items).toHaveLength(1);
            expect(items[0].id).toBe('smoke_bomb');
        });
    });

    describe('useItem', () => {
        it('should return effect and remove consumable item', () => {
            inventory.addItem('speed_potion');
            const effect = inventory.useItem('speed_potion');
            expect(effect).not.toBeNull();
            expect(effect.type).toBe('movement_bonus');
            expect(inventory.hasItem('speed_potion')).toBe(false);
        });

        it('should return null if item not in inventory', () => {
            const effect = inventory.useItem('speed_potion');
            expect(effect).toBeNull();
        });

        it('should return null for unknown item', () => {
            const effect = inventory.useItem('unknown');
            expect(effect).toBeNull();
        });
    });

    describe('checkPassiveItem', () => {
        it('should consume armor_shard for dragon trigger', () => {
            inventory.addItem('armor_shard');
            const item = inventory.checkPassiveItem('dragon');
            expect(item).not.toBeNull();
            expect(item.id).toBe('armor_shard');
            expect(inventory.hasItem('armor_shard')).toBe(false);
        });

        it('should consume holy_shield for debuff trigger', () => {
            inventory.addItem('holy_shield');
            const item = inventory.checkPassiveItem('debuff');
            expect(item).not.toBeNull();
            expect(item.id).toBe('holy_shield');
            expect(inventory.hasItem('holy_shield')).toBe(false);
        });

        it('should not consume armor_shard for debuff trigger', () => {
            inventory.addItem('armor_shard');
            const item = inventory.checkPassiveItem('debuff');
            expect(item).toBeNull();
            expect(inventory.hasItem('armor_shard')).toBe(true);
        });

        it('should not consume holy_shield for dragon trigger', () => {
            inventory.addItem('holy_shield');
            const item = inventory.checkPassiveItem('dragon');
            expect(item).toBeNull();
            expect(inventory.hasItem('holy_shield')).toBe(true);
        });

        it('should return null when no matching passive', () => {
            inventory.addItem('speed_potion');
            const item = inventory.checkPassiveItem('dragon');
            expect(item).toBeNull();
        });
    });

    describe('fillWithArmor', () => {
        it('should fill all empty slots with armor shards', () => {
            const added = inventory.fillWithArmor();
            expect(added).toBe(3);
            expect(inventory.items).toHaveLength(3);
            inventory.items.forEach(id => {
                expect(id).toBe('armor_shard');
            });
        });

        it('should only fill remaining slots', () => {
            inventory.addItem('speed_potion');
            const added = inventory.fillWithArmor();
            expect(added).toBe(2);
            expect(inventory.items).toHaveLength(3);
        });

        it('should return 0 when inventory is full', () => {
            inventory.addItem('speed_potion');
            inventory.addItem('spell_scroll');
            inventory.addItem('smoke_bomb');
            const added = inventory.fillWithArmor();
            expect(added).toBe(0);
        });
    });

    describe('clear', () => {
        it('should remove all items', () => {
            inventory.addItem('armor_shard');
            inventory.addItem('speed_potion');
            inventory.clear();
            expect(inventory.items).toHaveLength(0);
        });
    });

    describe('toJSON', () => {
        it('should return serializable object', () => {
            inventory.addItem('armor_shard');
            inventory.addItem('speed_potion');
            const json = inventory.toJSON();
            expect(json.maxSlots).toBe(3);
            expect(json.items).toEqual(['armor_shard', 'speed_potion']);
        });

        it('should return copy of items array', () => {
            inventory.addItem('armor_shard');
            const json = inventory.toJSON();
            json.items.push('speed_potion');
            expect(inventory.items).toHaveLength(1);
        });
    });

    describe('fromJSON', () => {
        it('should restore inventory state', () => {
            const data = {
                maxSlots: 5,
                items: ['armor_shard', 'speed_potion']
            };
            inventory.fromJSON(data);
            expect(inventory.maxSlots).toBe(5);
            expect(inventory.items).toEqual(['armor_shard', 'speed_potion']);
        });

        it('should handle missing data gracefully', () => {
            inventory.fromJSON({});
            expect(inventory.maxSlots).toBe(3);
            expect(inventory.items).toEqual([]);
        });
    });
});
