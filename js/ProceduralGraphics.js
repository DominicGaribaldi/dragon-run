/**
 * DRAGON RUN: THE ROYAL RACE
 * ProceduralGraphics.js - Generates stylized placeholder graphics
 *
 * Creates a "Fantasy Metal Slug" aesthetic using Phaser primitives
 * until final pixel art assets are ready.
 */

class ProceduralGraphics {
    constructor(scene) {
        this.scene = scene;

        // Color palette extracted from concept art
        this.palette = {
            // Stone/Architecture
            stoneDark: 0x3D3D4D,
            stoneMid: 0x5A5A6A,
            stoneLight: 0x7A7A8A,
            stoneHighlight: 0x9A9AAA,

            // Wood
            woodDark: 0x4A3728,
            woodMid: 0x6B5344,
            woodLight: 0x8B7355,

            // Environment
            caveDark: 0x1A1A2E,
            caveMid: 0x2D2D3D,
            lava: 0xFF4400,
            lavaGlow: 0xFF6B35,

            // Dragons
            dragonGreen: 0x4A7A3A,
            dragonBlue: 0x4A9EBF,
            dragonRed: 0xCC4422,

            // Magic/Effects
            magicPurple: 0x9A4ADF,
            magicCyan: 0x4AE0E0,

            // UI/Gold
            goldDark: 0x8B6914,
            goldMid: 0xC9A227,
            goldLight: 0xFFD700,

            // Characters
            playerRed: 0xE63946,
            playerBlue: 0x457B9D,
            playerGreen: 0x2A9D8F,
            playerGold: 0xE9C46A
        };
    }

    /**
     * Generate the full game background with causeway
     */
    createBackground() {
        const g = this.scene.add.graphics();

        // Layer 1: Deep cave/chasm background
        this.drawCaveBackground(g);

        // Layer 2: Distant mountains/structures
        this.drawDistantElements(g);

        // Layer 3: Lava/water at the bottom
        this.drawChasm(g);

        g.setDepth(-10);

        return g;
    }

    /**
     * Draw the cave/dungeon background
     */
    drawCaveBackground(g) {
        // Gradient-like background using rectangles
        const gradientSteps = 10;
        const height = 720;
        const width = 1280;

        for (let i = 0; i < gradientSteps; i++) {
            const y = (height / gradientSteps) * i;
            const h = height / gradientSteps + 1;

            // Darker at top, slightly lighter toward middle
            const darkness = 0.3 + (Math.sin(i / gradientSteps * Math.PI) * 0.2);
            const color = Phaser.Display.Color.GetColor(
                Math.floor(26 * darkness),
                Math.floor(26 * darkness),
                Math.floor(46 * darkness)
            );

            g.fillStyle(color, 1);
            g.fillRect(0, y, width, h);
        }

        // Add some rocky texture dots
        g.fillStyle(0x2D2D3D, 0.5);
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * 1280;
            const y = Math.random() * 720;
            const size = Math.random() * 3 + 1;
            g.fillCircle(x, y, size);
        }
    }

    /**
     * Draw distant castle/mountain silhouettes
     */
    drawDistantElements(g) {
        // Left castle silhouette
        g.fillStyle(0x1A1A28, 0.8);
        this.drawCastleSilhouette(g, 50, 150, 0.7);

        // Right volcanic mountain
        g.fillStyle(0x1A1A28, 0.8);
        this.drawMountainSilhouette(g, 1100, 100, 0.8);

        // Add distant fire glow on right
        g.fillStyle(this.palette.lavaGlow, 0.15);
        g.fillCircle(1150, 200, 100);
    }

    /**
     * Draw a castle silhouette
     */
    drawCastleSilhouette(g, x, y, scale) {
        const s = scale;
        g.fillRect(x, y, 60 * s, 150 * s);
        g.fillRect(x - 20 * s, y + 50 * s, 100 * s, 100 * s);

        // Towers
        g.fillRect(x - 30 * s, y + 20 * s, 25 * s, 130 * s);
        g.fillRect(x + 65 * s, y + 30 * s, 25 * s, 120 * s);

        // Tower tops (triangles simulated with small rects)
        for (let i = 0; i < 10; i++) {
            g.fillRect(x - 30 * s + i * s, y + 20 * s - i * 2 * s, (25 - i * 2) * s, 3 * s);
        }
    }

    /**
     * Draw a mountain silhouette
     */
    drawMountainSilhouette(g, x, y, scale) {
        const s = scale;
        // Main peak
        const points = [
            { x: x - 100 * s, y: y + 200 * s },
            { x: x, y: y },
            { x: x + 80 * s, y: y + 200 * s }
        ];

        g.beginPath();
        g.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            g.lineTo(points[i].x, points[i].y);
        }
        g.closePath();
        g.fillPath();
    }

    /**
     * Draw the chasm with lava glow
     */
    drawChasm(g) {
        // Lava at the very bottom
        const lavaY = 680;

        // Lava glow gradient
        for (let i = 0; i < 5; i++) {
            const alpha = 0.1 - (i * 0.02);
            g.fillStyle(this.palette.lava, alpha);
            g.fillRect(0, lavaY - (i * 30), 1280, 40 + (i * 30));
        }

        // Actual lava
        g.fillStyle(this.palette.lava, 0.8);
        g.fillRect(0, lavaY, 1280, 40);

        // Lava highlights
        g.fillStyle(this.palette.lavaGlow, 0.6);
        for (let x = 0; x < 1280; x += 80) {
            const waveOffset = Math.sin(x * 0.05) * 5;
            g.fillRect(x, lavaY + waveOffset, 40, 10);
        }
    }

    /**
     * Create a stylized causeway tile
     * @param {number} x - Center X
     * @param {number} y - Center Y
     * @param {number} size - Tile size
     * @param {string} type - Tile type: 'stone', 'wood', 'special'
     */
    createCausewayTile(x, y, size, type = 'stone') {
        // Try to use actual tile images if they're loaded
        const tileKey = type === 'wood' ? 'tile_wood' : 'tile_stone';
        if (this.scene.textures.exists(tileKey)) {
            const tile = this.scene.add.image(x, y, tileKey);
            tile.setDisplaySize(size, size);
            tile.setDepth(0);
            return tile;
        }

        // Fallback to procedural graphics
        const g = this.scene.add.graphics();
        const half = size / 2;

        if (type === 'stone') {
            this.drawStoneTile(g, x, y, size);
        } else if (type === 'wood') {
            this.drawWoodTile(g, x, y, size);
        }

        g.setDepth(0);
        return g;
    }

    /**
     * Draw a stone causeway tile with depth effect
     */
    drawStoneTile(g, x, y, size) {
        const half = size / 2;
        const depth = 8; // 3D depth effect

        // Shadow/depth underneath
        g.fillStyle(this.palette.stoneDark, 1);
        g.fillRect(x - half, y - half + depth, size, size);

        // Main tile surface
        g.fillStyle(this.palette.stoneMid, 1);
        g.fillRect(x - half, y - half, size, size - depth);

        // Top highlight
        g.fillStyle(this.palette.stoneLight, 0.5);
        g.fillRect(x - half + 2, y - half + 2, size - 4, 4);

        // Left highlight
        g.fillStyle(this.palette.stoneLight, 0.3);
        g.fillRect(x - half + 2, y - half + 2, 3, size - depth - 4);

        // Stone crack details
        g.lineStyle(1, this.palette.stoneDark, 0.5);
        g.beginPath();
        g.moveTo(x - half + 10, y - half + 5);
        g.lineTo(x - half + 15, y - half + 20);
        g.lineTo(x - half + 8, y - half + 35);
        g.strokePath();

        // Another crack
        g.beginPath();
        g.moveTo(x + half - 12, y - half + 10);
        g.lineTo(x + half - 18, y - half + 25);
        g.strokePath();

        // Border
        g.lineStyle(2, this.palette.stoneDark, 1);
        g.strokeRect(x - half, y - half, size, size);
    }

    /**
     * Draw a wooden plank tile
     */
    drawWoodTile(g, x, y, size) {
        const half = size / 2;
        const depth = 6;

        // Shadow underneath
        g.fillStyle(this.palette.woodDark, 1);
        g.fillRect(x - half, y - half + depth, size, size);

        // Main wood surface
        g.fillStyle(this.palette.woodMid, 1);
        g.fillRect(x - half, y - half, size, size - depth);

        // Wood grain lines
        g.lineStyle(1, this.palette.woodDark, 0.4);
        for (let i = 0; i < 5; i++) {
            const lineY = y - half + 5 + (i * 10);
            g.beginPath();
            g.moveTo(x - half + 3, lineY);
            g.lineTo(x + half - 3, lineY + (Math.random() * 4 - 2));
            g.strokePath();
        }

        // Highlight
        g.fillStyle(this.palette.woodLight, 0.3);
        g.fillRect(x - half + 2, y - half + 2, size - 4, 3);

        // Border
        g.lineStyle(2, this.palette.woodDark, 1);
        g.strokeRect(x - half, y - half, size, size);
    }

    /**
     * Create a special tile marker (knight/dragon/encounter)
     */
    createSpecialTileMarker(x, y, size, type) {
        // Try to use actual marker images if they're loaded
        let markerKey = null;
        if (type === 'knight' && this.scene.textures.exists('tile_marker_knight')) {
            markerKey = 'tile_marker_knight';
        } else if (type === 'dragon' && this.scene.textures.exists('tile_marker_dragon')) {
            markerKey = 'tile_marker_dragon';
        } else if (type === 'encounter' && this.scene.textures.exists('tile_marker_encounter')) {
            markerKey = 'tile_marker_encounter';
        } else if (type === 'special') {
            // Single marker for all special/bonus tiles
            if (this.scene.textures.exists('tile_marker_special')) {
                markerKey = 'tile_marker_special';
            }
        }

        if (markerKey) {
            const marker = this.scene.add.image(x, y, markerKey);
            marker.setDisplaySize(size, size);
            marker.setDepth(1);
            return marker;
        }

        // Fallback to procedural graphics
        const g = this.scene.add.graphics();
        const half = size / 2;

        let color, glowColor, icon;

        switch(type) {
            case 'knight':
                color = this.palette.goldMid;
                glowColor = this.palette.goldLight;
                break;
            case 'dragon':
                color = this.palette.dragonRed;
                glowColor = this.palette.lava;
                break;
            case 'encounter':
                color = 0x4A4A4A; // Grey shadow for monster encounters
                glowColor = 0x2A2A2A;
                break;
            case 'special':
                color = 0xFFD700; // Golden glow for item tiles (chests, portals)
                glowColor = 0xFFE066;
                break;
            default:
                color = this.palette.stoneMid;
                glowColor = this.palette.stoneLight;
        }

        // Glow effect
        g.fillStyle(glowColor, 0.3);
        g.fillCircle(x, y, half + 5);

        // Outer ring
        g.lineStyle(3, color, 0.8);
        g.strokeCircle(x, y, half - 5);

        // Inner filled circle
        g.fillStyle(color, 0.4);
        g.fillCircle(x, y, half - 10);

        // Pulsing will be added via tween
        g.setDepth(1);

        return g;
    }

    /**
     * Create a stylized player token
     */
    createPlayerToken(playerNumber) {
        const colors = [
            null, // index 0 unused
            { main: this.palette.playerRed, dark: 0xA62836, light: 0xFF5A6A },
            { main: this.palette.playerBlue, dark: 0x2D5A7A, light: 0x6A9DBD },
            { main: this.palette.playerGreen, dark: 0x1A7D6F, light: 0x4ABDA8 },
            { main: this.palette.playerGold, dark: 0xB9944A, light: 0xFFE49A }
        ];

        const c = colors[playerNumber] || colors[1];

        // Create a container for the token
        const container = this.scene.add.container(0, 0);
        const g = this.scene.add.graphics();

        // Shadow
        g.fillStyle(0x000000, 0.4);
        g.fillEllipse(0, 20, 30, 10);

        // Body (chunky pixel-art style knight)
        // Base/feet
        g.fillStyle(c.dark, 1);
        g.fillRect(-12, 8, 24, 8);

        // Torso
        g.fillStyle(c.main, 1);
        g.fillRect(-10, -8, 20, 18);

        // Shoulder armor
        g.fillStyle(c.light, 1);
        g.fillRect(-14, -6, 6, 10);
        g.fillRect(8, -6, 6, 10);

        // Head/helmet
        g.fillStyle(c.main, 1);
        g.fillCircle(0, -14, 10);

        // Helmet visor
        g.fillStyle(c.dark, 1);
        g.fillRect(-6, -16, 12, 4);

        // Helmet plume based on player
        g.fillStyle(c.light, 1);
        g.fillRect(-2, -26, 4, 10);

        // Eye slit glow
        g.fillStyle(0xFFFFFF, 0.8);
        g.fillRect(-4, -15, 3, 2);
        g.fillRect(1, -15, 3, 2);

        // Player number on chest
        const text = this.scene.add.text(0, -2, playerNumber.toString(), {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        container.add([g, text]);
        container.setDepth(10 + playerNumber);

        return container;
    }

    /**
     * Create a dragon graphic that coils around the causeway
     */
    createDragon(type, startX, startY, endX, endY) {
        const container = this.scene.add.container(0, 0);

        // Map type to sprite key
        let spriteKey = null;
        switch(type) {
            case 'slime':
                spriteKey = 'dragon_slimetooth';
                break;
            case 'frost':
                spriteKey = 'dragon_frostfang';
                break;
            case 'fire':
                spriteKey = 'dragon_ignis';
                break;
        }

        // Try to use actual dragon sprite if loaded
        if (spriteKey && this.scene.textures.exists(spriteKey)) {
            // Create animated dragon sprite at head position
            // Dragons use 128px frames from 512x512 sheets
            const dragon = this.scene.add.sprite(startX, startY - 50, spriteKey, 0);
            dragon.setScale(1.2); // Dragons are larger (128px frames)

            // Create animations for dragon sprite sheet (4x4 grid = 16 frames)
            // Full cycle uses ALL 16 frames for impressive board display
            const fullKey = `${spriteKey}_full`;
            const attackKey = `${spriteKey}_attack`;

            if (!this.scene.anims.exists(fullKey)) {
                this.scene.anims.create({
                    key: fullKey,
                    frames: this.scene.anims.generateFrameNumbers(spriteKey, { start: 0, end: 15 }),
                    frameRate: 6,
                    repeat: -1
                });
            }
            if (!this.scene.anims.exists(attackKey)) {
                this.scene.anims.create({
                    key: attackKey,
                    frames: this.scene.anims.generateFrameNumbers(spriteKey, { start: 8, end: 15 }),
                    frameRate: 10,
                    repeat: 0
                });
            }

            // Store animation keys on the sprite for later use
            dragon.attackAnim = attackKey;
            dragon.idleAnim = fullKey;
            dragon.play(fullKey); // Play full 16-frame animation

            // Draw a simple curved line connecting head to tail
            const g = this.scene.add.graphics();
            const controlX = (startX + endX) / 2 - 50;
            const controlY = (startY + endY) / 2 + 100;
            const curvePoints = this.getQuadraticBezierPoints(startX, startY, controlX, controlY, endX, endY, 20);

            // Dragon body line (simple, since we have the sprite)
            g.lineStyle(8, this.getDragonColor(type), 0.6);
            for (let i = 0; i < curvePoints.length - 1; i++) {
                g.lineBetween(curvePoints[i].x, curvePoints[i].y, curvePoints[i+1].x, curvePoints[i+1].y);
            }

            container.add([g, dragon]);
            container.setDepth(5);
            return container;
        }

        // Fallback to procedural graphics
        const g = this.scene.add.graphics();
        let color, colorLight, colorDark;

        switch(type) {
            case 'slime':
                color = this.palette.dragonGreen;
                colorLight = 0x6A9A5A;
                colorDark = 0x2A5A1A;
                break;
            case 'frost':
                color = this.palette.dragonBlue;
                colorLight = 0x6ABEDE;
                colorDark = 0x2A7A9A;
                break;
            case 'fire':
                color = this.palette.dragonRed;
                colorLight = 0xEC6644;
                colorDark = 0x8A2200;
                break;
            default:
                color = this.palette.dragonRed;
                colorLight = 0xEC6644;
                colorDark = 0x8A2200;
        }

        // Calculate curve points for dragon body using bezier approximation
        const controlX = (startX + endX) / 2 - 50;
        const controlY = (startY + endY) / 2 + 100;

        // Generate points along a quadratic bezier curve
        const curvePoints = this.getQuadraticBezierPoints(startX, startY, controlX, controlY, endX, endY, 20);

        // Dragon body - draw as connected segments (dark outline)
        g.lineStyle(20, colorDark, 1);
        for (let i = 0; i < curvePoints.length - 1; i++) {
            g.lineBetween(curvePoints[i].x, curvePoints[i].y, curvePoints[i+1].x, curvePoints[i+1].y);
        }

        // Lighter overlay for 3D effect
        g.lineStyle(14, color, 1);
        for (let i = 0; i < curvePoints.length - 1; i++) {
            g.lineBetween(curvePoints[i].x, curvePoints[i].y, curvePoints[i+1].x, curvePoints[i+1].y);
        }

        // Highlight
        g.lineStyle(6, colorLight, 0.6);
        for (let i = 0; i < curvePoints.length - 1; i++) {
            g.lineBetween(curvePoints[i].x, curvePoints[i].y - 4, curvePoints[i+1].x, curvePoints[i+1].y - 4);
        }

        // Dragon head at start position
        this.drawDragonHead(g, startX, startY - 15, color, colorLight, colorDark, type);

        // Dragon tail at end position
        this.drawDragonTail(g, endX, endY, colorDark);

        container.add(g);
        container.setDepth(5);

        return container;
    }

    /**
     * Draw dragon head
     */
    drawDragonHead(g, x, y, color, colorLight, colorDark, type) {
        // Head base
        g.fillStyle(color, 1);
        g.fillCircle(x, y, 18);

        // Snout
        g.fillStyle(color, 1);
        g.fillRect(x + 10, y - 8, 20, 16);

        // Horns
        g.fillStyle(colorDark, 1);
        g.fillTriangle(x - 8, y - 15, x - 4, y - 30, x + 2, y - 12);
        g.fillTriangle(x + 8, y - 15, x + 4, y - 30, x - 2, y - 12);

        // Eye
        g.fillStyle(0xFFFF00, 1);
        g.fillCircle(x + 5, y - 5, 5);
        g.fillStyle(0x000000, 1);
        g.fillCircle(x + 6, y - 5, 2);

        // Nostril smoke/breath based on type
        if (type === 'fire') {
            g.fillStyle(this.palette.lava, 0.6);
            g.fillCircle(x + 28, y, 8);
            g.fillCircle(x + 35, y - 3, 5);
        } else if (type === 'frost') {
            g.fillStyle(0xAADDFF, 0.6);
            g.fillCircle(x + 28, y, 8);
        } else {
            g.fillStyle(0x88FF88, 0.6);
            g.fillCircle(x + 28, y, 8);
        }
    }

    /**
     * Draw dragon tail
     */
    drawDragonTail(g, x, y, color) {
        g.fillStyle(color, 1);
        g.fillTriangle(x, y, x - 15, y + 5, x - 8, y - 20);
    }

    /**
     * Create a knight/ladder graphic
     */
    createKnight(type, x, y) {
        const container = this.scene.add.container(x, y);
        const g = this.scene.add.graphics();

        let armorColor, accentColor, mountType;

        switch(type) {
            case 'hedge':
                armorColor = 0x708090; // Steel gray
                accentColor = 0x228B22; // Forest green
                mountType = 'none';
                break;
            case 'griffin':
                armorColor = 0xC0C0C0; // Silver
                accentColor = 0x9400D3; // Purple
                mountType = 'griffin';
                break;
            case 'champion':
                armorColor = 0xFFD700; // Gold
                accentColor = 0x8B0000; // Royal red
                mountType = 'none';
                break;
            default:
                armorColor = 0x708090;
                accentColor = 0x228B22;
                mountType = 'none';
        }

        // Mount (if griffin)
        if (mountType === 'griffin') {
            // Griffin body
            g.fillStyle(0x8B4513, 1);
            g.fillEllipse(0, 20, 40, 25);

            // Griffin wings
            g.fillStyle(0xDEB887, 1);
            g.fillTriangle(-25, 10, -50, -20, -15, 0);
            g.fillTriangle(25, 10, 50, -20, 15, 0);

            // Griffin head
            g.fillStyle(0xFFD700, 1);
            g.fillCircle(0, -5, 12);

            // Beak
            g.fillStyle(0xFFA500, 1);
            g.fillTriangle(0, -5, 15, -8, 10, 0);
        }

        // Knight body
        g.fillStyle(armorColor, 1);
        g.fillRect(-10, -15, 20, 25);

        // Helmet
        g.fillStyle(armorColor, 1);
        g.fillCircle(0, -22, 12);

        // Plume
        g.fillStyle(accentColor, 1);
        g.fillRect(-2, -38, 4, 14);

        // Shield
        g.fillStyle(accentColor, 1);
        g.fillRect(-18, -10, 8, 15);
        g.lineStyle(1, 0x000000, 0.5);
        g.strokeRect(-18, -10, 8, 15);

        // Sword
        g.fillStyle(0xC0C0C0, 1);
        g.fillRect(12, -20, 3, 30);
        g.fillStyle(armorColor, 1);
        g.fillRect(10, -22, 7, 5);

        container.add(g);
        container.setDepth(6);

        return container;
    }

    /**
     * Get color for dragon body line based on type
     */
    getDragonColor(type) {
        switch(type) {
            case 'slime': return 0x4A7A3A;
            case 'frost': return 0x4A9EBF;
            case 'fire': return 0xCC4422;
            default: return 0xCC4422;
        }
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

    /**
     * Create the UI frame with gold borders
     */
    createUIFrame() {
        const g = this.scene.add.graphics();

        // Outer gold border
        g.lineStyle(6, this.palette.goldMid, 1);
        g.strokeRect(3, 3, 1274, 714);

        // Inner dark border
        g.lineStyle(2, this.palette.goldDark, 1);
        g.strokeRect(8, 8, 1264, 704);

        // Corner ornaments
        this.drawCornerOrnament(g, 0, 0, 1);           // Top-left
        this.drawCornerOrnament(g, 1280, 0, 2);        // Top-right
        this.drawCornerOrnament(g, 0, 720, 3);         // Bottom-left
        this.drawCornerOrnament(g, 1280, 720, 4);      // Bottom-right

        g.setDepth(100);

        return g;
    }

    /**
     * Draw corner ornaments
     */
    drawCornerOrnament(g, x, y, corner) {
        const size = 30;
        let offsetX = corner === 1 || corner === 3 ? size : -size;
        let offsetY = corner === 1 || corner === 2 ? size : -size;

        g.fillStyle(this.palette.goldLight, 1);
        g.fillCircle(x + offsetX/2, y + offsetY/2, 8);

        g.fillStyle(this.palette.goldMid, 1);
        g.fillCircle(x + offsetX/2, y + offsetY/2, 5);
    }

    /**
     * Create an animated D6 dice
     */
    createDice(x, y) {
        const container = this.scene.add.container(x, y);
        const size = 60;
        const half = size / 2;

        // Try to use dice sprite sheet if available
        if (this.scene.textures.exists('ui_dice')) {
            // Use sprite-based dice (frame 0-5 for faces 1-6)
            const diceSprite = this.scene.add.sprite(0, 0, 'ui_dice', 0);
            diceSprite.setDisplaySize(size, size);
            container.add(diceSprite);

            // Store sprite reference for updates
            container.diceSprite = diceSprite;

            // Create a hidden text for value tracking (used by game logic)
            const valueText = this.scene.add.text(0, 100, '?', {
                fontSize: '1px',
                color: '#000000'
            }).setOrigin(0.5).setAlpha(0);
            container.add(valueText);
            container.valueText = valueText;

            // Custom update function to show correct dice face
            container.showValue = (value) => {
                if (value >= 1 && value <= 6) {
                    diceSprite.setFrame(value - 1); // Frames 0-5 for values 1-6
                }
                valueText.setText(value.toString());
            };

            // Show question mark state (use frame 0 as default)
            diceSprite.setFrame(0);
        } else {
            // Fallback to procedural graphics
            const g = this.scene.add.graphics();

            // Dice shadow
            g.fillStyle(0x000000, 0.3);
            g.fillRoundedRect(-half + 4, -half + 4, size, size, 8);

            // Dice body
            g.fillStyle(0xFFFFF0, 1); // Ivory
            g.fillRoundedRect(-half, -half, size, size, 8);

            // Border
            g.lineStyle(3, this.palette.goldMid, 1);
            g.strokeRoundedRect(-half, -half, size, size, 8);

            // Inner border
            g.lineStyle(1, this.palette.goldDark, 0.5);
            g.strokeRoundedRect(-half + 4, -half + 4, size - 8, size - 8, 6);

            container.add(g);

            // Dice value text (will be updated)
            const valueText = this.scene.add.text(0, 0, '?', {
                fontSize: '36px',
                fontFamily: 'Georgia, serif',
                color: '#1a1a2e',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            container.add(valueText);
            container.valueText = valueText;
            container.graphics = g;
        }

        container.setDepth(50);
        return container;
    }

    /**
     * Update dice display
     */
    updateDice(diceContainer, value) {
        if (diceContainer.valueText) {
            // Show pips instead of number for authentic look
            const pips = this.getPipPattern(value);
            diceContainer.valueText.setText(value.toString());
        }
    }

    /**
     * Get pip pattern for dice value (for future enhancement)
     */
    getPipPattern(value) {
        // Returns positions for drawing pips
        const patterns = {
            1: [[0, 0]],
            2: [[-12, -12], [12, 12]],
            3: [[-12, -12], [0, 0], [12, 12]],
            4: [[-12, -12], [12, -12], [-12, 12], [12, 12]],
            5: [[-12, -12], [12, -12], [0, 0], [-12, 12], [12, 12]],
            6: [[-12, -12], [12, -12], [-12, 0], [12, 0], [-12, 12], [12, 12]]
        };
        return patterns[value] || patterns[1];
    }
}

// Export for use
// export default ProceduralGraphics;
