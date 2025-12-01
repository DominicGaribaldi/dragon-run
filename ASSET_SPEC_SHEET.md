# Dragon Run: The Royal Race - Asset Specification Sheet

> Master document for all game art assets. Track progress by marking items as complete.

---

## Asset Summary

| Category | Count | Status |
|----------|-------|--------|
| Backgrounds | 2 | Pending |
| Board Elements | 6 | Pending |
| Player Characters | 6 | Pending |
| Dragons | 3 | Pending |
| Knights (Ladders) | 3 | Pending |
| Monsters | 6 | Pending |
| Items | 5 | Pending |
| UI Elements | 12 | Pending |
| Effects/Particles | 4 | Pending |
| **TOTAL** | **47** | **0/47** |

---

## 1. BACKGROUNDS

### 1.1 Main Game Background
- **Filename:** `bg_causeway_main.png`
- **Dimensions:** 1280 x 720 px
- **Format:** PNG (no transparency)
- **Status:** [ ] Pending

**Description:**
The primary game board background. An elevated stone causeway/bridge system winding through a fantasy chasm. The path should snake from bottom-left to top-right with 10 rows visible. Dark atmospheric cave/canyon environment with lava glow at the bottom.

**AI Prompt (Midjourney/SD):**
```
16-bit pixel art game background, elevated stone causeway bridge winding through dark fantasy cavern, snaking path from bottom-left to top-right, ancient weathered stone bridges with wooden plank sections, deep chasm below with orange lava glow, distant castle silhouette on left, volcanic mountain on right, dark atmospheric cave ceiling, torches along the path, Metal Slug art style, rich detailed pixel art, game asset, 1280x720, --ar 16:9 --style raw
```

**Alternative Prompt (More detailed):**
```
Pixel art game board background, fantasy medieval setting, interconnected stone bridges forming S-curve path across deadly chasm, alternating gray cobblestone and brown wooden plank sections, gothic architecture details, stalactites hanging from cave ceiling, pools of molten lava far below casting orange ambient light, mist and atmosphere, side-scrolling game perspective, 16-bit era graphics quality, rich color palette browns grays oranges, no characters, empty path ready for game pieces, --ar 16:9 --v 6
```

---

### 1.2 Title Screen Background
- **Filename:** `bg_title_screen.png`
- **Dimensions:** 1280 x 720 px
- **Format:** PNG
- **Status:** [ ] Pending

**Description:**
Epic title screen showing a dragon coiled around a castle tower with knights approaching. Dramatic lighting, fantasy atmosphere.

**AI Prompt:**
```
16-bit pixel art title screen, epic fantasy scene, massive red dragon coiled around gothic castle tower, four heroic knights approaching on stone bridge, dramatic sunset lighting orange and purple sky, fantasy Metal Slug style, detailed pixel art, game logo space at top center, rich colors, medieval fantasy atmosphere, 1280x720, --ar 16:9 --style raw
```

---

## 2. BOARD ELEMENTS

### 2.1 Stone Tile
- **Filename:** `tile_stone.png`
- **Dimensions:** 64 x 64 px
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**Description:**
Standard stone causeway tile. Weathered gray cobblestone with subtle cracks and moss.

**AI Prompt:**
```
Single pixel art stone tile, top-down view, weathered gray cobblestone, subtle cracks and moss details, medieval fantasy style, game asset, 64x64 pixels, transparent background, tileable edges, 16-bit style --s 250
```

---

### 2.2 Wood Tile
- **Filename:** `tile_wood.png`
- **Dimensions:** 64 x 64 px
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**Description:**
Wooden plank bridge tile. Aged brown wood with visible grain and nail heads.

**AI Prompt:**
```
Single pixel art wooden plank tile, top-down view, aged brown wooden planks, visible wood grain and iron nails, bridge flooring, game asset, 64x64 pixels, transparent background, tileable, 16-bit pixel art style --s 250
```

---

### 2.3 Start Tile
- **Filename:** `tile_start.png`
- **Dimensions:** 64 x 64 px
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**Description:**
Starting position tile with green banner/flag motif and "START" carved into stone.

**AI Prompt:**
```
Pixel art game start tile, stone tile with green banner flag, word START carved into stone, decorative border, fantasy medieval style, 64x64 pixels, transparent background, 16-bit game asset --s 250
```

---

### 2.4 Finish Tile
- **Filename:** `tile_finish.png`
- **Dimensions:** 64 x 64 px
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**Description:**
Victory tile with golden crown, checkered pattern, and royal flourishes.

**AI Prompt:**
```
Pixel art game finish tile, golden crown emblem in center, black and white checkered border, royal purple accents, victory celebration tile, fantasy medieval style, 64x64 pixels, transparent background, 16-bit game asset --s 250
```

---

### 2.5 Knight Tile Marker (Ladder)
- **Filename:** `tile_marker_knight.png`
- **Dimensions:** 64 x 64 px
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**Description:**
Golden glowing tile marker indicating a knight/ladder space. Sword and shield emblem.

**AI Prompt:**
```
Pixel art special tile marker, golden glowing aura, sword and shield emblem, positive power-up indicator, fantasy game asset, shimmering gold effect, 64x64 pixels, transparent background, 16-bit style --s 250
```

---

### 2.6 Dragon Tile Marker (Snake)
- **Filename:** `tile_marker_dragon.png`
- **Dimensions:** 64 x 64 px
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**Description:**
Red/orange glowing danger tile marker. Dragon claw or flame emblem.

**AI Prompt:**
```
Pixel art danger tile marker, red orange glowing aura, dragon claw emblem with flames, hazard warning indicator, fantasy game asset, ominous fire effect, 64x64 pixels, transparent background, 16-bit style --s 250
```

---

## 3. PLAYER CHARACTERS

> All characters need: Idle (4 frames), Walk (6 frames), Victory (4 frames)
> Sprite sheet format: Horizontal strip, each frame 64x64

### 3.1 Sir Reginald (The Brave Knight)
- **Filename:** `char_reginald_sheet.png`
- **Dimensions:** 896 x 64 px (14 frames x 64px)
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**Description:**
Heavy armored knight in red/silver. Bulky, brave, carries large sword and shield. Ironclad appearance.

**AI Prompt:**
```
Pixel art sprite sheet, medieval knight character, heavy plate armor red and silver colors, large sword and tower shield, brave heroic pose, 14 frame horizontal strip animation sheet, idle walk and victory poses, chibi proportions, Metal Slug character style, 64x64 per frame, transparent background, 16-bit game asset --ar 14:1
```

**Individual Frame Prompt:**
```
Single pixel art knight character, heavy red and silver plate armor, large broadsword, tower shield with lion emblem, heroic standing pose, chibi proportions like Metal Slug, 64x64 pixels, transparent background, 16-bit style
```

---

### 3.2 Elara (The Clever Wizard)
- **Filename:** `char_elara_sheet.png`
- **Dimensions:** 896 x 64 px
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**Description:**
Female wizard in blue robes with pointed hat. Carries magical staff with glowing crystal. Mysterious and intelligent.

**AI Prompt:**
```
Pixel art sprite sheet, female wizard character, flowing blue robes and pointed wizard hat, magical staff with glowing blue crystal, arcane symbols on clothing, 14 frame horizontal animation, idle walk victory poses, chibi Metal Slug style, 64x64 per frame, transparent background, 16-bit --ar 14:1
```

---

### 3.3 Kaelen (The Rogue Archer)
- **Filename:** `char_kaelen_sheet.png`
- **Dimensions:** 896 x 64 px
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**Description:**
Agile hooded archer in green/brown leather. Carries bow and quiver. Quick and nimble appearance.

**AI Prompt:**
```
Pixel art sprite sheet, hooded archer rogue character, green and brown leather armor, longbow and arrow quiver, hood shadowing face, agile nimble pose, 14 frame horizontal animation, idle walk victory, chibi Metal Slug style, 64x64 per frame, transparent background, 16-bit --ar 14:1
```

---

### 3.4 Princess Aurelia (The Royal)
- **Filename:** `char_aurelia_sheet.png`
- **Dimensions:** 896 x 64 px
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**Description:**
Royal princess in golden armor dress. Tiara, elegant but battle-ready. Carries rapier.

**AI Prompt:**
```
Pixel art sprite sheet, princess warrior character, elegant golden armor dress, royal tiara crown, rapier sword, regal but battle-ready pose, blonde hair, 14 frame horizontal animation, idle walk victory, chibi Metal Slug style, 64x64 per frame, transparent background, 16-bit --ar 14:1
```

---

### 3.5 Grizelda (Dwarf Engineer)
- **Filename:** `char_grizelda_sheet.png`
- **Dimensions:** 896 x 64 px
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**Description:**
Stout female dwarf with braided beard, goggles, and mechanical hammer. Steampunk-fantasy hybrid.

**AI Prompt:**
```
Pixel art sprite sheet, female dwarf engineer character, stout body braided red beard, brass goggles on forehead, mechanical warhammer with gears, leather apron with tools, 14 frame horizontal animation, idle walk victory, chibi Metal Slug style, 64x64 per frame, transparent background, 16-bit --ar 14:1
```

---

### 3.6 Pippin (Mischievous Bard)
- **Filename:** `char_pippin_sheet.png`
- **Dimensions:** 896 x 64 px
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**Description:**
Cheerful halfling/gnome bard with lute. Colorful jester-like outfit in purple and gold. Always smiling.

**AI Prompt:**
```
Pixel art sprite sheet, halfling bard character, cheerful smiling face, purple and gold jester-like outfit with bells, carrying lute instrument, feathered cap, 14 frame horizontal animation, idle walk victory, chibi Metal Slug style, 64x64 per frame, transparent background, 16-bit --ar 14:1
```

---

## 4. DRAGONS (Snakes)

> Large sprites that span multiple tiles visually. Need idle animation (4 frames) and attack animation (4 frames).

### 4.1 Slime-Tooth (Swamp Dragon)
- **Filename:** `dragon_slimetooth_sheet.png`
- **Dimensions:** 512 x 256 px (8 frames, 2 rows)
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**Description:**
Green swamp dragon dripping with slime and acid. Long serpentine body, multiple eyes, gooey texture.

**AI Prompt:**
```
Pixel art dragon sprite sheet, green swamp dragon, serpentine body dripping with slime and acid, multiple glowing eyes, gooey toxic texture, menacing but cartoonish, 8 frames arranged 4x2 grid, idle breathing and acid spit attack animations, 128x128 per frame, transparent background, 16-bit Metal Slug monster style --ar 2:1
```

---

### 4.2 Frost-Fang (Ice Drake)
- **Filename:** `dragon_frostfang_sheet.png`
- **Dimensions:** 512 x 256 px
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**Description:**
Blue/white ice dragon with crystalline scales. Icicle horns, frost breath, cold mist emanating from body.

**AI Prompt:**
```
Pixel art dragon sprite sheet, ice dragon blue and white, crystalline frozen scales, icicle horns and spines, frost breath with snowflakes, cold mist aura, 8 frames 4x2 grid, idle and ice breath attack animations, 128x128 per frame, transparent background, 16-bit Metal Slug style --ar 2:1
```

---

### 4.3 Ignis the King (Fire Dragon)
- **Filename:** `dragon_ignis_sheet.png`
- **Dimensions:** 512 x 256 px
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**Description:**
Massive red/orange fire dragon. The boss dragon. Crown of flames, molten scales, terrifying but majestic.

**AI Prompt:**
```
Pixel art dragon sprite sheet, massive fire dragon king, red and orange with molten gold scales, crown of flames on head, glowing ember eyes, smoke from nostrils, majestic terrifying boss monster, 8 frames 4x2 grid, idle and fire breath attack, 128x128 per frame, transparent background, 16-bit Metal Slug boss style --ar 2:1
```

---

## 5. KNIGHTS (Ladders)

> Helper characters that boost players forward. Need idle animation (4 frames).

### 5.1 Hedge Knight
- **Filename:** `knight_hedge_sheet.png`
- **Dimensions:** 256 x 64 px (4 frames)
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**Description:**
Simple traveling knight in worn steel armor. Friendly, helpful appearance. Offers hand to help player up.

**AI Prompt:**
```
Pixel art knight sprite sheet, humble hedge knight, worn steel gray armor with green tabard, friendly helpful expression, extending hand upward gesture, 4 frame idle animation, 64x64 per frame horizontal strip, transparent background, 16-bit fantasy style --ar 4:1
```

---

### 5.2 Griffin Rider
- **Filename:** `knight_griffin_sheet.png`
- **Dimensions:** 256 x 256 px (4x4 grid = 16 frames)
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**Description:**
Knight mounted on a griffin. Silver armor with purple accents. Majestic flying mount with eagle head and lion body.

**AI Prompt:**
```
Pixel art griffin rider sprite sheet, knight in silver armor with purple cape, mounted on majestic griffin, eagle head lion body, wings spread ready to carry player, 16 frames in 4x4 grid, idle and hover animation, 64x64 per frame, 256x256 total image, transparent background, 16-bit fantasy style --ar 1:1
```

---

### 5.3 King's Champion
- **Filename:** `knight_champion_sheet.png`
- **Dimensions:** 256 x 64 px (4 frames)
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**Description:**
Elite royal knight in gleaming gold armor. Red cape, champion's crown. The most powerful ladder in the game.

**AI Prompt:**
```
Pixel art champion knight sprite sheet, elite warrior in gleaming gold armor, flowing red royal cape, champion crown helmet, powerful victorious pose, raised sword salute, 4 frame idle animation, 64x64 per frame, transparent background, 16-bit fantasy style --ar 4:1
```

---

## 6. MONSTERS (Encounters)

> Each monster needs idle (4 frames) and attack/react animation (4 frames).

### 6.1 Monster Milk Baby
- **Filename:** `monster_milkbaby_sheet.png`
- **Dimensions:** 512 x 128 px
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**Description:**
Bizarre cute-but-creepy baby monster made of milk/cream. Wobbly, sticky, throws tantrum. White/cream colored with rosy cheeks.

**AI Prompt:**
```
Pixel art monster sprite sheet, cute creepy milk baby creature, wobbly white cream-colored body, rosy cheeks, big watery eyes, sticky dripping texture, throwing tantrum pose, 8 frames 4x2 grid idle and crying attack, 64x64 per frame, transparent background, 16-bit quirky style --ar 4:1
```

---

### 6.2 Goblin Tax Collector
- **Filename:** `monster_taxgoblin_sheet.png`
- **Dimensions:** 512 x 128 px
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**Description:**
Greedy goblin in fancy but tattered noble clothes. Monocle, top hat, carries ledger and coin purse. Green skin.

**AI Prompt:**
```
Pixel art goblin sprite sheet, greedy tax collector goblin, tattered fancy noble clothes, monocle and bent top hat, carrying ledger book and bulging coin purse, green skin long nose, 8 frames idle and demanding money animation, 64x64 per frame, transparent background, 16-bit fantasy style --ar 4:1
```

---

### 6.3 Snoozing Hill-Giant
- **Filename:** `monster_hillgiant_sheet.png`
- **Dimensions:** 256 x 256 px (4x4 grid = 16 frames)
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**Description:**
Massive sleeping giant blocking path. Brown/green skin, patched clothing, snoring with Z's floating up.

**AI Prompt:**
```
Pixel art giant sprite sheet, sleeping hill giant, massive brown-green skin, patched primitive clothing, lying down snoring, floating Z letters, peaceful but dangerous if woken, 16 frames in 4x4 grid, sleeping and startled wake animation, 64x64 per frame, 256x256 total image, transparent background, 16-bit style --ar 1:1
```

---

### 6.4 Mimic Chest
- **Filename:** `monster_mimic_sheet.png`
- **Dimensions:** 512 x 128 px
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**Description:**
Treasure chest that's actually a monster. Transforms from innocent chest to toothy maw with tongue.

**AI Prompt:**
```
Pixel art mimic sprite sheet, treasure chest monster, first frames look like normal wooden chest with gold trim, transforms to reveal sharp teeth tongue and one eye, wooden texture with metal bands, 8 frames closed chest to open attack, 64x64 per frame, transparent background, 16-bit fantasy style --ar 4:1
```

---

### 6.5 Lucy & Vampire Family
- **Filename:** `monster_vampires_sheet.png`
- **Dimensions:** 512 x 128 px
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**Description:**
Cute vampire family - mother Lucy with two small vampire children. Gothic elegant dress, fangs, bat companions.

**AI Prompt:**
```
Pixel art vampire family sprite sheet, elegant mother vampire Lucy in gothic black dress, two small vampire children, pale skin red eyes, cute but spooky, small bats flying around, 8 frames welcoming and hypnotize animation, 64x64 per frame, transparent background, 16-bit style --ar 4:1
```

---

### 6.6 Hypno-Toad
- **Filename:** `monster_hypnotoad_sheet.png`
- **Dimensions:** 512 x 128 px
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**Description:**
Large psychedelic toad with spiral hypnotic eyes. Purple/green colors, glowing patterns, swirling effects.

**AI Prompt:**
```
Pixel art hypno toad sprite sheet, large magical toad, spiral hypnotic eyes with rainbow colors, purple and green warty skin, glowing psychedelic patterns, sitting zen pose, 8 frames idle and eye spiral hypnotize animation, 64x64 per frame, transparent background, 16-bit quirky style --ar 4:1
```

---

## 7. ITEMS

> Static item icons for inventory display. No animation needed.

### 7.1 Armor Shard
- **Filename:** `item_armor_shard.png`
- **Dimensions:** 32 x 32 px
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**AI Prompt:**
```
Pixel art item icon, glowing armor shard piece, metallic silver with blue magical glow, defensive shield fragment, fantasy RPG inventory item, 32x32 pixels, transparent background, 16-bit style
```

---

### 7.2 Speed Potion
- **Filename:** `item_speed_potion.png`
- **Dimensions:** 32 x 32 px
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**AI Prompt:**
```
Pixel art item icon, speed potion in glass bottle, swirling yellow-orange liquid, lightning bolt on label, cork stopper, fantasy RPG inventory item, 32x32 pixels, transparent background, 16-bit style
```

---

### 7.3 Spell Scroll
- **Filename:** `item_spell_scroll.png`
- **Dimensions:** 32 x 32 px
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**AI Prompt:**
```
Pixel art item icon, magical spell scroll, rolled parchment with purple ribbon, glowing arcane symbols, mystical aura, fantasy RPG inventory item, 32x32 pixels, transparent background, 16-bit style
```

---

### 7.4 Smoke Bomb
- **Filename:** `item_smoke_bomb.png`
- **Dimensions:** 32 x 32 px
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**AI Prompt:**
```
Pixel art item icon, ninja smoke bomb, round black sphere with fuse, wisps of gray smoke, stealthy escape item, fantasy RPG inventory item, 32x32 pixels, transparent background, 16-bit style
```

---

### 7.5 Holy Shield
- **Filename:** `item_holy_shield.png`
- **Dimensions:** 32 x 32 px
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**AI Prompt:**
```
Pixel art item icon, holy shield amulet, golden cross on white shield shape, divine light rays, protective blessing item, fantasy RPG inventory item, 32x32 pixels, transparent background, 16-bit style
```

---

## 8. UI ELEMENTS

### 8.1 UI Frame/Border
- **Filename:** `ui_frame.png`
- **Dimensions:** 1280 x 720 px
- **Format:** PNG (with transparency for game area)
- **Status:** [ ] Pending

**AI Prompt:**
```
Pixel art game UI frame, ornate golden medieval border, dragon scale pattern, corner decorations with dragon heads, transparent center for gameplay, fantasy RPG interface, 1280x720, 16-bit style
```

---

### 8.2 Side Panel Background
- **Filename:** `ui_panel_bg.png`
- **Dimensions:** 300 x 650 px
- **Format:** PNG
- **Status:** [ ] Pending

**AI Prompt:**
```
Pixel art UI panel background, dark stone texture with gold trim border, medieval scroll/parchment style, subtle dragon emblem watermark, fantasy RPG interface panel, 300x650 pixels, 16-bit style
```

---

### 8.3 Dice (6 faces)
- **Filename:** `ui_dice_sheet.png`
- **Dimensions:** 384 x 64 px (6 frames)
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**AI Prompt:**
```
Pixel art dice sprite sheet, ivory colored D6 die, 6 frames showing faces 1 through 6, golden dots/pips, ornate medieval style with subtle engravings, 64x64 per frame horizontal strip, transparent background, 16-bit style --ar 6:1
```

---

### 8.4 Dice Rolling Animation
- **Filename:** `ui_dice_roll_sheet.png`
- **Dimensions:** 512 x 64 px (8 frames)
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**AI Prompt:**
```
Pixel art dice rolling animation, ivory D6 tumbling spinning, motion blur frames, 8 frame animation sequence, dynamic rolling action, 64x64 per frame, transparent background, 16-bit style --ar 8:1
```

---

### 8.5 Button - Roll
- **Filename:** `ui_button_roll.png`
- **Dimensions:** 160 x 48 px
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**AI Prompt:**
```
Pixel art game button, "ROLL" text, golden medieval style button, raised 3D bevel effect, ornate border decorations, fantasy RPG UI element, 160x48 pixels, transparent background, 16-bit style
```

---

### 8.6 Button - Roll (Pressed)
- **Filename:** `ui_button_roll_pressed.png`
- **Dimensions:** 160 x 48 px
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**AI Prompt:**
```
Pixel art game button pressed state, "ROLL" text, golden medieval button pushed down, darker shading, fantasy RPG UI element, 160x48 pixels, transparent background, 16-bit style
```

---

### 8.7 Player Turn Indicator
- **Filename:** `ui_turn_banner.png`
- **Dimensions:** 200 x 60 px
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**AI Prompt:**
```
Pixel art banner ribbon, flowing medieval banner for current turn display, red and gold colors, ornate ends, text area in center, fantasy RPG UI element, 200x60 pixels, transparent background, 16-bit style
```

---

### 8.8 Player Portrait Frame
- **Filename:** `ui_portrait_frame.png`
- **Dimensions:** 80 x 80 px
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**AI Prompt:**
```
Pixel art portrait frame, ornate golden picture frame, medieval style with corner flourishes, empty center for character portrait, fantasy RPG UI element, 80x80 pixels, transparent background, 16-bit style
```

---

### 8.9 Inventory Slot
- **Filename:** `ui_inventory_slot.png`
- **Dimensions:** 48 x 48 px
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**AI Prompt:**
```
Pixel art inventory slot, leather pouch style container, stitched border, empty slot for items, fantasy RPG inventory UI, 48x48 pixels, transparent background, 16-bit style
```

---

### 8.10 Health/Defense Bar Background
- **Filename:** `ui_bar_bg.png`
- **Dimensions:** 120 x 16 px
- **Format:** PNG
- **Status:** [ ] Pending

**AI Prompt:**
```
Pixel art status bar background, dark recessed bar frame, stone texture with metal rivets on ends, empty bar for fill overlay, RPG UI element, 120x16 pixels, 16-bit style
```

---

### 8.11 Win Screen Overlay
- **Filename:** `ui_win_screen.png`
- **Dimensions:** 600 x 400 px
- **Format:** PNG (semi-transparent background)
- **Status:** [ ] Pending

**AI Prompt:**
```
Pixel art victory screen, ornate golden frame, "VICTORY" banner at top, space for winner portrait, confetti and celebration elements, royal trumpets and flags, fantasy medieval style, 600x400 pixels, semi-transparent dark background, 16-bit style
```

---

### 8.12 Logo/Title
- **Filename:** `ui_logo.png`
- **Dimensions:** 500 x 120 px
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**AI Prompt:**
```
Pixel art game logo, "DRAGON RUN" text, medieval fantasy font style, golden letters with red dragon silhouette incorporated, "The Royal Race" subtitle below smaller, ornate decorative flourishes, 500x120 pixels, transparent background, 16-bit style
```

---

## 9. EFFECTS & PARTICLES

### 9.1 Fire/Flame Effect
- **Filename:** `fx_fire_sheet.png`
- **Dimensions:** 256 x 64 px (4 frames)
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**AI Prompt:**
```
Pixel art fire animation sprite sheet, flickering flames, orange yellow red gradient, 4 frame loop animation, 64x64 per frame, transparent background, 16-bit style particle effect --ar 4:1
```

---

### 9.2 Ice/Frost Effect
- **Filename:** `fx_ice_sheet.png`
- **Dimensions:** 256 x 64 px (4 frames)
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**AI Prompt:**
```
Pixel art ice crystal animation sprite sheet, sparkling frost particles, blue white cyan colors, 4 frame shimmer loop, 64x64 per frame, transparent background, 16-bit style particle effect --ar 4:1
```

---

### 9.3 Magic Sparkle Effect
- **Filename:** `fx_sparkle_sheet.png`
- **Dimensions:** 256 x 64 px (4 frames)
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**AI Prompt:**
```
Pixel art magic sparkle animation, twinkling star particles, purple and gold colors, magical fairy dust, 4 frame loop, 64x64 per frame, transparent background, 16-bit style effect --ar 4:1
```

---

### 9.4 Smoke/Dust Poof Effect
- **Filename:** `fx_smoke_sheet.png`
- **Dimensions:** 256 x 64 px (4 frames)
- **Format:** PNG (transparent background)
- **Status:** [ ] Pending

**AI Prompt:**
```
Pixel art smoke poof animation, expanding dust cloud, gray brown colors, cartoon impact effect, 4 frame dissipating sequence, 64x64 per frame, transparent background, 16-bit style --ar 4:1
```

---

## Generation Tips

### For Midjourney:
- Add `--v 6` for latest version
- Add `--style raw` for less stylization
- Add `--s 250` for higher stylization (good for pixel art)
- Use `--ar` for aspect ratio (e.g., `--ar 1:1` for square)
- Add `--no realistic, 3d, photographic` to enforce pixel art style

### For Stable Diffusion:
- Use LoRA models: "pixel-art-xl", "16bit-game-sprites"
- Negative prompt: "blurry, 3d render, realistic, photographic, smooth"
- CFG Scale: 7-9
- Steps: 30-50
- Sampler: DPM++ 2M Karras

### Post-Processing:
1. Resize to exact dimensions if needed (nearest neighbor scaling)
2. Reduce colors to 32-64 color palette for authentic retro look
3. Clean up edges and remove anti-aliasing artifacts
4. Ensure transparent backgrounds are clean

---

## File Organization

```
dragon-run/
└── assets/
    ├── images/
    │   ├── backgrounds/
    │   │   ├── bg_causeway_main.png
    │   │   └── bg_title_screen.png
    │   ├── tiles/
    │   │   ├── tile_stone.png
    │   │   ├── tile_wood.png
    │   │   ├── tile_start.png
    │   │   ├── tile_finish.png
    │   │   ├── tile_marker_knight.png
    │   │   └── tile_marker_dragon.png
    │   ├── characters/
    │   │   ├── char_reginald_sheet.png
    │   │   ├── char_elara_sheet.png
    │   │   ├── char_kaelen_sheet.png
    │   │   ├── char_aurelia_sheet.png
    │   │   ├── char_grizelda_sheet.png
    │   │   └── char_pippin_sheet.png
    │   ├── dragons/
    │   │   ├── dragon_slimetooth_sheet.png
    │   │   ├── dragon_frostfang_sheet.png
    │   │   └── dragon_ignis_sheet.png
    │   ├── knights/
    │   │   ├── knight_hedge_sheet.png
    │   │   ├── knight_griffin_sheet.png
    │   │   └── knight_champion_sheet.png
    │   ├── monsters/
    │   │   ├── monster_milkbaby_sheet.png
    │   │   ├── monster_taxgoblin_sheet.png
    │   │   ├── monster_hillgiant_sheet.png
    │   │   ├── monster_mimic_sheet.png
    │   │   ├── monster_vampires_sheet.png
    │   │   └── monster_hypnotoad_sheet.png
    │   ├── items/
    │   │   ├── item_armor_shard.png
    │   │   ├── item_speed_potion.png
    │   │   ├── item_spell_scroll.png
    │   │   ├── item_smoke_bomb.png
    │   │   └── item_holy_shield.png
    │   ├── ui/
    │   │   ├── ui_frame.png
    │   │   ├── ui_panel_bg.png
    │   │   ├── ui_dice_sheet.png
    │   │   ├── ui_dice_roll_sheet.png
    │   │   ├── ui_button_roll.png
    │   │   ├── ui_button_roll_pressed.png
    │   │   ├── ui_turn_banner.png
    │   │   ├── ui_portrait_frame.png
    │   │   ├── ui_inventory_slot.png
    │   │   ├── ui_bar_bg.png
    │   │   ├── ui_win_screen.png
    │   │   └── ui_logo.png
    │   └── effects/
    │       ├── fx_fire_sheet.png
    │       ├── fx_ice_sheet.png
    │       ├── fx_sparkle_sheet.png
    │       └── fx_smoke_sheet.png
    └── audio/
        └── (audio assets TBD)
```

---

## Progress Tracking

Update this section as assets are completed:

- [ ] **Phase 1: Core Visuals** (Start here)
  - [ ] bg_causeway_main.png
  - [ ] char_reginald_sheet.png
  - [ ] char_elara_sheet.png
  - [ ] ui_dice_sheet.png

- [ ] **Phase 2: Enemies**
  - [ ] dragon_slimetooth_sheet.png
  - [ ] dragon_frostfang_sheet.png
  - [ ] dragon_ignis_sheet.png
  - [ ] All monster sheets

- [ ] **Phase 3: Polish**
  - [ ] All remaining characters
  - [ ] All knights
  - [ ] All items
  - [ ] All UI elements
  - [ ] All effects

---

*Last Updated: 2024*
*Document Version: 1.0*
