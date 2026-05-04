/**
 * DRAGON RUN: THE ROYAL RACE
 * EncounterData.js - All encounter definitions (Dragons, Knights, Monsters, Special)
 */

const EncounterData = {
    /**
     * DRAGONS (Snakes) - Landing triggers defense check
     * Success: Stay on tile
     * Failure: Slide back to tail tile
     */
    dragons: {
        slimetooth: {
            id: 'slimetooth',
            name: 'Slime-Tooth',
            title: 'The Swamp Dragon',
            headTile: 32,
            tailTile: 6,
            description: 'A sluggish swamp dragon - easiest to evade.',
            defenseCheck: {
                successMin: 3, // Roll 3-6 to save (67% success) - EASY
                successMessage: 'You dodge the slow acid spray!',
                failMessage: 'The acid burns! You slide down to safety...'
            },
            element: 'poison',
            spriteKey: 'dragon_slimetooth_sheet'
        },

        frostfang: {
            id: 'frostfang',
            name: 'Frost-Fang',
            title: 'The Ice Drake',
            headTile: 62,
            tailTile: 19,
            description: 'A cunning ice dragon with freezing breath.',
            defenseCheck: {
                successMin: 4, // Roll 4-6 to save (50% success) - MEDIUM
                successMessage: 'You resist the freezing cold!',
                failMessage: 'Frozen solid! You tumble down the icy path...'
            },
            element: 'ice',
            spriteKey: 'dragon_frostfang_sheet'
        },

        ignis: {
            id: 'ignis',
            name: 'Ignis the King',
            title: 'The Fire Dragon',
            headTile: 98,
            tailTile: 75,
            description: 'The legendary dragon king - most dangerous of all!',
            defenseCheck: {
                successMin: 5, // Roll 5-6 to save (33% success) - HARD
                successMessage: 'You leap through the flames unscathed!',
                failMessage: 'The inferno overwhelms you! Back you go...'
            },
            element: 'fire',
            spriteKey: 'dragon_ignis_sheet'
        }
    },

    /**
     * KNIGHTS (Ladders) - Automatic boost forward
     */
    knights: {
        hedge: {
            id: 'hedge',
            name: 'Hedge Knight',
            title: 'The Wandering Protector',
            baseTile: 9,
            destinationTile: 22,
            description: 'A humble knight who helps travelers on their way.',
            boostMessage: 'The Hedge Knight lifts you to higher ground!',
            spriteKey: 'knight_hedge_sheet'
        },

        griffin: {
            id: 'griffin',
            name: 'Griffin Rider',
            title: 'Sky Guardian',
            baseTile: 45,
            destinationTile: 66,
            description: 'A majestic rider who soars above the danger.',
            boostMessage: 'The Griffin swoops down and carries you skyward!',
            spriteKey: 'knight_griffin_sheet'
        },

        champion: {
            id: 'champion',
            name: "King's Champion",
            title: 'Royal Elite',
            baseTile: 80,
            destinationTile: 99,
            description: 'The most powerful knight in the realm.',
            boostMessage: 'The Champion vaults you toward victory!',
            spriteKey: 'knight_champion_sheet'
        }
    },

    /**
     * MONSTERS - Encounter check with various effects
     */
    monsters: {
        milkbaby: {
            id: 'milkbaby',
            name: 'Monster Milk Baby',
            tile: 14,
            description: 'A bizarre creature that throws sticky tantrums.',
            encounterCheck: {
                successMin: 3, // Roll 3-6 to pass
                successMessage: 'You calm the baby with a lullaby!',
                failMessage: 'Covered in sticky goo!'
            },
            failEffect: {
                type: 'slow',
                duration: 1, // Next turn
                value: 0.5, // Movement halved
                message: 'Next turn movement is halved (rounded down).'
            },
            spriteKey: 'monster_milkbaby_sheet'
        },

        taxgoblin: {
            id: 'taxgoblin',
            name: 'Goblin Tax Collector',
            tile: 28,
            description: 'A greedy goblin demanding payment.',
            encounterCheck: {
                successMin: 4,
                successMessage: 'You show empty pockets and the goblin leaves!',
                failMessage: 'AUDIT! The goblin demands your time!'
            },
            failEffect: {
                type: 'stun',
                duration: 1,
                message: 'Lose your next turn dealing with paperwork.'
            },
            spriteKey: 'monster_taxgoblin_sheet'
        },

        hillgiant: {
            id: 'hillgiant',
            name: 'Snoozing Hill-Giant',
            tile: 42,
            description: 'A massive giant blocking the path. Shhh!',
            encounterCheck: {
                successMin: 2, // Easy - 2-6 to pass
                successMessage: 'You tiptoe past without waking him!',
                failMessage: 'STOMP! You woke the giant!'
            },
            failEffect: {
                type: 'knockback',
                value: 5,
                message: 'Go back 5 spaces from the stomp!'
            },
            spriteKey: 'monster_hillgiant_sheet'
        },

        mimic: {
            id: 'mimic',
            name: 'The Mimic Chest',
            tile: 53,
            description: 'Is that treasure... or teeth?',
            encounterCheck: {
                successMin: 4,
                successMessage: 'You spot the teeth in time and grab real loot!',
                failMessage: 'CHOMP! The mimic bites your hand!'
            },
            successEffect: {
                type: 'loot',
                value: 1,
                message: 'Gain 1 random item!'
            },
            failEffect: {
                type: 'lose_item',
                value: 1,
                message: 'Lose 1 random item from your inventory.'
            },
            spriteKey: 'monster_mimic_sheet'
        },

        vampires: {
            id: 'vampires',
            name: 'Lucy & Vampire Family',
            tile: 66,
            description: 'An elegant vampire family inviting you to dinner...',
            encounterCheck: {
                type: 'even', // Must roll even number (2, 4, 6)
                successMessage: 'You politely decline the invitation!',
                failMessage: 'Their charm is irresistible...'
            },
            failEffect: {
                type: 'knockback',
                value: 10,
                message: 'Go back 10 spaces in a daze.'
            },
            spriteKey: 'monster_vampires_sheet'
        },

        hypnotoad: {
            id: 'hypnotoad',
            name: 'Hypno-Toad',
            tile: 58,
            description: 'ALL GLORY TO THE HYPNO-TOAD.',
            encounterCheck: {
                type: 'odd', // Must roll odd number (1, 3, 5)
                successMessage: 'You avert your eyes in time!',
                failMessage: 'The spirals... so beautiful...'
            },
            failEffect: {
                type: 'reverse',
                duration: 1,
                message: 'Next turn, you move BACKWARDS the amount you roll.'
            },
            spriteKey: 'monster_hypnotoad_sheet'
        }
    },

    /**
     * SPECIAL TILES - Unique effects
     */
    special: {
        rustyAnvil: {
            id: 'rustyAnvil',
            name: 'The Rusty Anvil',
            tile: 50,
            description: 'A hidden forge. The blacksmith offers to repair your gear!',
            effect: {
                type: 'gain_armor',
                value: 1,
                message: 'The blacksmith forges you an Armor Shard!'
            }
        },

/**
         * PORTALS - Three types with different risk/reward profiles
         * Players choose whether to enter when landing on a portal tile
         */
        portalBalanced: {
            id: 'portalBalanced',
            name: 'Stable Portal',
            title: 'The Safe Passage',
            tiles: [], // Will be set dynamically (1-3 portals of this type)
            description: 'A calm green portal with predictable outcomes.',
            portalType: 'balanced',
            color: 0x44cc66,
            spriteKey: 'portal_balanced_sheet',
            effects: [
                { id: 'advance_3', weight: 1, type: 'move', value: 3, message: 'Gentle winds push you forward 3 spaces!' },
                { id: 'gain_item', weight: 1, type: 'loot', value: 1, message: 'A gift materializes! Gain 1 item.' },
                { id: 'gain_armor', weight: 1, type: 'armor', value: 1, message: 'Magical protection! Gain 1 Armor Shard.' },
                { id: 'heal_status', weight: 1, type: 'cleanse', message: 'Purifying light! All status effects removed.' },
                { id: 'nothing_good', weight: 1, type: 'none', message: 'The portal hums pleasantly... nothing happens.' },
                { id: 'retreat_3', weight: 1, type: 'move', value: -3, message: 'Whoops! Pushed back 3 spaces.' },
                { id: 'lose_armor', weight: 1, type: 'lose_armor', value: 1, message: 'Static discharge! Lose 1 Armor Shard.' },
                { id: 'slow', weight: 1, type: 'status', effect: 'slowed', message: 'Temporal drag! Movement halved next turn.' },
                { id: 'burned', weight: 1, type: 'status', effect: 'burned', message: 'Energy burn! -1 to next roll.' },
                { id: 'nothing_bad', weight: 1, type: 'none', message: 'The portal flickers... nothing happens.' }
            ]
        },

        portalRisky: {
            id: 'portalRisky',
            name: 'Unstable Rift',
            title: 'The Gambler\'s Gate',
            tiles: [], // Will be set dynamically (1-3 portals of this type)
            description: 'A volatile purple rift. High risk, high reward!',
            portalType: 'risky',
            color: 0x9944dd,
            spriteKey: 'portal_risky_sheet',
            // Rebalanced: ~40% good outcomes, ~60% bad outcomes (total weight: 10)
            effects: [
                // Good outcomes (weight 4 total = 40%)
                { id: 'advance_10', weight: 2, type: 'move', value: 10, message: 'SURGE! Launched forward 10 spaces!' },
                { id: 'gain_items', weight: 1, type: 'loot', value: 2, message: 'Jackpot! Gain 2 items!' },
                { id: 'full_armor', weight: 1, type: 'armor', value: 3, message: 'Maximum shields! Gain 3 Armor Shards!' },
                // Bad outcomes (weight 6 total = 60%)
                { id: 'retreat_8', weight: 2, type: 'move', value: -8, message: 'BACKFIRE! Thrown back 8 spaces!' },
                { id: 'lose_item', weight: 1, type: 'lose_item', value: 1, message: 'Dimensional theft! Lose 1 random item.' },
                { id: 'stun', weight: 1, type: 'status', effect: 'stunned', message: 'Paralyzed! Skip your next turn.' },
                { id: 'all_status', weight: 1, type: 'all_status', message: 'Chaos energy! Slowed, burned AND reversed!' },
                { id: 'retreat_15', weight: 1, type: 'move', value: -15, message: 'CATASTROPHE! Hurled back 15 spaces!' }
            ]
        },

        portalChaotic: {
            id: 'portalChaotic',
            name: 'Chaos Vortex',
            title: 'The Void Gate',
            tiles: [], // Will be set dynamically (1-3 portals of this type)
            description: 'A swirling red vortex of pure chaos. Anything can happen!',
            portalType: 'chaotic',
            color: 0xdd4444,
            spriteKey: 'portal_chaotic_sheet',
            effects: [
                { id: 'swap_random', weight: 1, type: 'swap_player', message: 'SWAP! You switch places with a random player!' },
                { id: 'teleport_random', weight: 1, type: 'teleport_random', message: 'WARP! Teleported to a random tile!' },
                { id: 'steal_item', weight: 1, type: 'steal_item', message: 'Void theft! Steal an item from the leader!' },
                { id: 'double_roll', weight: 1, type: 'buff', effect: 'double_roll', message: 'POWER UP! Your next roll is DOUBLED!' },
                { id: 'reverse_all', weight: 1, type: 'reverse_all', message: 'CHAOS WAVE! All other players move backwards next turn!' },
                { id: 'skip_2', weight: 1, type: 'status', effect: 'stunned', duration: 2, message: 'TIME LOCK! Skip your next 2 turns!' },
                { id: 'lose_all_items', weight: 1, type: 'lose_all_items', message: 'VOID DRAIN! Lose ALL your items!' },
                { id: 'to_start', weight: 1, type: 'move_to', value: 1, message: 'BANISHED! Sent back to the START!' }
            ]
        },

        lootChest: {
            id: 'lootChest',
            name: 'Treasure Chest',
            tiles: [15, 35, 55, 70, 90], // Multiple loot locations
            description: 'A chest full of useful items!',
            effect: {
                type: 'loot',
                value: 1,
                message: 'You found treasure! Gain 1 random item.'
            }
        }
    },

    /**
     * Get dragon by head tile
     */
    getDragonAtTile(tile) {
        return Object.values(this.dragons).find(d => d.headTile === tile) || null;
    },

    /**
     * Get dragon if tile is anywhere in dragon zone (tail to head)
     * Returns the dragon and whether the tile is the head
     */
    getDragonZoneAtTile(tile) {
        for (const dragon of Object.values(this.dragons)) {
            if (tile >= dragon.tailTile && tile <= dragon.headTile) {
                return {
                    dragon: dragon,
                    isHead: tile === dragon.headTile,
                    isTail: tile === dragon.tailTile
                };
            }
        }
        return null;
    },

    /**
     * Get knight by base tile
     */
    getKnightAtTile(tile) {
        return Object.values(this.knights).find(k => k.baseTile === tile) || null;
    },

    /**
     * Get monster at tile
     */
    getMonsterAtTile(tile) {
        return Object.values(this.monsters).find(m => m.tile === tile) || null;
    },

    /**
     * Get special tile effect
     */
    getSpecialAtTile(tile) {
        // Check single-tile specials
        for (const special of Object.values(this.special)) {
            if (special.tile === tile) return special;
            if (special.tiles && special.tiles.includes(tile)) return special;
        }
        return null;
    },

    /**
     * Get portal at tile (if any)
     * Now checks arrays since each portal type can have 1-3 instances
     */
    getPortalAtTile(tile) {
        const portals = ['portalBalanced', 'portalRisky', 'portalChaotic'];
        for (const portalKey of portals) {
            const portal = this.special[portalKey];
            if (portal && portal.tiles && portal.tiles.includes(tile)) {
                return portal;
            }
        }
        return null;
    },

    /**
     * Get all portals
     */
    getAllPortals() {
        return [
            this.special.portalBalanced,
            this.special.portalRisky,
            this.special.portalChaotic
        ].filter(p => p);
    },

    /**
     * Pick a random effect from a portal based on weights.
     * If a Pippin character is provided, rolls twice and discards the first result
     * when it is clearly negative (Distraction passive's "+1 portal rolls").
     */
    rollPortalEffect(portal, playerCharacter = null) {
        if (!portal || !portal.effects) return null;

        let effect = this._weightedPickPortalEffect(portal);

        // Pippin's Distraction: +1 reroll if first portal effect is clearly bad.
        if (playerCharacter && playerCharacter.id === 'pippin' &&
            playerCharacter.passive && playerCharacter.passive.portalBonus &&
            this._isPortalEffectBad(effect)) {
            effect = this._weightedPickPortalEffect(portal);
        }
        return effect;
    },

    _weightedPickPortalEffect(portal) {
        const totalWeight = portal.effects.reduce((sum, e) => sum + (e.weight || 1), 0);
        let roll = Math.random() * totalWeight;
        for (const effect of portal.effects) {
            roll -= (effect.weight || 1);
            if (roll <= 0) return effect;
        }
        return portal.effects[portal.effects.length - 1];
    },

    _isPortalEffectBad(effect) {
        if (!effect) return false;
        switch (effect.type) {
            case 'move':
                return (effect.value || 0) < 0;
            case 'lose_item':
            case 'lose_armor':
            case 'lose_all_items':
            case 'status':
            case 'all_status':
                return true;
            case 'move_to':
                return (effect.value || 0) <= 1;
            case 'none':
                return effect.id === 'nothing_bad';
            default:
                return false;
        }
    },

    /**
     * Get any encounter at tile
     */
    getEncounterAtTile(tile) {
        return this.getDragonAtTile(tile) ||
               this.getKnightAtTile(tile) ||
               this.getMonsterAtTile(tile) ||
               this.getSpecialAtTile(tile);
    },

    /**
     * Perform encounter check (roll dice, determine success)
     */
    performCheck(encounter, roll, playerCharacter = null) {
        const check = encounter.encounterCheck || encounter.defenseCheck;
        if (!check) return { success: true };

        let success = false;
        let threshold = check.successMin || 4;
        let modifiedRoll = roll;
        let bonusApplied = null;

        // Apply Reginald's Ironclad ability for dragons (+1 to defense roll)
        if (playerCharacter && playerCharacter.id === 'reginald' && encounter.defenseCheck) {
            modifiedRoll += 1;
            bonusApplied = 'Ironclad (+1)';
        }

        // Apply Pippin's Distraction ability for monsters (succeed on 2-6)
        if (playerCharacter && playerCharacter.id === 'pippin' && encounter.encounterCheck) {
            threshold = Math.max(threshold - 2, 2); // Lower threshold by 2, min 2
        }

        // Check type
        if (check.type === 'even') {
            success = modifiedRoll % 2 === 0;
        } else if (check.type === 'odd') {
            success = modifiedRoll % 2 === 1;
        } else {
            success = modifiedRoll >= threshold;
        }

        return {
            success,
            roll: modifiedRoll,
            originalRoll: roll,
            threshold,
            bonusApplied,
            message: success ? check.successMessage : check.failMessage
        };
    }
};

