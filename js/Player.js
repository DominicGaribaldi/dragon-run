/**
 * DRAGON RUN: THE ROYAL RACE
 * Player.js - Handles player tokens, movement, and state
 *
 * Each player is represented by a colored token that moves along the board.
 * Currently uses primitive shapes - will be swapped for Metal Slug style sprites.
 */

class Player {
    /**
     * Player color configurations
     */
    static COLORS = {
        1: 0xE63946,  // Player 1: Red (matching palette)
        2: 0x457B9D,  // Player 2: Blue
        3: 0x2A9D8F,  // Player 3: Green
        4: 0xE9C46A   // Player 4: Yellow/Gold
    };

    static NAMES = {
        1: "Sir Reginald",
        2: "Elara",
        3: "Kaelen",
        4: "Princess Aurelia"
    };

    /**
     * @param {Phaser.Scene} scene - The Phaser scene
     * @param {number} playerNumber - Player ID (1-4)
     * @param {Board} board - Reference to the game board
     * @param {ProceduralGraphics} gfx - Procedural graphics generator
     * @param {Object} characterData - Character definition from CharacterData
     */
    constructor(scene, playerNumber, board, gfx = null, characterData = null) {
        this.scene = scene;
        this.playerNumber = playerNumber;
        this.board = board;
        this.gfx = gfx;
        this.characterData = characterData;

        // Player state
        this.currentTile = 1;      // All players start at tile 1
        this.isMoving = false;     // Lock to prevent multiple moves
        this.hasWon = false;       // Win condition flag

        // Status effects
        this.statusEffects = {
            stunned: false,        // Skip next turn
            slowed: false,         // Movement halved
            reversed: false,       // Move backwards
            burned: false          // -1 to next roll (fire zone)
        };

        // Inventory system
        this.inventory = new Inventory(3);

        // Visual properties - use character data if available
        if (characterData) {
            this.color = characterData.color;
            this.name = characterData.name;
        } else {
            this.color = Player.COLORS[playerNumber] || 0xffffff;
            this.name = Player.NAMES[playerNumber] || `Player ${playerNumber}`;
        }
        this.tokenRadius = 18;

        // Offset to prevent tokens from stacking on same tile
        this.stackOffset = this.calculateStackOffset(playerNumber);

        // Create the player token
        this.token = null;
        this.useSprite = false;
        this.spriteScale = 0.625; // Default for 64px frames
        this.createToken();

        // Apply starting bonuses (Princess Aurelia's Royal Tax)
        if (characterData && characterData.id === 'aurelia') {
            this.inventory.addRandomItem();
            console.log(`[Player ${playerNumber}] ${this.name} starts with a bonus item!`);
        }

        // Track Elara's Arcane Insight ability uses
        if (characterData && characterData.id === 'elara') {
            this.arcaneInsightUsed = false;
        }

        console.log(`[Player ${playerNumber}] ${this.name} created at tile 1`);
    }

    /**
     * Calculate offset so multiple players on same tile don't overlap
     *
     * @param {number} playerNumber - Player ID (1-4)
     * @returns {Object} x, y offset values
     */
    calculateStackOffset(playerNumber) {
        const offsets = {
            1: { x: -12, y: -12 },  // Top-left
            2: { x: 12, y: -12 },   // Top-right
            3: { x: -12, y: 12 },   // Bottom-left
            4: { x: 12, y: 12 }     // Bottom-right
        };
        return offsets[playerNumber] || { x: 0, y: 0 };
    }

    /**
     * Create the visual player token
     * Uses sprite sheet if available, otherwise procedural graphics or simple circle
     */
    createToken() {
        const startTile = this.board.getTilePosition(1);
        const x = startTile.x + this.stackOffset.x;
        const y = startTile.y + this.stackOffset.y;

        // Try to use character sprite sheet
        const spriteKey = this.characterData ? `char_${this.characterData.id}` : null;

        if (spriteKey && this.scene.textures.exists(spriteKey)) {
            // Use animated sprite
            this.token = this.scene.add.sprite(x, y, spriteKey);

            // Calculate scale based on actual frame size - target ~60px display
            const frame = this.scene.textures.getFrame(spriteKey, 0);
            const frameSize = frame ? frame.width : 64;
            this.spriteScale = 60 / frameSize;
            this.token.setScale(this.spriteScale);
            this.token.setDepth(10 + this.playerNumber);
            this.tokenText = null;

            // Play full 16-frame animation if it exists, otherwise idle
            const fullAnim = `${spriteKey}_full`;
            const idleAnim = `${spriteKey}_idle`;
            if (this.scene.anims.exists(fullAnim)) {
                this.token.play(fullAnim);
            } else if (this.scene.anims.exists(idleAnim)) {
                this.token.play(idleAnim);
            }

            this.useSprite = true;
        } else if (this.gfx) {
            // Use procedural graphics for stylized knight token
            this.token = this.gfx.createPlayerToken(this.playerNumber);
            this.token.x = x;
            this.token.y = y;
            this.tokenText = null;
            this.useSprite = false;
        } else {
            // Fallback to simple circle
            this.token = this.scene.add.circle(x, y, this.tokenRadius, this.color);
            this.token.setStrokeStyle(3, 0x000000);
            this.token.setDepth(10 + this.playerNumber);

            this.tokenText = this.scene.add.text(x, y, this.playerNumber.toString(), {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5).setDepth(11 + this.playerNumber);
            this.useSprite = false;
        }
    }

    /**
     * Move the player to a specific tile with animation
     *
     * @param {number} targetTile - Destination tile number
     * @param {boolean} instant - If true, teleport instead of animate
     * @returns {Promise} Resolves when movement is complete
     */
    async moveTo(targetTile, instant = false) {
        // Clamp to valid range (use board's totalTiles)
        const maxTile = this.board.totalTiles || 200;
        targetTile = Math.max(1, Math.min(maxTile, targetTile));

        const targetPos = this.board.getTilePosition(targetTile);

        const newX = targetPos.x + this.stackOffset.x;
        const newY = targetPos.y + this.stackOffset.y;

        if (instant) {
            // Instant teleport (for knight/dragon effects)
            this.token.x = newX;
            this.token.y = newY;
            if (this.tokenText) {
                this.tokenText.x = newX;
                this.tokenText.y = newY;
            }
            this.currentTile = targetTile;
            return Promise.resolve();
        }

        // Animated movement using Phaser tweens
        const tweenTargets = this.tokenText ? [this.token, this.tokenText] : [this.token];

        return new Promise((resolve) => {
            this.scene.tweens.add({
                targets: tweenTargets,
                x: newX,
                y: newY,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    this.currentTile = targetTile;
                    resolve();
                }
            });
        });
    }

    /**
     * Move player tile-by-tile (animated hop movement)
     *
     * @param {number} steps - Number of tiles to move forward
     * @returns {Promise} Resolves when all movement is complete
     */
    async moveSteps(steps) {
        if (this.isMoving || this.hasWon) {
            console.log(`[Player ${this.playerNumber}] Cannot move - already moving or has won`);
            return;
        }

        this.isMoving = true;
        this.playWalkAnimation(); // Start walk animation
        console.log(`[Player ${this.playerNumber}] Rolling ${steps} - moving from tile ${this.currentTile}`);

        // Calculate target tile
        let targetTile = this.currentTile + steps;
        const maxTile = this.board.totalTiles || 200;

        // Check win condition - must land exactly on finish tile
        if (targetTile > maxTile) {
            // Bounce back from finish
            const overshoot = targetTile - maxTile;
            targetTile = maxTile - overshoot;
            console.log(`[Player ${this.playerNumber}] Overshot! Bouncing back to tile ${targetTile}`);
        }

        // Animate tile-by-tile movement and track tiles passed
        const startTile = this.currentTile;
        const direction = targetTile > startTile ? 1 : -1;
        const tilesPassedThrough = []; // Track all tiles passed (not including start)

        for (let t = startTile + direction; direction > 0 ? t <= targetTile : t >= targetTile; t += direction) {
            tilesPassedThrough.push(t);
            await this.moveTo(t);
            // Small delay between hops for visual effect
            await this.delay(100);
        }

        console.log(`[Player ${this.playerNumber}] Landed on tile ${this.currentTile}`);

        // Check for win (reached finish tile)
        if (this.currentTile === maxTile) {
            this.hasWon = true;
            this.playVictoryAnimation(); // Play victory animation
            console.log(`[Player ${this.playerNumber}] 🎉 ${this.name} WINS THE RACE! 🎉`);
            this.isMoving = false;
            return { won: true, tile: maxTile, tilesPassedThrough: tilesPassedThrough };
        }

        // Check for special tile effects
        const effect = this.board.checkSpecialTile(this.currentTile);

        if (effect) {
            // Apply special tile effect after a brief pause
            await this.delay(500);

            if (effect.type === 'knight') {
                // Knights boost immediately - move to destination
                console.log(`[Player ${this.playerNumber}] Knight boosts to tile ${effect.to}!`);
                await this.moveTo(effect.to, false);

                // Re-check for cascading effects (landing on another special tile)
                const cascadeEffect = this.board.checkSpecialTile(this.currentTile);
                if (cascadeEffect && cascadeEffect.type === 'knight') {
                    console.log(`[Player ${this.playerNumber}] Cascade knight effect!`);
                    await this.delay(500);
                    await this.moveTo(cascadeEffect.to, false);
                }
            }
            // Dragons are handled in game.js via handleDragonEncounter
            // which shows a defense roll modal before deciding movement
            // Encounters/monsters don't move the player, just trigger events
        }

        this.isMoving = false;
        this.playIdleAnimation(); // Return to idle after movement
        return { won: false, tile: this.currentTile, effect: effect, tilesPassedThrough: tilesPassedThrough };
    }

    /**
     * Helper function for delays in async movement
     *
     * @param {number} ms - Milliseconds to wait
     * @returns {Promise} Resolves after delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get current player position
     *
     * @returns {Object} Current tile data
     */
    getPosition() {
        return {
            tile: this.currentTile,
            ...this.board.getTilePosition(this.currentTile)
        };
    }

    /**
     * Reset player to starting position
     */
    reset() {
        this.currentTile = 1;
        this.hasWon = false;
        this.isMoving = false;
        this.clearStatusEffects();
        this.inventory.clear();
        this.moveTo(1, true);
        console.log(`[Player ${this.playerNumber}] Reset to start`);
    }

    /**
     * Apply a status effect
     */
    applyStatusEffect(effect) {
        switch(effect.type) {
            case 'stun':
                this.statusEffects.stunned = true;
                console.log(`[Player ${this.playerNumber}] STUNNED - will skip next turn`);
                break;
            case 'slow':
                this.statusEffects.slowed = true;
                this.statusEffects.slowValue = effect.value || 0.5;
                console.log(`[Player ${this.playerNumber}] SLOWED - movement halved next turn`);
                break;
            case 'reverse':
                this.statusEffects.reversed = true;
                console.log(`[Player ${this.playerNumber}] REVERSED - will move backwards next turn`);
                break;
            case 'knockback':
                // Immediate effect - move back X spaces
                const newTile = Math.max(1, this.currentTile - effect.value);
                this.moveTo(newTile);
                console.log(`[Player ${this.playerNumber}] KNOCKBACK - moved back to tile ${newTile}`);
                break;
            case 'lose_item':
                const lostItem = this.inventory.removeRandomItem();
                if (lostItem) {
                    console.log(`[Player ${this.playerNumber}] Lost item: ${lostItem.name}`);
                }
                break;
        }
    }

    /**
     * Clear all status effects (called at end of affected turn)
     */
    clearStatusEffects() {
        this.statusEffects = {
            stunned: false,
            slowed: false,
            reversed: false,
            burned: false
        };
    }

    /**
     * Check if player can take their turn
     */
    canTakeTurn() {
        if (this.statusEffects.stunned) {
            console.log(`[Player ${this.playerNumber}] is stunned - skipping turn`);
            this.statusEffects.stunned = false; // Clear after skipping
            return false;
        }
        return true;
    }

    /**
     * Modify dice roll based on status effects
     */
    modifyRoll(roll) {
        let modifiedRoll = roll;

        // Burned - subtract 1 from roll (fire zone effect)
        if (this.statusEffects.burned) {
            modifiedRoll = Math.max(1, roll - 1); // Minimum 1
            this.statusEffects.burned = false; // Clear after applying
            console.log(`[Player ${this.playerNumber}] Burned: ${roll} -> ${modifiedRoll}`);
        }

        // Slowed - halve movement
        if (this.statusEffects.slowed) {
            modifiedRoll = Math.floor(modifiedRoll * (this.statusEffects.slowValue || 0.5));
            modifiedRoll = Math.max(1, modifiedRoll); // Minimum 1
            this.statusEffects.slowed = false; // Clear after applying
            console.log(`[Player ${this.playerNumber}] Slowed: ${roll} -> ${modifiedRoll}`);
        }

        // Reversed - move backwards (handled in moveSteps)
        if (this.statusEffects.reversed) {
            modifiedRoll = -modifiedRoll;
            this.statusEffects.reversed = false;
            console.log(`[Player ${this.playerNumber}] Reversed: moving backwards ${Math.abs(modifiedRoll)}`);
        }

        return modifiedRoll;
    }

    /**
     * Check if player has Kaelen's Parkour ability active
     */
    hasParkourChoice(roll) {
        return this.characterData &&
               this.characterData.id === 'kaelen' &&
               roll === 6;
    }

    /**
     * Check if player can use Elara's Arcane Insight ability
     */
    canUseArcaneInsight() {
        return this.characterData &&
               this.characterData.id === 'elara' &&
               !this.arcaneInsightUsed;
    }

    /**
     * Use Elara's Arcane Insight ability (marks as used)
     */
    useArcaneInsight() {
        if (this.canUseArcaneInsight()) {
            this.arcaneInsightUsed = true;
            return true;
        }
        return false;
    }

    /**
     * Highlight this player (for current turn indicator)
     *
     * @param {boolean} active - Whether this player is the active player
     */
    setActive(active) {
        const baseScale = this.useSprite ? (this.spriteScale || 0.625) : 1;

        if (active) {
            // Add pulsing glow effect
            this.scene.tweens.add({
                targets: this.token,
                scaleX: baseScale * 1.2,
                scaleY: baseScale * 1.2,
                duration: 300,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        } else {
            // Remove all tweens and reset scale
            this.scene.tweens.killTweensOf(this.token);
            this.token.setScale(baseScale);
        }
    }

    /**
     * Play walk animation during movement
     */
    playWalkAnimation() {
        if (this.useSprite && this.characterData) {
            const walkAnim = `char_${this.characterData.id}_walk`;
            if (this.scene.anims.exists(walkAnim)) {
                this.token.play(walkAnim);
            }
        }
    }

    /**
     * Play idle animation
     */
    playIdleAnimation() {
        if (this.useSprite && this.characterData) {
            const idleAnim = `char_${this.characterData.id}_idle`;
            if (this.scene.anims.exists(idleAnim)) {
                this.token.play(idleAnim);
            }
        }
    }

    /**
     * Play victory animation
     */
    playVictoryAnimation() {
        if (this.useSprite && this.characterData) {
            const victoryAnim = `char_${this.characterData.id}_victory`;
            if (this.scene.anims.exists(victoryAnim)) {
                this.token.play(victoryAnim);
            }
        }
    }

    /**
     * Play action/hurt animation (used when taking damage, using items, etc.)
     * @param {Function} onComplete - Optional callback when animation completes
     */
    playActionAnimation(onComplete = null) {
        if (this.useSprite && this.characterData) {
            const actionAnim = `char_${this.characterData.id}_action`;
            if (this.scene.anims.exists(actionAnim)) {
                this.token.play(actionAnim);
                if (onComplete) {
                    this.token.once('animationcomplete', () => {
                        // Return to idle after action
                        this.playIdleAnimation();
                        onComplete();
                    });
                } else {
                    // Auto-return to idle after action
                    this.token.once('animationcomplete', () => {
                        this.playIdleAnimation();
                    });
                }
            } else if (onComplete) {
                onComplete();
            }
        } else if (onComplete) {
            onComplete();
        }
    }

    /**
     * Play full animation cycle (all 16 frames)
     * @param {Function} onComplete - Optional callback when animation completes
     */
    playFullAnimation(onComplete = null) {
        if (this.useSprite && this.characterData) {
            const fullAnim = `char_${this.characterData.id}_full`;
            if (this.scene.anims.exists(fullAnim)) {
                this.token.play(fullAnim);
                if (onComplete) {
                    this.token.once('animationcomplete', onComplete);
                }
            } else if (onComplete) {
                onComplete();
            }
        } else if (onComplete) {
            onComplete();
        }
    }
}

// Export for use in other files
// export default Player;
