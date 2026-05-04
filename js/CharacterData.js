/**
 * DRAGON RUN: THE ROYAL RACE
 * CharacterData.js - Character class definitions and abilities
 */

const CharacterData = {
    // All 6 playable characters with stats and abilities
    characters: {
        reginald: {
            id: 'reginald',
            name: 'Sir Reginald',
            title: 'The Brave Knight',
            description: 'A stalwart defender who shrugs off dragon attacks.',
            color: 0xE63946,
            preferredStat: 'defense',
            passive: {
                name: 'Ironclad',
                description: 'Reduce all slide/knockback by 3. +1 dragon defense.',
                icon: 'shield',
                slideReduction: 3,
                dragonBonus: 1
            },
            passive2: {
                name: 'Shield Wall',
                description: 'Once per game, completely block a negative portal effect.',
                icon: 'shield',
                uses: 1
            },
            stats: {
                defense: 5,
                magic: 1,
                agility: 2,
                charisma: 2,
                engineering: 1,
                luck: 2
            },
            spriteKey: 'char_reginald_sheet',
            cardKey: 'card_reginald'
        },

        elara: {
            id: 'elara',
            name: 'Elara',
            title: 'The Clever Wizard',
            description: 'A cunning mage who can manipulate fate itself.',
            color: 0x457B9D,
            preferredStat: 'magic',
            passive: {
                name: 'Arcane Insight',
                description: '2x per game: swap roll with player behind you. +1 next roll.',
                icon: 'wand',
                usesRemaining: 2,
                bonusAfterUse: 1
            },
            passive2: {
                name: 'Scrying',
                description: 'See what portal effect you would get before choosing to enter.',
                icon: 'eye'
            },
            stats: {
                defense: 1,
                magic: 5,
                agility: 2,
                charisma: 2,
                engineering: 2,
                luck: 1
            },
            spriteKey: 'char_elara_sheet',
            cardKey: 'card_elara'
        },

        kaelen: {
            id: 'kaelen',
            name: 'Kaelen',
            title: 'The Rogue Archer',
            description: 'A swift ranger who can take extra moves.',
            color: 0x2A9D8F,
            preferredStat: 'agility',
            passive: {
                name: 'Parkour',
                description: 'On a 6: move 6 OR move 3 and take another turn.',
                icon: 'arrow'
            },
            passive2: {
                name: 'Evasion',
                description: 'First monster encounter each game automatically succeeds.',
                icon: 'dodge',
                uses: 1
            },
            stats: {
                defense: 2,
                magic: 1,
                agility: 5,
                charisma: 1,
                engineering: 2,
                luck: 2
            },
            spriteKey: 'char_kaelen_sheet',
            cardKey: 'card_kaelen'
        },

        aurelia: {
            id: 'aurelia',
            name: 'Princess Aurelia',
            title: 'The Royal',
            description: 'Born to wealth, she starts ahead and collects more.',
            color: 0xE9C46A,
            preferredStat: 'charisma',
            passive: {
                name: 'Royal Tax',
                description: 'Start on tile 5 with 1 item + 2 Armor. 2x items from loot.',
                icon: 'crown',
                startTile: 5,
                startArmor: 2,
                doubleItems: true
            },
            passive2: {
                name: 'Royal Decree',
                description: 'Once per game, completely skip a monster encounter.',
                icon: 'scroll',
                uses: 1
            },
            stats: {
                defense: 2,
                magic: 2,
                agility: 1,
                charisma: 5,
                engineering: 1,
                luck: 2
            },
            spriteKey: 'char_aurelia_sheet',
            cardKey: 'card_aurelia'
        },

        grizelda: {
            id: 'grizelda',
            name: 'Grizelda',
            title: 'Dwarf Engineer',
            description: 'A master builder who gets extra boost from knights.',
            color: 0xB5651D,
            preferredStat: 'engineering',
            passive: {
                name: 'Shortcuts',
                description: 'Knight boosts give +4 extra. Immune to ice slip.',
                icon: 'gear',
                knightBonus: 4,
                iceImmune: true
            },
            passive2: {
                name: 'Reinforced',
                description: 'Armor Shards protect against 2 dragon/monster hits instead of 1.',
                icon: 'anvil',
                armorBonus: true
            },
            stats: {
                defense: 3,
                magic: 1,
                agility: 1,
                charisma: 1,
                engineering: 5,
                luck: 2
            },
            spriteKey: 'char_grizelda_sheet',
            cardKey: 'card_grizelda'
        },

        pippin: {
            id: 'pippin',
            name: 'Pippin',
            title: 'Mischievous Bard',
            description: 'A lucky entertainer who charms his way past monsters.',
            color: 0x9B59B6,
            preferredStat: 'luck',
            passive: {
                name: 'Distraction',
                description: 'Monster checks 2-6. First stun blocked. +1 portal rolls.',
                icon: 'music',
                monsterBonus: 2,
                stunImmune: true,
                portalBonus: 1
            },
            passive2: {
                name: 'Lucky Reroll',
                description: 'Once per game, reroll any dice result of 1 or 2.',
                icon: 'dice',
                uses: 1
            },
            stats: {
                defense: 1,
                magic: 2,
                agility: 2,
                charisma: 2,
                engineering: 1,
                luck: 5
            },
            spriteKey: 'char_pippin_sheet',
            cardKey: 'card_pippin'
        }
    },

    /**
     * Get character by ID
     */
    getCharacter(id) {
        return this.characters[id] || null;
    },

    /**
     * Get all characters as array
     */
    getAllCharacters() {
        return Object.values(this.characters);
    },

    /**
     * Get character IDs
     */
    getCharacterIds() {
        return Object.keys(this.characters);
    }
};

