# Dragon Run: Future Implementation Plan

## Systems To Implement

### 1. Character Selection System
6 playable classes with unique abilities:

| Character | Passive Ability | Preferred Stat |
|-----------|-----------------|----------------|
| Sir Reginald (Knight) | Ironclad: Ignore first 3 spaces of slide-back | Defense |
| Elara (Wizard) | Arcane Insight: Once/game swap roll with player behind | Magic |
| Kaelen (Rogue Archer) | Parkour: On 6, choose move 6 OR move 3 + extra turn | Agility |
| Princess Aurelia (Royal) | Royal Tax: Start with 1 power-up, get 2x loot | Charisma |
| Grizelda (Dwarf Engineer) | Shortcuts: +2 spaces after using Knight ladder | Engineering |
| Pippin (Bard) | Distraction: Monster encounters succeed on 3-6 | Luck |

### 2. Inventory System
- 3-slot inventory per player
- Items collected from Chests and Loot Spaces

| Item | Effect | Usage |
|------|--------|-------|
| Armor Shard | Auto-success on Dragon defense check | Passive (consumed) |
| Speed Potion | +3 to movement roll | Active (before roll) |
| Spell Scroll | Re-roll dice (must keep second) | Active (after roll) |
| Smoke Bomb | Escape Monster Encounter, no penalty | Active (during encounter) |
| Holy Shield | Block Curse/Stun effects | Passive (consumed) |

### 3. Defense Check System (Dragons)
When landing on Dragon Head:
- Roll D6: 1-3 = FAIL (slide back), 4-6 = SAVE (stay)
- Armor Shard provides auto-save

Dragons:
- Slime-Tooth: Tile 32 → 6
- Frost-Fang: Tile 62 → 19
- Ignis the King: Tile 98 → 75

### 4. Monster Encounter System
Each monster has unique roll requirements:

| Monster | Tile | Pass | Fail Effect |
|---------|------|------|-------------|
| Monster Milk Baby | 14 | 3+ | Next turn movement halved |
| Goblin Tax Collector | 28 | 4+ | Lose next turn |
| Snoozing Hill-Giant | 42 | 2+ | Go back 5 spaces |
| The Mimic Chest | 53 | 4+ | Lose 1 item (win = gain 1) |
| Lucy & Vampires | 66 | Evens | Go back 10 spaces |
| Hypno-Toad | 58 | Odds | Next turn move backwards |

### 5. Special Tiles
- Loot Chests: Various locations, grant 1 random item
- Rusty Anvil (Tile 50): Grants full armor (3 shards)
- Twin Portals (Tile 85): Roll 1-3 = Tile 95, Roll 4-6 = Tile 55

### 6. Co-op Mode (Future)
- Shared team inventory
- Boost: Land on teammate = they move +3
- Assisted Defense: Teammate can use their Armor Shard for you
- Revive: Land on/pass stunned teammate to break stun

## Win Condition
- First to reach Tile 100 (no exact roll required)

## UI Requirements
- Character select screen
- Inventory display (3 slots)
- Defense/Encounter roll popup with animation
- Item effect indicators
- Turn order display
