/**
 * DRAGON RUN: THE ROYAL RACE
 * game.js - Main entry point and game loop
 *
 * A PvP Digital Board Game with Fantasy Metal Slug Aesthetic
 * Similar to Snakes & Ladders with knights (ladders) and dragons (snakes)
 */

// ============================================================================
// GAME CONFIGURATION
// ============================================================================

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',

    // Enable pixel art rendering for crisp retro graphics
    pixelArt: true,
    antialias: false,

    // Background color (dark medieval stone)
    backgroundColor: '#1a1a2e',

    // Scale to fill the browser window (4K base resolution for high-res backgrounds)
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 3840,
        height: 2160
    },

    // Physics (not heavily used but available for particle effects)
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },

    // Game scenes
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// ============================================================================
// GLOBAL GAME STATE
// ============================================================================

let game;
let gfx;           // Procedural graphics system
let gameUI;        // Game UI system
let board;
let players = [];
let playerCharacterSelections = []; // Track which characters are selected
let currentPlayerIndex = 0;
let turnText;
let diceText;
let diceContainer; // Stylized dice display
let instructionText;
let playerStatusTexts = []; // Track player status text elements
let playerInventoryContainers = []; // Track inventory UI containers
let uiElements = {}; // Track all UI elements for repositioning on resize
let gameState = 'character_select'; // 'character_select', 'waiting', 'rolling', 'moving', 'encounter', 'ended'
let diceValue = 0;
let numberOfPlayers = 2; // Default, can be changed
let diceBoxBounds = null; // Bounds for dice click detection
let diceRollCount = 0; // Track dice rolls for SFX frequency

// Ability system
let abilityButton = null; // Ability toggle button
let abilityActivated = false; // Whether player has activated their ability for this roll

// Audio system
let audioManager = null;

// Multiplayer system
let networkManager = null;
let multiplayerUI = null;
let isMultiplayer = false;
let isMyTurn = true; // In local mode, always true
let serverBoardData = null; // Board data from server in multiplayer

// ============================================================================
// AUDIO MANAGER
// ============================================================================

/**
 * Simple audio manager for handling music playback
 */
class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.currentMusic = null;
        this.musicVolume = 0.5;
        this.sfxVolume = 0.7;
        this.muted = false;
        this.pendingMusic = null; // Track music to play after user interaction
        this.audioUnlocked = false;

        // Try to unlock audio on first user interaction
        this.setupAudioUnlock();
    }

    /**
     * Setup listener to unlock audio on first user interaction
     * Browsers require user interaction before playing audio
     */
    setupAudioUnlock() {
        const unlockAudio = () => {
            if (this.audioUnlocked) return;

            // Resume the audio context
            if (this.scene.sound.context && this.scene.sound.context.state === 'suspended') {
                this.scene.sound.context.resume().then(() => {
                    console.log('[Audio] Audio context resumed');
                    this.audioUnlocked = true;
                    // Play any pending music
                    if (this.pendingMusic) {
                        this.playMusic(this.pendingMusic.key, this.pendingMusic.loop);
                        this.pendingMusic = null;
                    }
                });
            } else {
                this.audioUnlocked = true;
                // Play any pending music
                if (this.pendingMusic) {
                    this.playMusic(this.pendingMusic.key, this.pendingMusic.loop);
                    this.pendingMusic = null;
                }
            }
        };

        // Listen for various user interactions
        this.scene.input.once('pointerdown', unlockAudio);
        this.scene.input.keyboard.once('keydown', unlockAudio);
    }

    /**
     * Play a music track (with crossfade)
     * @param {string} key - The audio key to play
     * @param {boolean} loop - Whether to loop (default true for music)
     */
    playMusic(key, loop = true) {
        // Check if the audio exists
        if (!this.scene.cache.audio.exists(key)) {
            console.log(`[Audio] Music not found: ${key}`);
            return;
        }

        // If audio isn't unlocked yet, queue this for later
        if (!this.audioUnlocked) {
            console.log(`[Audio] Queueing music for after user interaction: ${key}`);
            this.pendingMusic = { key, loop };
            return;
        }

        // Stop current music with fade out
        if (this.currentMusic && this.currentMusic.isPlaying) {
            const oldMusic = this.currentMusic;
            this.scene.tweens.add({
                targets: oldMusic,
                volume: 0,
                duration: 500,
                onComplete: () => {
                    oldMusic.stop();
                    oldMusic.destroy();
                }
            });
        }

        // Start new music with fade in
        this.currentMusic = this.scene.sound.add(key, {
            volume: 0,
            loop: loop
        });

        this.currentMusic.play();

        this.scene.tweens.add({
            targets: this.currentMusic,
            volume: this.muted ? 0 : this.musicVolume,
            duration: 500
        });

        console.log(`[Audio] Playing music: ${key}`);
    }

    /**
     * Play a sound effect
     * @param {string} key - The audio key to play
     */
    playSFX(key) {
        if (!this.scene.cache.audio.exists(key)) {
            console.log(`[Audio] SFX not found: ${key}`);
            return;
        }

        this.scene.sound.play(key, {
            volume: this.muted ? 0 : this.sfxVolume
        });
    }

    /**
     * Stop all music
     */
    stopMusic() {
        if (this.currentMusic) {
            this.scene.tweens.add({
                targets: this.currentMusic,
                volume: 0,
                duration: 300,
                onComplete: () => {
                    this.currentMusic.stop();
                    this.currentMusic = null;
                }
            });
        }
    }

    /**
     * Toggle mute
     */
    toggleMute() {
        this.muted = !this.muted;
        if (this.currentMusic) {
            this.currentMusic.setVolume(this.muted ? 0 : this.musicVolume);
        }
        console.log(`[Audio] Muted: ${this.muted}`);
        return this.muted;
    }

    /**
     * Set music volume
     * @param {number} volume - Volume 0-1
     */
    setMusicVolume(volume) {
        this.musicVolume = Phaser.Math.Clamp(volume, 0, 1);
        if (this.currentMusic && !this.muted) {
            this.currentMusic.setVolume(this.musicVolume);
        }
    }
}

// ============================================================================
// PHASER LIFECYCLE FUNCTIONS
// ============================================================================

/**
 * Preload assets
 */
function preload() {
    console.log('[Game] Preloading assets...');

    // Load background images
    this.load.image('bg_title', 'assets/images/backgrounds/bg_title_screen.png');
    this.load.image('bg_causeway', 'assets/images/backgrounds/bg_causeway_main.png');
    this.load.image('bg_board', 'assets/images/backgrounds/bg_causeway_main.png');

    // Load character sprite sheets (4x4 grid, all 256x256 = 64px frames)
    const charFrameConfig = { frameWidth: 64, frameHeight: 64 };
    this.load.spritesheet('char_reginald', 'assets/images/characters/char_reginald_sheet.png', charFrameConfig);
    this.load.spritesheet('char_elara', 'assets/images/characters/char_elara_sheet.png', charFrameConfig);
    this.load.spritesheet('char_kaelen', 'assets/images/characters/char_kaelen_sheet.png', charFrameConfig);
    this.load.spritesheet('char_aurelia', 'assets/images/characters/char_aurelia_sheet.png', charFrameConfig);
    this.load.spritesheet('char_grizelda', 'assets/images/characters/char_grizelda_sheet.png', charFrameConfig);
    this.load.spritesheet('char_pippin', 'assets/images/characters/char_pippin_sheet.png', charFrameConfig);

    // Load character card artwork (high-res MTG-style portraits, 512x768)
    this.load.image('card_reginald', 'assets/images/cards/card_reginald.png');
    this.load.image('card_elara', 'assets/images/cards/card_elara.png');
    this.load.image('card_kaelen', 'assets/images/cards/card_kaelen.png');
    this.load.image('card_aurelia', 'assets/images/cards/card_aurelia.png');
    this.load.image('card_grizelda', 'assets/images/cards/card_grizelda.png');
    this.load.image('card_pippin', 'assets/images/cards/card_pippin.png');

    // Load UI images
    this.load.image('ui_character_select', 'assets/images/ui/ui_character_select.png');
    this.load.image('ui_logo', 'assets/images/ui/ui_logo.png');
    // Dice sprite sheet (4x4 grid, 256x256 = 64px frames, faces 1-6 in first 6 frames)
    const diceFrameConfig = { frameWidth: 64, frameHeight: 64 };
    this.load.spritesheet('ui_dice', 'assets/images/ui/ui_dice_sheet.png', diceFrameConfig);

    // Load item icons (64x64 single images)
    this.load.image('item_armor_shard', 'assets/images/items/item_armor_shard.png');
    this.load.image('item_speed_potion', 'assets/images/items/item_speed_potion.png');
    this.load.image('item_spell_scroll', 'assets/images/items/item_spell_scroll.png');
    this.load.image('item_smoke_bomb', 'assets/images/items/item_smoke_bomb.png');
    this.load.image('item_holy_shield', 'assets/images/items/item_holy_shield.png');

    // Load effect sprite sheets (4x4 grid, 256x256 = 64px frames)
    const fxFrameConfig = { frameWidth: 64, frameHeight: 64 };
    this.load.spritesheet('fx_fire', 'assets/images/effects/fx_fire_sheet.png', fxFrameConfig);
    this.load.spritesheet('fx_ice', 'assets/images/effects/fx_ice_sheet.png', fxFrameConfig);
    this.load.spritesheet('fx_sparkle', 'assets/images/effects/fx_sparkle_sheet.png', fxFrameConfig);
    this.load.spritesheet('fx_smoke', 'assets/images/effects/fx_smoke_sheet.png', fxFrameConfig);
    this.load.spritesheet('fx_poison', 'assets/images/effects/fx_smoke_sheet.png', fxFrameConfig); // Reuse smoke for poison

    // Load dragon sprite sheets (4x4 grid, 512x512 = 128px frames)
    const dragonFrameConfig = { frameWidth: 128, frameHeight: 128 };
    this.load.spritesheet('dragon_ignis', 'assets/images/dragons/dragon_ignis_sheet.png', dragonFrameConfig);
    this.load.spritesheet('dragon_frostfang', 'assets/images/dragons/dragon_frostfang_sheet.png', dragonFrameConfig);
    this.load.spritesheet('dragon_slimetooth', 'assets/images/dragons/dragon_slimetooth_sheet.png', dragonFrameConfig);
    // Also load with _sheet suffix for EncounterData compatibility
    this.load.spritesheet('dragon_ignis_sheet', 'assets/images/dragons/dragon_ignis_sheet.png', dragonFrameConfig);
    this.load.spritesheet('dragon_frostfang_sheet', 'assets/images/dragons/dragon_frostfang_sheet.png', dragonFrameConfig);
    this.load.spritesheet('dragon_slimetooth_sheet', 'assets/images/dragons/dragon_slimetooth_sheet.png', dragonFrameConfig);

    // Load knight sprite sheets (256x256 with 4x4 grid = 64px frames)
    const knightFrameConfig = { frameWidth: 64, frameHeight: 64 };
    this.load.spritesheet('knight_hedge_sheet', 'assets/images/knights/knight_hedge_sheet.png', knightFrameConfig);
    this.load.spritesheet('knight_griffin_sheet', 'assets/images/knights/knight_griffin_sheet.png', knightFrameConfig);
    this.load.spritesheet('knight_champion_sheet', 'assets/images/knights/knight_champion_sheet.png', knightFrameConfig);

    // Load monster sprite sheets (256x256 with 4x4 grid = 64px frames)
    const monsterFrameConfig = { frameWidth: 64, frameHeight: 64 };
    this.load.spritesheet('monster_milkbaby_sheet', 'assets/images/monsters/monster_milkbaby_sheet.png', monsterFrameConfig);
    this.load.spritesheet('monster_taxgoblin_sheet', 'assets/images/monsters/monster_taxgoblin_sheet.png', monsterFrameConfig);
    this.load.spritesheet('monster_hillgiant_sheet', 'assets/images/monsters/monster_hillgiant_sheet.png', monsterFrameConfig);
    this.load.spritesheet('monster_mimic_sheet', 'assets/images/monsters/monster_mimic_sheet.png', monsterFrameConfig);
    this.load.spritesheet('monster_vampires_sheet', 'assets/images/monsters/monster_vampires_sheet.png', monsterFrameConfig);
    this.load.spritesheet('monster_hypnotoad_sheet', 'assets/images/monsters/monster_hypnotoad_sheet.png', monsterFrameConfig);

    // Load tile images (64x64 single tiles)
    this.load.image('tile_stone', 'assets/images/tiles/tile_stone.png');
    this.load.image('tile_wood', 'assets/images/tiles/tile_wood.png');
    this.load.image('tile_start', 'assets/images/tiles/tile_start.png');
    this.load.image('tile_finish', 'assets/images/tiles/tile_finish.png');
    this.load.image('tile_marker_knight', 'assets/images/tiles/tile_marker_knight.png');
    this.load.image('tile_marker_encounter', 'assets/images/tiles/tile_marker_special.png');
    // Single marker for all special/bonus tiles (chests, portals, anvil)
    this.load.image('tile_marker_special', 'assets/images/tiles/tile_marker_special.png');
    // Elemental tiles (near dragons)
    this.load.image('tile_fire', 'assets/images/tiles/tile_fire.png');
    this.load.image('tile_ice', 'assets/images/tiles/tile_ice.png');
    this.load.image('tile_poison', 'assets/images/tiles/tile_poison.png');

    // Load encounter card images (for encounter modal display)
    this.load.image('encounter_milkbaby', 'assets/images/encounters/encounter_milkbaby.png');
    this.load.image('encounter_taxgoblin', 'assets/images/encounters/encounter_taxgoblin.png');
    this.load.image('encounter_hillgiant', 'assets/images/encounters/encounter_hillgiant.png');
    this.load.image('encounter_mimic', 'assets/images/encounters/encounter_mimic.png');
    this.load.image('encounter_vampires', 'assets/images/encounters/encounter_vampires.png');
    this.load.image('encounter_hypnotoad', 'assets/images/encounters/encounter_hypnotoad.png');
    this.load.image('encounter_slimetooth', 'assets/images/encounters/encounter_slimetooth.png');
    this.load.image('encounter_frostfang', 'assets/images/encounters/encounter_frostfang.png');
    this.load.image('encounter_ignis', 'assets/images/encounters/encounter_ignis.png');
    this.load.image('encounter_hedgeknight', 'assets/images/encounters/encounter_hedgeknight.png');
    this.load.image('encounter_griffinrider', 'assets/images/encounters/encounter_griffinrider.png');
    this.load.image('encounter_champion', 'assets/images/encounters/encounter_champion.png');
    this.load.image('encounter_treasure', 'assets/images/encounters/encounter_treasure.png');
    this.load.image('encounter_anvil', 'assets/images/encounters/encounter_anvil.png');

    // Portal encounter images (3 types)
    this.load.image('encounter_portalBalanced', 'assets/images/encounters/encounter_portal_balanced.png');
    this.load.image('encounter_portalRisky', 'assets/images/encounters/encounter_portal_risky.png');
    this.load.image('encounter_portalChaotic', 'assets/images/encounters/encounter_portal_chaotic.png');

    // Portal board sprite sheets (3 types, 4x4 grid = 16 frames, 2048x2048 images = 512x512 per frame)
    this.load.spritesheet('portal_balanced_sheet', 'assets/images/portals/portal_balanced_sheet.png', { frameWidth: 512, frameHeight: 512 });
    this.load.spritesheet('portal_risky_sheet', 'assets/images/portals/portal_risky_sheet.png', { frameWidth: 512, frameHeight: 512 });
    this.load.spritesheet('portal_chaotic_sheet', 'assets/images/portals/portal_chaotic_sheet.png', { frameWidth: 512, frameHeight: 512 });

    // Load audio files - music tracks
    this.load.audio('music_title', 'assets/audio/music_title.mp3');
    this.load.audio('music_character_select', 'assets/audio/music_character_select.mp3');
    this.load.audio('music_gameplay', 'assets/audio/music_gameplay.mp3');
    this.load.audio('music_tension', 'assets/audio/music_tension.mp3');
    this.load.audio('music_encounter', 'assets/audio/music_encounter.mp3');
    this.load.audio('music_victory', 'assets/audio/music_victory.mp3');

    // Load sound effects
    this.load.audio('sfx_button_click', 'assets/audio/sfx_button_click.mp3');
    this.load.audio('sfx_character_select', 'assets/audio/sfx_character_select.mp3');
    this.load.audio('sfx_dice_shake', 'assets/audio/sfx_dice_shake.mp3');
    this.load.audio('sfx_dragon_roar', 'assets/audio/sfx_dragon_roar.mp3');
    this.load.audio('sfx_dragon_slide', 'assets/audio/sfx_dragon_slide.mp3');
    this.load.audio('sfx_encounter_success', 'assets/audio/sfx_encounter_success.mp3');
    this.load.audio('sfx_giant_stomp', 'assets/audio/sfx_giant_stomp.mp3');
    this.load.audio('sfx_goblin_laugh', 'assets/audio/sfx_goblin_laugh.mp3');
    this.load.audio('sfx_hypno_spiral', 'assets/audio/sfx_hypno_spiral.mp3');
    this.load.audio('sfx_item_get', 'assets/audio/sfx_item_get.mp3');
    this.load.audio('sfx_knight_boost', 'assets/audio/sfx_knight_boost.mp3');
    this.load.audio('sfx_mimic_chomp', 'assets/audio/sfx_mimic_chomp.mp3');
    this.load.audio('sfx_move_step', 'assets/audio/sfx_move_step.mp3');
    this.load.audio('sfx_portal_teleport', 'assets/audio/sfx_portal_teleport.mp3');
    this.load.audio('sfx_treasure_open', 'assets/audio/sfx_treasure_open.mp3');
    this.load.audio('sfx_turn_start', 'assets/audio/sfx_turn_start.mp3');
}

/**
 * Create game objects and initialize systems
 */
function create() {
    console.log('[Game] Creating game world...');

    // Initialize procedural graphics system
    gfx = new ProceduralGraphics(this);

    // Initialize GameUI system
    gameUI = new GameUI(this, gfx);

    // Initialize audio manager
    audioManager = new AudioManager(this);

    // Start title/character select music
    audioManager.playMusic('music_title');

    // Create the main gameplay background with parallax scrolling
    const createBackground = () => {
        if (this.textures.exists('bg_causeway')) {
            const texture = this.textures.get('bg_causeway');
            const frame = texture.getSourceImage();
            const bg = this.add.image(frame.width / 2, frame.height / 2, 'bg_causeway');
            // Keep native resolution - no scaling
            bg.setDepth(-10);
            bg.setName('gameBackground');
            // Parallax: background scrolls slower than foreground (0.3 = 30% of camera movement)
            bg.setScrollFactor(0.3);
        } else if (this.textures.exists('bg_board')) {
            const texture = this.textures.get('bg_board');
            const frame = texture.getSourceImage();
            const bg = this.add.image(frame.width / 2, frame.height / 2, 'bg_board');
            bg.setDepth(-10);
            bg.setName('gameBackground');
            bg.setScrollFactor(0.3);
        } else {
            gfx.createBackground();
        }
    };
    createBackground();

    // Create the game board (tiles overlay on the background)
    board = new Board(this, gfx);
    board.create();

    // Setup camera controls for panning/zooming
    setupCameraControls.call(this);

    // Note: UI frame removed - the right panel provides the UI border

    // Create character animations
    createCharacterAnimations.call(this);

    // Show main menu (local vs online choice)
    showMainMenu.call(this);
}

/**
 * Setup camera with auto-follow and optional manual panning
 * Supports multi-finger trackpad drag to pan the camera
 */
function setupCameraControls() {
    const camera = this.cameras.main;

    // Set camera bounds based on actual board size (will be updated after board creation)
    camera.setBounds(-200, -200, 4000, 4000);

    // Fixed zoom level for consistent view
    camera.setZoom(1);

    // Track panning state
    let isPanning = false;
    let panStartX = 0;
    let panStartY = 0;
    let cameraStartX = 0;
    let cameraStartY = 0;

    // Handle multi-finger trackpad/touch panning
    // On trackpad, two-finger scroll fires as wheel events
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
        // Use wheel event for trackpad two-finger scroll panning
        // Check if it's a horizontal/vertical scroll (trackpad pan) vs zoom (ctrl+scroll)
        if (!pointer.event.ctrlKey) {
            // Pan the camera
            camera.scrollX += deltaX * 0.5;
            camera.scrollY += deltaY * 0.5;
        }
    });

    // Also support click-and-drag panning with middle mouse button or when shift is held
    this.input.on('pointerdown', (pointer) => {
        // Middle mouse button (button 1) or shift+click to start panning
        if (pointer.middleButtonDown() || (pointer.leftButtonDown() && pointer.event.shiftKey)) {
            isPanning = true;
            panStartX = pointer.x;
            panStartY = pointer.y;
            cameraStartX = camera.scrollX;
            cameraStartY = camera.scrollY;
        }
    });

    this.input.on('pointermove', (pointer) => {
        if (isPanning) {
            const dx = panStartX - pointer.x;
            const dy = panStartY - pointer.y;
            camera.scrollX = cameraStartX + dx;
            camera.scrollY = cameraStartY + dy;
        }
    });

    this.input.on('pointerup', (pointer) => {
        isPanning = false;
    });

    // Handle touch gesture panning (for actual touchscreens)
    if (this.input.touch) {
        let lastTouchX = 0;
        let lastTouchY = 0;
        let touchCount = 0;

        this.input.on('pointerdown', (pointer) => {
            touchCount++;
            if (touchCount >= 2) {
                lastTouchX = pointer.x;
                lastTouchY = pointer.y;
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (touchCount >= 2) {
                const dx = lastTouchX - pointer.x;
                const dy = lastTouchY - pointer.y;
                camera.scrollX += dx;
                camera.scrollY += dy;
                lastTouchX = pointer.x;
                lastTouchY = pointer.y;
            }
        });

        this.input.on('pointerup', () => {
            touchCount = Math.max(0, touchCount - 1);
        });
    }
}

/**
 * Update camera bounds after board is created
 */
function updateCameraBounds() {
    if (!board || !board.actualBounds) return;

    const scene = game.scene.scenes[0];
    const camera = scene.cameras.main;
    const bounds = board.actualBounds;

    // Set generous bounds to allow centering on any tile
    camera.setBounds(
        bounds.minX - scene.scale.width,
        bounds.minY - scene.scale.height,
        bounds.width + scene.scale.width * 2,
        bounds.height + scene.scale.height * 2
    );

    console.log('[Camera] Bounds updated:', bounds);
}

/**
 * Center the camera on a specific player
 * @param {Player} player - The player to focus on
 * @param {number} duration - Animation duration in ms (default 400)
 */
function panToPlayer(player, duration = 400) {
    if (!player || !player.token) return;

    const scene = game.scene.scenes[0];
    if (!scene) return;

    const camera = scene.cameras.main;

    // Get player position
    const targetX = player.token.x;
    const targetY = player.token.y;

    // Account for UI panel on the right (300px wide)
    const panelWidth = 320;
    const gameAreaWidth = scene.scale.width - panelWidth;

    // Center player in the game area (left side of screen)
    const scrollX = targetX - gameAreaWidth / 2;
    const scrollY = targetY - scene.scale.height / 2;

    // Animate camera to player
    scene.tweens.add({
        targets: camera,
        scrollX: scrollX,
        scrollY: scrollY,
        duration: duration,
        ease: 'Sine.easeInOut'
    });
}

/**
 * Create sprite animations for all characters
 */
function createCharacterAnimations() {
    const characterIds = ['reginald', 'elara', 'kaelen', 'aurelia', 'grizelda', 'pippin'];

    characterIds.forEach(charId => {
        const key = `char_${charId}`;
        if (this.textures.exists(key)) {
            // Row 1 (0-3): Idle animation
            this.anims.create({
                key: `${key}_idle`,
                frames: this.anims.generateFrameNumbers(key, { start: 0, end: 3 }),
                frameRate: 6,
                repeat: -1
            });

            // Row 2 (4-7): Walk/Run animation
            this.anims.create({
                key: `${key}_walk`,
                frames: this.anims.generateFrameNumbers(key, { start: 4, end: 7 }),
                frameRate: 8,
                repeat: -1
            });

            // Row 3 (8-11): Action/Hurt animation (taking damage, using item, etc.)
            this.anims.create({
                key: `${key}_action`,
                frames: this.anims.generateFrameNumbers(key, { start: 8, end: 11 }),
                frameRate: 10,
                repeat: 0
            });

            // Row 4 (12-15): Victory/Celebrate animation
            this.anims.create({
                key: `${key}_victory`,
                frames: this.anims.generateFrameNumbers(key, { start: 12, end: 15 }),
                frameRate: 6,
                repeat: -1
            });

            // Full animation cycle (all 16 frames) - loops continuously for board display
            this.anims.create({
                key: `${key}_full`,
                frames: this.anims.generateFrameNumbers(key, { start: 0, end: 15 }),
                frameRate: 6,
                repeat: -1
            });
        }
    });

    // Create monster animations (4x4 grid = 16 frames)
    // Row 1 (0-3): Idle, Row 2 (4-7): Move/Prowl, Row 3 (8-11): Attack windup, Row 4 (12-15): Attack release
    const monsterIds = ['milkbaby', 'taxgoblin', 'hillgiant', 'mimic', 'vampires', 'hypnotoad'];
    monsterIds.forEach(monsterId => {
        const key = `monster_${monsterId}_sheet`;
        console.log(`[Animations] Checking monster texture: ${key}, exists: ${this.textures.exists(key)}`);
        if (this.textures.exists(key)) {
            console.log(`[Animations] Creating animations for monster: ${key}`);
            // Row 1 (0-3): Primary idle
            this.anims.create({
                key: `${key}_idle`,
                frames: this.anims.generateFrameNumbers(key, { start: 0, end: 3 }),
                frameRate: 6,
                repeat: -1
            });
            // Row 2 (4-7): Movement/Prowl animation
            this.anims.create({
                key: `${key}_move`,
                frames: this.anims.generateFrameNumbers(key, { start: 4, end: 7 }),
                frameRate: 8,
                repeat: -1
            });
            // Row 3 (8-11): Attack windup
            this.anims.create({
                key: `${key}_windup`,
                frames: this.anims.generateFrameNumbers(key, { start: 8, end: 11 }),
                frameRate: 8,
                repeat: 0
            });
            // Row 4 (12-15): Attack release
            this.anims.create({
                key: `${key}_strike`,
                frames: this.anims.generateFrameNumbers(key, { start: 12, end: 15 }),
                frameRate: 12,
                repeat: 0
            });
            // Full attack sequence (rows 3-4, frames 8-15)
            this.anims.create({
                key: `${key}_attack`,
                frames: this.anims.generateFrameNumbers(key, { start: 8, end: 15 }),
                frameRate: 10,
                repeat: 0
            });
            // Full animation cycle (all 16 frames) - loops continuously for board display
            this.anims.create({
                key: `${key}_full`,
                frames: this.anims.generateFrameNumbers(key, { start: 0, end: 15 }),
                frameRate: 6,
                repeat: -1
            });
        }
    });

    // Create knight animations (4x4 grid = 16 frames)
    // Row 1 (0-3): Idle, Row 2 (4-7): Walk/Gallop, Row 3 (8-11): Charge/Salute, Row 4 (12-15): Rescue action
    const knightIds = ['hedge', 'griffin', 'champion'];
    knightIds.forEach(knightId => {
        const key = `knight_${knightId}_sheet`;
        if (this.textures.exists(key)) {
            // Row 1 (0-3): Idle
            this.anims.create({
                key: `${key}_idle`,
                frames: this.anims.generateFrameNumbers(key, { start: 0, end: 3 }),
                frameRate: 6,
                repeat: -1
            });
            // Row 2 (4-7): Walk/Gallop
            this.anims.create({
                key: `${key}_walk`,
                frames: this.anims.generateFrameNumbers(key, { start: 4, end: 7 }),
                frameRate: 8,
                repeat: -1
            });
            // Row 3 (8-11): Charge/Salute
            this.anims.create({
                key: `${key}_charge`,
                frames: this.anims.generateFrameNumbers(key, { start: 8, end: 11 }),
                frameRate: 10,
                repeat: 0
            });
            // Row 4 (12-15): Rescue/Action
            this.anims.create({
                key: `${key}_rescue`,
                frames: this.anims.generateFrameNumbers(key, { start: 12, end: 15 }),
                frameRate: 10,
                repeat: 0
            });
            // Full action sequence (rows 3-4, frames 8-15)
            this.anims.create({
                key: `${key}_action`,
                frames: this.anims.generateFrameNumbers(key, { start: 8, end: 15 }),
                frameRate: 10,
                repeat: 0
            });
            // Full animation cycle (all 16 frames) - loops continuously for board display
            this.anims.create({
                key: `${key}_full`,
                frames: this.anims.generateFrameNumbers(key, { start: 0, end: 15 }),
                frameRate: 6,
                repeat: -1
            });
        }
    });

    // Create dragon animations (4x4 grid = 16 frames)
    // Row 1 (0-3): Idle/Breathing, Row 2 (4-7): Menacing hover, Row 3 (8-11): Attack windup, Row 4 (12-15): Breath attack
    const dragonIds = ['ignis', 'frostfang', 'slimetooth'];
    dragonIds.forEach(dragonId => {
        // Create animations for both key formats (with and without _sheet suffix)
        const keys = [`dragon_${dragonId}`, `dragon_${dragonId}_sheet`];
        keys.forEach(key => {
            if (this.textures.exists(key)) {
                // Row 1 (0-3): Primary idle/breathing
                this.anims.create({
                    key: `${key}_idle`,
                    frames: this.anims.generateFrameNumbers(key, { start: 0, end: 3 }),
                    frameRate: 5,
                    repeat: -1
                });
                // Row 2 (4-7): Menacing hover/prowl
                this.anims.create({
                    key: `${key}_hover`,
                    frames: this.anims.generateFrameNumbers(key, { start: 4, end: 7 }),
                    frameRate: 6,
                    repeat: -1
                });
                // Row 3 (8-11): Attack windup (inhale before breath)
                this.anims.create({
                    key: `${key}_windup`,
                    frames: this.anims.generateFrameNumbers(key, { start: 8, end: 11 }),
                    frameRate: 8,
                    repeat: 0
                });
                // Row 4 (12-15): Breath attack
                this.anims.create({
                    key: `${key}_breath`,
                    frames: this.anims.generateFrameNumbers(key, { start: 12, end: 15 }),
                    frameRate: 12,
                    repeat: 0
                });
                // Full attack sequence (rows 3-4, frames 8-15)
                this.anims.create({
                    key: `${key}_attack`,
                    frames: this.anims.generateFrameNumbers(key, { start: 8, end: 15 }),
                    frameRate: 10,
                    repeat: 0
                });
                // Full animation cycle (all 16 frames) - loops continuously for board display
                this.anims.create({
                    key: `${key}_full`,
                    frames: this.anims.generateFrameNumbers(key, { start: 0, end: 15 }),
                    frameRate: 6,
                    repeat: -1
                });
            }
        });
    });

    // Create effect animations (4x4 grid = 16 frames)
    // Row 1-2 (0-7): Build-up phase, Row 3-4 (8-15): Intensity/Fade phase
    const effectIds = ['fire', 'ice', 'sparkle', 'smoke', 'poison'];
    effectIds.forEach(effectId => {
        const key = `fx_${effectId}`;
        if (this.textures.exists(key)) {
            // Main looping animation (all 16 frames) - continuous effect
            this.anims.create({
                key: `${key}_loop`,
                frames: this.anims.generateFrameNumbers(key, { start: 0, end: 15 }),
                frameRate: 12,
                repeat: -1
            });
            // One-shot burst animation (faster, no repeat) - quick impact
            this.anims.create({
                key: `${key}_burst`,
                frames: this.anims.generateFrameNumbers(key, { start: 0, end: 15 }),
                frameRate: 20,
                repeat: 0
            });
            // Build-up only (rows 1-2, frames 0-7) - effect starting
            this.anims.create({
                key: `${key}_start`,
                frames: this.anims.generateFrameNumbers(key, { start: 0, end: 7 }),
                frameRate: 10,
                repeat: 0
            });
            // Intensity phase (rows 3-4, frames 8-15) - effect climax
            this.anims.create({
                key: `${key}_peak`,
                frames: this.anims.generateFrameNumbers(key, { start: 8, end: 15 }),
                frameRate: 14,
                repeat: 0
            });
            // Slow ambient loop (first row only) - subtle background effect
            this.anims.create({
                key: `${key}_ambient`,
                frames: this.anims.generateFrameNumbers(key, { start: 0, end: 3 }),
                frameRate: 6,
                repeat: -1
            });
        }
    });
}

/**
 * Game update loop (called every frame)
 */
function update() {
    // Currently no per-frame updates needed
    // Movement is handled through tweens and async functions
}

// ============================================================================
// MAIN MENU & MULTIPLAYER
// ============================================================================

/**
 * Show the main menu with Local/Online options
 */
function showMainMenu() {
    console.log('[Game] Showing main menu...');

    const scene = this;

    // Initialize multiplayer systems
    networkManager = new NetworkManager();
    multiplayerUI = new MultiplayerUI(scene);
    multiplayerUI.setNetworkManager(networkManager);

    // Switch to character select music
    if (audioManager) {
        audioManager.playMusic('music_character_select');
    }

    // Reset camera
    const camera = scene.cameras.main;
    camera.scrollX = 0;
    camera.scrollY = 0;
    camera.setZoom(1);

    // Get screen dimensions
    const width = scene.scale.width;
    const height = scene.scale.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Use title screen as background
    if (scene.textures.exists('bg_title')) {
        const texture = scene.textures.get('bg_title');
        const frame = texture.getSourceImage();
        const titleBg = scene.add.image(centerX, centerY, 'bg_title');
        const scaleX = width / frame.width;
        const scaleY = height / frame.height;
        titleBg.setScale(Math.max(scaleX, scaleY));
        titleBg.setDepth(99).setName('titleBackground').setScrollFactor(0);
    }

    // Semi-transparent overlay
    const selectBg = scene.add.graphics();
    selectBg.fillStyle(0x000000, 0.5);
    selectBg.fillRect(0, 0, width, height);
    selectBg.setDepth(100).setName('selectOverlay').setScrollFactor(0);

    // Show main menu
    multiplayerUI.showMainMenu((mode) => {
        if (mode === 'local') {
            // Local game - proceed with character selection
            isMultiplayer = false;
            isMyTurn = true;
            startCharacterSelection.call(scene);
        }
        // Online mode is handled by MultiplayerUI
    });

    // Setup callback for when online game is ready
    multiplayerUI.setOnGameReady((data) => {
        console.log('[Game] Online game ready, starting...', data);
        isMultiplayer = true;
        serverBoardData = data.board;

        // Setup network event handlers
        setupNetworkHandlers.call(scene);

        // Start the game with server data
        startOnlineGame.call(scene, data);
    });
}

/**
 * Setup network event handlers for multiplayer
 */
function setupNetworkHandlers() {
    const scene = this;

    // Handle roll results from server
    networkManager.on('rollResult', (data) => {
        console.log('[Network] Roll result:', data);

        if (data.playerNumber === networkManager.myPlayerNumber) {
            // It's our roll - animate it
            diceValue = data.roll;
            animateDiceRoll.call(scene, data.roll, () => {
                // After animation, tell server to process movement
                networkManager.processMovement({});
            });
        } else {
            // Other player's roll - just update display
            diceValue = data.roll;
            updateDiceDisplay(data.roll);
        }
    });

    // Handle turn completion
    networkManager.on('turnComplete', (data) => {
        console.log('[Network] Turn complete:', data);

        // Update all player states
        data.playerStates.forEach((state, index) => {
            if (players[index]) {
                // Instantly move to new position (no animation for remote players)
                players[index].currentTile = state.currentTile;
                players[index].statusEffects = { ...state.statusEffects };
                players[index].inventory.items = [...state.inventory];
                players[index].hasWon = state.hasWon;

                // Snap sprite to position
                const tile = board.tiles[state.currentTile];
                if (tile && players[index].sprite) {
                    players[index].sprite.x = tile.x;
                    players[index].sprite.y = tile.y - 20;
                }
            }
        });

        updatePlayerStatus();

        if (data.gameEnded) {
            // Game over
            gameState = 'ended';
            const winner = players.find(p => p.hasWon);
            showGameOver.call(scene, winner);
        } else {
            // Next turn
            currentPlayerIndex = data.currentPlayerIndex;
            isMyTurn = (data.currentPlayerIndex + 1) === networkManager.myPlayerNumber;
            gameState = 'waiting';
            updateTurnDisplay.call(scene);
        }
    });

    // Handle encounters
    networkManager.on('encounterTriggered', (data) => {
        console.log('[Network] Encounter triggered:', data);

        if (data.playerNumber === networkManager.myPlayerNumber) {
            // Show encounter modal for our turn
            gameState = 'encounter';
            gameUI.showEncounterModal(data.encounter, players[currentPlayerIndex], (result) => {
                networkManager.encounterChoice(result);
            });
        }
    });

    // Handle game end
    networkManager.on('gameEnded', (data) => {
        console.log('[Network] Game ended:', data);
        gameState = 'ended';
        const winner = players.find(p => p.playerNumber === data.winner);
        showGameOver.call(scene, winner);
    });

    // Handle errors
    networkManager.on('error', (data) => {
        console.error('[Network] Error:', data.message);
        gameUI.showToast(data.message, 'danger');
    });

    // Handle disconnection
    networkManager.on('disconnected', (data) => {
        console.log('[Network] Disconnected:', data.reason);
        gameUI.showToast('Disconnected from server', 'danger');
    });
}

/**
 * Start an online multiplayer game
 */
function startOnlineGame(data) {
    const scene = this;

    console.log('[Game] Starting online game with data:', data);

    // Clear any existing multiplayer UI
    if (multiplayerUI) {
        multiplayerUI.clearElements();
    }

    // Store server board data for seeded generation
    serverBoardData = data.board;

    // Set number of players
    numberOfPlayers = data.players.length;

    // Map server players to character selections
    playerCharacterSelections = data.players.map(p => {
        return CharacterData.find(c => c.id === p.characterId);
    });

    // Set initial turn state
    currentPlayerIndex = data.currentPlayerIndex || 0;
    isMyTurn = (currentPlayerIndex + 1) === networkManager.myPlayerNumber;

    // Apply server-provided board assignments for multiplayer sync
    if (board && serverBoardData) {
        board.applyServerAssignments(serverBoardData);
    }

    // Start the game (similar to finishCharacterSelection but for multiplayer)
    finishCharacterSelection.call(scene);

    // Update turn display for multiplayer
    updateTurnDisplay.call(scene);
}

/**
 * Update turn display for multiplayer
 */
function updateTurnDisplay() {
    const currentPlayer = players[currentPlayerIndex];
    if (turnText) {
        turnText.setText(currentPlayer.name);
    }

    // Update instruction text
    if (instructionText) {
        if (isMyTurn) {
            instructionText.setText('Click dice or SPACE\nto roll!');
        } else {
            instructionText.setText(`Waiting for\n${currentPlayer.name}...`);
        }
    }

    // Highlight current player
    players.forEach((p, i) => p.setActive(i === currentPlayerIndex));
}

/**
 * Animate dice roll (used for both local and network)
 */
function animateDiceRoll(finalValue, onComplete) {
    const scene = this;

    // Play dice shake sound
    if (audioManager) {
        audioManager.playSFX('sfx_dice_shake');
    }

    // Phase 1: Initial throw - fast rotation and scale bounce
    scene.tweens.add({
        targets: diceContainer,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 100,
        ease: 'Power2.easeOut',
        onComplete: () => {
            scene.tweens.add({
                targets: diceContainer,
                scaleX: 1.3,
                scaleY: 1.3,
                duration: 80,
                ease: 'Power2.easeIn'
            });
        }
    });

    // Phase 2: Tumbling rotation
    scene.tweens.add({
        targets: diceContainer,
        angle: 360,
        duration: 800,
        ease: 'Power3.easeOut'
    });

    // Phase 3: Flash through frames
    let flashCount = 0;
    const totalFlashes = 12;
    let currentDelay = 40;

    const flashNextValue = () => {
        const frameIndex = flashCount % 16;
        if (diceContainer.diceSprite) {
            diceContainer.diceSprite.setFrame(frameIndex);
        } else if (diceContainer.valueText) {
            const randomVal = Math.floor(Math.random() * 6) + 1;
            diceContainer.valueText.setText(randomVal.toString());
        }

        flashCount++;

        if (flashCount >= totalFlashes) {
            scene.time.delayedCall(80, () => {
                // Show final value
                if (diceContainer.showValue) {
                    diceContainer.showValue(finalValue);
                } else if (diceContainer.valueText) {
                    diceContainer.valueText.setText(finalValue.toString());
                }

                // Final bounce
                scene.tweens.add({
                    targets: diceContainer,
                    scaleX: 1.45,
                    scaleY: 1.45,
                    duration: 80,
                    yoyo: true,
                    ease: 'Power2.easeOut',
                    onComplete: () => {
                        diceContainer.angle = 0;
                        diceContainer.setScale(1.3);
                        diceValue = finalValue;
                        if (onComplete) onComplete();
                    }
                });
            });
        } else {
            currentDelay = 40 + Math.pow(flashCount, 1.8) * 2;
            scene.time.delayedCall(currentDelay, flashNextValue);
        }
    };

    scene.time.delayedCall(50, flashNextValue);
}

/**
 * Update dice display without animation (for observing other players' rolls)
 */
function updateDiceDisplay(value) {
    if (diceContainer) {
        if (diceContainer.showValue) {
            diceContainer.showValue(value);
        } else if (diceContainer.valueText) {
            diceContainer.valueText.setText(value.toString());
        }
    }
}

// ============================================================================
// CHARACTER SELECTION
// ============================================================================

/**
 * Start the character selection process
 */
function startCharacterSelection() {
    console.log('[Game] Starting character selection...');

    // Switch to character select music
    if (audioManager) {
        audioManager.playMusic('music_character_select');
    }

    // Reset camera for title screen
    const camera = this.cameras.main;
    camera.scrollX = 0;
    camera.scrollY = 0;
    camera.setZoom(1);

    // Get screen dimensions for dynamic positioning
    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Use title screen as background if available - cover screen maintaining aspect ratio
    if (this.textures.exists('bg_title')) {
        const texture = this.textures.get('bg_title');
        const frame = texture.getSourceImage();
        const titleBg = this.add.image(centerX, centerY, 'bg_title');

        // Scale to cover the screen (like CSS background-size: cover)
        const scaleX = width / frame.width;
        const scaleY = height / frame.height;
        const scale = Math.max(scaleX, scaleY); // Use larger scale to cover entire screen
        titleBg.setScale(scale);

        titleBg.setDepth(99);
        titleBg.setName('titleBackground');
        titleBg.setScrollFactor(0); // Fixed to screen
    }

    // Create semi-transparent overlay for readability - fill entire screen
    const selectBg = this.add.graphics();
    selectBg.fillStyle(0x000000, 0.5);
    selectBg.fillRect(0, 0, width, height);
    selectBg.setDepth(100);
    selectBg.setName('selectOverlay');
    selectBg.setScrollFactor(0); // Fixed to screen

    const selectTitle = this.add.text(centerX, 50, 'SELECT YOUR CHARACTERS', {
        fontSize: '32px',
        fontFamily: 'Georgia, serif',
        color: '#c9a227',
        stroke: '#000000',
        strokeThickness: 4
    }).setOrigin(0.5).setDepth(101).setName('selectTitle').setScrollFactor(0);

    // Create polished player count panel - centered on screen
    const panelW = 400;
    const panelH = 280;
    const panelX = centerX;
    const panelY = centerY;

    // Outer glow effect
    const glow = this.add.graphics();
    glow.fillStyle(0xc9a227, 0.15);
    glow.fillRoundedRect(panelX - panelW/2 - 15, panelY - panelH/2 - 15, panelW + 30, panelH + 30, 24);
    glow.fillStyle(0xc9a227, 0.08);
    glow.fillRoundedRect(panelX - panelW/2 - 25, panelY - panelH/2 - 25, panelW + 50, panelH + 50, 32);
    glow.setDepth(101);
    glow.setScrollFactor(0);
    glow.setName('playerCountGlow');

    // Panel background
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x0d0d1a, 1);
    panelBg.fillRoundedRect(panelX - panelW/2, panelY - panelH/2, panelW, panelH, 16);
    panelBg.fillStyle(0x1a1a2e, 0.5);
    panelBg.fillRoundedRect(panelX - panelW/2 + 4, panelY - panelH/2 + 4, panelW - 8, panelH/3, 14);
    panelBg.lineStyle(3, 0xc9a227, 1);
    panelBg.strokeRoundedRect(panelX - panelW/2, panelY - panelH/2, panelW, panelH, 16);
    panelBg.lineStyle(1, 0xc9a227, 0.3);
    panelBg.strokeRoundedRect(panelX - panelW/2 + 6, panelY - panelH/2 + 6, panelW - 12, panelH - 12, 12);
    panelBg.setDepth(102);
    panelBg.setScrollFactor(0);
    panelBg.setName('playerCountPanel');

    // Panel title
    const panelTitle = this.add.text(panelX, panelY - panelH/2 + 50, 'HOW MANY PLAYERS?', {
        fontSize: '24px',
        fontFamily: 'Georgia, serif',
        color: '#c9a227',
        stroke: '#000000',
        strokeThickness: 3
    }).setOrigin(0.5).setDepth(103).setScrollFactor(0).setName('playerCountText');

    // Create polished buttons
    const scene = this;
    const buttonY = panelY + 30;
    const buttonSpacing = 110;
    const startX = panelX - buttonSpacing;

    for (let i = 2; i <= 4; i++) {
        const btnX = startX + ((i - 2) * buttonSpacing);
        const btnW = 90;
        const btnH = 80;

        // Button background graphics
        const btnBg = this.add.graphics();
        btnBg.fillStyle(0x0a0a12, 1);
        btnBg.fillRoundedRect(btnX - btnW/2, buttonY - btnH/2, btnW, btnH, 12);
        btnBg.fillStyle(0xc9a227, 0.15);
        btnBg.fillRoundedRect(btnX - btnW/2 + 2, buttonY - btnH/2 + 2, btnW - 4, btnH - 4, 10);
        btnBg.lineStyle(2, 0xc9a227, 1);
        btnBg.strokeRoundedRect(btnX - btnW/2, buttonY - btnH/2, btnW, btnH, 12);
        btnBg.setDepth(103);
        btnBg.setScrollFactor(0);
        btnBg.setName(`playerCountBtnBg${i}`);

        // Large number
        const numText = this.add.text(btnX, buttonY - 10, `${i}`, {
            fontSize: '36px',
            fontFamily: 'Georgia, serif',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(104).setScrollFactor(0).setName(`playerCountNum${i}`);

        // "Players" label
        const labelText = this.add.text(btnX, buttonY + 25, 'Players', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#aaaaaa'
        }).setOrigin(0.5).setDepth(104).setScrollFactor(0).setName(`playerCountLabel${i}`);

        // Hit area for interaction
        const hitArea = this.add.rectangle(btnX, buttonY, btnW, btnH, 0x000000, 0);
        hitArea.setDepth(105);
        hitArea.setScrollFactor(0);
        hitArea.setInteractive({ useHandCursor: true });
        hitArea.setName(`playerCountBtn${i}`);

        // Hover effects
        hitArea.on('pointerover', () => {
            btnBg.clear();
            btnBg.fillStyle(0x1a1a24, 1);
            btnBg.fillRoundedRect(btnX - btnW/2, buttonY - btnH/2, btnW, btnH, 12);
            btnBg.fillStyle(0xc9a227, 0.35);
            btnBg.fillRoundedRect(btnX - btnW/2 + 2, buttonY - btnH/2 + 2, btnW - 4, btnH - 4, 10);
            btnBg.lineStyle(3, 0xc9a227, 1);
            btnBg.strokeRoundedRect(btnX - btnW/2, buttonY - btnH/2, btnW, btnH, 12);
            numText.setScale(1.1);
        });

        hitArea.on('pointerout', () => {
            btnBg.clear();
            btnBg.fillStyle(0x0a0a12, 1);
            btnBg.fillRoundedRect(btnX - btnW/2, buttonY - btnH/2, btnW, btnH, 12);
            btnBg.fillStyle(0xc9a227, 0.15);
            btnBg.fillRoundedRect(btnX - btnW/2 + 2, buttonY - btnH/2 + 2, btnW - 4, btnH - 4, 10);
            btnBg.lineStyle(2, 0xc9a227, 1);
            btnBg.strokeRoundedRect(btnX - btnW/2, buttonY - btnH/2, btnW, btnH, 12);
            numText.setScale(1);
        });

        hitArea.on('pointerdown', () => {
            // Play button click sound
            if (audioManager) {
                audioManager.playSFX('sfx_button_click');
            }
            numberOfPlayers = i;
            // Remove player count UI elements
            scene.children.getByName('playerCountGlow')?.destroy();
            scene.children.getByName('playerCountPanel')?.destroy();
            scene.children.getByName('playerCountText')?.destroy();
            for (let j = 2; j <= 4; j++) {
                scene.children.getByName(`playerCountBtnBg${j}`)?.destroy();
                scene.children.getByName(`playerCountNum${j}`)?.destroy();
                scene.children.getByName(`playerCountLabel${j}`)?.destroy();
                scene.children.getByName(`playerCountBtn${j}`)?.destroy();
            }
            // Start selecting characters
            selectCharacterForPlayer.call(scene, 1);
        });
    }
}

/**
 * Show character selection for a specific player
 */
function selectCharacterForPlayer(playerNumber) {
    const scene = this;

    // Update title
    const titleText = scene.children.getByName('selectTitle');
    if (titleText) {
        titleText.setText(`PLAYER ${playerNumber}: Choose Your Character`);
    }

    // Get already selected character IDs
    const excludeIds = playerCharacterSelections.map(sel => sel.id);

    // Show character selection UI
    gameUI.showCharacterSelect(playerNumber, excludeIds, (selectedCharacter) => {
        console.log(`[Game] Player ${playerNumber} selected: ${selectedCharacter.name}`);

        // Play character select sound
        if (audioManager) {
            audioManager.playSFX('sfx_character_select');
        }

        playerCharacterSelections.push(selectedCharacter);

        // Check if all players have selected
        if (playerNumber < numberOfPlayers) {
            // Select next player's character
            selectCharacterForPlayer.call(scene, playerNumber + 1);
        } else {
            // All characters selected, start the game
            finishCharacterSelection.call(scene);
        }
    });
}

/**
 * Finish character selection and start the game
 */
function finishCharacterSelection() {
    console.log('[Game] Character selection complete, starting game...');

    // Switch to gameplay music
    if (audioManager) {
        audioManager.playMusic('music_gameplay');
    }

    // Remove title screen and selection overlay
    const titleBg = this.children.getByName('titleBackground');
    if (titleBg) titleBg.destroy();
    const overlay = this.children.getByName('selectOverlay');
    if (overlay) overlay.destroy();
    const title = this.children.getByName('selectTitle');
    if (title) title.destroy();

    // Create players with selected characters
    for (let i = 0; i < numberOfPlayers; i++) {
        const characterData = playerCharacterSelections[i];
        const player = new Player(this, i + 1, board, gfx, characterData);
        players.push(player);
    }

    // Set first player as active
    players[currentPlayerIndex].setActive(true);

    // Create UI elements
    createUI.call(this);

    // Setup input handlers
    setupInput.call(this);

    // Set initial game state
    gameState = 'waiting';

    // Update camera bounds based on actual board size and focus on start
    updateCameraBounds();

    // Pan to show the first player at the start
    setTimeout(() => {
        panToPlayer(players[currentPlayerIndex], 500);
    }, 100);

    console.log('[Game] Game initialized with', numberOfPlayers, 'players');
    console.log('[Game] Click anywhere or press SPACE to roll the dice!');
    console.log('[Game] Press F to follow current player, Home to reset view');
}

// ============================================================================
// UI FUNCTIONS
// ============================================================================

/**
 * Helper to make a game object fixed on screen (doesn't scroll with camera)
 */
function makeFixed(obj) {
    if (obj && obj.setScrollFactor) {
        obj.setScrollFactor(0);
    }
    return obj;
}

/**
 * Create all UI text elements
 * Uses dynamic positioning based on screen size
 * Panel is docked to the right edge of the viewport
 */
function createUI() {
    const scene = this;

    // Clear any existing UI elements
    if (uiElements.allGraphics) {
        uiElements.allGraphics.forEach(g => g.destroy());
    }
    if (uiElements.allTexts) {
        uiElements.allTexts.forEach(t => t.destroy());
    }
    uiElements = { allGraphics: [], allTexts: [] };

    buildUIElements.call(this);

    // Setup resize handler
    this.scale.on('resize', (gameSize) => {
        rebuildUI.call(scene, gameSize.width, gameSize.height);
    });
}

/**
 * Rebuild UI on resize - destroys and recreates all elements
 */
function rebuildUI(newWidth, newHeight) {
    const scene = this;

    // Destroy existing UI elements
    if (uiElements.allGraphics) {
        uiElements.allGraphics.forEach(g => {
            if (g && g.destroy) g.destroy();
        });
    }
    if (uiElements.allTexts) {
        uiElements.allTexts.forEach(t => {
            if (t && t.destroy) t.destroy();
        });
    }

    // Clear player status tracking (will be recreated)
    playerStatusTexts = [];
    playerInventoryContainers = [];

    // Destroy dice container (will be recreated)
    if (diceContainer && diceContainer.destroy) {
        diceContainer.destroy();
    }

    uiElements = { allGraphics: [], allTexts: [] };

    // Rebuild all UI
    buildUIElements.call(scene);
}

/**
 * Build all UI elements - called on init and resize
 */
function buildUIElements() {
    const scene = this;
    const width = this.scale.width;
    const height = this.scale.height;

    // UI panel dimensions - fixed width, docked to right edge
    const panelWidth = 300;
    const panelMargin = 10;
    const panelX = width - panelWidth - panelMargin;
    const panelCenterX = panelX + panelWidth / 2;

    // Helper to track graphics
    const addGraphics = () => {
        const g = this.add.graphics();
        uiElements.allGraphics.push(g);
        return g;
    };

    // Helper to track text
    const addText = (x, y, text, style) => {
        const t = this.add.text(x, y, text, style);
        uiElements.allTexts.push(t);
        return t;
    };

    // Dark background strip on right side (covers area behind panel)
    const bgStrip = addGraphics();
    bgStrip.fillStyle(0x050508, 1);
    bgStrip.fillRect(panelX - 15, 0, panelWidth + 30, height);
    bgStrip.setDepth(39);
    makeFixed(bgStrip);

    // Outer glow for panel
    const panelGlow = addGraphics();
    panelGlow.fillStyle(0xc9a227, 0.08);
    panelGlow.fillRoundedRect(panelX - 8, 12, panelWidth + 16, height - 24, 18);
    panelGlow.fillStyle(0xc9a227, 0.04);
    panelGlow.fillRoundedRect(panelX - 12, 8, panelWidth + 24, height - 16, 22);
    panelGlow.setDepth(39);
    makeFixed(panelGlow);

    // UI Panel background with gradient effect
    const panelG = addGraphics();
    // Main dark background
    panelG.fillStyle(0x0d0d1a, 1);
    panelG.fillRoundedRect(panelX, 20, panelWidth, height - 40, 14);
    // Subtle top gradient
    panelG.fillStyle(0x1a1a2e, 0.6);
    panelG.fillRoundedRect(panelX + 3, 23, panelWidth - 6, 100, 12);
    // Border
    panelG.lineStyle(2, 0xc9a227, 1);
    panelG.strokeRoundedRect(panelX, 20, panelWidth, height - 40, 14);
    // Inner highlight
    panelG.lineStyle(1, 0xc9a227, 0.2);
    panelG.strokeRoundedRect(panelX + 4, 24, panelWidth - 8, height - 48, 10);
    panelG.setDepth(40);
    panelG.setName('uiPanel');
    makeFixed(panelG);

    // Title text - centered above game board
    const gameAreaCenterX = (width - panelWidth - panelMargin * 2) / 2;
    const titleText = addText(gameAreaCenterX, 25, 'DRAGON RUN: THE ROYAL RACE', {
        fontSize: '28px',
        fontFamily: 'Georgia, serif',
        color: '#c9a227',
        stroke: '#000000',
        strokeThickness: 4,
        shadow: {
            offsetX: 2,
            offsetY: 2,
            color: '#000000',
            blur: 4,
            fill: true
        }
    });
    titleText.setOrigin(0.5).setDepth(50);
    makeFixed(titleText);

    // Player status panel header with decorative line
    const playersHeaderY = 55;
    const headerLineG = addGraphics();
    headerLineG.lineStyle(1, 0xc9a227, 0.4);
    headerLineG.beginPath();
    headerLineG.moveTo(panelX + 30, playersHeaderY + 15);
    headerLineG.lineTo(panelX + 80, playersHeaderY + 15);
    headerLineG.moveTo(panelX + panelWidth - 80, playersHeaderY + 15);
    headerLineG.lineTo(panelX + panelWidth - 30, playersHeaderY + 15);
    headerLineG.strokePath();
    headerLineG.setDepth(50);
    makeFixed(headerLineG);

    const playersHeader = addText(panelCenterX, playersHeaderY, 'PLAYERS', {
        fontSize: '16px',
        fontFamily: 'Georgia, serif',
        color: '#c9a227',
        letterSpacing: 3
    });
    playersHeader.setOrigin(0.5).setDepth(50);
    makeFixed(playersHeader);

    // Player status entries - larger cards with visible portrait illustrations
    const playerStartY = 85;
    const cardSpacing = 105; // More space for larger portraits
    players.forEach((player, index) => {
        const cardY = playerStartY + (index * cardSpacing);
        const cardW = panelWidth - 24;
        const cardH = 95; // Taller card for portrait
        const cardX = panelX + 12;

        // Outer glow effect
        const glowG = addGraphics();
        glowG.fillStyle(player.color, 0.1);
        glowG.fillRoundedRect(cardX - 3, cardY - 3, cardW + 6, cardH + 6, 10);
        glowG.setDepth(44);
        makeFixed(glowG);

        // Player card background
        const cardG = addGraphics();
        cardG.fillStyle(0x0d0d1a, 1);
        cardG.fillRoundedRect(cardX, cardY, cardW, cardH, 8);
        cardG.fillStyle(0x1a1a2e, 0.5);
        cardG.fillRoundedRect(cardX + 2, cardY + 2, cardW - 4, 30, 6);
        cardG.lineStyle(2, player.color, 0.8);
        cardG.strokeRoundedRect(cardX, cardY, cardW, cardH, 8);
        cardG.setDepth(45);
        makeFixed(cardG);

        // Character portrait - tall portrait showing character art
        const portraitW = 55;
        const portraitH = 82;
        const portraitX = cardX + 8 + portraitW / 2;
        const portraitY = cardY + cardH / 2;

        // Portrait background glow
        const portraitBg = addGraphics();
        portraitBg.fillStyle(player.color, 0.25);
        portraitBg.fillRoundedRect(portraitX - portraitW/2 - 3, portraitY - portraitH/2 - 3, portraitW + 6, portraitH + 6, 5);
        portraitBg.setDepth(46);
        makeFixed(portraitBg);

        // Character portrait image
        const cardKey = player.characterData?.cardKey || `card_${player.characterData?.id}`;
        if (cardKey && scene.textures.exists(cardKey)) {
            const portrait = scene.add.image(portraitX, portraitY, cardKey);
            portrait.setDisplaySize(portraitW, portraitH);
            portrait.setDepth(47);
            portrait.setScrollFactor(0);
            uiElements.allGraphics.push(portrait);

            // Border
            const portraitBorder = addGraphics();
            portraitBorder.lineStyle(2, player.color, 0.9);
            portraitBorder.strokeRoundedRect(portraitX - portraitW/2, portraitY - portraitH/2, portraitW, portraitH, 4);
            portraitBorder.setDepth(48);
            makeFixed(portraitBorder);
        } else {
            // Fallback: colored rectangle with initial
            const fallbackG = addGraphics();
            fallbackG.fillStyle(player.color, 0.6);
            fallbackG.fillRoundedRect(portraitX - portraitW/2, portraitY - portraitH/2, portraitW, portraitH, 4);
            fallbackG.setDepth(47);
            makeFixed(fallbackG);

            const initial = addText(portraitX, portraitY, player.name[0], {
                fontSize: '24px',
                fontFamily: 'Georgia, serif',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            });
            initial.setOrigin(0.5).setDepth(48);
            makeFixed(initial);
        }

        // Player name - to the right of portrait
        const textX = cardX + 8 + portraitW + 12;
        const nameText = addText(textX, cardY + 16, player.name, {
            fontSize: '14px',
            fontFamily: 'Georgia, serif',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        nameText.setOrigin(0, 0.5).setDepth(50);
        makeFixed(nameText);

        // Character title
        if (player.characterData) {
            const charTitle = addText(textX, cardY + 32, player.characterData.title, {
                fontSize: '10px',
                fontFamily: 'Arial',
                color: '#999999'
            });
            charTitle.setOrigin(0, 0.5).setDepth(50);
            makeFixed(charTitle);
        }

        // Tile position badge - right side, centered vertically
        const badgeX = panelX + panelWidth - 35;
        const badgeG = addGraphics();
        badgeG.fillStyle(0x0a0a12, 1);
        badgeG.fillRoundedRect(badgeX - 18, cardY + 8, 36, 24, 6);
        badgeG.lineStyle(1, 0xc9a227, 0.5);
        badgeG.strokeRoundedRect(badgeX - 18, cardY + 8, 36, 24, 6);
        badgeG.setDepth(49);
        makeFixed(badgeG);

        const statusText = addText(badgeX, cardY + 20, `${player.currentTile}`, {
            fontSize: '13px',
            fontFamily: 'Georgia, serif',
            color: '#c9a227',
            stroke: '#000000',
            strokeThickness: 1
        });
        statusText.setOrigin(0.5, 0.5).setDepth(50);
        makeFixed(statusText);
        playerStatusTexts.push(statusText);

        // Inventory slots - below name/title, to right of portrait
        const invContainer = gameUI.createInventoryUI(textX, cardY + 52, player.inventory, (item, itemIndex) => {
            handleItemClick(player, item, index);
        });
        invContainer.setDepth(50);
        makeFixed(invContainer);
        playerInventoryContainers.push(invContainer);
        uiElements.allGraphics.push(invContainer);
    });

    // Divider with decorative elements
    const dividerY = playerStartY + (players.length * cardSpacing) + 18;
    const dividerG = addGraphics();
    dividerG.lineStyle(1, 0xc9a227, 0.4);
    dividerG.beginPath();
    dividerG.moveTo(panelX + 30, dividerY);
    dividerG.lineTo(panelCenterX - 25, dividerY);
    dividerG.moveTo(panelCenterX + 25, dividerY);
    dividerG.lineTo(panelX + panelWidth - 30, dividerY);
    dividerG.strokePath();
    // Center diamond with glow
    dividerG.fillStyle(0xc9a227, 0.2);
    dividerG.fillRect(panelCenterX - 8, dividerY - 8, 16, 16);
    dividerG.fillStyle(0xc9a227, 0.8);
    dividerG.fillRect(panelCenterX - 4, dividerY - 4, 8, 8);
    dividerG.setDepth(50);
    makeFixed(dividerG);

    // Current turn section with polished styling (matching encounter modal)
    const turnSectionY = dividerY + 22;
    const turnBoxW = panelWidth - 36;
    const turnBoxH = 72;
    const turnBoxX = panelX + 18;

    // Outer glow for turn box
    const turnGlowG = addGraphics();
    turnGlowG.fillStyle(0xc9a227, 0.06);
    turnGlowG.fillRoundedRect(turnBoxX - 4, turnSectionY - 4, turnBoxW + 8, turnBoxH + 8, 14);
    turnGlowG.setDepth(44);
    makeFixed(turnGlowG);

    // Turn box background with gradient (like encounter modal)
    const turnBoxG = addGraphics();
    turnBoxG.fillStyle(0x0d0d1a, 1);
    turnBoxG.fillRoundedRect(turnBoxX, turnSectionY, turnBoxW, turnBoxH, 10);
    // Subtle inner gradient
    turnBoxG.fillStyle(0x1a1a2e, 0.5);
    turnBoxG.fillRoundedRect(turnBoxX + 2, turnSectionY + 2, turnBoxW - 4, turnBoxH * 0.4, 8);
    // Border
    turnBoxG.lineStyle(2, 0xc9a227, 0.8);
    turnBoxG.strokeRoundedRect(turnBoxX, turnSectionY, turnBoxW, turnBoxH, 10);
    // Inner highlight line
    turnBoxG.lineStyle(1, 0xc9a227, 0.2);
    turnBoxG.strokeRoundedRect(turnBoxX + 3, turnSectionY + 3, turnBoxW - 6, turnBoxH - 6, 8);
    turnBoxG.setDepth(45);
    makeFixed(turnBoxG);

    const turnLabel = addText(panelCenterX, turnSectionY + 16, 'CURRENT TURN', {
        fontSize: '10px',
        fontFamily: 'Arial',
        color: '#888888',
        letterSpacing: 2
    });
    turnLabel.setOrigin(0.5).setDepth(50);
    makeFixed(turnLabel);

    turnText = addText(panelCenterX, turnSectionY + 46, players[currentPlayerIndex].name, {
        fontSize: '20px',
        fontFamily: 'Georgia, serif',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
    });
    turnText.setOrigin(0.5).setDepth(50);
    makeFixed(turnText);

    // Dice section with polished styling (matching encounter modal)
    const diceY = turnSectionY + 97;
    const diceBoxW = panelWidth - 30;
    const diceBoxH = 150;
    const diceBoxX = panelX + 15;

    // Outer glow for dice box
    const diceGlowG = addGraphics();
    diceGlowG.fillStyle(0xc9a227, 0.06);
    diceGlowG.fillRoundedRect(diceBoxX - 4, diceY - 4, diceBoxW + 8, diceBoxH + 8, 16);
    diceGlowG.setDepth(44);
    makeFixed(diceGlowG);

    // Dice area background with gradient
    const diceBoxG = addGraphics();
    diceBoxG.fillStyle(0x0d0d1a, 1);
    diceBoxG.fillRoundedRect(diceBoxX, diceY, diceBoxW, diceBoxH, 12);
    // Subtle inner gradient
    diceBoxG.fillStyle(0x1a1a2e, 0.5);
    diceBoxG.fillRoundedRect(diceBoxX + 2, diceY + 2, diceBoxW - 4, diceBoxH * 0.35, 10);
    // Border
    diceBoxG.lineStyle(2, 0xc9a227, 0.8);
    diceBoxG.strokeRoundedRect(diceBoxX, diceY, diceBoxW, diceBoxH, 12);
    // Inner highlight line
    diceBoxG.lineStyle(1, 0xc9a227, 0.2);
    diceBoxG.strokeRoundedRect(diceBoxX + 4, diceY + 4, diceBoxW - 8, diceBoxH - 8, 10);
    diceBoxG.setDepth(45);
    makeFixed(diceBoxG);

    const diceLabel = addText(panelCenterX, diceY + 18, 'DICE', {
        fontSize: '11px',
        fontFamily: 'Arial',
        color: '#888888',
        letterSpacing: 3
    });
    diceLabel.setOrigin(0.5).setDepth(50);
    makeFixed(diceLabel);

    // Create stylized dice - larger and more prominent
    diceContainer = gfx.createDice(panelCenterX, diceY + 70);
    diceContainer.setScale(1.3);
    makeFixed(diceContainer);
    uiElements.allGraphics.push(diceContainer);

    // Store dice box bounds for click detection
    diceBoxBounds = {
        x: diceBoxX,
        y: diceY,
        width: diceBoxW,
        height: diceBoxH
    };

    // Hidden text for value tracking
    diceText = addText(panelCenterX, diceY + 70, '?', {
        fontSize: '0px',
        fontFamily: 'Georgia, serif',
        color: '#ffd700'
    });
    diceText.setOrigin(0.5).setDepth(50);
    makeFixed(diceText);

    // Instructions with better styling
    instructionText = addText(panelCenterX, diceY + 128, 'Click dice or SPACE to roll', {
        fontSize: '12px',
        fontFamily: 'Arial',
        color: '#888888',
        align: 'center'
    });
    instructionText.setOrigin(0.5).setDepth(50);
    makeFixed(instructionText);

    // Ability button - shown when current player has an activatable ability
    createAbilityButton(this, panelCenterX, diceY + 155, panelWidth - 60);

    // Legend button (replaces inline legend to save space)
    const legendBtnY = height - 95;
    const legendBtnW = panelWidth - 40;
    const legendBtnH = 32;
    const legendBtnX = panelX + 20;

    // Legend button background
    const legendBtnBg = addGraphics();
    legendBtnBg.fillStyle(0x0d0d1a, 1);
    legendBtnBg.fillRoundedRect(legendBtnX, legendBtnY, legendBtnW, legendBtnH, 8);
    legendBtnBg.lineStyle(2, 0xc9a227, 0.5);
    legendBtnBg.strokeRoundedRect(legendBtnX, legendBtnY, legendBtnW, legendBtnH, 8);
    legendBtnBg.setDepth(45);
    makeFixed(legendBtnBg);

    // Legend button text
    const legendBtnText = addText(panelCenterX, legendBtnY + legendBtnH/2, '? LEGEND', {
        fontSize: '12px',
        fontFamily: 'Arial',
        color: '#c9a227',
        letterSpacing: 2
    });
    legendBtnText.setOrigin(0.5).setDepth(50);
    makeFixed(legendBtnText);

    // Legend button hit area
    const legendBtnHit = this.add.rectangle(panelCenterX, legendBtnY + legendBtnH/2, legendBtnW, legendBtnH, 0x000000, 0);
    legendBtnHit.setDepth(51);
    legendBtnHit.setScrollFactor(0);
    legendBtnHit.setInteractive({ useHandCursor: true });

    legendBtnHit.on('pointerover', () => {
        legendBtnBg.clear();
        legendBtnBg.fillStyle(0x1a1a2e, 1);
        legendBtnBg.fillRoundedRect(legendBtnX, legendBtnY, legendBtnW, legendBtnH, 8);
        legendBtnBg.lineStyle(2, 0xc9a227, 0.8);
        legendBtnBg.strokeRoundedRect(legendBtnX, legendBtnY, legendBtnW, legendBtnH, 8);
        legendBtnText.setColor('#ffd700');
    });

    legendBtnHit.on('pointerout', () => {
        legendBtnBg.clear();
        legendBtnBg.fillStyle(0x0d0d1a, 1);
        legendBtnBg.fillRoundedRect(legendBtnX, legendBtnY, legendBtnW, legendBtnH, 8);
        legendBtnBg.lineStyle(2, 0xc9a227, 0.5);
        legendBtnBg.strokeRoundedRect(legendBtnX, legendBtnY, legendBtnW, legendBtnH, 8);
        legendBtnText.setColor('#c9a227');
    });

    legendBtnHit.on('pointerdown', () => {
        showLegendPopup();
    });

    uiElements.allGraphics.push(legendBtnHit);

    // Controls at bottom - styled text
    const controlsText1 = addText(panelCenterX, height - 55, 'SPACE Roll | H Help | M Mute', {
        fontSize: '9px',
        fontFamily: 'Arial',
        color: '#666666'
    });
    controlsText1.setOrigin(0.5).setDepth(50);
    makeFixed(controlsText1);

    const controlsText2 = addText(panelCenterX, height - 43, 'Click dice to roll | Click items to use', {
        fontSize: '8px',
        fontFamily: 'Arial',
        color: '#555555'
    });
    controlsText2.setOrigin(0.5).setDepth(50);
    makeFixed(controlsText2);
}

/**
 * Update player status display
 */
function updatePlayerStatus() {
    players.forEach((player, index) => {
        if (playerStatusTexts[index]) {
            // Just show tile number - status effects shown via color/icon
            playerStatusTexts[index].setText(player.currentTile.toString());

            // Change color based on status
            if (player.statusEffects.stunned) {
                playerStatusTexts[index].setColor('#ff6666');
            } else if (player.statusEffects.slowed) {
                playerStatusTexts[index].setColor('#ffaa44');
            } else if (player.statusEffects.reversed) {
                playerStatusTexts[index].setColor('#aa66ff');
            } else {
                playerStatusTexts[index].setColor('#c9a227');
            }
        }
        // Update inventory display
        if (playerInventoryContainers[index]) {
            gameUI.updateInventoryUI(playerInventoryContainers[index]);
        }
    });

    // Update ability button visibility
    updateAbilityButton();
}

/**
 * Create ability button for activatable character abilities
 */
function createAbilityButton(scene, x, y, width) {
    // Container for ability button elements
    abilityButton = {
        scene: scene,
        x: x,
        y: y,
        width: width,
        height: 28,
        visible: false,
        activated: false,
        elements: []
    };

    // Background
    const bg = scene.add.graphics();
    bg.setDepth(50);
    bg.setScrollFactor(0);
    bg.setVisible(false);
    abilityButton.bg = bg;
    abilityButton.elements.push(bg);

    // Text label
    const text = scene.add.text(x, y, '', {
        fontSize: '11px',
        fontFamily: 'Arial',
        color: '#66bbff',
        fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(51).setScrollFactor(0).setVisible(false);
    abilityButton.text = text;
    abilityButton.elements.push(text);

    // Hit area for interaction
    const hitArea = scene.add.rectangle(x, y, width, 28, 0x000000, 0);
    hitArea.setDepth(52);
    hitArea.setScrollFactor(0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.setVisible(false);
    abilityButton.hitArea = hitArea;
    abilityButton.elements.push(hitArea);

    // Hover effects
    hitArea.on('pointerover', () => {
        if (!abilityButton.visible) return;
        drawAbilityButtonBg(true);
    });

    hitArea.on('pointerout', () => {
        if (!abilityButton.visible) return;
        drawAbilityButtonBg(false);
    });

    // Click to toggle activation
    hitArea.on('pointerdown', () => {
        if (!abilityButton.visible) return;
        toggleAbilityActivation();
    });
}

/**
 * Draw ability button background
 */
function drawAbilityButtonBg(hovered = false) {
    if (!abilityButton || !abilityButton.bg) return;

    const bg = abilityButton.bg;
    const x = abilityButton.x;
    const y = abilityButton.y;
    const w = abilityButton.width;
    const h = abilityButton.height;

    bg.clear();

    if (abilityButton.activated) {
        // Active state - glowing green
        bg.fillStyle(0x00aa44, 0.3);
        bg.fillRoundedRect(x - w/2, y - h/2, w, h, 6);
        bg.lineStyle(2, 0x00ff66, 1);
        bg.strokeRoundedRect(x - w/2, y - h/2, w, h, 6);
    } else if (hovered) {
        // Hover state
        bg.fillStyle(0x1a1a2e, 1);
        bg.fillRoundedRect(x - w/2, y - h/2, w, h, 6);
        bg.lineStyle(2, 0x66bbff, 0.8);
        bg.strokeRoundedRect(x - w/2, y - h/2, w, h, 6);
    } else {
        // Normal state
        bg.fillStyle(0x0d0d1a, 1);
        bg.fillRoundedRect(x - w/2, y - h/2, w, h, 6);
        bg.lineStyle(1, 0x66bbff, 0.5);
        bg.strokeRoundedRect(x - w/2, y - h/2, w, h, 6);
    }
}

/**
 * Toggle ability activation
 */
function toggleAbilityActivation() {
    if (!abilityButton) return;

    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer) return;

    abilityActivated = !abilityActivated;
    abilityButton.activated = abilityActivated;

    // Update visual
    drawAbilityButtonBg(false);

    if (abilityActivated) {
        abilityButton.text.setText(`⚡ ${getAbilityName(currentPlayer)} [ON]`);
        abilityButton.text.setColor('#00ff66');
        gameUI.showToast(`${getAbilityName(currentPlayer)} activated! Roll to use.`, 'success');
    } else {
        abilityButton.text.setText(`⚡ ${getAbilityName(currentPlayer)}`);
        abilityButton.text.setColor('#66bbff');
    }
}

/**
 * Get the name of a player's activatable ability
 */
function getAbilityName(player) {
    if (!player || !player.characterData || !player.characterData.passive) return '';
    return player.characterData.passive.name;
}

/**
 * Check if a player has an activatable ability that's available
 */
function hasActivatableAbility(player) {
    if (!player || !player.characterData) return false;

    // Elara's Arcane Insight - can be activated before roll (one time)
    if (player.characterData.id === 'elara' && !player.arcaneInsightUsed) {
        return true;
    }

    // Note: Kaelen's Parkour is roll-dependent (triggers on 6) so it stays automatic
    // Other passives are automatic (Reginald, Aurelia, Grizelda, Pippin)

    return false;
}

/**
 * Update ability button visibility based on current player
 */
function updateAbilityButton() {
    if (!abilityButton) return;

    const currentPlayer = players[currentPlayerIndex];
    const hasAbility = hasActivatableAbility(currentPlayer);
    const canActivate = gameState === 'waiting'; // Only show during waiting phase

    abilityButton.visible = hasAbility && canActivate;

    // Show/hide all elements
    abilityButton.elements.forEach(el => {
        if (el.setVisible) el.setVisible(abilityButton.visible);
    });

    if (abilityButton.visible) {
        // Update text
        const abilityName = getAbilityName(currentPlayer);
        if (abilityActivated) {
            abilityButton.text.setText(`⚡ ${abilityName} [ON]`);
            abilityButton.text.setColor('#00ff66');
        } else {
            abilityButton.text.setText(`⚡ ${abilityName}`);
            abilityButton.text.setColor('#66bbff');
        }
        drawAbilityButtonBg(false);
    }
}

/**
 * Reset ability activation state for new turn
 */
function resetAbilityState() {
    abilityActivated = false;
    if (abilityButton) {
        abilityButton.activated = false;
    }
    updateAbilityButton();
}

// ============================================================================
// INPUT HANDLING
// ============================================================================

/**
 * Setup keyboard and mouse input handlers
 */
function setupInput() {
    // Spacebar to roll dice
    this.input.keyboard.on('keydown-SPACE', handleRollDice, this);

    // Click in dice box area only to roll dice (not anywhere on screen)
    this.input.on('pointerdown', handleDiceBoxClick, this);

    // R to reset game
    this.input.keyboard.on('keydown-R', resetGame, this);

    // I for inventory (show current player's items)
    this.input.keyboard.on('keydown-I', showInventory, this);

    // M to mute/unmute audio
    this.input.keyboard.on('keydown-M', toggleMute, this);

    // D for debug: move to next tile (debug movement)
    this.input.keyboard.on('keydown-D', debugMove, this);

    // H for help guide
    this.input.keyboard.on('keydown-H', showHelpGuide, this);
}

/**
 * Handle click on dice box area only
 */
function handleDiceBoxClick(pointer) {
    // Only respond to left clicks
    if (!pointer.leftButtonDown()) return;

    // Check if click is within dice box bounds
    if (diceBoxBounds) {
        const x = pointer.x;
        const y = pointer.y;

        if (x >= diceBoxBounds.x && x <= diceBoxBounds.x + diceBoxBounds.width &&
            y >= diceBoxBounds.y && y <= diceBoxBounds.y + diceBoxBounds.height) {
            handleRollDice();
        }
    }
}

/**
 * Toggle mute state for audio
 */
function toggleMute() {
    if (audioManager) {
        const muted = audioManager.toggleMute();
        gameUI.showToast(muted ? 'Audio muted' : 'Audio unmuted', 'info');
    }
}

// ============================================================================
// DICE FUNCTIONS
// ============================================================================

/**
 * Roll a standard D6 (1-6)
 *
 * @returns {number} Random number between 1 and 6
 */
function rollDice() {
    const result = Math.floor(Math.random() * 6) + 1;
    console.log(`[Dice] Rolled: ${result}`);
    return result;
}

/**
 * Handle dice roll action
 */
async function handleRollDice() {
    // Only allow rolling in waiting state
    if (gameState !== 'waiting') {
        console.log('[Game] Cannot roll - game is', gameState);
        return;
    }

    // In multiplayer, check if it's our turn
    if (isMultiplayer && !isMyTurn) {
        console.log('[Game] Cannot roll - not your turn');
        gameUI.showToast("Wait for your turn!", 'warning');
        return;
    }

    // In multiplayer, send roll request to server
    if (isMultiplayer && networkManager && networkManager.isConnected()) {
        gameState = 'rolling';
        instructionText.setText('Rolling...');
        networkManager.rollDice();
        return; // Server will send back the result
    }

    const currentPlayer = players[currentPlayerIndex];

    // Check if player can take their turn (might be stunned)
    if (!currentPlayer.canTakeTurn()) {
        gameUI.showToast(`${currentPlayer.name} is stunned! Skipping turn...`, 'warning');
        await delay(1500);
        nextTurn();
        return;
    }

    gameState = 'rolling';
    instructionText.setText('Rolling...');

    // Play dice shake sound randomly (every 3-4 rolls to avoid repetition)
    diceRollCount++;
    if (audioManager && (diceRollCount === 1 || diceRollCount >= 3 + Math.floor(Math.random() * 2))) {
        audioManager.playSFX('sfx_dice_shake');
        diceRollCount = 0; // Reset counter after playing
    }

    // Animate dice with realistic tumbling effect
    const scene = game.scene.scenes[0];

    // Pre-calculate the final value
    const finalValue = Math.floor(Math.random() * 6) + 1;

    // Phase 1: Initial throw - fast rotation and scale bounce
    scene.tweens.add({
        targets: diceContainer,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 100,
        ease: 'Power2.easeOut',
        onComplete: () => {
            // Bounce back
            scene.tweens.add({
                targets: diceContainer,
                scaleX: 1.3,
                scaleY: 1.3,
                duration: 80,
                ease: 'Power2.easeIn'
            });
        }
    });

    // Phase 2: Tumbling rotation - starts fast, slows down
    scene.tweens.add({
        targets: diceContainer,
        angle: 360, // One full rotation
        duration: 800,
        ease: 'Power3.easeOut'
    });

    // Phase 3: Flash through all 16 sprite frames (4x4 sheet) - starts fast, slows down
    let flashCount = 0;
    const totalFlashes = 12;
    let currentDelay = 40; // Start fast

    const flashNextValue = () => {
        // Cycle through all 16 frames of the sprite sheet during tumbling
        const frameIndex = flashCount % 16;
        if (diceContainer.diceSprite) {
            diceContainer.diceSprite.setFrame(frameIndex);
        } else if (diceContainer.valueText) {
            // Fallback for procedural dice - show random value
            const randomVal = Math.floor(Math.random() * 6) + 1;
            diceContainer.valueText.setText(randomVal.toString());
        }

        flashCount++;

        if (flashCount >= totalFlashes) {
            // Final landing - show actual value with bounce effect
            scene.time.delayedCall(80, () => {
                if (diceContainer.showValue) {
                    diceContainer.showValue(finalValue);
                } else if (diceContainer.valueText) {
                    diceContainer.valueText.setText(finalValue.toString());
                }

                // Final bounce animation
                scene.tweens.add({
                    targets: diceContainer,
                    scaleX: 1.45,
                    scaleY: 1.45,
                    duration: 80,
                    yoyo: true,
                    ease: 'Power2.easeOut',
                    onComplete: () => {
                        diceContainer.angle = 0;
                        diceContainer.setScale(1.3);
                        // Store the value and complete
                        diceValue = finalValue;
                        completeDiceRoll.call(scene);
                    }
                });
            });
        } else {
            // Increase delay progressively for slowdown effect
            currentDelay = 40 + Math.pow(flashCount, 1.8) * 2;
            scene.time.delayedCall(currentDelay, flashNextValue);
        }
    };

    // Start the flash sequence
    scene.time.delayedCall(50, flashNextValue);
}

/**
 * Complete the dice roll and move the player
 * Note: diceValue is already set by the animation sequence
 */
async function completeDiceRoll() {
    // diceValue was set by the roll animation
    const currentPlayer = players[currentPlayerIndex];

    // Check for Elara's Arcane Insight ability - only if player activated it before rolling
    if (abilityActivated && currentPlayer.canUseArcaneInsight()) {
        // Find the player who is behind the current player
        const playerBehind = findPlayerBehind(currentPlayer);
        if (playerBehind) {
            // Simulate what the player behind would roll
            const playerBehindRoll = Math.floor(Math.random() * 6) + 1;

            // Use the ability automatically since they activated it
            currentPlayer.useArcaneInsight();
            gameUI.showToast(`✨ Arcane Insight! Swapped roll ${diceValue} for ${playerBehindRoll}!`, 'success');

            // Update dice display to show swapped value
            if (diceContainer && diceContainer.valueText) {
                diceContainer.valueText.setText(playerBehindRoll.toString());
            }

            await delay(1000);

            // Reset ability state
            resetAbilityState();

            // Current player uses the swapped roll
            await continueAfterArcaneInsight(currentPlayer, playerBehindRoll);
            return;
        } else {
            // No player behind to swap with
            gameUI.showToast('No player behind you to swap with!', 'warning');
        }
    }

    // Reset ability state for next turn
    resetAbilityState();

    // Continue with normal flow
    await continueAfterArcaneInsight(currentPlayer, diceValue);
}

/**
 * Find the player who is behind (lower tile position) the current player
 */
function findPlayerBehind(currentPlayer) {
    let behindPlayer = null;
    let closestDistance = Infinity;

    for (const player of players) {
        if (player === currentPlayer || player.hasWon) continue;

        // Only consider players behind
        if (player.currentTile < currentPlayer.currentTile) {
            const distance = currentPlayer.currentTile - player.currentTile;
            if (distance < closestDistance) {
                closestDistance = distance;
                behindPlayer = player;
            }
        }
    }

    return behindPlayer;
}

/**
 * Continue after Arcane Insight check (or if not applicable)
 */
async function continueAfterArcaneInsight(currentPlayer, rollValue) {
    // Only offer Spell Scroll reroll on bad rolls (1 or 2) - don't interrupt every turn
    const hasSpellScroll = currentPlayer.inventory.hasItem('spell_scroll');
    if (hasSpellScroll && rollValue <= 2) {
        await offerMovementReroll(currentPlayer, rollValue);
        return; // The reroll handler will continue the flow
    }

    // Continue with normal flow
    await processMovementRoll(currentPlayer, rollValue);
}

/**
 * Offer the player a chance to reroll their movement using Spell Scroll
 */
async function offerMovementReroll(player, originalRoll) {
    gameUI.showRerollChoice(originalRoll, 'movement', async (result) => {
        let finalRoll = originalRoll;

        if (result.reroll) {
            // Use the Spell Scroll
            player.inventory.useItem('spell_scroll');
            finalRoll = Math.floor(Math.random() * 6) + 1;
            gameUI.showToast(`Spell Scroll used! New roll: ${finalRoll}`, 'info');

            // Update dice display
            if (diceContainer && diceContainer.valueText) {
                diceContainer.valueText.setText(finalRoll.toString());
            }
            updatePlayerStatus();
            await delay(800);
        }

        // Continue with the roll
        await processMovementRoll(player, finalRoll);
    });
}

/**
 * Process movement roll after potential reroll
 */
async function processMovementRoll(currentPlayer, rollValue) {
    // Track starting tile for elemental zone check
    const startTile = currentPlayer.currentTile;

    // Check for status effects and show messages before modifying roll
    const wasBurned = currentPlayer.statusEffects.burned;
    const wasSlowed = currentPlayer.statusEffects.slowed;
    const wasReversed = currentPlayer.statusEffects.reversed;

    // Apply any status effect modifiers to the roll
    let modifiedRoll = currentPlayer.modifyRoll(rollValue);

    // Show status effect messages
    if (wasBurned) {
        gameUI.showToast(`BURNED! Roll reduced: ${rollValue} → ${Math.max(1, rollValue - 1)}`, 'danger');
        await delay(800);
    }
    if (wasSlowed) {
        const slowedValue = Math.floor(rollValue * 0.5);
        gameUI.showToast(`SLOWED! Movement halved: ${rollValue} → ${Math.max(1, slowedValue)}`, 'warning');
        await delay(800);
    }
    if (wasReversed) {
        gameUI.showToast(`HYPNOTIZED! Moving BACKWARDS ${Math.abs(modifiedRoll)} spaces!`, 'warning');
        await delay(800);
    }

    // Apply movement bonus from Speed Potion if used
    if (currentPlayer.movementBonus) {
        modifiedRoll += currentPlayer.movementBonus;
        gameUI.showToast(`Speed Potion: ${rollValue} + ${currentPlayer.movementBonus} = ${modifiedRoll}!`, 'success');
        currentPlayer.movementBonus = 0; // Clear the bonus after use
    }

    // Check for Kaelen's Parkour ability (roll of 6 gives choice)
    if (currentPlayer.hasParkourChoice(rollValue)) {
        // Show modal for Parkour choice and wait for selection
        gameUI.showParkourChoice(async (choice) => {
            modifiedRoll = choice.spaces;

            gameState = 'moving';
            instructionText.setText('Moving...');

            // Play move step sound
            if (audioManager) {
                audioManager.playSFX('sfx_move_step');
            }

            // Move the player
            const result = await currentPlayer.moveSteps(Math.abs(modifiedRoll));
            updatePlayerStatus();

            // Handle tile effects and encounters
            if (result && result.won) {
                handleWin(currentPlayer);
                return;
            }

            // Check for dragon zone passed through
            try {
                const dragonPassed = checkDragonZonePassed(result?.tilesPassedThrough, startTile);
                if (dragonPassed) {
                    await handleDragonEncounter(currentPlayer, dragonPassed);
                }
            } catch (err) {
                console.error('[Game] Error in dragon zone check:', err);
            }

            if (result && result.effect && result.effect.type !== 'dragon') {
                await handleTileEffect(currentPlayer, result.effect);
            }
            await checkForEncounters(currentPlayer);
            await checkElementalTileEffect(currentPlayer, startTile);

            // If extra turn was chosen, don't advance to next player
            if (choice.extraTurn) {
                gameUI.showToast(`${currentPlayer.name} gets another turn!`, 'success');
                gameState = 'waiting';
                instructionText.setText('Click dice or SPACE\nto roll again!');
            } else {
                nextTurn();
            }
        });
        return; // Exit early - the callback will handle the rest
    }

    gameState = 'moving';
    instructionText.setText('Moving...');

    // Play move step sound
    if (audioManager) {
        audioManager.playSFX('sfx_move_step');
    }

    // Move the player
    const result = await currentPlayer.moveSteps(Math.abs(modifiedRoll));

    // Update player status display
    updatePlayerStatus();

    // Check for win
    if (result && result.won) {
        handleWin(currentPlayer);
        return;
    }

    // Check if player passed through a dragon zone during movement (sneak check)
    try {
        const dragonPassed = checkDragonZonePassed(result?.tilesPassedThrough, startTile);
        if (dragonPassed) {
            console.log(`[Game] ${currentPlayer.name} passed through ${dragonPassed.name}'s territory!`);
            await handleDragonEncounter(currentPlayer, dragonPassed);
            // After dragon encounter, player may have been moved - check for more encounters
        }
    } catch (err) {
        console.error('[Game] Error in dragon zone check:', err);
    }

    // Handle any special tile effects/encounters (like knight boost)
    if (result && result.effect && result.effect.type !== 'dragon') {
        // Skip dragon effects here since we handle them above
        await handleTileEffect(currentPlayer, result.effect);
    }

    // Check for encounters on the current tile (monsters, specials)
    await checkForEncounters(currentPlayer);

    // Check for elemental tile effects (pass startTile to avoid repeated effects in same zone)
    await checkElementalTileEffect(currentPlayer, startTile);

    // Switch to next player
    nextTurn();
}

/**
 * Check if player is on an elemental tile and apply effect
 * @param {Player} player - The player to check
 * @param {number} startTile - The tile the player started their turn on
 */
async function checkElementalTileEffect(player, startTile) {
    const element = board.getTileElement(player.currentTile);
    if (!element) return;

    // Check if player was already on this same elemental zone before moving
    // This prevents getting repeatedly slowed/burned when stuck in a zone
    const startElement = board.getTileElement(startTile);
    if (startElement === element) {
        // Player was already in this zone - don't reapply effect
        return;
    }

    // Check for Holy Shield protection against elemental effects
    const shieldProtection = player.inventory.checkPassiveItem('debuff');

    const elementEffects = {
        fire: {
            name: 'Fire Zone',
            message: 'The flames singe you! -1 to next roll',
            effect: 'burn',
            color: 'danger'
        },
        ice: {
            name: 'Ice Zone',
            message: 'You slip on ice! Move 1 space forward or back randomly',
            effect: 'slip',
            color: 'info'
        },
        poison: {
            name: 'Poison Zone',
            message: 'Toxic fumes slow you! Movement halved next turn',
            effect: 'slow',
            color: 'warning'
        }
    };

    const effectData = elementEffects[element];
    if (effectData) {
        // Add visual effect
        const effectKey = element === 'poison' ? 'smoke' : element;
        playEffectBurst(effectKey, player.token.x, player.token.y - 15, 3, 40);

        // Check for protection
        if (shieldProtection && effectData.effect !== 'slip') {
            gameUI.showToast(`${effectData.name}: ${shieldProtection.name} protects you!`, 'success');
            playEffectBurst('sparkle', player.token.x, player.token.y - 20, 3, 30);
            return;
        }

        // Apply the elemental effect
        switch (effectData.effect) {
            case 'burn':
                // Fire: -1 to next movement roll
                player.statusEffects.burned = true;
                gameUI.showToast(`${effectData.name}: ${effectData.message}`, effectData.color);
                break;

            case 'slip':
                // Ice: Random slip 1 space forward or back
                const slipDirection = Math.random() < 0.5 ? -1 : 1;
                const slipDestination = Math.max(1, Math.min(100, player.currentTile + slipDirection));
                if (slipDestination !== player.currentTile) {
                    const slipMsg = slipDirection > 0 ? 'forward' : 'backward';
                    gameUI.showToast(`${effectData.name}: You slip ${slipMsg} 1 space!`, effectData.color);
                    await delay(500);
                    await player.moveTo(slipDestination, false);
                } else {
                    gameUI.showToast(`${effectData.name}: You almost slip!`, effectData.color);
                }
                break;

            case 'slow':
                // Poison: Movement halved next turn
                player.applyStatusEffect({ type: 'slow', value: 0.5 });
                gameUI.showToast(`${effectData.name}: ${effectData.message}`, effectData.color);
                break;
        }

        // Update player status display
        updatePlayerStatus();
    }
}

/**
 * Handle special tile effects
 */
async function handleTileEffect(player, effect) {
    if (effect.type === 'knight') {
        // Play knight rescue/action animation
        if (effect.knight && effect.knight.name) {
            board.playKnightAction(effect.knight.name);
        }

        // Knight boost effect - golden sparkles!
        playEffectBurst('sparkle', player.token.x, player.token.y - 20, 5, 50);

        // Play knight boost sound
        if (audioManager) {
            audioManager.playSFX('sfx_knight_boost');
        }

        // Play player victory animation for being helped
        player.playVictoryAnimation();

        gameUI.showToast(`${effect.knight.boostMessage}`, 'success');
        await delay(1200); // Slightly longer to see animations
    } else if (effect.type === 'dragon') {
        // Play dragon roar sound
        if (audioManager) {
            audioManager.playSFX('sfx_dragon_roar');
        }
        // Dragon encounter - need to do defense check
        await handleDragonEncounter(player, effect.dragon);
    }
}

/**
 * Play an effect sprite animation at a world position
 * @param {string} effectType - 'fire', 'ice', 'sparkle', 'smoke', or 'poison'
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {Object} options - Optional: scale, duration, onComplete callback
 */
function playEffect(effectType, x, y, options = {}) {
    const scene = game.scene.scenes[0];
    if (!scene) return null;

    const key = `fx_${effectType}`;
    if (!scene.textures.exists(key)) {
        console.log(`[Effect] Texture not found: ${key}`);
        return null;
    }

    const sprite = scene.add.sprite(x, y, key, 0);
    sprite.setScale(options.scale || 1.5);
    sprite.setDepth(options.depth || 100);

    // Add tint based on effect type for visual variety
    const tints = {
        fire: 0xffaa44,
        ice: 0x88ddff,
        poison: 0x88ff88,
        smoke: 0xaaaaaa,
        sparkle: 0xffff88
    };
    if (tints[effectType] && options.tint !== false) {
        sprite.setTint(tints[effectType]);
    }

    // Play burst animation (one-shot)
    const animKey = options.loop ? `${key}_loop` : `${key}_burst`;
    if (scene.anims.exists(animKey)) {
        sprite.play(animKey);
    }

    // Auto-destroy after animation completes (or duration)
    const duration = options.duration || 800;
    scene.time.delayedCall(duration, () => {
        scene.tweens.add({
            targets: sprite,
            alpha: 0,
            scale: sprite.scale * 0.5,
            duration: 200,
            onComplete: () => {
                sprite.destroy();
                if (options.onComplete) options.onComplete();
            }
        });
    });

    return sprite;
}

/**
 * Play multiple effect sprites in a spread pattern
 */
function playEffectBurst(effectType, x, y, count = 3, spread = 40) {
    for (let i = 0; i < count; i++) {
        const offsetX = (Math.random() - 0.5) * spread;
        const offsetY = (Math.random() - 0.5) * spread;
        const delayMs = i * 100;

        setTimeout(() => {
            playEffect(effectType, x + offsetX, y + offsetY, {
                scale: 1 + Math.random() * 0.5,
                duration: 600 + Math.random() * 400
            });
        }, delayMs);
    }
}

/**
 * Check if player passed through any dragon zones during movement
 * Returns the first dragon encountered (if any)
 * Only triggers when moving FORWARD through the zone (not at tail, must pass body tiles)
 */
function checkDragonZonePassed(tilesPassedThrough, startTile) {
    if (!tilesPassedThrough || tilesPassedThrough.length === 0) return null;

    // Only trigger sneak check if player PASSES THROUGH the dragon's HEAD tile
    // (not just entering the dragon's body zone - that would be too punishing)
    // This means you can walk into dragon territory safely, but jumping over the head requires a check
    for (const tile of tilesPassedThrough) {
        const dragon = EncounterData.getDragonAtTile(tile); // Only returns dragon if this IS the head tile
        if (dragon) {
            // Passing through dragon head - trigger sneak check
            return dragon;
        }
    }
    return null;
}

/**
 * Handle dragon encounter with defense check
 */
async function handleDragonEncounter(player, dragon) {
    console.log(`[Game] ${player.name} encountered ${dragon.name}!`);

    // Check for passive item protection (Armor Shard)
    const armorProtection = player.inventory.checkPassiveItem('dragon');
    if (armorProtection) {
        // Show sparkle effect for protection
        playEffectBurst('sparkle', player.token.x, player.token.y - 20, 5, 50);
        gameUI.showToast(`${armorProtection.name} protected you from ${dragon.name}!`, 'success');
        return;
    }

    // Play encounter music
    if (audioManager) {
        audioManager.playMusic('music_encounter');
    }

    // Show encounter modal for defense check
    gameState = 'encounter';

    return new Promise((resolve) => {
        gameUI.showEncounterModal(dragon, player, async (result) => {
            // Resume gameplay music after encounter
            if (audioManager) {
                audioManager.playMusic('music_gameplay');
            }
            if (result.success) {
                // Defended successfully - show sparkle/shield effect
                playEffectBurst('sparkle', player.token.x, player.token.y - 20, 4, 40);
                // Play encounter success sound
                if (audioManager) {
                    audioManager.playSFX('sfx_encounter_success');
                }
                gameUI.showToast(result.message, 'success');
                // Play player action animation for successful defense
                player.playActionAnimation();
            } else {
                // Play dragon attack animation
                board.playDragonAttack(dragon.name);

                // Defeated by dragon - show dragon's element effect
                const dragonEffects = {
                    'Ignis the King': 'fire',
                    'Frost-Fang': 'ice',
                    'Slime-Tooth': 'poison'
                };
                const effectType = dragonEffects[dragon.name] || 'fire';
                playEffectBurst(effectType, player.token.x, player.token.y - 20, 5, 60);

                // Play player hurt/action animation
                player.playActionAnimation();

                gameUI.showToast(result.message, 'danger');

                // Calculate slide destination - check for Reginald's Ironclad ability
                let slideDestination = dragon.tailTile;
                if (player.characterData && player.characterData.id === 'reginald') {
                    const slideDistance = dragon.headTile - dragon.tailTile;
                    const reducedSlide = Math.max(0, slideDistance - 3);
                    slideDestination = dragon.headTile - reducedSlide;
                    if (slideDestination !== dragon.tailTile) {
                        gameUI.showToast(`🛡️ IRONCLAD! Slide reduced by 3 tiles!`, 'info');
                    }
                }

                // Player slides down to destination
                await delay(1000); // Longer delay to see the attack animation
                // Play dragon slide sound
                if (audioManager) {
                    audioManager.playSFX('sfx_dragon_slide');
                }
                await player.moveTo(slideDestination, false);
                updatePlayerStatus();
            }
            gameState = 'moving';
            resolve();
        });
    });
}

/**
 * Check for monster encounters and special tiles on current position
 */
async function checkForEncounters(player) {
    const tile = player.currentTile;

    // Check for dragon head - landing on dragon head triggers encounter
    // (This catches cases where the dragon check in movement didn't fire)
    const dragon = EncounterData.getDragonAtTile(tile);
    if (dragon) {
        console.log(`[Game] ${player.name} landed on ${dragon.name}'s head tile!`);
        await handleDragonEncounter(player, dragon);
        return;
    }

    // Check for portal first - player gets to choose whether to enter
    const portal = EncounterData.getPortalAtTile(tile);
    if (portal) {
        await handlePortalEncounter(player, portal);
        return;
    }

    // Check for monster
    const monster = EncounterData.getMonsterAtTile(tile);
    if (monster) {
        await handleMonsterEncounter(player, monster);
        return;
    }

    // Check for special tile
    const special = EncounterData.getSpecialAtTile(tile);
    if (special) {
        await handleSpecialTile(player, special);
    }
}

/**
 * Handle monster encounter
 */
async function handleMonsterEncounter(player, monster) {
    console.log(`[Game] ${player.name} encountered ${monster.name}!`);

    // Play encounter music
    if (audioManager) {
        audioManager.playMusic('music_encounter');
    }

    // Play monster-specific SFX
    if (audioManager) {
        const monsterSfx = {
            'Snoozing Hill-Giant': 'sfx_giant_stomp',
            'Goblin Tax Collector': 'sfx_goblin_laugh',
            'Mimic': 'sfx_mimic_chomp',
            'Hypno-Toad': 'sfx_hypno_spiral'
        };
        const sfxKey = monsterSfx[monster.name];
        if (sfxKey) {
            audioManager.playSFX(sfxKey);
        }
    }

    gameState = 'encounter';

    return new Promise((resolve) => {
        gameUI.showEncounterModal(monster, player, async (result) => {
            // Resume gameplay music after encounter
            if (audioManager) {
                audioManager.playMusic('music_gameplay');
            }
            if (result.success) {
                // Victory effect - sparkles!
                playEffectBurst('sparkle', player.token.x, player.token.y - 20, 4, 40);
                // Play encounter success sound
                if (audioManager) {
                    audioManager.playSFX('sfx_encounter_success');
                }
                gameUI.showToast(result.message, 'success');
                // Play player action animation for victory
                player.playActionAnimation();
                // Check for success effect (like Mimic loot)
                if (monster.successEffect) {
                    await applyEncounterEffect(player, monster.successEffect);
                }
            } else {
                // Play monster attack animation
                board.playMonsterAttack(player.currentTile);

                // Failure effect based on monster type
                const monsterEffects = {
                    'Monster Milk Baby': 'smoke',      // Confusion/daze
                    'Goblin Tax Collector': 'sparkle', // Gold loss
                    'Snoozing Hill-Giant': 'smoke',    // Knocked back
                    'Mimic': 'smoke',                  // Bite attack
                    'Hypno-Toad': 'ice',               // Hypnotized/frozen
                    'Lucy & Vampire Family': 'smoke'   // Drained
                };
                const effectType = monsterEffects[monster.name] || 'smoke';
                playEffectBurst(effectType, player.token.x, player.token.y - 20, 4, 50);

                // Play player hurt/action animation
                player.playActionAnimation();

                gameUI.showToast(result.message, 'danger');
                // Check for Holy Shield blocking debuffs
                const shieldProtection = player.inventory.checkPassiveItem('debuff');
                if (shieldProtection && monster.failEffect &&
                    ['stun', 'slow', 'reverse'].includes(monster.failEffect.type)) {
                    playEffectBurst('sparkle', player.token.x, player.token.y - 20, 3, 30);
                    gameUI.showToast(`${shieldProtection.name} blocked the effect!`, 'success');
                } else if (monster.failEffect) {
                    await delay(500); // Brief delay to show attack animation
                    await applyEncounterEffect(player, monster.failEffect);
                }
            }
            gameState = 'moving';
            resolve();
        });
    });
}

/**
 * Handle portal encounter - give player choice to enter
 */
async function handlePortalEncounter(player, portal) {
    console.log(`[Game] ${player.name} found ${portal.name}!`);

    gameState = 'encounter';

    return new Promise((resolve) => {
        gameUI.showPortalChoiceModal(portal, player, async (entered) => {
            if (entered) {
                // Player chose to enter the portal
                if (audioManager) {
                    audioManager.playSFX('sfx_portal_teleport');
                }

                // Roll for random effect
                const effect = EncounterData.rollPortalEffect(portal);
                if (effect) {
                    await applyPortalEffect(player, effect, portal);
                }
            } else {
                // Player chose to skip
                gameUI.showToast(`${player.name} decided not to enter the portal.`, 'info');
            }
            gameState = 'moving';
            resolve();
        });
    });
}

/**
 * Apply a portal effect to a player
 */
async function applyPortalEffect(player, effect, portal) {
    console.log(`[Game] Portal effect: ${effect.id} - ${effect.message}`);

    // Visual effect based on portal type
    const effectType = portal.portalType === 'balanced' ? 'sparkle' :
                      portal.portalType === 'risky' ? 'smoke' : 'fire';
    playEffectBurst(effectType, player.token.x, player.token.y - 20, 5, 50);

    // Determine if this is a good or bad effect for toast color
    const goodEffects = ['move', 'loot', 'armor', 'cleanse', 'none', 'buff', 'steal_item', 'double_roll'];
    const isGood = goodEffects.includes(effect.type) && (effect.value === undefined || effect.value > 0);
    const toastType = isGood ? 'success' : (effect.type === 'none' ? 'info' : 'danger');

    gameUI.showToast(effect.message, toastType);
    await delay(800);

    switch (effect.type) {
        case 'move':
            // Move forward or backward
            const newTile = Math.max(1, Math.min(board.totalTiles, player.currentTile + effect.value));
            await player.moveTo(newTile, false);
            updatePlayerStatus();
            break;

        case 'move_to':
            // Move to specific tile
            await player.moveTo(effect.value, false);
            updatePlayerStatus();
            break;

        case 'loot':
            // Gain items
            for (let i = 0; i < (effect.value || 1); i++) {
                if (player.inventory.hasSpace()) {
                    const item = player.inventory.addRandomItem();
                    if (item && audioManager) {
                        audioManager.playSFX('sfx_item_get');
                    }
                }
            }
            updatePlayerStatus();
            break;

        case 'armor':
            // Gain armor shards
            for (let i = 0; i < (effect.value || 1); i++) {
                if (player.inventory.hasSpace()) {
                    player.inventory.addItem(ItemData.items.armor_shard);
                }
            }
            updatePlayerStatus();
            break;

        case 'cleanse':
            // Remove all status effects
            player.statusEffects = { stunned: false, slowed: false, reversed: false, burned: false };
            updatePlayerStatus();
            break;

        case 'status':
            // Apply status effect
            if (effect.effect === 'slowed') {
                player.applyStatusEffect({ type: 'slow', value: 0.5 });
            } else if (effect.effect === 'burned') {
                player.applyStatusEffect({ type: 'burn' });
            } else if (effect.effect === 'stunned') {
                player.applyStatusEffect({ type: 'stun' });
                // Handle duration > 1 for multi-turn stun
                if (effect.duration && effect.duration > 1) {
                    player.stunDuration = effect.duration;
                }
            } else if (effect.effect === 'reversed') {
                player.applyStatusEffect({ type: 'reverse' });
            }
            updatePlayerStatus();
            break;

        case 'lose_armor':
            // Lose armor shards
            for (let i = 0; i < (effect.value || 1); i++) {
                player.inventory.removeItemById('armor_shard');
            }
            updatePlayerStatus();
            break;

        case 'lose_item':
            // Lose random item(s)
            for (let i = 0; i < (effect.value || 1); i++) {
                const lost = player.inventory.removeRandomItem();
                if (lost) {
                    gameUI.showToast(`Lost: ${lost.name}!`, 'danger');
                }
            }
            updatePlayerStatus();
            break;

        case 'lose_all_items':
            // Lose ALL items
            while (player.inventory.items.some(slot => slot !== null)) {
                player.inventory.removeRandomItem();
            }
            updatePlayerStatus();
            break;

        case 'all_status':
            // Apply all negative status effects
            player.applyStatusEffect({ type: 'slow', value: 0.5 });
            player.applyStatusEffect({ type: 'burn' });
            player.applyStatusEffect({ type: 'reverse' });
            updatePlayerStatus();
            break;

        case 'swap_player':
            // Swap positions with a random other player
            const otherPlayers = players.filter(p => p !== player && !p.hasWon);
            if (otherPlayers.length > 0) {
                const target = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
                const playerTile = player.currentTile;
                const targetTile = target.currentTile;
                await Promise.all([
                    player.moveTo(targetTile, false),
                    target.moveTo(playerTile, false)
                ]);
                gameUI.showToast(`Swapped places with ${target.name}!`, 'warning');
                updatePlayerStatus();
            }
            break;

        case 'teleport_random':
            // Teleport to random tile
            const randomTile = Math.floor(Math.random() * (board.totalTiles - 10)) + 5;
            await player.moveTo(randomTile, false);
            gameUI.showToast(`Teleported to tile ${randomTile}!`, 'warning');
            updatePlayerStatus();
            break;

        case 'steal_item':
            // Steal item from player in the lead
            const leader = [...players].filter(p => p !== player && !p.hasWon)
                .sort((a, b) => b.currentTile - a.currentTile)[0];
            if (leader && leader.inventory.items.some(slot => slot !== null)) {
                const stolenItem = leader.inventory.removeRandomItem();
                if (stolenItem && player.inventory.hasSpace()) {
                    player.inventory.addItem(stolenItem);
                    gameUI.showToast(`Stole ${stolenItem.name} from ${leader.name}!`, 'success');
                }
            }
            updatePlayerStatus();
            break;

        case 'buff':
            // Apply buff (like double roll)
            if (effect.effect === 'double_roll') {
                player.nextRollDouble = true;
                gameUI.showToast('Your next roll will be DOUBLED!', 'success');
            }
            break;

        case 'reverse_all':
            // Apply reverse to all other players
            for (const otherPlayer of players) {
                if (otherPlayer !== player && !otherPlayer.hasWon) {
                    otherPlayer.applyStatusEffect({ type: 'reverse' });
                }
            }
            updatePlayerStatus();
            break;

        case 'none':
            // Nothing happens
            break;
    }
}

/**
 * Apply an encounter effect to a player
 */
async function applyEncounterEffect(player, effect) {
    switch (effect.type) {
        case 'stun':
            player.applyStatusEffect({ type: 'stun' });
            gameUI.showToast(effect.message, 'warning');
            break;
        case 'slow':
            player.applyStatusEffect({ type: 'slow', value: effect.value });
            gameUI.showToast(effect.message, 'warning');
            break;
        case 'reverse':
            player.applyStatusEffect({ type: 'reverse' });
            gameUI.showToast(effect.message, 'warning');
            break;
        case 'knockback':
            const newTile = Math.max(1, player.currentTile - effect.value);
            await player.moveTo(newTile, false);
            gameUI.showToast(effect.message, 'warning');
            updatePlayerStatus();
            break;
        case 'loot':
            if (player.inventory.hasSpace()) {
                const item = player.inventory.addRandomItem();
                if (item) {
                    gameUI.showToast(`Found: ${item.name}!`, 'success');
                }
            } else {
                gameUI.showToast('Inventory full! Item lost.', 'warning');
            }
            break;
        case 'lose_item':
            const lostItem = player.inventory.removeRandomItem();
            if (lostItem) {
                gameUI.showToast(`Lost: ${lostItem.name}!`, 'danger');
            }
            break;
    }
}

/**
 * Handle special tile effects
 */
async function handleSpecialTile(player, special) {
    console.log(`[Game] ${player.name} landed on ${special.name}!`);

    switch (special.effect.type) {
        case 'full_armor':
            // Rusty Anvil - fill inventory with armor shards
            const added = player.inventory.fillWithArmor();
            // Show fire/forge effect
            playEffectBurst('fire', player.token.x, player.token.y - 20, 4, 40);
            gameUI.showToast(`${special.effect.message} (+${added} shards)`, 'success');
            break;

        case 'teleport_random':
            // Twin Portals - roll to determine destination
            gameState = 'encounter';
            return new Promise((resolve) => {
                gameUI.showEncounterModal(special, player, async (result) => {
                    const roll = result.roll;
                    const outcome = special.effect.outcomes.find(o => o.roll.includes(roll));
                    if (outcome) {
                        // Portal effect based on result
                        const portalEffect = roll <= 3 ? 'sparkle' : 'smoke';
                        playEffectBurst(portalEffect, player.token.x, player.token.y - 20, 5, 50);
                        // Play portal teleport sound
                        if (audioManager) {
                            audioManager.playSFX('sfx_portal_teleport');
                        }
                        gameUI.showToast(outcome.message, roll <= 3 ? 'success' : 'warning');
                        await delay(700);
                        await player.moveTo(outcome.destination, false);
                        // Effect at destination
                        playEffectBurst('sparkle', player.token.x, player.token.y - 20, 3, 30);
                        updatePlayerStatus();
                    }
                    gameState = 'moving';
                    resolve();
                });
            });
            break;

        case 'loot':
            // Treasure chest - sparkle effect
            playEffectBurst('sparkle', player.token.x, player.token.y - 20, 5, 50);
            // Play treasure open sound
            if (audioManager) {
                audioManager.playSFX('sfx_treasure_open');
            }

            // Aurelia's Royal Tax - get 2 items instead of 1
            const lootCount = (player.characterData && player.characterData.id === 'aurelia') ? 2 : 1;
            const itemsFound = [];

            for (let i = 0; i < lootCount; i++) {
                if (player.inventory.hasSpace()) {
                    const item = player.inventory.addRandomItem();
                    if (item) {
                        itemsFound.push(item.name);
                    }
                }
            }

            if (itemsFound.length > 0) {
                // Play item get sound
                if (audioManager) {
                    audioManager.playSFX('sfx_item_get');
                }
                if (lootCount > 1 && itemsFound.length > 1) {
                    gameUI.showToast(`Royal Tax! Found: ${itemsFound.join(' & ')}!`, 'success');
                } else {
                    gameUI.showToast(`${special.effect.message} Got: ${itemsFound[0]}!`, 'success');
                }
            } else {
                gameUI.showToast('Found treasure but inventory is full!', 'warning');
            }
            break;
    }
}

/**
 * Show inventory for current player with option to use items
 */
function showInventory() {
    const currentPlayer = players[currentPlayerIndex];
    const items = currentPlayer.inventory.getItems();

    if (items.length === 0) {
        gameUI.showToast(`${currentPlayer.name}'s inventory is empty`, 'info');
        return;
    }

    // Only allow using items in waiting state (before rolling)
    if (gameState !== 'waiting') {
        const itemNames = items.map(i => i.name).join(', ');
        gameUI.showToast(`Items: ${itemNames}`, 'info');
        return;
    }

    // Find usable active items (before_roll timing)
    const activeItems = items.filter(item => item.type === 'active' && item.timing === 'before_roll');

    if (activeItems.length === 0) {
        // Show what items they have and explain why they can't be used manually
        const autoItems = items.filter(i => i.type === 'passive' || i.timing === 'after_roll' || i.timing === 'during_encounter');
        if (autoItems.length > 0) {
            const autoNames = autoItems.map(i => i.name).join(', ');
            gameUI.showToast(`${autoNames} - activate automatically when needed`, 'info');
        } else {
            const itemNames = items.map(i => i.name).join(', ');
            gameUI.showToast(`Items: ${itemNames}`, 'info');
        }
        return;
    }

    // Show modal to use the first available active item
    const scene = game.scene.scenes[0];
    const item = activeItems[0];

    gameUI.showItemUseModal(item, currentPlayer, (result) => {
        if (result.used) {
            currentPlayer.inventory.useItem(item.id);
            gameUI.showToast(`Used ${item.name}!`, 'success');

            // Apply the effect
            if (result.effect.type === 'movement_bonus') {
                // Store the bonus for the next roll
                currentPlayer.movementBonus = result.effect.value;
                gameUI.showToast(`+${result.effect.value} to your next roll!`, 'success');
            }

            updatePlayerStatus();
        }
    });
}

/**
 * Handle clicking on an inventory item
 * @param {Object} player - The player who owns the item
 * @param {Object} item - The item that was clicked
 * @param {number} playerIndex - The index of the player in the players array
 */
function handleItemClick(player, item, playerIndex) {
    // Only allow current player to use items
    if (playerIndex !== currentPlayerIndex) {
        gameUI.showToast(`It's not ${player.name}'s turn!`, 'info');
        return;
    }

    // Check if modal is already open
    if (gameUI.isModalOpen) {
        return;
    }

    // Handle passive items (can't be used manually)
    if (item.type === 'passive') {
        gameUI.showToast(`${item.name} activates automatically when needed`, 'info');
        return;
    }

    // Handle active items based on timing
    if (item.timing === 'before_roll') {
        if (gameState !== 'waiting') {
            gameUI.showToast(`${item.name} can only be used before rolling`, 'warning');
            return;
        }

        // Show use modal for before_roll items (like Speed Potion)
        gameUI.showItemUseModal(item, player, (result) => {
            if (result.used) {
                player.inventory.useItem(item.id);
                gameUI.showToast(`Used ${item.name}!`, 'success');

                if (result.effect.type === 'movement_bonus') {
                    player.movementBonus = result.effect.value;
                    gameUI.showToast(`+${result.effect.value} to your next roll!`, 'success');
                }

                updatePlayerStatus();
            }
        });
    } else if (item.timing === 'after_roll') {
        // Spell Scroll - can only be used when there's a pending roll to reroll
        gameUI.showToast(`${item.name} can be used after rolling (will prompt automatically)`, 'info');
    } else if (item.timing === 'during_encounter') {
        // Smoke Bomb - can only be used during monster encounters
        gameUI.showToast(`${item.name} can be used during monster encounters (will prompt automatically)`, 'info');
    }
}

/**
 * Show the legend popup
 */
function showLegendPopup() {
    if (gameUI.isModalOpen) return;

    gameUI.isModalOpen = true;
    const scene = game.scene.scenes[0];
    const screenW = scene.scale.width;
    const screenH = scene.scale.height;
    const cx = screenW / 2;
    const cy = screenH / 2;

    const legendContainer = scene.add.container(0, 0);
    legendContainer.setDepth(300);
    legendContainer.setScrollFactor(0);

    // Overlay
    const overlay = scene.add.rectangle(cx, cy, screenW, screenH, 0x000000, 0.8);
    overlay.setInteractive();
    legendContainer.add(overlay);

    // Modal - compact size for legend
    const modalW = 280;
    const modalH = 200;
    const modalBg = scene.add.graphics();
    modalBg.fillStyle(0x0d0d1a, 1);
    modalBg.fillRoundedRect(cx - modalW/2, cy - modalH/2, modalW, modalH, 12);
    modalBg.fillStyle(0x1a1a2e, 0.5);
    modalBg.fillRoundedRect(cx - modalW/2 + 4, cy - modalH/2 + 4, modalW - 8, 40, 10);
    modalBg.lineStyle(3, 0xc9a227, 1);
    modalBg.strokeRoundedRect(cx - modalW/2, cy - modalH/2, modalW, modalH, 12);
    legendContainer.add(modalBg);

    // Title
    const title = scene.add.text(cx, cy - modalH/2 + 25, 'LEGEND', {
        fontSize: '18px',
        fontFamily: 'Georgia, serif',
        color: '#c9a227',
        letterSpacing: 3
    }).setOrigin(0.5);
    legendContainer.add(title);

    // Legend items
    const legendItems = [
        { color: 0xffd700, label: 'Knight (Advance forward)' },
        { color: 0xff4422, label: 'Dragon (Roll to resist)' },
        { color: 0xbb66ff, label: 'Monster (Challenge)' },
        { color: 0x44ddff, label: 'Special/Bonus Tile' }
    ];

    const startY = cy - modalH/2 + 60;
    legendItems.forEach((item, index) => {
        const y = startY + (index * 28);
        const dotX = cx - modalW/2 + 30;

        // Glow
        const glow = scene.add.graphics();
        glow.fillStyle(item.color, 0.3);
        glow.fillCircle(dotX, y, 10);
        legendContainer.add(glow);

        // Dot
        const dot = scene.add.graphics();
        dot.fillStyle(item.color, 1);
        dot.fillCircle(dotX, y, 6);
        legendContainer.add(dot);

        // Label
        const label = scene.add.text(dotX + 20, y, item.label, {
            fontSize: '13px',
            fontFamily: 'Arial',
            color: '#cccccc'
        }).setOrigin(0, 0.5);
        legendContainer.add(label);
    });

    // Close function
    const closeLegend = () => {
        legendContainer.destroy();
        gameUI.isModalOpen = false;
    };

    // Close on overlay click
    overlay.on('pointerdown', closeLegend);

    // Close button
    const closeBtnY = cy + modalH/2 - 30;
    const closeBtnBg = scene.add.graphics();
    closeBtnBg.fillStyle(0xc9a227, 1);
    closeBtnBg.fillRoundedRect(cx - 50, closeBtnY - 14, 100, 28, 6);
    legendContainer.add(closeBtnBg);

    const closeBtnText = scene.add.text(cx, closeBtnY, 'CLOSE', {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#000000',
        fontStyle: 'bold'
    }).setOrigin(0.5);
    legendContainer.add(closeBtnText);

    const closeBtnHit = scene.add.rectangle(cx, closeBtnY, 100, 28, 0x000000, 0);
    closeBtnHit.setInteractive({ useHandCursor: true });
    closeBtnHit.on('pointerover', () => {
        closeBtnBg.clear();
        closeBtnBg.fillStyle(0xdaa520, 1);
        closeBtnBg.fillRoundedRect(cx - 50, closeBtnY - 14, 100, 28, 6);
    });
    closeBtnHit.on('pointerout', () => {
        closeBtnBg.clear();
        closeBtnBg.fillStyle(0xc9a227, 1);
        closeBtnBg.fillRoundedRect(cx - 50, closeBtnY - 14, 100, 28, 6);
    });
    closeBtnHit.on('pointerdown', closeLegend);
    legendContainer.add(closeBtnHit);
}

/**
 * Show the in-game help guide
 */
function showHelpGuide() {
    if (gameUI.isModalOpen) return;

    gameUI.isModalOpen = true;
    const scene = game.scene.scenes[0];
    const screenW = scene.scale.width;
    const screenH = scene.scale.height;
    const cx = screenW / 2;
    const cy = screenH / 2;

    // Store elements for cleanup
    const helpElements = [];

    // Overlay - directly on scene with scrollFactor 0
    const overlay = scene.add.rectangle(cx, cy, screenW, screenH, 0x000000, 0.9);
    overlay.setDepth(300);
    overlay.setScrollFactor(0);
    overlay.setInteractive();
    helpElements.push(overlay);

    // Modal - sized to fit content with scrolling text if needed
    const modalW = 550;
    const modalH = Math.min(screenH - 80, 620);
    const modalBg = scene.add.graphics();
    modalBg.fillStyle(0x0d0d1a, 1);
    modalBg.fillRoundedRect(cx - modalW/2, cy - modalH/2, modalW, modalH, 16);
    modalBg.fillStyle(0x1a1a2e, 0.5);
    modalBg.fillRoundedRect(cx - modalW/2 + 4, cy - modalH/2 + 4, modalW - 8, 60, 14);
    modalBg.lineStyle(3, 0xc9a227, 1);
    modalBg.strokeRoundedRect(cx - modalW/2, cy - modalH/2, modalW, modalH, 16);
    modalBg.setDepth(301);
    modalBg.setScrollFactor(0);
    helpElements.push(modalBg);

    // Title
    const title = scene.add.text(cx, cy - modalH/2 + 30, 'DRAGON RUN: HELP GUIDE', {
        fontSize: '22px',
        fontFamily: 'Georgia, serif',
        color: '#c9a227',
        stroke: '#000000',
        strokeThickness: 3
    }).setOrigin(0.5);
    title.setDepth(302);
    title.setScrollFactor(0);
    helpElements.push(title);

    // Help content - condensed
    const helpText = `HOW TO PLAY
• Roll dice (click or SPACE) to move along the path
• First to reach tile 50 wins!

ENCOUNTERS
• Dragons (Red): Roll 4+ to resist, or slide to tail
• Knights (Gold): Auto-advance to destination
• Monsters (Purple): Various challenges
• Special (Blue): Treasure, portals, bonuses

ITEMS (hover for info, click to use)
• Armor Shard: Auto-block dragon attacks
• Speed Potion: +3 movement (before roll)
• Spell Scroll: Re-roll (after roll, auto-prompt)
• Smoke Bomb: Escape monsters (auto-prompt)
• Holy Shield: Block curse/stun effects

STATUS EFFECTS
• Burned: -1 next roll | Slowed: Half movement
• Stunned: Skip turn | Hypnotized: Move backwards

CONTROLS
• SPACE/Click: Roll | I: Inventory | H: Help | M: Mute
• Drag/Arrows: Pan | Wheel: Zoom | R: Restart`;

    const content = scene.add.text(cx, cy - modalH/2 + 60, helpText, {
        fontSize: '11px',
        fontFamily: 'Arial',
        color: '#cccccc',
        lineSpacing: 3,
        wordWrap: { width: modalW - 50 },
        align: 'left'
    }).setOrigin(0.5, 0);
    content.setDepth(302);
    content.setScrollFactor(0);
    helpElements.push(content);

    // Close button - directly on scene
    const btnW = 120;
    const btnH = 36;
    const btnY = cy + modalH/2 - 35;

    const btnBg = scene.add.graphics();
    btnBg.fillStyle(0xc9a227, 1);
    btnBg.fillRoundedRect(cx - btnW/2, btnY - btnH/2, btnW, btnH, 8);
    btnBg.setDepth(302);
    btnBg.setScrollFactor(0);
    helpElements.push(btnBg);

    const btnText = scene.add.text(cx, btnY, 'CLOSE', {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#000000',
        fontStyle: 'bold'
    }).setOrigin(0.5);
    btnText.setDepth(303);
    btnText.setScrollFactor(0);
    helpElements.push(btnText);

    const btnHitArea = scene.add.rectangle(cx, btnY, btnW, btnH, 0x000000, 0);
    btnHitArea.setDepth(304);
    btnHitArea.setScrollFactor(0);
    btnHitArea.setInteractive({ useHandCursor: true });
    helpElements.push(btnHitArea);

    // Cleanup function
    const closeHelp = () => {
        helpElements.forEach(el => {
            if (el && el.destroy) el.destroy();
        });
        gameUI.isModalOpen = false;
    };

    btnHitArea.on('pointerover', () => {
        btnBg.clear();
        btnBg.fillStyle(0xdaa520, 1);
        btnBg.fillRoundedRect(cx - btnW/2, btnY - btnH/2, btnW, btnH, 8);
    });
    btnHitArea.on('pointerout', () => {
        btnBg.clear();
        btnBg.fillStyle(0xc9a227, 1);
        btnBg.fillRoundedRect(cx - btnW/2, btnY - btnH/2, btnW, btnH, 8);
    });
    btnHitArea.on('pointerdown', closeHelp);

    // Also close on overlay click or ESC key
    overlay.on('pointerdown', closeHelp);
    const escHandler = (event) => {
        if (event.key === 'Escape') {
            closeHelp();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

/**
 * Helper delay function
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Handle a player winning the game
 */
function handleWin(player) {
    gameState = 'ended';

    // Victory fireworks - multiple sparkle bursts!
    const burstVictoryEffects = () => {
        playEffectBurst('sparkle', player.token.x, player.token.y - 30, 6, 70);
        playEffectBurst('fire', player.token.x - 40, player.token.y - 20, 3, 40);
        playEffectBurst('fire', player.token.x + 40, player.token.y - 20, 3, 40);
    };
    burstVictoryEffects();
    // Repeat victory effects a couple times
    setTimeout(burstVictoryEffects, 600);
    setTimeout(burstVictoryEffects, 1200);

    // Play victory music
    if (audioManager) {
        audioManager.playMusic('music_victory', false);
    }
    turnText.setText(`${player.name} WINS!`);
    instructionText.setText('Press R to restart');
    if (diceContainer && diceContainer.valueText) {
        diceContainer.valueText.setText('!');
    }
    gameUI.showToast(`${player.name} wins the race!`, 'success');
}

/**
 * Advance to the next player's turn
 */
function nextTurn() {
    // Deactivate current player
    players[currentPlayerIndex].setActive(false);

    // Move to next player
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;

    // Skip players who have won
    let attempts = 0;
    while (players[currentPlayerIndex].hasWon && attempts < players.length) {
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        attempts++;
    }

    // Activate new player
    players[currentPlayerIndex].setActive(true);

    // Reset ability activation state for new turn
    resetAbilityState();

    // Play turn start sound
    if (audioManager) {
        audioManager.playSFX('sfx_turn_start');
    }

    // Update UI
    turnText.setText(players[currentPlayerIndex].name);
    instructionText.setText('Click dice or SPACE\nto roll!');

    // Set state back to waiting
    gameState = 'waiting';

    // Update status display
    updatePlayerStatus();

    // Auto-center camera on new current player
    panToPlayer(players[currentPlayerIndex], 400);

    console.log(`[Game] Turn passed to ${players[currentPlayerIndex].name}`);
}

// ============================================================================
// DEBUG FUNCTIONS
// ============================================================================

/**
 * Debug: Move current player forward one tile
 */
async function debugMove() {
    if (gameState !== 'waiting') return;

    const currentPlayer = players[currentPlayerIndex];
    console.log(`[Debug] Moving Player ${currentPlayer.playerNumber} forward 1 tile`);

    gameState = 'moving';
    await currentPlayer.moveSteps(1);
    updatePlayerStatus();

    if (!currentPlayer.hasWon) {
        // Check for encounters
        await checkForEncounters(currentPlayer);
        nextTurn();
    } else {
        gameState = 'ended';
        turnText.setText(`${currentPlayer.name} WINS!`);
        instructionText.setText('Press R to restart');
    }
}

/**
 * Reset the game to initial state
 */
function resetGame() {
    console.log('[Game] Resetting game...');

    // Stop any playing audio
    if (audioManager) {
        audioManager.stopMusic();
    }

    // Destroy current game and restart
    game.destroy(true);

    // Reset global state
    players = [];
    playerCharacterSelections = [];
    currentPlayerIndex = 0;
    playerStatusTexts = [];
    playerInventoryContainers = [];
    uiElements = {};
    gameState = 'character_select';
    diceValue = 0;
    audioManager = null;

    // Restart game
    game = new Phaser.Game(config);

    console.log('[Game] Game reset complete');
}

// ============================================================================
// INITIALIZE GAME
// ============================================================================

// Wait for DOM to be ready, then start Phaser
window.addEventListener('load', () => {
    console.log('[Game] Starting Dragon Run: The Royal Race');
    console.log('[Game] Phaser version:', Phaser.VERSION);

    game = new Phaser.Game(config);
});
