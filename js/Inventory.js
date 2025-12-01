/**
 * DRAGON RUN: THE ROYAL RACE
 * Inventory.js - Player inventory management
 */

class Inventory {
    constructor(maxSlots = 3) {
        this.maxSlots = maxSlots;
        this.items = []; // Array of item IDs
    }

    /**
     * Check if inventory has space
     */
    hasSpace() {
        return this.items.length < this.maxSlots;
    }

    /**
     * Get number of empty slots
     */
    emptySlots() {
        return this.maxSlots - this.items.length;
    }

    /**
     * Add item to inventory
     * @param {string} itemId - Item ID to add
     * @returns {boolean} Success
     */
    addItem(itemId) {
        if (!this.hasSpace()) {
            console.log('[Inventory] No space for item:', itemId);
            return false;
        }

        const item = ItemData.getItem(itemId);
        if (!item) {
            console.warn('[Inventory] Unknown item:', itemId);
            return false;
        }

        this.items.push(itemId);
        console.log(`[Inventory] Added ${item.name}. Slots: ${this.items.length}/${this.maxSlots}`);
        return true;
    }

    /**
     * Add random item
     * @returns {Object|null} The item added, or null if no space
     */
    addRandomItem() {
        if (!this.hasSpace()) return null;

        const item = ItemData.getRandomItem();
        this.addItem(item.id);
        return item;
    }

    /**
     * Remove item from inventory
     * @param {string} itemId - Item ID to remove
     * @returns {boolean} Success
     */
    removeItem(itemId) {
        const index = this.items.indexOf(itemId);
        if (index === -1) {
            console.log('[Inventory] Item not found:', itemId);
            return false;
        }

        this.items.splice(index, 1);
        console.log(`[Inventory] Removed ${itemId}. Slots: ${this.items.length}/${this.maxSlots}`);
        return true;
    }

    /**
     * Remove random item (for mimic penalty)
     * @returns {Object|null} The item removed, or null if empty
     */
    removeRandomItem() {
        if (this.items.length === 0) return null;

        const index = Math.floor(Math.random() * this.items.length);
        const itemId = this.items[index];
        const item = ItemData.getItem(itemId);
        this.items.splice(index, 1);
        return item;
    }

    /**
     * Check if player has specific item
     */
    hasItem(itemId) {
        return this.items.includes(itemId);
    }

    /**
     * Get all items with full data
     */
    getItems() {
        return this.items.map(id => ItemData.getItem(id)).filter(item => item !== null);
    }

    /**
     * Get items by type
     */
    getItemsByType(type) {
        return this.getItems().filter(item => item.type === type);
    }

    /**
     * Get items usable at specific timing
     */
    getItemsForTiming(timing) {
        return this.getItems().filter(item => item.timing === timing);
    }

    /**
     * Use an active item
     * @param {string} itemId - Item to use
     * @returns {Object|null} The item effect, or null if can't use
     */
    useItem(itemId) {
        if (!this.hasItem(itemId)) return null;

        const item = ItemData.getItem(itemId);
        if (!item) return null;

        // Remove if consumable
        if (item.effect.consumed) {
            this.removeItem(itemId);
        }

        console.log(`[Inventory] Used ${item.name}`);
        return item.effect;
    }

    /**
     * Check for and consume passive item (armor shard, holy shield)
     * @param {string} triggerType - What triggered this check
     * @returns {Object|null} The item that was consumed, or null
     */
    checkPassiveItem(triggerType) {
        for (const itemId of this.items) {
            const item = ItemData.getItem(itemId);
            if (!item || item.type !== 'passive') continue;

            // Armor shard triggers on dragon
            if (item.effect.type === 'auto_save_dragon' && triggerType === 'dragon') {
                this.removeItem(itemId);
                console.log(`[Inventory] Armor Shard consumed to block dragon!`);
                return item;
            }

            // Holy shield triggers on debuff
            if (item.effect.type === 'block_debuff' && triggerType === 'debuff') {
                this.removeItem(itemId);
                console.log(`[Inventory] Holy Shield consumed to block debuff!`);
                return item;
            }
        }

        return null;
    }

    /**
     * Fill inventory with armor shards (Rusty Anvil effect)
     */
    fillWithArmor() {
        let added = 0;
        while (this.hasSpace()) {
            this.addItem('armor_shard');
            added++;
        }
        return added;
    }

    /**
     * Clear all items
     */
    clear() {
        this.items = [];
    }

    /**
     * Get save data
     */
    toJSON() {
        return {
            maxSlots: this.maxSlots,
            items: [...this.items]
        };
    }

    /**
     * Load from save data
     */
    fromJSON(data) {
        this.maxSlots = data.maxSlots || 3;
        this.items = data.items || [];
    }
}
