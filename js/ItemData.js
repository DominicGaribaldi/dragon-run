/**
 * DRAGON RUN: THE ROYAL RACE
 * ItemData.js - Item definitions and effects
 */

const ItemData = {
    items: {
        armor_shard: {
            id: 'armor_shard',
            name: 'Armor Shard',
            description: 'Auto-Success on the next Dragon Breath/Head encounter.',
            icon: 'shield',
            type: 'passive', // Consumed automatically when needed
            effect: {
                type: 'auto_save_dragon',
                consumed: true
            },
            rarity: 'common',
            spriteKey: 'item_armor_shard'
        },

        speed_potion: {
            id: 'speed_potion',
            name: 'Speed Potion',
            description: 'Add +3 to your movement roll.',
            icon: 'potion',
            type: 'active', // Must be used before rolling
            timing: 'before_roll',
            effect: {
                type: 'movement_bonus',
                value: 3,
                consumed: true
            },
            rarity: 'common',
            spriteKey: 'item_speed_potion'
        },

        spell_scroll: {
            id: 'spell_scroll',
            name: 'Spell Scroll',
            description: 'Re-roll the dice (Movement or Encounter). Must keep second result.',
            icon: 'scroll',
            type: 'active', // Can be used after any roll
            timing: 'after_roll',
            effect: {
                type: 'reroll',
                consumed: true
            },
            rarity: 'uncommon',
            spriteKey: 'item_spell_scroll'
        },

        smoke_bomb: {
            id: 'smoke_bomb',
            name: 'Smoke Bomb',
            description: 'Escape a Monster Encounter without rolling. No penalty.',
            icon: 'bomb',
            type: 'active', // Used during monster encounter
            timing: 'during_encounter',
            effect: {
                type: 'escape_encounter',
                consumed: true
            },
            rarity: 'uncommon',
            spriteKey: 'item_smoke_bomb'
        },

        holy_shield: {
            id: 'holy_shield',
            name: 'Holy Shield',
            description: 'Blocks a Curse or Stun effect (Hypno-Toad, Tax Collector).',
            icon: 'cross',
            type: 'passive', // Consumed automatically when cursed/stunned
            effect: {
                type: 'block_debuff',
                consumed: true
            },
            rarity: 'rare',
            spriteKey: 'item_holy_shield'
        }
    },

    /**
     * Get item by ID
     */
    getItem(id) {
        return this.items[id] || null;
    },

    /**
     * Get all items as array
     */
    getAllItems() {
        return Object.values(this.items);
    },

    /**
     * Get random item (for loot drops)
     */
    getRandomItem() {
        const items = this.getAllItems();
        const weights = items.map(item => {
            switch(item.rarity) {
                case 'common': return 50;
                case 'uncommon': return 35;
                case 'rare': return 15;
                default: return 25;
            }
        });

        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return items[i];
            }
        }

        return items[0];
    },

    /**
     * Get items by type
     */
    getItemsByType(type) {
        return this.getAllItems().filter(item => item.type === type);
    }
};
