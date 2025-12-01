/**
 * GameLogic - Server-side game mechanics
 * Board generation, encounter resolution, item effects
 */

export class GameLogic {
    constructor() {
        // Item definitions
        this.items = {
            armor_shard: { name: 'Armor Shard', type: 'passive' },
            speed_potion: { name: 'Speed Potion', type: 'active' },
            spell_scroll: { name: 'Spell Scroll', type: 'active' },
            smoke_bomb: { name: 'Smoke Bomb', type: 'active' },
            holy_shield: { name: 'Holy Shield', type: 'active' }
        };

        // Encounter definitions
        this.encounters = {
            // Dragons (slide down on fail)
            dragon_ignis: { type: 'dragon', name: 'Ignis the King', defense: 6 },
            dragon_frostfang: { type: 'dragon', name: 'Frost-Fang', defense: 5 },
            dragon_slimetooth: { type: 'dragon', name: 'Slime-Tooth', defense: 4 },

            // Knights (boost up on success)
            knight_hedge: { type: 'knight', name: 'Sir Bramble', boost: 15 },
            knight_griffin: { type: 'knight', name: 'Lord Gallant', boost: 20 },
            knight_champion: { type: 'knight', name: 'Sir Sterling', boost: 25 },

            // Monsters
            monster_milkbaby: { type: 'monster', name: 'The Milkbaby', checkType: 'threshold', threshold: 3 },
            monster_taxgoblin: { type: 'monster', name: 'Tax Goblin', checkType: 'even_odd', success: 'even' },
            monster_hillgiant: { type: 'monster', name: 'Hill Giant', checkType: 'threshold', threshold: 4 },
            monster_mimic: { type: 'monster', name: 'Mimic', checkType: 'threshold', threshold: 4 },
            monster_vampires: { type: 'monster', name: 'Vampires', checkType: 'threshold', threshold: 5 },
            monster_hypnotoad: { type: 'monster', name: 'Hypnotoad', checkType: 'even_odd', success: 'odd' }
        };
    }

    /**
     * Generate a game board with procedural assignments
     * Returns board data that can be sent to all clients
     */
    generateBoard() {
        const seed = Date.now();
        const rng = this.seededRandom(seed);

        // Generate procedural assignments matching client's Board.js logic
        const assignments = {
            seed,
            dragons: this.assignDragons(rng),
            knights: this.assignKnights(rng),
            monsters: this.assignMonsters(rng),
            specials: this.assignSpecials(rng),
            portals: this.assignPortals(rng)
        };

        return assignments;
    }

    /**
     * Simple seeded random number generator
     */
    seededRandom(seed) {
        let s = seed;
        return () => {
            s = (s * 1103515245 + 12345) & 0x7fffffff;
            return s / 0x7fffffff;
        };
    }

    /**
     * Assign dragon positions
     */
    assignDragons(rng) {
        // Ignis (strongest) near finish (tiles 90-98)
        const ignisHead = 90 + Math.floor(rng() * 8);
        const ignisTail = Math.max(50, ignisHead - 30 - Math.floor(rng() * 10));

        // Frostfang in middle (tiles 50-70)
        const frostfangHead = 50 + Math.floor(rng() * 20);
        const frostfangTail = Math.max(20, frostfangHead - 20 - Math.floor(rng() * 10));

        // Slimetooth early (tiles 20-40)
        const slimetoothHead = 20 + Math.floor(rng() * 20);
        const slimetoothTail = Math.max(5, slimetoothHead - 10 - Math.floor(rng() * 5));

        return {
            ignis: { head: ignisHead, tail: ignisTail },
            frostfang: { head: frostfangHead, tail: frostfangTail },
            slimetooth: { head: slimetoothHead, tail: slimetoothTail }
        };
    }

    /**
     * Assign knight positions
     */
    assignKnights(rng) {
        // Knights boost players up
        const hedgeBase = 10 + Math.floor(rng() * 10);
        const hedgeDest = hedgeBase + 15 + Math.floor(rng() * 5);

        const griffinBase = 35 + Math.floor(rng() * 10);
        const griffinDest = griffinBase + 20 + Math.floor(rng() * 5);

        const championBase = 60 + Math.floor(rng() * 10);
        const championDest = Math.min(99, championBase + 25 + Math.floor(rng() * 5));

        return {
            hedge: { base: hedgeBase, dest: hedgeDest },
            griffin: { base: griffinBase, dest: griffinDest },
            champion: { base: championBase, dest: championDest }
        };
    }

    /**
     * Assign monster positions
     */
    assignMonsters(rng) {
        const usedTiles = new Set();
        const monsters = [];

        const monsterTypes = ['milkbaby', 'taxgoblin', 'hillgiant', 'mimic', 'vampires', 'hypnotoad'];

        monsterTypes.forEach(type => {
            let tile;
            do {
                tile = 15 + Math.floor(rng() * 75); // Tiles 15-90
            } while (usedTiles.has(tile));

            usedTiles.add(tile);
            monsters.push({ type, tile });
        });

        return monsters;
    }

    /**
     * Assign special tile positions (chests, anvil)
     */
    assignSpecials(rng) {
        const usedTiles = new Set();
        const specials = [];

        // 4 treasure chests
        for (let i = 0; i < 4; i++) {
            let tile;
            do {
                tile = 10 + Math.floor(rng() * 80);
            } while (usedTiles.has(tile));

            usedTiles.add(tile);
            specials.push({ type: 'chest', tile });
        }

        // 1 anvil
        let anvilTile;
        do {
            anvilTile = 30 + Math.floor(rng() * 50);
        } while (usedTiles.has(anvilTile));

        specials.push({ type: 'anvil', tile: anvilTile });

        return specials;
    }

    /**
     * Assign portal positions
     */
    assignPortals(rng) {
        const usedTiles = new Set();
        const portals = [];

        const portalTypes = ['balanced', 'risky', 'chaotic'];

        portalTypes.forEach(type => {
            let tile;
            do {
                tile = 20 + Math.floor(rng() * 60);
            } while (usedTiles.has(tile));

            usedTiles.add(tile);
            portals.push({ type, tile });
        });

        return portals;
    }

    /**
     * Check if a tile has an encounter
     */
    checkEncounter(tile, board) {
        // Check dragons
        for (const [name, dragon] of Object.entries(board.dragons)) {
            if (tile === dragon.head) {
                return { type: 'dragon', name, ...this.encounters[`dragon_${name}`], tailTile: dragon.tail };
            }
        }

        // Check knights
        for (const [name, knight] of Object.entries(board.knights)) {
            if (tile === knight.base) {
                return { type: 'knight', name, ...this.encounters[`knight_${name}`], destTile: knight.dest };
            }
        }

        // Check monsters
        const monster = board.monsters.find(m => m.tile === tile);
        if (monster) {
            return { type: 'monster', ...this.encounters[`monster_${monster.type}`] };
        }

        // Check specials
        const special = board.specials.find(s => s.tile === tile);
        if (special) {
            return { type: 'special', specialType: special.type };
        }

        // Check portals
        const portal = board.portals.find(p => p.tile === tile);
        if (portal) {
            return { type: 'portal', portalType: portal.type };
        }

        return null;
    }

    /**
     * Resolve an encounter
     */
    resolveEncounter(encounter, player, data, board) {
        const roll = Math.floor(Math.random() * 6) + 1;

        switch (encounter.type) {
            case 'dragon':
                return this.resolveDragonEncounter(encounter, player, roll);

            case 'knight':
                return this.resolveKnightEncounter(encounter, player, roll);

            case 'monster':
                return this.resolveMonsterEncounter(encounter, player, roll);

            case 'special':
                return this.resolveSpecialEncounter(encounter, player);

            default:
                return { success: true, roll };
        }
    }

    /**
     * Resolve dragon encounter
     */
    resolveDragonEncounter(encounter, player, roll) {
        // Add armor bonus
        const totalRoll = roll + player.armorShards;
        const success = totalRoll >= encounter.defense;

        if (success) {
            return {
                success: true,
                roll,
                totalRoll,
                effect: 'Defended successfully!'
            };
        } else {
            // Slide down to tail
            return {
                success: false,
                roll,
                totalRoll,
                effect: `Slid down to tile ${encounter.tailTile}!`,
                newTile: encounter.tailTile,
                statusEffect: this.getDragonEffect(encounter.name)
            };
        }
    }

    /**
     * Get status effect from dragon type
     */
    getDragonEffect(dragonName) {
        switch (dragonName) {
            case 'ignis': return 'burned';
            case 'frostfang': return 'slowed';
            case 'slimetooth': return 'slowed';
            default: return null;
        }
    }

    /**
     * Resolve knight encounter
     */
    resolveKnightEncounter(encounter, player, roll) {
        // Knights always boost (automatic success)
        return {
            success: true,
            roll,
            effect: `Boosted to tile ${encounter.destTile}!`,
            newTile: encounter.destTile
        };
    }

    /**
     * Resolve monster encounter
     */
    resolveMonsterEncounter(encounter, player, roll) {
        let success;

        if (encounter.checkType === 'threshold') {
            success = roll >= encounter.threshold;
        } else if (encounter.checkType === 'even_odd') {
            const isEven = roll % 2 === 0;
            success = encounter.success === 'even' ? isEven : !isEven;
        }

        if (success) {
            // Reward: random item
            const item = this.getRandomItem();
            return {
                success: true,
                roll,
                effect: `Victory! Found ${this.items[item].name}`,
                item
            };
        } else {
            // Penalty: lose a turn
            return {
                success: false,
                roll,
                effect: 'Defeated! Lose next turn.',
                statusEffect: 'stunned'
            };
        }
    }

    /**
     * Resolve special tile encounter
     */
    resolveSpecialEncounter(encounter, player) {
        if (encounter.specialType === 'chest') {
            const item = this.getRandomItem();
            return {
                success: true,
                effect: `Found ${this.items[item].name}!`,
                item
            };
        } else if (encounter.specialType === 'anvil') {
            return {
                success: true,
                effect: 'Armor restored to full!',
                armorShards: 3 - player.armorShards
            };
        }

        return { success: true };
    }

    /**
     * Get a random item (weighted)
     */
    getRandomItem() {
        const items = [
            { id: 'armor_shard', weight: 30 },
            { id: 'speed_potion', weight: 25 },
            { id: 'spell_scroll', weight: 20 },
            { id: 'smoke_bomb', weight: 15 },
            { id: 'holy_shield', weight: 10 }
        ];

        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;

        for (const item of items) {
            random -= item.weight;
            if (random <= 0) {
                return item.id;
            }
        }

        return 'armor_shard';
    }

    /**
     * Use an item
     */
    useItem(itemId, player) {
        switch (itemId) {
            case 'armor_shard':
                player.armorShards = Math.min(3, player.armorShards + 1);
                return { effect: 'Armor increased!' };

            case 'speed_potion':
                return { effect: 'Next roll +2!', modifier: { type: 'roll_bonus', value: 2 } };

            case 'spell_scroll':
                return { effect: 'Can reroll next bad roll!' };

            case 'smoke_bomb':
                return { effect: 'Skip next encounter!' };

            case 'holy_shield':
                return { effect: 'Protected from next dragon!' };

            default:
                return { effect: 'Item used' };
        }
    }

    /**
     * Use a portal
     */
    usePortal(currentTile, board) {
        const portal = board.portals.find(p => p.tile === currentTile);
        if (!portal) {
            return { newTile: currentTile, type: null };
        }

        let newTile;

        switch (portal.type) {
            case 'balanced':
                // Move forward 5-15 tiles
                newTile = Math.min(99, currentTile + 5 + Math.floor(Math.random() * 11));
                break;

            case 'risky':
                // 50% chance: forward 20-30, or back 10-20
                if (Math.random() < 0.5) {
                    newTile = Math.min(99, currentTile + 20 + Math.floor(Math.random() * 11));
                } else {
                    newTile = Math.max(1, currentTile - 10 - Math.floor(Math.random() * 11));
                }
                break;

            case 'chaotic':
                // Random tile anywhere
                newTile = 1 + Math.floor(Math.random() * 99);
                break;

            default:
                newTile = currentTile;
        }

        return { newTile, type: portal.type };
    }
}
