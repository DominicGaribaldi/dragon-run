# Dragon Run: Implementation Status & Future Plans

## Implemented Features

### Character System
All 6 playable characters with unique dual abilities:

| Character | Ability 1 | Ability 2 |
|-----------|-----------|-----------|
| Sir Reginald | Ironclad (-3 slide, +1 dragon defense) | Shield Wall (block negative portal 1x) |
| Elara | Arcane Insight (2x swap roll, +1 bonus) | Scrying (preview portal effects) |
| Kaelen | Parkour (6 = move 6 OR 3 + extra turn) | Evasion (auto-pass 1st monster) |
| Princess Aurelia | Royal Tax (start tile 5, 2 armor, 2x loot) | Royal Decree (skip monster 1x) |
| Grizelda | Shortcuts (+4 knight, ice immune) | Reinforced (armor protects 2x) |
| Pippin | Distraction (2-6 monsters, stun immune, +1 portal) | Lucky Reroll (reroll 1-2 once) |

### Inventory System
- 3-slot inventory per player
- 5 unique items with different rarities
- Passive and active item types
- Weighted loot drops (Common 50%, Uncommon 35%, Rare 15%)

### Dragon System (Difficulty Balanced)
| Dragon | Element | Difficulty | Success Rate |
|--------|---------|------------|--------------|
| Slime-Tooth | Poison | Easy | 67% (3-6) |
| Frost-Fang | Ice | Medium | 50% (4-6) |
| Ignis | Fire | Hard | 33% (5-6) |

### Monster Encounters
- 6 unique monsters with varied check types
- Standard threshold checks (roll X+)
- Even/Odd checks (Vampires/Hypno-Toad)
- Success/fail effects implemented

### Portal System
- 3 portal types: Balanced, Risky, Chaotic
- Player choice to enter or skip
- Weighted random effects
- Character-specific interactions (Elara preview, Reginald block)

### Knight System
- 3 knights as ladder boosters
- Character-specific bonuses (Grizelda +4)
- Cascade knight support

### Status Effects
- Slowed (movement halved, rounded down, min 1)
- Burned (-1 roll)
- Stunned (skip turn; multi-turn supported via stunDuration)
- Reversed (move backwards)
- Holy Shield protection (blocks stun / slow / reverse only — does NOT block ice slip)

### Elemental Zones
- Fire zones (burn effect)
- Ice zones (slip effect)
- Poison zones (slow effect)
- Character immunities (Grizelda vs ice)

### UI/UX
- Character selection screen with card previews
- Encounter modals with dice rolling
- Portal choice modals with Scrying preview
- Inventory management
- Status effect indicators
- Toast notifications

### Multiplayer
- Socket.io integration
- Real-time game state sync
- Room system

---

## Future Enhancements

### Gameplay
- [ ] Co-op mode with shared objectives
- [ ] Team inventory sharing
- [ ] Teammate boost mechanics (+3 when landing on teammate)
- [ ] Assisted Defense (use teammate's armor)
- [ ] Additional characters
- [ ] More monsters and encounters
- [ ] Boss encounters

### Technical
- [ ] Save/load game state
- [ ] Replay system
- [ ] Spectator mode
- [ ] Game history/statistics
- [ ] Achievements system

### Polish
- [ ] More animations
- [ ] Additional sound effects
- [ ] Music variations
- [ ] Visual effects improvements
- [ ] Mobile optimization

---

## Win Condition
- First to reach Tile 100 (no exact roll required)

## Board Layout
- 100 tiles in a snaking path
- 3 dragons procedurally placed within zones (Slime-Tooth poison zone,
  Frost-Fang ice zone, Ignis fire zone). Ignis is fixed at tile 95-98;
  the other two are randomized per game by Board.js.
- 3 knights procedurally placed (Hedge / Griffin / King's Champion).
- 6 monsters at fixed tiles (Milk Baby 14, Tax Goblin 28, Hill-Giant 42,
  Mimic 53, Hypno-Toad 58, Vampire Family 66).
- 1-3 portals of each type (Stable / Risky / Chaotic), procedurally placed.
- 8 treasure chests procedurally placed (was documented as 5).
- 1 Rusty Anvil at tile 50 (grants 3 Armor Shards).

> Earlier docs claimed fixed positions for everything (dragons at 32/62/98,
> knights at 9/45/80, 5 chests). The implementation in `js/Board.js` is
> procedural — those numbers were never the runtime layout.
