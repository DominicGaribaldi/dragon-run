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
                description: 'Ignore the first 3 spaces of any slide-back effect (Dragon or Hazard).',
                icon: 'shield'
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
                description: 'Once per game, swap your dice roll with the player behind you.',
                icon: 'wand',
                usesRemaining: 1
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
                description: 'If you roll a 6, choose to move 6 spaces OR move 3 spaces and take another turn.',
                icon: 'arrow'
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
                description: 'Start with 1 random Power-Up. When landing on Loot, gain 2 items instead of 1.',
                icon: 'crown'
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
                description: 'When using a Knight (Ladder), move an additional +2 spaces after landing.',
                icon: 'gear'
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
                description: 'Monster Encounters succeed on 3-6 instead of 4-6.',
                icon: 'music'
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

