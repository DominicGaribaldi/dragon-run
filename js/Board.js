/**
 * DRAGON RUN: THE ROYAL RACE
 * Board.js - Handles the game board logic and tile system
 *
 * The board is procedurally generated with a zigzag winding path:
 * - Starts at bottom-left (tile 1)
 * - Zigzags up with random variations in segment lengths
 * - Path is generated fresh each game for variety
 */

class Board {
    /**
     * @param {Phaser.Scene} scene - The Phaser scene this board belongs to
     * @param {ProceduralGraphics} gfx - The procedural graphics generator
     */
    constructor(scene, gfx = null) {
        this.scene = scene;
        this.gfx = gfx; // Procedural graphics system

        // Board configuration - 100 tiles for classic board game feel
        this.totalTiles = 100;

        // Tile visual settings - MUCH bigger tiles for visibility
        this.tileSize = 80;
        this.tileGap = 15;  // More gap between tiles

        // Board bounds - the board can extend beyond the screen (camera will pan)
        this.marginX = 100;   // Left margin for start
        this.marginY = 100;   // Bottom margin for start

        // Board dimensions - much larger than screen, camera will scroll
        this.boardWidth = 3000;  // Wide board for snaking path
        this.boardHeight = 2500; // Tall board for many rows

        // Storage for tile coordinates (1-indexed: tiles[1] through tiles[100])
        this.tiles = {};

        // Storage for the procedural path (pixel coordinates)
        this.path = [];

        // Storage for tile graphics objects
        this.tileGraphics = [];
        this.specialMarkers = [];
        this.dragonGraphics = [];
        this.knightGraphics = [];

        // Storage for monster/dragon/knight sprites keyed by tile for animation access
        this.monsterSprites = {}; // { tile: sprite }
        this.dragonSpritesMap = {}; // { 'ignis': sprite, 'frostfang': sprite, etc. }
        this.knightSpritesMap = {}; // { 'hedge': sprite, 'griffin': sprite, 'champion': sprite }

        // Path connector graphics
        this.pathConnectors = [];

        // Graphics object for drawing prototype tiles
        this.graphics = null;

        // Special tiles will be assigned after path generation
        this.specialTiles = null;

        // Board container for camera following
        this.container = null;
    }

    /**
     * Initialize special tiles with procedurally assigned positions
     * Called after path generation to place encounters at appropriate tiles
     *
     * @returns {Object} Configuration object for all special tiles
     */
    initializeSpecialTiles() {
        // Define zones for placing special tiles (based on 100 tile board)
        // This ensures good distribution across the board
        const zones = {
            veryEarly: { min: 3, max: 15 },    // Tiles 3-15
            early: { min: 12, max: 30 },       // Tiles 12-30
            earlyMid: { min: 25, max: 45 },    // Tiles 25-45
            mid: { min: 40, max: 60 },         // Tiles 40-60
            lateMid: { min: 55, max: 75 },     // Tiles 55-75
            late: { min: 70, max: 90 },        // Tiles 70-90
            veryLate: { min: 85, max: 97 }     // Tiles 85-97
        };

        // Helper to pick a random tile in a zone
        const pickInZone = (zone, exclude = []) => {
            let tile;
            let attempts = 0;
            do {
                tile = Math.floor(Math.random() * (zone.max - zone.min + 1)) + zone.min;
                attempts++;
            } while (exclude.includes(tile) && attempts < 50);
            return tile;
        };

        const usedTiles = [];

        // KNIGHTS (Ladders) - 3 knights spread across the board
        const knight1Tile = pickInZone(zones.veryEarly, usedTiles);
        usedTiles.push(knight1Tile);
        const knight1Dest = Math.min(knight1Tile + 15 + Math.floor(Math.random() * 10), 35);

        const knight2Tile = pickInZone(zones.earlyMid, usedTiles);
        usedTiles.push(knight2Tile);
        const knight2Dest = Math.min(knight2Tile + 15 + Math.floor(Math.random() * 10), 65);

        const knight3Tile = pickInZone(zones.lateMid, usedTiles);
        usedTiles.push(knight3Tile);
        const knight3Dest = Math.min(knight3Tile + 12 + Math.floor(Math.random() * 8), 92);

        // DRAGONS (Snakes) - 3 dragons guarding different areas
        const dragon1Tile = pickInZone(zones.early, usedTiles);
        usedTiles.push(dragon1Tile);
        const dragon1Dest = Math.max(dragon1Tile - 12 - Math.floor(Math.random() * 8), 3);

        const dragon2Tile = pickInZone(zones.mid, usedTiles);
        usedTiles.push(dragon2Tile);
        const dragon2Dest = Math.max(dragon2Tile - 18 - Math.floor(Math.random() * 10), 15);

        // Ignis (Red Dragon) - ALWAYS close to finish line (tiles 95-98)
        const dragon3Tile = 95 + Math.floor(Math.random() * 3); // 95, 96, 97, or 98
        usedTiles.push(dragon3Tile);
        const dragon3Dest = Math.max(dragon3Tile - 25 - Math.floor(Math.random() * 10), 55);

        // ENCOUNTERS (Monsters) - 6 encounters spread across the board
        const encounter1 = pickInZone(zones.veryEarly, usedTiles);
        usedTiles.push(encounter1);
        const encounter2 = pickInZone(zones.early, usedTiles);
        usedTiles.push(encounter2);
        const encounter3 = pickInZone(zones.earlyMid, usedTiles);
        usedTiles.push(encounter3);
        const encounter4 = pickInZone(zones.mid, usedTiles);
        usedTiles.push(encounter4);
        const encounter5 = pickInZone(zones.lateMid, usedTiles);
        usedTiles.push(encounter5);
        const encounter6 = pickInZone(zones.late, usedTiles);
        usedTiles.push(encounter6);

        // SPECIAL TILES (Chests, Anvil, Portals) - 8 chests for 100 tiles (doubled!)
        const chest1 = pickInZone(zones.veryEarly, usedTiles);
        usedTiles.push(chest1);
        const chest2 = pickInZone(zones.veryEarly, usedTiles);
        usedTiles.push(chest2);
        const chest3 = pickInZone(zones.early, usedTiles);
        usedTiles.push(chest3);
        const chest4 = pickInZone(zones.earlyMid, usedTiles);
        usedTiles.push(chest4);
        const anvil = pickInZone(zones.mid, usedTiles);
        usedTiles.push(anvil);
        const chest5 = pickInZone(zones.mid, usedTiles);
        usedTiles.push(chest5);
        const chest6 = pickInZone(zones.lateMid, usedTiles);
        usedTiles.push(chest6);
        const chest7 = pickInZone(zones.late, usedTiles);
        usedTiles.push(chest7);
        const chest8 = pickInZone(zones.veryLate, usedTiles);
        usedTiles.push(chest8);

        // PORTAL TYPES - random 1-3 of each type spread across the board
        // Helper to pick multiple tiles in a zone
        const pickMultipleInZone = (zones, count, exclude) => {
            const tiles = [];
            for (let i = 0; i < count; i++) {
                const zone = zones[i % zones.length]; // Cycle through zones
                const tile = pickInZone(zone, exclude);
                tiles.push(tile);
                exclude.push(tile);
            }
            return tiles;
        };

        // Random 1-3 of each portal type
        const balancedCount = Math.floor(Math.random() * 3) + 1; // 1-3
        const riskyCount = Math.floor(Math.random() * 3) + 1;
        const chaoticCount = Math.floor(Math.random() * 3) + 1;

        // Spread portals across appropriate zones
        const portalBalancedTiles = pickMultipleInZone(
            [zones.veryEarly, zones.early, zones.earlyMid],
            balancedCount, usedTiles
        ); // Green - safe early game

        const portalRiskyTiles = pickMultipleInZone(
            [zones.earlyMid, zones.mid, zones.lateMid],
            riskyCount, usedTiles
        ); // Purple - mid game gamble

        const portalChaoticTiles = pickMultipleInZone(
            [zones.lateMid, zones.late, zones.veryLate],
            chaoticCount, usedTiles
        ); // Red - late game chaos

        // Store the procedural assignments for EncounterData to reference
        this.proceduralAssignments = {
            knights: {
                hedge: { base: knight1Tile, dest: knight1Dest },
                griffin: { base: knight2Tile, dest: knight2Dest },
                champion: { base: knight3Tile, dest: knight3Dest }
            },
            dragons: {
                slimetooth: { head: dragon1Tile, tail: dragon1Dest },
                frostfang: { head: dragon2Tile, tail: dragon2Dest },
                ignis: { head: dragon3Tile, tail: dragon3Dest }
            },
            monsters: {
                milkbaby: encounter1,
                taxgoblin: encounter2,
                hillgiant: encounter3,
                mimic: encounter4,
                hypnotoad: encounter5,
                vampires: encounter6
            },
            special: {
                chests: [chest1, chest2, chest3, chest4, chest5, chest6, chest7, chest8],
                anvil: anvil,
                portalBalancedTiles: portalBalancedTiles,
                portalRiskyTiles: portalRiskyTiles,
                portalChaoticTiles: portalChaoticTiles
            }
        };

        // Create elemental zones around dragons
        // Tiles within range of each dragon get an elemental effect
        this.elementalTiles = {};
        const elementalRange = 5; // tiles before and after dragon head

        // Slime-Tooth (poison) - green dragon
        for (let i = Math.max(1, dragon1Tile - elementalRange); i <= Math.min(100, dragon1Tile + elementalRange); i++) {
            if (!usedTiles.includes(i)) this.elementalTiles[i] = 'poison';
        }

        // Frost-Fang (ice) - blue dragon
        for (let i = Math.max(1, dragon2Tile - elementalRange); i <= Math.min(100, dragon2Tile + elementalRange); i++) {
            if (!usedTiles.includes(i)) this.elementalTiles[i] = 'ice';
        }

        // Ignis (fire) - red dragon
        for (let i = Math.max(1, dragon3Tile - elementalRange); i <= Math.min(100, dragon3Tile + elementalRange); i++) {
            if (!usedTiles.includes(i)) this.elementalTiles[i] = 'fire';
        }

        // Update EncounterData with procedural positions
        this.updateEncounterData();

        return {
            knights: {
                [knight1Tile]: { destination: knight1Dest, name: "Hedge Knight" },
                [knight2Tile]: { destination: knight2Dest, name: "Griffin Rider" },
                [knight3Tile]: { destination: knight3Dest, name: "King's Champion" }
            },
            dragons: {
                [dragon1Tile]: { destination: dragon1Dest, name: "Slime-Tooth" },
                [dragon2Tile]: { destination: dragon2Dest, name: "Frost-Fang" },
                [dragon3Tile]: { destination: dragon3Dest, name: "Ignis the King" }
            },
            encounters: {
                [encounter1]: { name: "Monster Milk Baby" },
                [encounter2]: { name: "Goblin Tax Collector" },
                [encounter3]: { name: "Snoozing Hill-Giant" },
                [encounter4]: { name: "Mimic Chest" },
                [encounter5]: { name: "Hypno-Toad" },
                [encounter6]: { name: "Lucy & Vampire Family" }
            },
            special: {
                [chest1]: { name: "Treasure Chest" },
                [chest2]: { name: "Treasure Chest" },
                [chest3]: { name: "Treasure Chest" },
                [chest4]: { name: "Treasure Chest" },
                [anvil]: { name: "Rusty Anvil" },
                [chest5]: { name: "Treasure Chest" },
                [chest6]: { name: "Treasure Chest" },
                [chest7]: { name: "Treasure Chest" },
                [chest8]: { name: "Treasure Chest" },
                // Add all portal tiles dynamically
                ...Object.fromEntries(portalBalancedTiles.map(t => [t, { name: "Stable Portal" }])),
                ...Object.fromEntries(portalRiskyTiles.map(t => [t, { name: "Gambler's Gate" }])),
                ...Object.fromEntries(portalChaoticTiles.map(t => [t, { name: "Chaos Rift" }]))
            }
        };
    }

    /**
     * Apply server-provided board assignments for multiplayer sync
     * This overwrites the local procedural assignments with server data
     * @param {Object} serverAssignments - Assignments from server including seed
     */
    applyServerAssignments(serverAssignments) {
        if (!serverAssignments) {
            console.error('[Board] No server assignments provided');
            return;
        }

        console.log('[Board] Applying server assignments:', serverAssignments);

        // Convert server format to client format
        this.proceduralAssignments = {
            knights: {
                hedge: serverAssignments.knights.hedge,
                griffin: serverAssignments.knights.griffin,
                champion: serverAssignments.knights.champion
            },
            dragons: {
                slimetooth: serverAssignments.dragons.slimetooth,
                frostfang: serverAssignments.dragons.frostfang,
                ignis: serverAssignments.dragons.ignis
            },
            monsters: {
                milkbaby: serverAssignments.monsters.find(m => m.type === 'milkbaby')?.tile,
                taxgoblin: serverAssignments.monsters.find(m => m.type === 'taxgoblin')?.tile,
                hillgiant: serverAssignments.monsters.find(m => m.type === 'hillgiant')?.tile,
                mimic: serverAssignments.monsters.find(m => m.type === 'mimic')?.tile,
                hypnotoad: serverAssignments.monsters.find(m => m.type === 'hypnotoad')?.tile,
                vampires: serverAssignments.monsters.find(m => m.type === 'vampires')?.tile
            },
            special: {
                chests: serverAssignments.specials.filter(s => s.type === 'chest').map(s => s.tile),
                anvil: serverAssignments.specials.find(s => s.type === 'anvil')?.tile,
                // Portal arrays - server can send multiple tiles per portal type
                portalBalancedTiles: serverAssignments.portals.filter(p => p.type === 'balanced').map(p => p.tile),
                portalRiskyTiles: serverAssignments.portals.filter(p => p.type === 'risky').map(p => p.tile),
                portalChaoticTiles: serverAssignments.portals.filter(p => p.type === 'chaotic').map(p => p.tile)
            }
        };

        // Update EncounterData with new positions
        this.updateEncounterData();

        console.log('[Board] Server assignments applied, proceduralAssignments:', this.proceduralAssignments);
    }

    /**
     * Regenerate board using a seed (for multiplayer sync)
     * @param {number} seed - The seed to use for random generation
     */
    regenerateWithSeed(seed) {
        console.log('[Board] Regenerating with seed:', seed);
        // For now, we use server-provided assignments directly
        // This method exists for future seeded client-side generation if needed
    }

    /**
     * Update EncounterData with procedurally generated tile positions
     */
    updateEncounterData() {
        if (typeof EncounterData === 'undefined') return;

        const pa = this.proceduralAssignments;

        // Update knights
        EncounterData.knights.hedge.baseTile = pa.knights.hedge.base;
        EncounterData.knights.hedge.destinationTile = pa.knights.hedge.dest;
        EncounterData.knights.griffin.baseTile = pa.knights.griffin.base;
        EncounterData.knights.griffin.destinationTile = pa.knights.griffin.dest;
        EncounterData.knights.champion.baseTile = pa.knights.champion.base;
        EncounterData.knights.champion.destinationTile = pa.knights.champion.dest;

        // Update dragons
        EncounterData.dragons.slimetooth.headTile = pa.dragons.slimetooth.head;
        EncounterData.dragons.slimetooth.tailTile = pa.dragons.slimetooth.tail;
        EncounterData.dragons.frostfang.headTile = pa.dragons.frostfang.head;
        EncounterData.dragons.frostfang.tailTile = pa.dragons.frostfang.tail;
        EncounterData.dragons.ignis.headTile = pa.dragons.ignis.head;
        EncounterData.dragons.ignis.tailTile = pa.dragons.ignis.tail;

        // Update monsters
        EncounterData.monsters.milkbaby.tile = pa.monsters.milkbaby;
        EncounterData.monsters.taxgoblin.tile = pa.monsters.taxgoblin;
        EncounterData.monsters.hillgiant.tile = pa.monsters.hillgiant;
        EncounterData.monsters.mimic.tile = pa.monsters.mimic;
        EncounterData.monsters.hypnotoad.tile = pa.monsters.hypnotoad;
        EncounterData.monsters.vampires.tile = pa.monsters.vampires;

        // Update special tiles
        EncounterData.special.rustyAnvil.tile = pa.special.anvil;
        EncounterData.special.lootChest.tiles = pa.special.chests;

        // Update portal tiles (now arrays for multiple portals of each type)
        EncounterData.special.portalBalanced.tiles = pa.special.portalBalancedTiles;
        EncounterData.special.portalRisky.tiles = pa.special.portalRiskyTiles;
        EncounterData.special.portalChaotic.tiles = pa.special.portalChaoticTiles;

        console.log('[Board] Updated EncounterData with procedural positions');
        console.log('[Board] Knights:', pa.knights);
        console.log('[Board] Dragons:', pa.dragons);
        console.log('[Board] Portals:', {
            balanced: pa.special.portalBalancedTiles,
            risky: pa.special.portalRiskyTiles,
            chaotic: pa.special.portalChaoticTiles
        });
    }

    /**
     * Generate tile coordinates using a zigzag path
     * Path goes: right across, up one, left across, up one, repeat
     * With random variations in horizontal segment lengths
     */
    generateTileCoordinates() {
        // Generate the zigzag path
        this.generateZigzagPath();

        // Now initialize special tiles (needs path to exist first)
        this.specialTiles = this.initializeSpecialTiles();

        // Update isSpecial property for each tile
        for (let tileNumber = 1; tileNumber <= this.totalTiles; tileNumber++) {
            this.tiles[tileNumber].isSpecial = this.getTileType(tileNumber);
        }

        console.log(`[Board] Generated zigzag path with ${this.totalTiles} tiles`);
        console.log('[Board] Tile 1 (Start):', this.tiles[1]);
        console.log(`[Board] Tile ${this.totalTiles} (Finish):`, this.tiles[this.totalTiles]);
    }

    /**
     * Generate a winding path where tiles connect edge-to-edge
     * Only uses cardinal directions (up, down, left, right) - no diagonals
     * Creates a snake-like path from bottom-left moving upward
     */
    generateZigzagPath() {
        this.path = [];

        // Tile spacing - tiles touch edge-to-edge
        const tileSpacing = this.tileSize;

        // Grid-based system for proper connections
        // Each grid cell can only have one tile
        const gridCellSize = this.tileSize;
        const grid = new Map(); // key: "gridX,gridY" -> tileNumber
        const gridKey = (gx, gy) => `${gx},${gy}`;

        // Calculate grid dimensions
        const gridWidth = Math.floor((this.boardWidth - this.marginX * 2) / gridCellSize);
        const gridHeight = Math.floor((this.boardHeight - this.marginY * 2) / gridCellSize);

        // Start at bottom-left of grid
        let gridX = 1;
        let gridY = gridHeight - 1;

        // Cardinal directions only - tiles must connect by edges
        const directions = [
            { dx: 1, dy: 0, name: 'right' },
            { dx: -1, dy: 0, name: 'left' },
            { dx: 0, dy: -1, name: 'up' },
            { dx: 0, dy: 1, name: 'down' }
        ];

        // Convert grid position to pixel position
        const gridToPixel = (gx, gy) => ({
            x: this.marginX + gx * gridCellSize + gridCellSize / 2,
            y: this.marginY + gy * gridCellSize + gridCellSize / 2
        });

        // Place first tile
        const startPos = gridToPixel(gridX, gridY);
        this.tiles[1] = {
            number: 1,
            x: startPos.x,
            y: startPos.y,
            isSpecial: null,
            gridX: gridX,
            gridY: gridY
        };
        this.path.push({ x: startPos.x, y: startPos.y });
        grid.set(gridKey(gridX, gridY), 1);

        // Track last direction to avoid immediate backtracking
        let lastDirection = null;

        // Generate remaining tiles
        for (let tileNum = 2; tileNum <= this.totalTiles; tileNum++) {
            const progress = tileNum / this.totalTiles;

            // Find valid moves (unoccupied adjacent cells)
            let validMoves = [];

            for (const dir of directions) {
                const newGX = gridX + dir.dx;
                const newGY = gridY + dir.dy;

                // Check grid bounds
                if (newGX < 0 || newGX >= gridWidth) continue;
                if (newGY < 0 || newGY >= gridHeight) continue;

                // Check if cell is already occupied
                if (grid.has(gridKey(newGX, newGY))) continue;

                // Calculate weight for this direction
                let weight = 10;

                // Prefer upward movement overall (we want to reach the top)
                if (dir.dy < 0) weight += 15 + progress * 10;

                // Discourage downward movement except early game
                if (dir.dy > 0) weight = progress < 0.3 ? 8 : 2;

                // Prefer horizontal movement to create snake pattern
                if (dir.dx !== 0) weight += 12;

                // Avoid immediate backtracking
                if (lastDirection && dir.dx === -lastDirection.dx && dir.dy === -lastDirection.dy) {
                    weight = 1;
                }

                // Prefer staying away from edges
                if (newGX <= 1 || newGX >= gridWidth - 2) weight -= 3;

                // Slight randomness to prevent predictable patterns
                weight += Math.random() * 5;

                validMoves.push({ dir, gx: newGX, gy: newGY, weight });
            }

            // If no valid moves (stuck), we need to find a path continuation
            // But we MUST maintain adjacency between consecutive tiles
            if (validMoves.length === 0) {
                // Strategy: Look for an empty cell that is:
                // 1. Adjacent to the current position
                // 2. Try expanding our search if truly stuck

                // First, try cells 2 steps away (we'll need to place intermediate tile)
                for (const dir of directions) {
                    const newGX = gridX + dir.dx;
                    const newGY = gridY + dir.dy;

                    // Skip if out of bounds
                    if (newGX < 0 || newGX >= gridWidth) continue;
                    if (newGY < 0 || newGY >= gridHeight) continue;

                    // If this immediate neighbor is occupied, check if we can go around
                    if (grid.has(gridKey(newGX, newGY))) {
                        // Try perpendicular directions from the occupied cell
                        for (const perpDir of directions) {
                            if (perpDir.dx === dir.dx && perpDir.dy === dir.dy) continue;
                            if (perpDir.dx === -dir.dx && perpDir.dy === -dir.dy) continue;

                            const aroundGX = gridX + perpDir.dx;
                            const aroundGY = gridY + perpDir.dy;

                            if (aroundGX >= 0 && aroundGX < gridWidth &&
                                aroundGY >= 0 && aroundGY < gridHeight &&
                                !grid.has(gridKey(aroundGX, aroundGY))) {
                                validMoves.push({ dir: perpDir, gx: aroundGX, gy: aroundGY, weight: 5 });
                            }
                        }
                    }
                }

                // If still stuck, find the nearest unoccupied cell we can reach
                if (validMoves.length === 0) {
                    // Search in expanding rings around current position
                    for (let radius = 2; radius <= 5 && validMoves.length === 0; radius++) {
                        for (let dx = -radius; dx <= radius; dx++) {
                            for (let dy = -radius; dy <= radius; dy++) {
                                if (Math.abs(dx) + Math.abs(dy) !== 1) continue; // Only direct neighbors of search area

                                const testGX = gridX + dx;
                                const testGY = gridY + dy;

                                if (testGX >= 0 && testGX < gridWidth &&
                                    testGY >= 0 && testGY < gridHeight &&
                                    !grid.has(gridKey(testGX, testGY))) {

                                    // Check if this cell is adjacent to any existing tile
                                    for (const checkDir of directions) {
                                        const adjGX = testGX + checkDir.dx;
                                        const adjGY = testGY + checkDir.dy;
                                        if (grid.has(gridKey(adjGX, adjGY))) {
                                            // Found an empty cell adjacent to the path
                                            // Move current position to the adjacent existing tile
                                            const adjTileNum = grid.get(gridKey(adjGX, adjGY));
                                            const adjTile = this.tiles[adjTileNum];
                                            gridX = adjTile.gridX;
                                            gridY = adjTile.gridY;
                                            validMoves.push({
                                                dir: { dx: testGX - gridX, dy: testGY - gridY },
                                                gx: testGX,
                                                gy: testGY,
                                                weight: 1
                                            });
                                            break;
                                        }
                                    }
                                    if (validMoves.length > 0) break;
                                }
                            }
                            if (validMoves.length > 0) break;
                        }
                    }
                }
            }

            // Last resort: force placement in any empty adjacent cell, biased upward
            if (validMoves.length === 0) {
                for (const dir of [directions[2], directions[0], directions[1], directions[3]]) { // up, right, left, down
                    let testY = gridY + dir.dy;
                    let testX = gridX + dir.dx;

                    // Search along this direction for an empty cell
                    for (let step = 1; step <= 3; step++) {
                        const searchGX = gridX + dir.dx * step;
                        const searchGY = gridY + dir.dy * step;

                        if (searchGX >= 0 && searchGX < gridWidth &&
                            searchGY >= 0 && searchGY < gridHeight &&
                            !grid.has(gridKey(searchGX, searchGY))) {
                            // Place at first available along this line
                            validMoves.push({ dir, gx: searchGX, gy: searchGY, weight: 1 });
                            break;
                        }
                    }
                    if (validMoves.length > 0) break;
                }
            }

            // Absolute last resort: if still no moves, find ANY empty cell
            if (validMoves.length === 0) {
                for (let searchY = 0; searchY < gridHeight; searchY++) {
                    for (let searchX = 0; searchX < gridWidth; searchX++) {
                        if (!grid.has(gridKey(searchX, searchY))) {
                            validMoves.push({ dir: directions[2], gx: searchX, gy: searchY, weight: 1 });
                            break;
                        }
                    }
                    if (validMoves.length > 0) break;
                }
            }

            // Weighted random selection
            const totalWeight = validMoves.reduce((sum, m) => sum + m.weight, 0);
            let random = Math.random() * totalWeight;
            let chosen = validMoves[0];

            // Safety check - if still no moves, something is very wrong
            if (!chosen) {
                console.error('[Board] Path generation failed - no valid moves at tile', tileNum);
                break;
            }

            for (const move of validMoves) {
                random -= move.weight;
                if (random <= 0) {
                    chosen = move;
                    break;
                }
            }

            gridX = chosen.gx;
            gridY = chosen.gy;
            lastDirection = chosen.dir;

            const pos = gridToPixel(gridX, gridY);
            this.tiles[tileNum] = {
                number: tileNum,
                x: pos.x,
                y: pos.y,
                isSpecial: null,
                gridX: gridX,
                gridY: gridY
            };
            this.path.push({ x: pos.x, y: pos.y });
            grid.set(gridKey(gridX, gridY), tileNum);

            // Validation: Ensure this tile is adjacent to the previous tile
            if (tileNum > 1) {
                const prevTile = this.tiles[tileNum - 1];
                const dx = Math.abs(gridX - prevTile.gridX);
                const dy = Math.abs(gridY - prevTile.gridY);
                const isAdjacent = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);

                if (!isAdjacent) {
                    console.warn(`[Board] Non-adjacent tiles detected: ${tileNum - 1} at (${prevTile.gridX},${prevTile.gridY}) -> ${tileNum} at (${gridX},${gridY})`);
                }
            }
        }

        // Post-processing: Verify and fix any non-adjacent tiles
        this.validateAndFixPath(grid, gridKey, gridToPixel, gridWidth, gridHeight);

        // Calculate actual board bounds based on generated tiles
        let minTileY = Infinity, maxTileY = -Infinity;
        let minTileX = Infinity, maxTileX = -Infinity;
        for (let i = 1; i <= this.totalTiles; i++) {
            minTileY = Math.min(minTileY, this.tiles[i].y);
            maxTileY = Math.max(maxTileY, this.tiles[i].y);
            minTileX = Math.min(minTileX, this.tiles[i].x);
            maxTileX = Math.max(maxTileX, this.tiles[i].x);
        }

        // Store actual bounds for camera
        this.actualBounds = {
            minX: minTileX - this.tileSize * 2,
            maxX: maxTileX + this.tileSize * 2,
            minY: minTileY - this.tileSize * 2,
            maxY: maxTileY + this.tileSize * 2,
            width: (maxTileX - minTileX) + this.tileSize * 4,
            height: (maxTileY - minTileY) + this.tileSize * 4
        };

        console.log('[Board] Generated connected path:', this.totalTiles, 'tiles');
        console.log('[Board] Actual bounds:', this.actualBounds);
    }

    /**
     * Validate the path and fix any non-adjacent tiles by repositioning them
     */
    validateAndFixPath(grid, gridKey, gridToPixel, gridWidth, gridHeight) {
        const directions = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 }
        ];

        let fixCount = 0;

        for (let tileNum = 2; tileNum <= this.totalTiles; tileNum++) {
            const tile = this.tiles[tileNum];
            const prevTile = this.tiles[tileNum - 1];

            const dx = Math.abs(tile.gridX - prevTile.gridX);
            const dy = Math.abs(tile.gridY - prevTile.gridY);
            const isAdjacent = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);

            if (!isAdjacent) {
                // Find an empty cell adjacent to the previous tile
                let fixed = false;

                for (const dir of directions) {
                    const newGX = prevTile.gridX + dir.dx;
                    const newGY = prevTile.gridY + dir.dy;

                    // Check bounds
                    if (newGX < 0 || newGX >= gridWidth || newGY < 0 || newGY >= gridHeight) continue;

                    // Check if cell is empty or is this tile's current position
                    const key = gridKey(newGX, newGY);
                    const occupant = grid.get(key);

                    if (!occupant || occupant === tileNum) {
                        // Remove old grid entry if moving
                        if (tile.gridX !== newGX || tile.gridY !== newGY) {
                            grid.delete(gridKey(tile.gridX, tile.gridY));
                        }

                        // Update tile position
                        const newPos = gridToPixel(newGX, newGY);
                        tile.gridX = newGX;
                        tile.gridY = newGY;
                        tile.x = newPos.x;
                        tile.y = newPos.y;
                        grid.set(key, tileNum);

                        // Update path array
                        this.path[tileNum - 1] = { x: newPos.x, y: newPos.y };

                        console.log(`[Board] Fixed tile ${tileNum}: moved to (${newGX}, ${newGY})`);
                        fixed = true;
                        fixCount++;
                        break;
                    }
                }

                if (!fixed) {
                    console.warn(`[Board] Could not fix tile ${tileNum} - no adjacent empty cells`);
                }
            }
        }

        if (fixCount > 0) {
            console.log(`[Board] Fixed ${fixCount} non-adjacent tiles`);
        }
    }

    /**
     * Determine if a tile has a special property
     *
     * @param {number} tileNumber - The tile to check
     * @returns {string|null} Type of special tile or null
     */
    getTileType(tileNumber) {
        if (!this.specialTiles) return null;
        if (this.specialTiles.knights && this.specialTiles.knights[tileNumber]) return 'knight';
        if (this.specialTiles.dragons && this.specialTiles.dragons[tileNumber]) return 'dragon';
        if (this.specialTiles.encounters && this.specialTiles.encounters[tileNumber]) return 'encounter';
        if (this.specialTiles.special && this.specialTiles.special[tileNumber]) return 'special';
        return null;
    }

    /**
     * Get the elemental type for a tile (if any)
     * @param {number} tileNumber - The tile to check
     * @returns {string|null} Element type ('fire', 'ice', 'poison') or null
     */
    getTileElement(tileNumber) {
        if (!this.elementalTiles) return null;
        return this.elementalTiles[tileNumber] || null;
    }

    /**
     * Draw the board using procedural graphics system
     * Creates stylized Fantasy Metal Slug aesthetic
     */
    drawBoard() {
        // Use procedural graphics if available, otherwise fall back to prototype
        if (this.gfx) {
            this.drawStylizedBoard();
        } else {
            this.drawPrototypeBoard();
        }
    }

    /**
     * Draw the stylized board with procedural graphics
     */
    drawStylizedBoard() {
        console.log('[Board] drawStylizedBoard started');
        // First draw path connectors between tiles
        this.drawPathConnectors();

        // Draw causeway tiles
        for (let tileNumber = 1; tileNumber <= this.totalTiles; tileNumber++) {
            const tile = this.tiles[tileNumber];
            const tileType = this.getTileType(tileNumber);

            // Alternate tile styles based on position along path for variety
            const pathProgress = tileNumber / this.totalTiles;
            const isWoodTile = Math.floor(pathProgress * 10) % 3 === 1;
            const tileStyle = isWoodTile ? 'wood' : 'stone';

            // Create the base tile
            const tileGfx = this.gfx.createCausewayTile(tile.x, tile.y, this.tileSize, tileStyle);
            this.tileGraphics.push(tileGfx);

            // Check if this tile is in an elemental zone
            const element = this.getTileElement(tileNumber);
            const isElementalTile = element && !tileType;

            // For elemental tiles, hide/replace the base tile with elemental tile
            if (isElementalTile) {
                // Hide the base tile graphic
                if (tileGfx && tileGfx.setVisible) {
                    tileGfx.setVisible(false);
                } else if (tileGfx && tileGfx.setAlpha) {
                    tileGfx.setAlpha(0);
                }

                const elementColors = {
                    fire: 0xff4400,
                    ice: 0x44aaff,
                    poison: 0x44ff44
                };
                const color = elementColors[element] || 0xffffff;

                // Try to use elemental tile image as the base tile (not overlay)
                const tileKey = `tile_${element}`;
                if (this.scene.textures.exists(tileKey)) {
                    const elementTile = this.scene.add.image(tile.x, tile.y, tileKey);
                    elementTile.setDisplaySize(this.tileSize, this.tileSize);
                    elementTile.setDepth(0); // Same level as regular tiles
                } else {
                    // Fallback: Create a colored elemental tile
                    const elementTileGfx = this.scene.add.graphics();
                    elementTileGfx.fillStyle(color, 0.5);
                    elementTileGfx.fillRect(tile.x - this.tileSize/2, tile.y - this.tileSize/2, this.tileSize, this.tileSize);
                    elementTileGfx.lineStyle(2, color, 0.8);
                    elementTileGfx.strokeRect(tile.x - this.tileSize/2, tile.y - this.tileSize/2, this.tileSize, this.tileSize);
                    elementTileGfx.setDepth(0);
                }

                // Add animated effect sprite on top of elemental tile
                const effectKey = element === 'poison' ? 'fx_smoke' : `fx_${element}`;
                if (this.scene.textures.exists(effectKey)) {
                    const effectSprite = this.scene.add.sprite(tile.x, tile.y - 10, effectKey, 0);
                    effectSprite.setScale(0.5);
                    effectSprite.setAlpha(0.4);
                    effectSprite.setDepth(3);

                    // Apply tint based on element
                    const tints = { fire: 0xffaa44, ice: 0x88ddff, poison: 0x88ff88 };
                    if (tints[element]) effectSprite.setTint(tints[element]);

                    // Play looping animation if exists
                    const animKey = `${effectKey}_loop`;
                    if (this.scene.anims.exists(animKey)) {
                        effectSprite.play(animKey);
                    }

                    // Add gentle floating animation
                    this.scene.tweens.add({
                        targets: effectSprite,
                        y: effectSprite.y - 5,
                        alpha: 0.25,
                        duration: 1500 + Math.random() * 500,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                }
            }

            // Add special tile marker if needed
            if (tileType) {
                const marker = this.gfx.createSpecialTileMarker(tile.x, tile.y, this.tileSize, tileType);
                this.specialMarkers.push(marker);

                // Add pulsing animation to special markers
                this.scene.tweens.add({
                    targets: marker,
                    alpha: 0.5,
                    duration: 1000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }

            // Add tile number text (visible on larger tiles)
            this.scene.add.text(tile.x, tile.y, tileNumber.toString(), {
                fontSize: '14px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5).setAlpha(0.9).setDepth(2);
        }

        console.log('[Board] Finished drawing tiles, now drawing entities');

        // Draw dragons connecting their tiles (using procedural positions)
        this.drawDragons();
        console.log('[Board] Dragons drawn');

        // Draw knights at their positions (using procedural positions)
        this.drawKnights();
        console.log('[Board] Knights drawn');

        // Draw monsters at their positions
        this.drawMonsters();
        console.log('[Board] Monsters drawn');

        // Draw special tiles (chests, anvil, portals)
        console.log('[Board] About to call drawSpecialTiles');
        this.drawSpecialTiles();
        console.log('[Board] Special tiles drawn');

        // Draw start/finish markers
        this.drawStartFinish();
        console.log('[Board] drawStylizedBoard complete');
    }

    /**
     * Draw connectors between adjacent tiles to show the path
     */
    drawPathConnectors() {
        // With grid-based tiles that touch edge-to-edge,
        // connectors are optional visual enhancements showing connection points
        const connectorGraphics = this.scene.add.graphics();
        connectorGraphics.setDepth(0);

        for (let i = 1; i < this.totalTiles; i++) {
            const currentTile = this.tiles[i];
            const nextTile = this.tiles[i + 1];

            // Calculate midpoint between tiles (where they connect)
            const midX = (currentTile.x + nextTile.x) / 2;
            const midY = (currentTile.y + nextTile.y) / 2;

            // Determine if horizontal or vertical connection
            const dx = Math.abs(nextTile.x - currentTile.x);
            const dy = Math.abs(nextTile.y - currentTile.y);
            const isHorizontal = dx > dy;

            // Draw subtle connection indicator at the shared edge
            connectorGraphics.fillStyle(0x2a2a3e, 0.4);
            if (isHorizontal) {
                // Horizontal connection - draw vertical bridge line
                connectorGraphics.fillRect(midX - 2, midY - this.tileSize * 0.3, 4, this.tileSize * 0.6);
            } else {
                // Vertical connection - draw horizontal bridge line
                connectorGraphics.fillRect(midX - this.tileSize * 0.3, midY - 2, this.tileSize * 0.6, 4);
            }
        }

        this.pathConnectors.push(connectorGraphics);
    }

    /**
     * Draw dragons that connect head and tail tiles
     * Uses procedurally assigned positions
     */
    drawDragons() {
        if (!this.proceduralAssignments) return;

        const pa = this.proceduralAssignments.dragons;
        const dragonConfigs = [
            { type: 'slime', head: pa.slimetooth.head, tail: pa.slimetooth.tail },
            { type: 'frost', head: pa.frostfang.head, tail: pa.frostfang.tail },
            { type: 'fire', head: pa.ignis.head, tail: pa.ignis.tail }
        ];

        dragonConfigs.forEach(config => {
            const headTile = this.tiles[config.head];
            const tailTile = this.tiles[config.tail];

            if (headTile && tailTile) {
                const dragonContainer = this.gfx.createDragon(
                    config.type,
                    headTile.x,
                    headTile.y,
                    tailTile.x,
                    tailTile.y
                );

                this.dragonGraphics.push(dragonContainer);

                // Extract the dragon sprite from the container and store it
                // The sprite is the second element (after the line graphics)
                const dragonSprite = dragonContainer.list.find(child =>
                    child.type === 'Sprite' && child.attackAnim
                );
                if (dragonSprite) {
                    // Map type to dragon name
                    const dragonNameMap = {
                        'slime': 'slimetooth',
                        'frost': 'frostfang',
                        'fire': 'ignis'
                    };
                    const dragonName = dragonNameMap[config.type];
                    this.dragonSpritesMap[dragonName] = dragonSprite;
                    dragonSprite.headTile = config.head;
                }
            }
        });
    }

    /**
     * Get dragon sprite by dragon name
     * @param {string} dragonName - The dragon name (ignis, frostfang, slimetooth)
     * @returns {Phaser.GameObjects.Sprite|null} The dragon sprite or null
     */
    getDragonSprite(dragonName) {
        // Handle full names like "Ignis the King"
        const nameMap = {
            'Ignis the King': 'ignis',
            'Frost-Fang': 'frostfang',
            'Slime-Tooth': 'slimetooth'
        };
        const simpleName = nameMap[dragonName] || dragonName.toLowerCase();
        return this.dragonSpritesMap[simpleName] || null;
    }

    /**
     * Play attack animation on dragon
     * @param {string} dragonName - The dragon name
     * @param {Function} onComplete - Callback when animation completes
     */
    playDragonAttack(dragonName, onComplete = null) {
        const dragon = this.getDragonSprite(dragonName);
        if (dragon && dragon.attackAnim && this.scene.anims.exists(dragon.attackAnim)) {
            dragon.play(dragon.attackAnim);
            if (onComplete) {
                dragon.once('animationcomplete', () => {
                    // Return to idle
                    if (this.scene.anims.exists(dragon.idleAnim)) {
                        dragon.play(dragon.idleAnim);
                    }
                    onComplete();
                });
            } else {
                dragon.once('animationcomplete', () => {
                    if (this.scene.anims.exists(dragon.idleAnim)) {
                        dragon.play(dragon.idleAnim);
                    }
                });
            }
        } else if (onComplete) {
            onComplete();
        }
    }

    /**
     * Draw knights at their positions
     * Uses procedurally assigned positions
     */
    drawKnights() {
        if (!this.proceduralAssignments) return;

        const pa = this.proceduralAssignments.knights;
        const knightConfigs = [
            { type: 'hedge', tile: pa.hedge.base, destTile: pa.hedge.dest, spriteKey: 'knight_hedge_sheet' },
            { type: 'griffin', tile: pa.griffin.base, destTile: pa.griffin.dest, spriteKey: 'knight_griffin_sheet' },
            { type: 'champion', tile: pa.champion.base, destTile: pa.champion.dest, spriteKey: 'knight_champion_sheet' }
        ];

        knightConfigs.forEach(config => {
            const tile = this.tiles[config.tile];
            const destTile = this.tiles[config.destTile];
            if (tile && destTile) {
                // Draw golden ladder line from base tile to destination tile
                const g = this.scene.add.graphics();
                g.setDepth(4);

                // Calculate bezier curve for ladder line
                const controlX = (tile.x + destTile.x) / 2 + 30;
                const controlY = (tile.y + destTile.y) / 2 - 50;
                const curvePoints = this.getQuadraticBezierPoints(
                    tile.x, tile.y,
                    controlX, controlY,
                    destTile.x, destTile.y,
                    15
                );

                // Draw golden ladder with rungs
                // Outer glow
                g.lineStyle(12, 0xffd700, 0.3);
                for (let i = 0; i < curvePoints.length - 1; i++) {
                    g.lineBetween(curvePoints[i].x, curvePoints[i].y, curvePoints[i+1].x, curvePoints[i+1].y);
                }

                // Main golden line
                g.lineStyle(6, 0xc9a227, 1);
                for (let i = 0; i < curvePoints.length - 1; i++) {
                    g.lineBetween(curvePoints[i].x, curvePoints[i].y, curvePoints[i+1].x, curvePoints[i+1].y);
                }

                // Highlight
                g.lineStyle(2, 0xffd700, 0.8);
                for (let i = 0; i < curvePoints.length - 1; i++) {
                    g.lineBetween(curvePoints[i].x - 2, curvePoints[i].y - 2, curvePoints[i+1].x - 2, curvePoints[i+1].y - 2);
                }

                // Draw rungs across the ladder
                for (let i = 2; i < curvePoints.length - 2; i += 3) {
                    const p = curvePoints[i];
                    // Calculate perpendicular direction for rungs
                    const dx = curvePoints[i+1].x - curvePoints[i-1].x;
                    const dy = curvePoints[i+1].y - curvePoints[i-1].y;
                    const len = Math.sqrt(dx*dx + dy*dy);
                    const perpX = -dy / len * 8;
                    const perpY = dx / len * 8;

                    g.lineStyle(3, 0xffd700, 0.9);
                    g.lineBetween(p.x - perpX, p.y - perpY, p.x + perpX, p.y + perpY);
                }

                let knight;

                // Try to use actual knight sprite sheet
                if (this.scene.textures.exists(config.spriteKey)) {
                    knight = this.scene.add.sprite(tile.x, tile.y - 35, config.spriteKey, 0);
                    // All knights use 64px frames from 256x256 sheets
                    knight.setScale(1.3);
                    knight.setDepth(5);

                    // Store animation keys on the sprite for later use
                    knight.fullAnim = `${config.spriteKey}_full`;
                    knight.idleAnim = `${config.spriteKey}_idle`;
                    knight.actionAnim = `${config.spriteKey}_action`;
                    knight.knightType = config.type;

                    // Store reference to this knight sprite by type
                    this.knightSpritesMap[config.type] = knight;

                    // Create full 16-frame animation if not exists
                    if (!this.scene.anims.exists(knight.fullAnim)) {
                        this.scene.anims.create({
                            key: knight.fullAnim,
                            frames: this.scene.anims.generateFrameNumbers(config.spriteKey, { start: 0, end: 15 }),
                            frameRate: 6,
                            repeat: -1
                        });
                    }
                    knight.play(knight.fullAnim); // Play full 16-frame animation
                } else {
                    // Fallback to procedural graphics
                    knight = this.gfx.createKnight(config.type, tile.x, tile.y - 20);
                }

                this.knightGraphics.push(knight);

                // Add bobbing animation
                this.scene.tweens.add({
                    targets: knight,
                    y: knight.y - 5,
                    duration: 1500,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });
    }

    /**
     * Get knight sprite by knight type
     * @param {string} knightType - The knight type (hedge, griffin, champion)
     * @returns {Phaser.GameObjects.Sprite|null} The knight sprite or null
     */
    getKnightSprite(knightType) {
        // Handle full names
        const typeMap = {
            'Sir Bramble': 'hedge',
            'Lord Gallant': 'griffin',
            'Sir Sterling': 'champion'
        };
        const simpleType = typeMap[knightType] || knightType.toLowerCase();
        return this.knightSpritesMap[simpleType] || null;
    }

    /**
     * Play action/rescue animation on knight
     * @param {string} knightType - The knight type
     * @param {Function} onComplete - Callback when animation completes
     */
    playKnightAction(knightType, onComplete = null) {
        const knight = this.getKnightSprite(knightType);
        if (knight && knight.actionAnim && this.scene.anims.exists(knight.actionAnim)) {
            knight.play(knight.actionAnim);
            if (onComplete) {
                knight.once('animationcomplete', () => {
                    // Return to idle
                    if (this.scene.anims.exists(knight.idleAnim)) {
                        knight.play(knight.idleAnim);
                    }
                    onComplete();
                });
            } else {
                knight.once('animationcomplete', () => {
                    if (this.scene.anims.exists(knight.idleAnim)) {
                        knight.play(knight.idleAnim);
                    }
                });
            }
        } else if (onComplete) {
            onComplete();
        }
    }

    /**
     * Draw monsters at their positions
     * Uses procedurally assigned positions
     */
    drawMonsters() {
        if (!this.proceduralAssignments) return;

        const pa = this.proceduralAssignments.monsters;
        const monsterConfigs = [
            { id: 'milkbaby', tile: pa.milkbaby, spriteKey: 'monster_milkbaby_sheet' },
            { id: 'taxgoblin', tile: pa.taxgoblin, spriteKey: 'monster_taxgoblin_sheet' },
            { id: 'hillgiant', tile: pa.hillgiant, spriteKey: 'monster_hillgiant_sheet' },
            { id: 'mimic', tile: pa.mimic, spriteKey: 'monster_mimic_sheet' },
            { id: 'vampires', tile: pa.vampires, spriteKey: 'monster_vampires_sheet' },
            { id: 'hypnotoad', tile: pa.hypnotoad, spriteKey: 'monster_hypnotoad_sheet' }
        ];

        monsterConfigs.forEach(config => {
            const tile = this.tiles[config.tile];
            if (tile) {
                // Try to use actual monster sprite sheet
                if (this.scene.textures.exists(config.spriteKey)) {
                    const monster = this.scene.add.sprite(tile.x, tile.y - 30, config.spriteKey, 0);
                    // All monsters use 64px frames from 256x256 sheets - same scale for all
                    monster.setScale(1.1);
                    monster.setDepth(5);

                    // Store animation keys on the sprite for later use
                    monster.fullAnim = `${config.spriteKey}_full`;
                    monster.idleAnim = `${config.spriteKey}_idle`;
                    monster.attackAnim = `${config.spriteKey}_attack`;
                    monster.monsterId = config.id;

                    // Store reference to this monster sprite by tile number
                    this.monsterSprites[config.tile] = monster;

                    // Play full 16-frame animation if exists, otherwise idle
                    console.log(`[Board] Monster ${config.id} - fullAnim: ${monster.fullAnim}, exists: ${this.scene.anims.exists(monster.fullAnim)}`);
                    console.log(`[Board] Monster ${config.id} - idleAnim: ${monster.idleAnim}, exists: ${this.scene.anims.exists(monster.idleAnim)}`);
                    if (this.scene.anims.exists(monster.fullAnim)) {
                        monster.play(monster.fullAnim);
                        console.log(`[Board] Playing full animation for ${config.id}`);
                    } else if (this.scene.anims.exists(monster.idleAnim)) {
                        monster.play(monster.idleAnim);
                        console.log(`[Board] Playing idle animation for ${config.id}`);
                    } else {
                        console.log(`[Board] No animation found for ${config.id}`);
                    }

                    // Add subtle floating animation
                    this.scene.tweens.add({
                        targets: monster,
                        y: monster.y - 3,
                        duration: 1200 + Math.random() * 400,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                }
            }
        });
    }

    /**
     * Get monster sprite at a given tile
     * @param {number} tileNum - The tile number
     * @returns {Phaser.GameObjects.Sprite|null} The monster sprite or null
     */
    getMonsterSpriteAtTile(tileNum) {
        return this.monsterSprites[tileNum] || null;
    }

    /**
     * Play attack animation on monster at tile
     * @param {number} tileNum - The tile number
     * @param {Function} onComplete - Callback when animation completes
     */
    playMonsterAttack(tileNum, onComplete = null) {
        const monster = this.monsterSprites[tileNum];
        if (monster && monster.attackAnim && this.scene.anims.exists(monster.attackAnim)) {
            monster.play(monster.attackAnim);
            if (onComplete) {
                monster.once('animationcomplete', () => {
                    // Return to idle
                    if (this.scene.anims.exists(monster.idleAnim)) {
                        monster.play(monster.idleAnim);
                    }
                    onComplete();
                });
            } else {
                monster.once('animationcomplete', () => {
                    if (this.scene.anims.exists(monster.idleAnim)) {
                        monster.play(monster.idleAnim);
                    }
                });
            }
        } else if (onComplete) {
            onComplete();
        }
    }

    /**
     * Draw special tiles (treasure chests, anvil, portals)
     */
    drawSpecialTiles() {
        console.log('[Board] drawSpecialTiles called, proceduralAssignments:', this.proceduralAssignments);
        if (!this.proceduralAssignments) {
            console.log('[Board] ERROR: proceduralAssignments is undefined!');
            return;
        }

        const pa = this.proceduralAssignments.special;
        console.log('[Board] Portal tiles:', pa.portalBalancedTiles, pa.portalRiskyTiles, pa.portalChaoticTiles);

        // Draw treasure chests
        if (pa.chests) {
            pa.chests.forEach(chestTile => {
                const tile = this.tiles[chestTile];
                if (tile) {
                    // Use mimic sprite (closed chest) or sparkle effect
                    if (this.scene.textures.exists('fx_sparkle')) {
                        const sparkle = this.scene.add.sprite(tile.x, tile.y - 15, 'fx_sparkle', 0);
                        sparkle.setScale(0.8);
                        sparkle.setDepth(4);

                        // Create sparkle animation if not exists
                        if (!this.scene.anims.exists('fx_sparkle_anim')) {
                            this.scene.anims.create({
                                key: 'fx_sparkle_anim',
                                frames: this.scene.anims.generateFrameNumbers('fx_sparkle', { start: 0, end: 15 }),
                                frameRate: 10,
                                repeat: -1
                            });
                        }
                        sparkle.play('fx_sparkle_anim');
                    } else {
                        // Fallback: golden sparkle graphic
                        const g = this.scene.add.graphics();
                        g.fillStyle(0xffd700, 0.6);
                        g.fillCircle(tile.x, tile.y - 10, 12);
                        g.setDepth(4);

                        this.scene.tweens.add({
                            targets: g,
                            alpha: 0.3,
                            duration: 800,
                            yoyo: true,
                            repeat: -1
                        });
                    }
                }
            });
        }

        // Draw anvil
        if (pa.anvil) {
            const tile = this.tiles[pa.anvil];
            if (tile) {
                // Orange forge glow effect
                const g = this.scene.add.graphics();
                g.fillStyle(0xff6600, 0.4);
                g.fillCircle(tile.x, tile.y - 10, 15);
                g.setDepth(4);

                this.scene.tweens.add({
                    targets: g,
                    alpha: 0.2,
                    duration: 600,
                    yoyo: true,
                    repeat: -1
                });

                // Anvil icon text
                const icon = this.scene.add.text(tile.x, tile.y - 12, '⚒', {
                    fontSize: '20px'
                }).setOrigin(0.5).setDepth(5);
            }
        }

        // Draw portals - three types with different colors (1-3 of each type)
        if (pa.portalBalancedTiles) {
            pa.portalBalancedTiles.forEach(tileNum => {
                this.drawPortal(tileNum, EncounterData.special.portalBalanced);
            });
        }
        if (pa.portalRiskyTiles) {
            pa.portalRiskyTiles.forEach(tileNum => {
                this.drawPortal(tileNum, EncounterData.special.portalRisky);
            });
        }
        if (pa.portalChaoticTiles) {
            pa.portalChaoticTiles.forEach(tileNum => {
                this.drawPortal(tileNum, EncounterData.special.portalChaotic);
            });
        }
    }

    /**
     * Draw a portal on the board
     * @param {number} tileNum - Tile number for the portal
     * @param {Object} portalData - Portal data from EncounterData
     */
    drawPortal(tileNum, portalData) {
        console.log(`[Board] drawPortal called: tileNum=${tileNum}, portalData=`, portalData);
        if (!tileNum || !portalData) {
            console.log('[Board] drawPortal early return: missing tileNum or portalData');
            return;
        }

        const tile = this.tiles[tileNum];
        if (!tile) {
            console.log(`[Board] drawPortal: tile ${tileNum} not found in tiles array`);
            return;
        }

        console.log(`[Board] Drawing portal at tile ${tileNum}: x=${tile.x}, y=${tile.y}`);
        const color = portalData.color || 0x8844ff;
        const spriteKey = portalData.spriteKey;

        // Try to use animated sprite sheet if available
        if (spriteKey && this.scene.textures.exists(spriteKey)) {
            console.log(`[Board] Using sprite sheet ${spriteKey} for portal`);
            // Create animation if it doesn't exist
            const animKey = `${spriteKey}_idle`;
            if (!this.scene.anims.exists(animKey)) {
                this.scene.anims.create({
                    key: animKey,
                    frames: this.scene.anims.generateFrameNumbers(spriteKey, { start: 0, end: 15 }),
                    frameRate: 8,
                    repeat: -1
                });
            }

            // Create animated sprite
            const sprite = this.scene.add.sprite(tile.x, tile.y - 5, spriteKey, 0);
            sprite.setDisplaySize(this.tileSize * 0.8, this.tileSize * 0.8);
            sprite.setDepth(4);
            sprite.play(animKey);

            // Add gentle pulsing on top of frame animation
            this.scene.tweens.add({
                targets: sprite,
                alpha: 0.8,
                scaleX: sprite.scaleX * 1.05,
                scaleY: sprite.scaleY * 1.05,
                duration: 1500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        } else {
            // Fallback: Colored circle with swirl effect
            console.log(`[Board] Using fallback portal graphics for ${portalData.name} at tile ${tileNum}`);

            // Outer glow
            const glow = this.scene.add.graphics();
            glow.fillStyle(color, 0.2);
            glow.fillCircle(tile.x, tile.y, 30);
            glow.setDepth(3);

            // Main portal circle
            const g = this.scene.add.graphics();
            g.fillStyle(color, 0.6);
            g.fillCircle(tile.x, tile.y, 20);
            g.lineStyle(3, 0xffffff, 0.8);
            g.strokeCircle(tile.x, tile.y, 20);
            g.lineStyle(2, color, 1.0);
            g.strokeCircle(tile.x, tile.y, 15);
            g.setDepth(4);

            // Pulsing effect on glow
            this.scene.tweens.add({
                targets: glow,
                alpha: 0.5,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 1200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            // Portal type indicator
            const label = portalData.portalType === 'balanced' ? 'S' :
                         portalData.portalType === 'risky' ? 'R' : 'C';
            const text = this.scene.add.text(tile.x, tile.y, label, {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5).setDepth(5);
        }
    }

    /**
     * Draw start and finish tile decorations
     */
    drawStartFinish() {
        const startTile = this.tiles[1];
        const finishTile = this.tiles[this.totalTiles];

        // Try to use actual start tile image
        if (this.scene.textures.exists('tile_start')) {
            const startImg = this.scene.add.image(startTile.x, startTile.y, 'tile_start');
            startImg.setDisplaySize(this.tileSize, this.tileSize);
            startImg.setDepth(3);
        } else {
            // Fallback: Start marker - green flag
            const startG = this.scene.add.graphics();
            startG.fillStyle(0x00AA00, 1);
            startG.fillRect(startTile.x - 5, startTile.y - 40, 4, 35);
            startG.fillStyle(0x00FF00, 1);
            startG.fillTriangle(
                startTile.x - 1, startTile.y - 40,
                startTile.x - 1, startTile.y - 25,
                startTile.x + 18, startTile.y - 32
            );
            startG.setDepth(3);
        }

        // Try to use actual finish tile image
        if (this.scene.textures.exists('tile_finish')) {
            const finishImg = this.scene.add.image(finishTile.x, finishTile.y, 'tile_finish');
            finishImg.setDisplaySize(this.tileSize, this.tileSize);
            finishImg.setDepth(3);
        } else {
            // Fallback: Finish marker - checkered flag
            const finishG = this.scene.add.graphics();
            finishG.fillStyle(0xFFFFFF, 1);
            finishG.fillRect(finishTile.x - 5, finishTile.y - 40, 4, 35);

            // Checkered pattern
            const flagX = finishTile.x - 1;
            const flagY = finishTile.y - 40;
            for (let fy = 0; fy < 3; fy++) {
                for (let fx = 0; fx < 4; fx++) {
                    const isBlack = (fx + fy) % 2 === 0;
                    finishG.fillStyle(isBlack ? 0x000000 : 0xFFFFFF, 1);
                    finishG.fillRect(flagX + (fx * 5), flagY + (fy * 5), 5, 5);
                }
            }
            finishG.setDepth(3);

            // Crown on finish
            const crownG = this.scene.add.graphics();
            crownG.fillStyle(0xFFD700, 1);
            crownG.fillRect(finishTile.x - 12, finishTile.y - 55, 24, 10);
            crownG.fillTriangle(finishTile.x - 12, finishTile.y - 55, finishTile.x - 8, finishTile.y - 65, finishTile.x - 4, finishTile.y - 55);
            crownG.fillTriangle(finishTile.x - 4, finishTile.y - 55, finishTile.x, finishTile.y - 68, finishTile.x + 4, finishTile.y - 55);
            crownG.fillTriangle(finishTile.x + 4, finishTile.y - 55, finishTile.x + 8, finishTile.y - 65, finishTile.x + 12, finishTile.y - 55);
            crownG.setDepth(3);
        }
    }

    /**
     * Draw the prototype board using Phaser Graphics (fallback)
     */
    drawPrototypeBoard() {
        this.graphics = this.scene.add.graphics();

        // First draw path connectors
        this.drawPrototypePathConnectors();

        for (let tileNumber = 1; tileNumber <= this.totalTiles; tileNumber++) {
            const tile = this.tiles[tileNumber];
            const halfSize = this.tileSize / 2;

            // Determine tile color based on type
            let fillColor = 0x2d5a27;  // Default: Forest green
            let borderColor = 0x000000; // Black border

            const tileType = this.getTileType(tileNumber);
            if (tileType === 'knight') {
                fillColor = 0xffd700;   // Gold for knights (ladders)
                borderColor = 0x8b6914;
            } else if (tileType === 'dragon') {
                fillColor = 0x8b0000;   // Dark red for dragons (snakes)
                borderColor = 0x4a0000;
            } else if (tileType === 'encounter') {
                fillColor = 0x4b0082;   // Indigo for encounters
                borderColor = 0x2e004f;
            } else if (tileType === 'special') {
                fillColor = 0x8b4513;   // Brown for special tiles (chests, etc.)
                borderColor = 0x5a3010;
            } else if (tileNumber === 1) {
                fillColor = 0x00ff00;   // Bright green for start
            } else if (tileNumber === 100) {
                fillColor = 0xffffff;   // White for finish
            }

            // Draw tile border
            this.graphics.lineStyle(2, borderColor, 1);

            // Draw tile fill
            this.graphics.fillStyle(fillColor, 0.8);
            this.graphics.fillRect(
                tile.x - halfSize,
                tile.y - halfSize,
                this.tileSize,
                this.tileSize
            );

            // Draw tile border stroke
            this.graphics.strokeRect(
                tile.x - halfSize,
                tile.y - halfSize,
                this.tileSize,
                this.tileSize
            );

            // Add tile number text for debugging
            this.scene.add.text(tile.x, tile.y, tileNumber.toString(), {
                fontSize: '10px',
                fontFamily: 'Arial',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
        }

        // Draw legend
        this.drawLegend();
    }

    /**
     * Draw path connectors for prototype board
     */
    drawPrototypePathConnectors() {
        const connectorGraphics = this.scene.add.graphics();
        connectorGraphics.setDepth(-1);

        for (let i = 1; i < this.totalTiles; i++) {
            const currentTile = this.tiles[i];
            const nextTile = this.tiles[i + 1];

            // Draw connecting line
            connectorGraphics.lineStyle(6, 0x1a3d1a, 0.7);
            connectorGraphics.beginPath();
            connectorGraphics.moveTo(currentTile.x, currentTile.y);
            connectorGraphics.lineTo(nextTile.x, nextTile.y);
            connectorGraphics.strokePath();
        }
    }

    /**
     * Draw a color legend for special tiles
     */
    drawLegend() {
        // Position legend in top-right corner, out of path area
        const legendX = this.scene.scale.width - 180;
        const legendY = 20;
        const spacing = 20;

        const legendItems = [
            { color: 0xffd700, label: 'Knight (Up)' },
            { color: 0x8b0000, label: 'Dragon (Down)' },
            { color: 0x4b0082, label: 'Encounter' },
            { color: 0x8b4513, label: 'Special' },
            { color: 0x00ff00, label: 'Start' },
            { color: 0xffffff, label: 'Finish' }
        ];

        // Draw semi-transparent background
        this.graphics.fillStyle(0x000000, 0.6);
        this.graphics.fillRoundedRect(legendX - 10, legendY - 5, 170, legendItems.length * spacing + 30, 8);

        this.scene.add.text(legendX, legendY, 'LEGEND:', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#c9a227',
            fontStyle: 'bold'
        }).setDepth(100);

        legendItems.forEach((item, index) => {
            // Draw color box
            this.graphics.fillStyle(item.color, 1);
            this.graphics.fillRect(legendX, legendY + 18 + (index * spacing), 12, 12);
            this.graphics.lineStyle(1, 0x000000, 1);
            this.graphics.strokeRect(legendX, legendY + 18 + (index * spacing), 12, 12);

            // Draw label
            this.scene.add.text(legendX + 18, legendY + 18 + (index * spacing) + 6, item.label, {
                fontSize: '10px',
                fontFamily: 'Arial',
                color: '#ffffff'
            }).setOrigin(0, 0.5).setDepth(100);
        });
    }

    /**
     * Get the coordinates for a specific tile
     *
     * @param {number} tileNumber - Tile number (1-100)
     * @returns {Object} Object containing x, y coordinates and tile data
     */
    getTilePosition(tileNumber) {
        if (tileNumber < 1 || tileNumber > this.totalTiles) {
            console.warn(`[Board] Invalid tile number: ${tileNumber}`);
            return this.tiles[1]; // Return start tile as fallback
        }
        return this.tiles[tileNumber];
    }

    /**
     * Check if landing on a tile triggers a special effect
     * Uses EncounterData for full encounter information
     *
     * @param {number} tileNumber - The tile the player landed on
     * @returns {Object|null} Effect data or null if no effect
     */
    checkSpecialTile(tileNumber) {
        // Check for Knight (ladder) - use EncounterData for full info
        const knightData = EncounterData.getKnightAtTile(tileNumber);
        if (knightData) {
            console.log(`[Board] KNIGHT! ${knightData.name} boosts player from tile ${tileNumber} to tile ${knightData.destinationTile}!`);
            return {
                type: 'knight',
                knight: knightData,
                from: tileNumber,
                to: knightData.destinationTile
            };
        }

        // Check for Dragon (snake) - use EncounterData for full info
        const dragonData = EncounterData.getDragonAtTile(tileNumber);
        if (dragonData) {
            console.log(`[Board] DRAGON! ${dragonData.name} threatens player at tile ${tileNumber}!`);
            return {
                type: 'dragon',
                dragon: dragonData,
                from: tileNumber,
                to: dragonData.tailTile
            };
        }

        // Note: Encounters (monsters, special tiles) are checked separately in game.js
        // via checkForEncounters() after movement completes

        return null;
    }

    /**
     * Initialize the board - generate coordinates and draw
     */
    create() {
        this.generateTileCoordinates();
        this.drawBoard();
        console.log('[Board] Board created successfully');
    }

    /**
     * Generate points along a quadratic bezier curve
     * @param {number} x0 - Start X
     * @param {number} y0 - Start Y
     * @param {number} cx - Control point X
     * @param {number} cy - Control point Y
     * @param {number} x1 - End X
     * @param {number} y1 - End Y
     * @param {number} segments - Number of segments
     * @returns {Array} Array of {x, y} points
     */
    getQuadraticBezierPoints(x0, y0, cx, cy, x1, y1, segments) {
        const points = [];
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const mt = 1 - t;
            // Quadratic bezier formula: B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
            const x = mt * mt * x0 + 2 * mt * t * cx + t * t * x1;
            const y = mt * mt * y0 + 2 * mt * t * cy + t * t * y1;
            points.push({ x, y });
        }
        return points;
    }
}

// Export for use in other files (ES6 module style comment for future migration)
// export default Board;
