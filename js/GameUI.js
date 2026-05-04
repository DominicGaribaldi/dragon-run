/**
 * DRAGON RUN: THE ROYAL RACE
 * GameUI.js - UI components for character select, encounters, inventory
 */

class GameUI {
    constructor(scene) {
        this.scene = scene;

        // UI containers
        this.characterSelectContainer = null;
        this.modalElements = [];
        this.encounterModalContainer = null; // Legacy reference
        this.inventoryContainer = null;

        // Callbacks
        this.onCharacterSelected = null;
        this.onEncounterComplete = null;
        this.onItemUsed = null;

        // State
        this.isModalOpen = false;
    }

    // =========================================================================
    // CHARACTER SELECTION SCREEN
    // =========================================================================

    /**
     * Show character selection screen
     * @param {number} playerNumber - Which player is selecting (1-4)
     * @param {Array} excludeIds - Character IDs already taken
     * @param {Function} callback - Called with selected character data
     */
    showCharacterSelect(playerNumber, excludeIds = [], callback) {
        this.onCharacterSelected = callback;
        this.isModalOpen = true;

        // Get screen dimensions
        const screenW = this.scene.scale.width;
        const screenH = this.scene.scale.height;
        const centerX = screenW / 2;
        const centerY = screenH / 2;

        // Create container
        this.characterSelectContainer = this.scene.add.container(0, 0);
        this.characterSelectContainer.setDepth(200);
        this.characterSelectContainer.setScrollFactor(0);

        // Dark background overlay
        const overlay = this.scene.add.rectangle(centerX, centerY, screenW, screenH, 0x000000, 0.95);
        this.characterSelectContainer.add(overlay);

        // Use character select background image if available - fill viewport
        if (this.scene.textures.exists('ui_character_select')) {
            const bgImg = this.scene.add.image(centerX, centerY, 'ui_character_select');
            // Fill the entire viewport
            bgImg.setDisplaySize(screenW, screenH);
            bgImg.setAlpha(0.3); // Dim the background
            this.characterSelectContainer.add(bgImg);
        }

        // Character cards - single row layout
        const characters = CharacterData.getAllCharacters();

        // Calculate card positions - spread evenly across the screen in one row
        const numChars = characters.length; // 6 characters
        const totalWidth = screenW - 100; // Leave 50px padding on each side
        const colSpacing = totalWidth / numChars;

        // Card dimensions - larger cards
        const cardWidth = Math.min(180, colSpacing - 20);
        const cardHeight = cardWidth * 1.5;

        // Y position for the single row - moved up to make room for heading below
        const cardY = centerY - 100;

        characters.forEach((char, index) => {
            // Position in single row, centered
            const x = 50 + colSpacing / 2 + index * colSpacing;

            const isAvailable = !excludeIds.includes(char.id);
            this.createCharacterCard(x, cardY, char, isAvailable, index, cardWidth, cardHeight, 1);
        });

        // Player number indicator - positioned below the cards
        const playerText = this.scene.add.text(centerX, screenH - 60, `PLAYER ${playerNumber}`, {
            fontSize: '36px',
            fontFamily: 'Georgia, serif',
            color: '#c9a227',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        this.characterSelectContainer.add(playerText);
    }

    /**
     * Create a character selection card
     * @param {number} x - Card center X
     * @param {number} y - Card center Y
     * @param {Object} character - Character data
     * @param {boolean} isAvailable - Whether character can be selected
     * @param {number} index - Character index
     * @param {number} cardWidth - Card width (default 180)
     * @param {number} cardHeight - Card height (default 320)
     * @param {number} scale - Scale factor (default 1)
     */
    createCharacterCard(x, y, character, isAvailable, index, cardWidth = 180, cardHeight = 320, scale = 1) {
        // Use high-res card artwork if available
        const cardKey = character.cardKey || `card_${character.id}`;
        const spriteKey = `char_${character.id}`;

        // Card dimensions - MTG style cards are 512x768, scale to fit slot
        const cardDisplayW = cardWidth;
        const cardDisplayH = cardWidth * 1.5; // 2:3 aspect ratio

        // Store base Y position for pop-up effect
        const baseY = y;
        const popUpAmount = 15; // How much to pop up on hover

        if (this.scene.textures.exists(cardKey)) {
            // Create card artwork image
            const cardImage = this.scene.add.image(x, baseY, cardKey);
            cardImage.setDisplaySize(cardDisplayW, cardDisplayH);
            cardImage.setAlpha(isAvailable ? 1 : 0.35);
            this.characterSelectContainer.add(cardImage);

            // Add colored glow/border behind card
            const glowBg = this.scene.add.graphics();
            glowBg.fillStyle(character.color, isAvailable ? 0.2 : 0.08);
            glowBg.fillRoundedRect(x - cardDisplayW/2 - 4, baseY - cardDisplayH/2 - 4, cardDisplayW + 8, cardDisplayH + 8, 8);
            this.characterSelectContainer.add(glowBg);
            this.characterSelectContainer.sendToBack(glowBg);

            // Store references for hover effects
            character._cardImage = cardImage;
            character._glow = glowBg;
            character._cardW = cardDisplayW;
            character._cardH = cardDisplayH;
            character._baseY = baseY;
        } else if (this.scene.textures.exists(spriteKey)) {
            // Fallback to sprite sheet
            const spriteSize = 64 * scale * 1.5;
            const sprite = this.scene.add.sprite(x, baseY, spriteKey, 0);
            sprite.setDisplaySize(spriteSize, spriteSize);
            sprite.setAlpha(isAvailable ? 1 : 0.4);

            const idleAnim = `${spriteKey}_idle`;
            if (this.scene.anims.exists(idleAnim)) {
                sprite.play(idleAnim);
            }

            this.characterSelectContainer.add(sprite);

            const glowBg = this.scene.add.graphics();
            glowBg.fillStyle(character.color, isAvailable ? 0.3 : 0.1);
            glowBg.fillCircle(x, baseY, spriteSize * 0.55);
            this.characterSelectContainer.add(glowBg);
            this.characterSelectContainer.sendToBack(glowBg);

            character._sprite = sprite;
            character._glow = glowBg;
            character._spriteSize = spriteSize;
            character._baseY = baseY;
        } else {
            // Fallback: colored circle with initial
            const portrait = this.scene.add.graphics();
            portrait.fillStyle(character.color, isAvailable ? 1 : 0.3);
            portrait.fillCircle(x, baseY, 35 * scale);
            portrait.lineStyle(3, 0x000000, 0.5);
            portrait.strokeCircle(x, baseY, 35 * scale);
            this.characterSelectContainer.add(portrait);

            const initial = this.scene.add.text(x, baseY, character.name[0], {
                fontSize: `${32 * scale}px`,
                fontFamily: 'Georgia, serif',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5).setAlpha(isAvailable ? 1 : 0.3);
            this.characterSelectContainer.add(initial);
        }

        // Dark background panel for text - same width as card, flush underneath
        // Create gradient effect from dark (top) to transparent (bottom)
        const textBgTop = character._cardImage ? baseY + cardDisplayH/2 : baseY + 60 * scale;
        const textBgHeight = 120;
        const textBg = this.scene.add.graphics();

        // Draw gradient using multiple rectangles (dark to transparent)
        const gradientSteps = 8;
        for (let i = 0; i < gradientSteps; i++) {
            const alpha = 0.85 - (i * 0.1); // Fade from 0.85 to 0.05
            const stepHeight = textBgHeight / gradientSteps;
            textBg.fillStyle(0x000000, Math.max(0.05, alpha));
            textBg.fillRect(x - cardDisplayW/2, textBgTop + (i * stepHeight), cardDisplayW, stepHeight);
        }
        this.characterSelectContainer.add(textBg);

        // Name - positioned in the gradient area below card
        const nameY = character._cardImage ? baseY + cardDisplayH/2 + 15 : baseY + 55 * scale;
        const name = this.scene.add.text(x, nameY, character.name, {
            fontSize: '16px',
            fontFamily: 'Georgia, serif',
            color: isAvailable ? '#ffffff' : '#666666',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.characterSelectContainer.add(name);
        character._nameText = name;

        // Title - positioned below name
        const titleY = nameY + 18;
        const title = this.scene.add.text(x, titleY, character.title, {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: isAvailable ? '#c9a227' : '#555555',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        this.characterSelectContainer.add(title);
        character._titleText = title;

        // Passive ability info - compact layout
        if (character.passive) {
            const abilityY = titleY + 18;
            const abilityName = this.scene.add.text(x, abilityY, `⚡ ${character.passive.name}`, {
                fontSize: '11px',
                fontFamily: 'Arial',
                color: isAvailable ? '#66bbff' : '#556666',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
            this.characterSelectContainer.add(abilityName);

            // Ability description - wrap text for longer descriptions
            const abilityDescY = abilityY + 14;
            const abilityDesc = this.scene.add.text(x, abilityDescY, character.passive.description, {
                fontSize: '10px',
                fontFamily: 'Arial',
                color: isAvailable ? '#aaaaaa' : '#555555',
                wordWrap: { width: cardDisplayW - 10 },
                align: 'center',
                lineSpacing: 1,
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5, 0);
            this.characterSelectContainer.add(abilityDesc);
        }

        // Make clickable if available
        if (isAvailable) {
            const hitH = character._cardImage ? cardDisplayH + 60 : cardHeight;
            const hitArea = this.scene.add.rectangle(x, baseY, cardWidth + 20, hitH, 0xffffff, 0);
            hitArea.setInteractive({ useHandCursor: true });

            hitArea.on('pointerover', () => {
                // Pop up the card (move up slightly)
                if (character._cardImage) {
                    this.scene.tweens.add({
                        targets: character._cardImage,
                        y: character._baseY - popUpAmount,
                        duration: 150,
                        ease: 'Back.easeOut'
                    });
                    // Brighten glow on hover
                    if (character._glow) {
                        character._glow.clear();
                        character._glow.fillStyle(character.color, 0.4);
                        character._glow.fillRoundedRect(x - character._cardW/2 - 6, character._baseY - popUpAmount - character._cardH/2 - 6, character._cardW + 12, character._cardH + 12, 10);
                    }
                } else if (character._sprite) {
                    this.scene.tweens.add({
                        targets: character._sprite,
                        y: character._baseY - popUpAmount,
                        duration: 150,
                        ease: 'Back.easeOut'
                    });
                }
                name.setStyle({ color: '#ffcc00' });
            });

            hitArea.on('pointerout', () => {
                // Return card to original position
                if (character._cardImage) {
                    this.scene.tweens.add({
                        targets: character._cardImage,
                        y: character._baseY,
                        duration: 150,
                        ease: 'Power2'
                    });
                    // Reset glow
                    if (character._glow) {
                        character._glow.clear();
                        character._glow.fillStyle(character.color, 0.2);
                        character._glow.fillRoundedRect(x - character._cardW/2 - 4, character._baseY - character._cardH/2 - 4, character._cardW + 8, character._cardH + 8, 8);
                    }
                } else if (character._sprite) {
                    this.scene.tweens.add({
                        targets: character._sprite,
                        y: character._baseY,
                        duration: 150,
                        ease: 'Power2'
                    });
                }
                name.setStyle({ color: '#ffffff' });
            });

            hitArea.on('pointerdown', () => {
                this.selectCharacter(character, x);
            });

            this.characterSelectContainer.add(hitArea);
        } else {
            // Show polished "TAKEN" banner over the character
            const bannerY = character._cardImage ? baseY : y;

            // Semi-transparent dark overlay on the card area
            const dimOverlay = this.scene.add.graphics();
            dimOverlay.fillStyle(0x000000, 0.5);
            if (character._cardImage) {
                dimOverlay.fillRoundedRect(x - cardDisplayW/2, baseY - cardDisplayH/2, cardDisplayW, cardDisplayH, 8);
            } else {
                dimOverlay.fillCircle(x, baseY, 40 * scale);
            }
            this.characterSelectContainer.add(dimOverlay);

            // Diagonal banner background
            const bannerBg = this.scene.add.graphics();
            bannerBg.fillStyle(0x1a1a2e, 0.95);
            bannerBg.fillRoundedRect(x - 50, bannerY - 15, 100, 30, 6);
            bannerBg.lineStyle(2, 0x666688, 0.8);
            bannerBg.strokeRoundedRect(x - 50, bannerY - 15, 100, 30, 6);
            this.characterSelectContainer.add(bannerBg);

            // "TAKEN" text with elegant styling
            const takenLabel = this.scene.add.text(x, bannerY, 'TAKEN', {
                fontSize: '16px',
                fontFamily: 'Georgia, serif',
                color: '#8888aa',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
            this.characterSelectContainer.add(takenLabel);

            // Small lock icon or decorative elements
            const lockLeft = this.scene.add.text(x - 40, bannerY, '◆', {
                fontSize: '10px',
                color: '#666688'
            }).setOrigin(0.5);
            const lockRight = this.scene.add.text(x + 40, bannerY, '◆', {
                fontSize: '10px',
                color: '#666688'
            }).setOrigin(0.5);
            this.characterSelectContainer.add(lockLeft);
            this.characterSelectContainer.add(lockRight);
        }
    }

    /**
     * Handle character selection
     * @param {Object} character - Selected character data
     * @param {number} cardX - X position of the card for glow effect
     */
    selectCharacter(character, cardX) {
        console.log(`[GameUI] Selected: ${character.name}`);

        // Add yellow glow around selected card
        if (character._glow && character._cardImage) {
            character._glow.clear();
            // Bright yellow glow
            character._glow.fillStyle(0xffdd00, 0.6);
            character._glow.fillRoundedRect(
                cardX - character._cardW/2 - 12,
                character._baseY - character._cardH/2 - 12,
                character._cardW + 24,
                character._cardH + 24,
                14
            );
            // Inner brighter glow
            character._glow.fillStyle(0xffff66, 0.4);
            character._glow.fillRoundedRect(
                cardX - character._cardW/2 - 6,
                character._baseY - character._cardH/2 - 6,
                character._cardW + 12,
                character._cardH + 12,
                10
            );
        }

        // Brief delay to show the yellow glow, then proceed
        this.scene.time.delayedCall(300, () => {
            // Destroy container
            if (this.characterSelectContainer) {
                this.characterSelectContainer.destroy();
                this.characterSelectContainer = null;
            }
            this.isModalOpen = false;

            if (this.onCharacterSelected) {
                this.onCharacterSelected(character);
            }
        });
    }

    /**
     * Close character select without selection
     */
    closeCharacterSelect() {
        if (this.characterSelectContainer) {
            this.characterSelectContainer.destroy();
            this.characterSelectContainer = null;
            this.isModalOpen = false;
        }
    }

    // =========================================================================
    // ENCOUNTER MODAL
    // =========================================================================

    /**
     * Show encounter modal (dragon, monster, etc.)
     * @param {Object} encounter - Encounter data from EncounterData
     * @param {Object} player - Player who triggered it
     * @param {Function} callback - Called with result { success, roll, effect }
     */
    showEncounterModal(encounter, player, callback) {
        this.onEncounterComplete = callback;
        this.isModalOpen = true;

        // Get screen dimensions for centering
        const screenW = this.scene.scale.width;
        const screenH = this.scene.scale.height;
        const centerX = screenW / 2;
        const centerY = screenH / 2;

        // Store all modal elements for cleanup
        this.modalElements = [];

        // Background overlay - covers full screen
        const overlay = this.scene.add.rectangle(centerX, centerY, screenW, screenH, 0x000000, 0.9);
        overlay.setDepth(200);
        overlay.setScrollFactor(0);
        overlay.setInteractive();
        this.modalElements.push(overlay);

        // Store center for use in other modal methods
        this.modalCenterX = centerX;
        this.modalCenterY = centerY;

        // Modal box dimensions - larger to accommodate bigger images
        const modalW = 500;
        const modalH = 650;

        // Border color based on encounter type
        let borderColor = 0xc9a227;
        let glowColor = 0xc9a227;
        if (encounter.headTile) { borderColor = 0xff6644; glowColor = 0xff4422; } // Dragon
        else if (encounter.baseTile) { borderColor = 0xffd700; glowColor = 0xffaa00; } // Knight
        else if (encounter.tile) { borderColor = 0xbb66ff; glowColor = 0x9944dd; } // Monster

        // Outer glow effect
        const glow = this.scene.add.graphics();
        glow.fillStyle(glowColor, 0.15);
        glow.fillRoundedRect(centerX - modalW/2 - 15, centerY - modalH/2 - 15, modalW + 30, modalH + 30, 24);
        glow.fillStyle(glowColor, 0.08);
        glow.fillRoundedRect(centerX - modalW/2 - 25, centerY - modalH/2 - 25, modalW + 50, modalH + 50, 32);
        glow.setDepth(201);
        glow.setScrollFactor(0);
        this.modalElements.push(glow);

        // Modal background with gradient effect
        const modalBg = this.scene.add.graphics();
        // Dark background
        modalBg.fillStyle(0x0d0d1a, 1);
        modalBg.fillRoundedRect(centerX - modalW/2, centerY - modalH/2, modalW, modalH, 16);
        // Subtle inner gradient
        modalBg.fillStyle(0x1a1a2e, 0.5);
        modalBg.fillRoundedRect(centerX - modalW/2 + 4, centerY - modalH/2 + 4, modalW - 8, modalH/2, 14);
        // Border
        modalBg.lineStyle(3, borderColor, 1);
        modalBg.strokeRoundedRect(centerX - modalW/2, centerY - modalH/2, modalW, modalH, 16);
        // Inner highlight line
        modalBg.lineStyle(1, borderColor, 0.3);
        modalBg.strokeRoundedRect(centerX - modalW/2 + 6, centerY - modalH/2 + 6, modalW - 12, modalH - 12, 12);
        modalBg.setDepth(202);
        modalBg.setScrollFactor(0);
        this.modalElements.push(modalBg);

        // Encounter name with better styling
        const name = this.scene.add.text(centerX, centerY - modalH/2 + 35, encounter.name.toUpperCase(), {
            fontSize: '22px',
            fontFamily: 'Georgia, serif',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        name.setDepth(203);
        name.setScrollFactor(0);
        this.modalElements.push(name);

        // Title/subtitle if exists
        if (encounter.title) {
            const title = this.scene.add.text(centerX, centerY - modalH/2 + 58, encounter.title, {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: Phaser.Display.Color.ValueToColor(borderColor).rgba
            }).setOrigin(0.5);
            title.setDepth(203);
            title.setScrollFactor(0);
            this.modalElements.push(title);
        }

        // Encounter image - prefer encounter card image, fallback to sprite sheet
        const encounterImgKey = `encounter_${encounter.id || 'default'}`;
        const useEncounterCard = this.scene.textures.exists(encounterImgKey);
        const imgKey = useEncounterCard ? encounterImgKey : encounter.spriteKey;

        // Image positioned prominently - 3x larger
        const imgY = centerY - 40;
        const imgSize = 380;

        if (imgKey && this.scene.textures.exists(imgKey)) {
            let img;
            if (useEncounterCard) {
                img = this.scene.add.image(centerX, imgY, imgKey);
                const frame = this.scene.textures.getFrame(imgKey);
                const scale = Math.min(imgSize / frame.width, imgSize / frame.height);
                img.setScale(scale);
            } else {
                // Sprite sheets - much larger display (3x)
                img = this.scene.add.sprite(centerX, imgY, imgKey, 0);
                img.setDisplaySize(imgSize, imgSize);
                // Play full 16-frame animation if available
                const fullAnim = `${imgKey}_full`;
                const idleAnim = `${imgKey}_idle`;
                if (this.scene.anims.exists(fullAnim)) {
                    img.play(fullAnim);
                } else if (this.scene.anims.exists(idleAnim)) {
                    img.play(idleAnim);
                }
            }
            img.setDepth(203);
            img.setScrollFactor(0);
            this.modalElements.push(img);

            // Store sprite reference
            this.encounterSprite = img;
            this.encounterSpriteKey = imgKey;
        }

        // Description - positioned below larger image
        const desc = this.scene.add.text(centerX, centerY + 170, encounter.description, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#aaaaaa',
            wordWrap: { width: modalW - 60 },
            align: 'center',
            lineSpacing: 4
        }).setOrigin(0.5);
        desc.setDepth(203);
        desc.setScrollFactor(0);
        this.modalElements.push(desc);

        // Store border color for buttons
        this.modalBorderColor = borderColor;

        // Check if this needs a roll
        const needsRoll = encounter.defenseCheck || encounter.encounterCheck;

        if (needsRoll) {
            this.showRollInterface(encounter, player);
        } else {
            this.showAutoResolve(encounter, player);
        }
    }

    /**
     * Show roll interface for encounters
     */
    showRollInterface(encounter, player) {
        const cx = this.modalCenterX;
        const cy = this.modalCenterY;
        const check = encounter.defenseCheck || encounter.encounterCheck;

        // Show what's needed
        let requirement = '';
        if (check.type === 'even') {
            requirement = 'Roll EVEN (2, 4, 6) to succeed';
        } else if (check.type === 'odd') {
            requirement = 'Roll ODD (1, 3, 5) to succeed';
        } else {
            let threshold = check.successMin;
            if (player.characterData && player.characterData.id === 'pippin' && encounter.encounterCheck) {
                threshold = Math.max(threshold - 2, 2);
            }
            requirement = `Roll ${threshold}+ to succeed`;
        }

        const reqText = this.scene.add.text(cx, cy + 220, requirement, {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffdd44',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        reqText.setDepth(203);
        reqText.setScrollFactor(0);
        this.modalElements.push(reqText);

        // Check for armor shard
        const hasArmorShard = player.inventory && player.inventory.hasItem('armor_shard') && encounter.headTile;

        if (hasArmorShard) {
            const armorText = this.scene.add.text(cx, cy + 250, 'ARMOR SHARD will auto-block this!', {
                fontSize: '13px',
                fontFamily: 'Arial',
                color: '#00ff88'
            }).setOrigin(0.5);
            armorText.setDepth(203);
            armorText.setScrollFactor(0);
            this.modalElements.push(armorText);
        }

        // Check if player has smoke bomb for escape option
        const hasSmokeBomb = player.inventory && player.inventory.hasItem('smoke_bomb') && encounter.tile;

        // Calculate button positions based on whether we have two buttons
        const rollBtnX = hasSmokeBomb ? cx - 105 : cx;

        // Roll button - create directly on scene (not in container)
        const rollBtn = this.createModalButton(rollBtnX, cy + 290, 'ROLL DICE', () => {
            this.performEncounterRoll(encounter, player);
        }, this.modalBorderColor || 0xc9a227);
        this.modalElements.push(rollBtn);

        // Add escape button if player has smoke bomb
        if (hasSmokeBomb) {
            const escapeBtn = this.createModalButton(cx + 105, cy + 290, 'ESCAPE', () => {
                player.inventory.useItem('smoke_bomb');
                this.resolveEncounter(encounter, player, { success: true, escaped: true });
            }, 0x555577);
            this.modalElements.push(escapeBtn);
        }
    }

    /**
     * Create a high-quality modal button (added directly to scene)
     */
    createModalButton(x, y, text, callback, color = 0xc9a227) {
        const btnW = 180;
        const btnH = 45;

        // Button background
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x0a0a12, 1);
        bg.fillRoundedRect(x - btnW/2, y - btnH/2, btnW, btnH, 10);
        bg.fillStyle(color, 0.2);
        bg.fillRoundedRect(x - btnW/2 + 2, y - btnH/2 + 2, btnW - 4, btnH - 4, 8);
        bg.lineStyle(2, color, 1);
        bg.strokeRoundedRect(x - btnW/2, y - btnH/2, btnW, btnH, 10);
        bg.setDepth(204);
        bg.setScrollFactor(0);

        // Button label
        const label = this.scene.add.text(x, y, text, {
            fontSize: '15px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        label.setDepth(205);
        label.setScrollFactor(0);

        // Hit area for interaction
        const hitArea = this.scene.add.rectangle(x, y, btnW, btnH, 0x000000, 0);
        hitArea.setDepth(206);
        hitArea.setScrollFactor(0);
        hitArea.setInteractive({ useHandCursor: true });

        // Hover effects
        hitArea.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x1a1a24, 1);
            bg.fillRoundedRect(x - btnW/2, y - btnH/2, btnW, btnH, 10);
            bg.fillStyle(color, 0.4);
            bg.fillRoundedRect(x - btnW/2 + 2, y - btnH/2 + 2, btnW - 4, btnH - 4, 8);
            bg.lineStyle(3, color, 1);
            bg.strokeRoundedRect(x - btnW/2, y - btnH/2, btnW, btnH, 10);
            label.setScale(1.05);
        });

        hitArea.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x0a0a12, 1);
            bg.fillRoundedRect(x - btnW/2, y - btnH/2, btnW, btnH, 10);
            bg.fillStyle(color, 0.2);
            bg.fillRoundedRect(x - btnW/2 + 2, y - btnH/2 + 2, btnW - 4, btnH - 4, 8);
            bg.lineStyle(2, color, 1);
            bg.strokeRoundedRect(x - btnW/2, y - btnH/2, btnW, btnH, 10);
            label.setScale(1);
        });

        hitArea.on('pointerdown', () => {
            callback();
        });

        // Return container-like object for position updates and cleanup
        const btnGroup = { bg, label, hitArea, x, y };
        btnGroup.destroy = () => {
            bg.destroy();
            label.destroy();
            hitArea.destroy();
        };

        return btnGroup;
    }

    /**
     * Perform the roll and show result
     */
    performEncounterRoll(encounter, player) {
        // Clear current modal elements and rebuild with result
        this.clearModalElements();

        const cx = this.modalCenterX;
        const cy = this.modalCenterY;

        // Roll dice
        const roll = Math.floor(Math.random() * 6) + 1;

        // Rebuild base modal
        this.rebuildModalBase(encounter);

        // Show rolling dice animation
        if (this.scene.textures.exists('ui_dice')) {
            const rollingDice = this.scene.add.sprite(cx, cy - 20, 'ui_dice', 0);
            rollingDice.setDisplaySize(90, 90);
            rollingDice.setDepth(205);
            rollingDice.setScrollFactor(0);
            this.modalElements.push(rollingDice);

            // Animate through dice faces rapidly
            let frameIndex = 0;
            this.scene.time.addEvent({
                delay: 80,
                callback: () => {
                    frameIndex = (frameIndex + 1) % 6;
                    rollingDice.setFrame(frameIndex);
                },
                repeat: 10
            });

            // Shake the dice while rolling
            this.scene.tweens.add({
                targets: rollingDice,
                angle: { from: -15, to: 15 },
                duration: 100,
                yoyo: true,
                repeat: 5,
                ease: 'Sine.easeInOut'
            });

            // After rolling, show the result
            this.scene.time.delayedCall(900, () => {
                this.clearModalElements();
                this.showFinalRoll(encounter, player, roll);
            });
        } else {
            this.showFinalRoll(encounter, player, roll);
        }
    }

    /**
     * Clear all modal elements
     */
    clearModalElements() {
        if (this.modalElements) {
            this.modalElements.forEach(el => {
                if (el && el.destroy) el.destroy();
            });
            this.modalElements = [];
        }
    }

    /**
     * Rebuild base modal structure
     */
    rebuildModalBase(encounter) {
        const screenW = this.scene.scale.width;
        const screenH = this.scene.scale.height;
        const cx = this.modalCenterX;
        const cy = this.modalCenterY;
        const modalW = 420;
        const modalH = 520;

        // Border color
        let borderColor = 0xc9a227;
        let glowColor = 0xc9a227;
        if (encounter.headTile) { borderColor = 0xff6644; glowColor = 0xff4422; }
        else if (encounter.baseTile) { borderColor = 0xffd700; glowColor = 0xffaa00; }
        else if (encounter.tile) { borderColor = 0xbb66ff; glowColor = 0x9944dd; }
        this.modalBorderColor = borderColor;

        // Overlay
        const overlay = this.scene.add.rectangle(cx, cy, screenW, screenH, 0x000000, 0.9);
        overlay.setDepth(200);
        overlay.setScrollFactor(0);
        overlay.setInteractive();
        this.modalElements.push(overlay);

        // Glow
        const glow = this.scene.add.graphics();
        glow.fillStyle(glowColor, 0.15);
        glow.fillRoundedRect(cx - modalW/2 - 15, cy - modalH/2 - 15, modalW + 30, modalH + 30, 24);
        glow.setDepth(201);
        glow.setScrollFactor(0);
        this.modalElements.push(glow);

        // Background
        const modalBg = this.scene.add.graphics();
        modalBg.fillStyle(0x0d0d1a, 1);
        modalBg.fillRoundedRect(cx - modalW/2, cy - modalH/2, modalW, modalH, 16);
        modalBg.fillStyle(0x1a1a2e, 0.5);
        modalBg.fillRoundedRect(cx - modalW/2 + 4, cy - modalH/2 + 4, modalW - 8, modalH/2, 14);
        modalBg.lineStyle(3, borderColor, 1);
        modalBg.strokeRoundedRect(cx - modalW/2, cy - modalH/2, modalW, modalH, 16);
        modalBg.lineStyle(1, borderColor, 0.3);
        modalBg.strokeRoundedRect(cx - modalW/2 + 6, cy - modalH/2 + 6, modalW - 12, modalH - 12, 12);
        modalBg.setDepth(202);
        modalBg.setScrollFactor(0);
        this.modalElements.push(modalBg);

        // Name
        const name = this.scene.add.text(cx, cy - modalH/2 + 35, encounter.name.toUpperCase(), {
            fontSize: '22px',
            fontFamily: 'Georgia, serif',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        name.setDepth(203);
        name.setScrollFactor(0);
        this.modalElements.push(name);
    }

    /**
     * Show final roll result after animation
     */
    showFinalRoll(encounter, player, roll) {
        // Rebuild modal
        this.rebuildModalBase(encounter);

        // Check for armor shard auto-save
        if (encounter.headTile && player.inventory && player.inventory.hasItem('armor_shard')) {
            player.inventory.useItem('armor_shard');
            this.showRollResult(encounter, player, {
                success: true,
                roll: roll,
                blocked: true,
                message: 'Armor Shard absorbed the attack!'
            });
            return;
        }

        // Perform the check
        const result = EncounterData.performCheck(encounter, roll, player.characterData);
        this.showRollResult(encounter, player, result);
    }

    /**
     * Show roll result
     */
    showRollResult(encounter, player, result) {
        const cx = this.modalCenterX;
        const cy = this.modalCenterY;

        // Large dice display in center
        const diceY = cy - 50;
        if (this.scene.textures.exists('ui_dice')) {
            // Glow behind dice
            const diceGlow = this.scene.add.graphics();
            diceGlow.fillStyle(result.success ? 0x00ff88 : 0xff4444, 0.3);
            diceGlow.fillCircle(cx, diceY, 65);
            diceGlow.setDepth(203);
            diceGlow.setScrollFactor(0);
            this.modalElements.push(diceGlow);

            const diceDisplay = this.scene.add.sprite(cx, diceY, 'ui_dice', result.roll - 1);
            diceDisplay.setDisplaySize(100, 100);
            diceDisplay.setDepth(204);
            diceDisplay.setScrollFactor(0);
            this.modalElements.push(diceDisplay);

            // Pop animation
            this.scene.tweens.add({
                targets: diceDisplay,
                scaleX: 1.3,
                scaleY: 1.3,
                duration: 200,
                yoyo: true,
                ease: 'Power2'
            });
        } else {
            const diceDisplay = this.scene.add.text(cx, diceY, result.roll.toString(), {
                fontSize: '72px',
                fontFamily: 'Georgia, serif',
                color: result.success ? '#00ff88' : '#ff4444',
                stroke: '#000000',
                strokeThickness: 6
            }).setOrigin(0.5);
            diceDisplay.setDepth(204);
            diceDisplay.setScrollFactor(0);
            this.modalElements.push(diceDisplay);
        }

        // Result label with glow effect
        const resultColor = result.success ? '#00ff88' : '#ff6666';
        const resultLabel = this.scene.add.text(cx, cy + 50, result.success ? 'SUCCESS!' : 'FAILED!', {
            fontSize: '36px',
            fontFamily: 'Georgia, serif',
            color: resultColor,
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5);
        resultLabel.setDepth(204);
        resultLabel.setScrollFactor(0);
        this.modalElements.push(resultLabel);

        // Pulse animation
        this.scene.tweens.add({
            targets: resultLabel,
            scaleX: 1.15,
            scaleY: 1.15,
            duration: 300,
            yoyo: true,
            repeat: 1,
            ease: 'Sine.easeInOut'
        });

        // Message
        const message = this.scene.add.text(cx, cy + 105, result.message, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#aaaaaa',
            wordWrap: { width: 340 },
            align: 'center',
            lineSpacing: 3
        }).setOrigin(0.5);
        message.setDepth(203);
        message.setScrollFactor(0);
        this.modalElements.push(message);

        // Show consequence/effect message for failures (or success effects)
        let consequenceText = '';
        let consequenceColor = '#ffaa44';

        if (!result.success && encounter.failEffect) {
            consequenceText = encounter.failEffect.message;
            consequenceColor = '#ff6666';
        } else if (!result.success && encounter.headTile) {
            // Dragon - show slide back message
            consequenceText = `You slide back to tile ${encounter.tailTile}!`;
            consequenceColor = '#ff6666';
        } else if (result.success && encounter.successEffect) {
            consequenceText = encounter.successEffect.message;
            consequenceColor = '#00ff88';
        }

        if (consequenceText) {
            const consequence = this.scene.add.text(cx, cy + 145, consequenceText, {
                fontSize: '13px',
                fontFamily: 'Arial',
                color: consequenceColor,
                wordWrap: { width: 340 },
                align: 'center',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            consequence.setDepth(203);
            consequence.setScrollFactor(0);
            this.modalElements.push(consequence);
        }

        // Continue button after delay
        this.scene.time.delayedCall(700, () => {
            const continueBtn = this.createModalButton(cx, cy + 200, 'CONTINUE', () => {
                this.resolveEncounter(encounter, player, result);
            }, this.modalBorderColor);
            this.modalElements.push(continueBtn);
        });
    }

    /**
     * Show auto-resolve for knights and special tiles
     */
    showAutoResolve(encounter, player) {
        const cx = this.modalCenterX;
        const cy = this.modalCenterY;

        let message = '';
        let effect = null;

        if (encounter.baseTile) {
            message = encounter.boostMessage;
            effect = { type: 'teleport', destination: encounter.destinationTile };
            if (player.characterData && player.characterData.id === 'grizelda') {
                effect.bonus = 2;
                message += ' (+2 bonus from Shortcuts!)';
            }
        } else if (encounter.effect) {
            message = encounter.effect.message;
            effect = encounter.effect;
        }

        const msgText = this.scene.add.text(cx, cy + 135, message, {
            fontSize: '15px',
            fontFamily: 'Arial',
            color: '#00ff88',
            wordWrap: { width: 350 },
            align: 'center',
            lineSpacing: 3
        }).setOrigin(0.5);
        msgText.setDepth(203);
        msgText.setScrollFactor(0);
        this.modalElements.push(msgText);

        // Continue button
        this.scene.time.delayedCall(400, () => {
            const continueBtn = this.createModalButton(cx, cy + 200, 'CONTINUE', () => {
                this.resolveEncounter(encounter, player, { success: true, effect: effect });
            }, this.modalBorderColor);
            this.modalElements.push(continueBtn);
        });
    }

    /**
     * Resolve encounter and close modal
     */
    resolveEncounter(encounter, player, result) {
        // Determine final effect
        let effect = result.effect || null;

        if (!result.success && !result.escaped) {
            effect = encounter.failEffect || null;

            // Dragon slide
            if (encounter.tailTile) {
                let destination = encounter.tailTile;
                if (player.characterData && player.characterData.id === 'reginald') {
                    const slideDistance = encounter.headTile - encounter.tailTile;
                    const reducedSlide = Math.max(0, slideDistance - 3);
                    destination = encounter.headTile - reducedSlide;
                }
                effect = { type: 'teleport', destination: destination };
            }
        } else if (result.success && encounter.successEffect) {
            effect = encounter.successEffect;
        }

        // Fade out and cleanup
        const fadeTargets = this.modalElements.filter(el => el && el.setAlpha);
        this.scene.tweens.add({
            targets: fadeTargets,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                this.clearModalElements();
                this.isModalOpen = false;

                if (this.onEncounterComplete) {
                    this.onEncounterComplete({
                        success: result.success,
                        roll: result.roll,
                        effect: effect,
                        encounter: encounter,
                        message: result.message
                    });
                }
            }
        });
    }

    /**
     * Show knight encounter modal (shows illustration before teleport)
     * @param {Object} knight - Knight data from EncounterData
     * @param {Object} player - Player who triggered it
     * @param {Function} callback - Called when player acknowledges
     */
    showKnightEncounterModal(knight, player, callback) {
        this.isModalOpen = true;
        this.modalElements = [];

        const screenW = this.scene.scale.width;
        const screenH = this.scene.scale.height;
        const cx = screenW / 2;
        const cy = screenH / 2;

        // Background overlay
        const overlay = this.scene.add.rectangle(cx, cy, screenW, screenH, 0x000000, 0.9);
        overlay.setDepth(200);
        overlay.setScrollFactor(0);
        overlay.setInteractive();
        this.modalElements.push(overlay);

        // Modal dimensions
        const modalW = 500;
        const modalH = 600;
        const borderColor = 0xffd700; // Gold for knights
        const glowColor = 0xffaa00;

        // Outer glow
        const glow = this.scene.add.graphics();
        glow.fillStyle(glowColor, 0.15);
        glow.fillRoundedRect(cx - modalW/2 - 15, cy - modalH/2 - 15, modalW + 30, modalH + 30, 24);
        glow.fillStyle(glowColor, 0.08);
        glow.fillRoundedRect(cx - modalW/2 - 25, cy - modalH/2 - 25, modalW + 50, modalH + 50, 32);
        glow.setDepth(201);
        glow.setScrollFactor(0);
        this.modalElements.push(glow);

        // Modal background
        const modalBg = this.scene.add.graphics();
        modalBg.fillStyle(0x0d0d1a, 1);
        modalBg.fillRoundedRect(cx - modalW/2, cy - modalH/2, modalW, modalH, 16);
        modalBg.fillStyle(0x1a1a2e, 0.5);
        modalBg.fillRoundedRect(cx - modalW/2 + 4, cy - modalH/2 + 4, modalW - 8, modalH/2, 14);
        modalBg.lineStyle(3, borderColor, 1);
        modalBg.strokeRoundedRect(cx - modalW/2, cy - modalH/2, modalW, modalH, 16);
        modalBg.lineStyle(1, borderColor, 0.3);
        modalBg.strokeRoundedRect(cx - modalW/2 + 6, cy - modalH/2 + 6, modalW - 12, modalH - 12, 12);
        modalBg.setDepth(202);
        modalBg.setScrollFactor(0);
        this.modalElements.push(modalBg);

        // Knight name
        const name = this.scene.add.text(cx, cy - modalH/2 + 35, knight.name.toUpperCase(), {
            fontSize: '24px',
            fontFamily: 'Georgia, serif',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        name.setDepth(203);
        name.setScrollFactor(0);
        this.modalElements.push(name);

        // Title
        if (knight.title) {
            const title = this.scene.add.text(cx, cy - modalH/2 + 60, knight.title, {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: '#ffaa00'
            }).setOrigin(0.5);
            title.setDepth(203);
            title.setScrollFactor(0);
            this.modalElements.push(title);
        }

        // Knight illustration - try encounter card first, then sprite sheet
        const encounterImgKey = `encounter_${knight.id}`;
        const imgKey = this.scene.textures.exists(encounterImgKey) ? encounterImgKey : knight.spriteKey;
        const imgY = cy - 40;
        const imgSize = 350;

        if (imgKey && this.scene.textures.exists(imgKey)) {
            let img;
            if (this.scene.textures.exists(encounterImgKey)) {
                img = this.scene.add.image(cx, imgY, encounterImgKey);
                const frame = this.scene.textures.getFrame(encounterImgKey);
                const scale = Math.min(imgSize / frame.width, imgSize / frame.height);
                img.setScale(scale);
            } else {
                img = this.scene.add.sprite(cx, imgY, imgKey, 0);
                img.setDisplaySize(imgSize, imgSize);
                const fullAnim = `${imgKey}_full`;
                const idleAnim = `${imgKey}_idle`;
                if (this.scene.anims.exists(fullAnim)) {
                    img.play(fullAnim);
                } else if (this.scene.anims.exists(idleAnim)) {
                    img.play(idleAnim);
                }
            }
            img.setDepth(203);
            img.setScrollFactor(0);
            this.modalElements.push(img);
        }

        // Description
        const desc = this.scene.add.text(cx, cy + 150, knight.description, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#aaaaaa',
            wordWrap: { width: modalW - 60 },
            align: 'center'
        }).setOrigin(0.5);
        desc.setDepth(203);
        desc.setScrollFactor(0);
        this.modalElements.push(desc);

        // Boost message
        const boostMsg = this.scene.add.text(cx, cy + 190, `"${knight.boostMessage}"`, {
            fontSize: '16px',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            color: '#ffd700',
            wordWrap: { width: modalW - 60 },
            align: 'center'
        }).setOrigin(0.5);
        boostMsg.setDepth(203);
        boostMsg.setScrollFactor(0);
        this.modalElements.push(boostMsg);

        // Continue button
        const continueBtn = this.createModalButton(cx, cy + 255, 'ONWARD!', () => {
            // Fade out and cleanup
            const fadeTargets = this.modalElements.filter(el => el && el.setAlpha);
            this.scene.tweens.add({
                targets: fadeTargets,
                alpha: 0,
                duration: 200,
                onComplete: () => {
                    this.clearModalElements();
                    this.isModalOpen = false;
                    callback();
                }
            });
        }, borderColor);
        this.modalElements.push(continueBtn);
    }

    // =========================================================================
    // INVENTORY UI
    // =========================================================================

    /**
     * Create inventory display for a player
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} inventory - Player inventory
     * @param {Function} onItemClick - Callback when an item is clicked (item, index)
     */
    createInventoryUI(x, y, inventory, onItemClick = null) {
        const container = this.scene.add.container(x, y);
        container.setDepth(45);

        const slotSize = 40;
        const gap = 5;

        for (let i = 0; i < inventory.maxSlots; i++) {
            const slotX = i * (slotSize + gap);

            // Slot background
            const slotBg = this.scene.add.graphics();
            slotBg.fillStyle(0x1a1a2e, 1);
            slotBg.fillRoundedRect(slotX, 0, slotSize, slotSize, 6);
            slotBg.lineStyle(2, 0x444444, 1);
            slotBg.strokeRoundedRect(slotX, 0, slotSize, slotSize, 6);
            container.add(slotBg);
        }

        // Store reference for updates
        container.slotSize = slotSize;
        container.gap = gap;
        container.inventory = inventory;
        container.itemDisplays = [];
        container.onItemClick = onItemClick;

        this.updateInventoryUI(container);

        return container;
    }

    /**
     * Update inventory display
     */
    updateInventoryUI(container) {
        // Clear existing item displays
        container.itemDisplays.forEach(d => d.destroy());
        container.itemDisplays = [];

        const items = container.inventory.getItems();

        items.forEach((item, i) => {
            const slotX = i * (container.slotSize + container.gap);
            const x = slotX + container.slotSize / 2;
            const y = container.slotSize / 2;

            // Create a container for this item slot to make it interactive
            const itemContainer = this.scene.add.container(x, y);
            container.add(itemContainer);
            container.itemDisplays.push(itemContainer);

            // Try to use actual item sprite if available
            const spriteKey = item.spriteKey || `item_${item.id}`;
            if (this.scene.textures.exists(spriteKey)) {
                const itemSprite = this.scene.add.image(0, 0, spriteKey);
                itemSprite.setDisplaySize(32, 32);
                itemContainer.add(itemSprite);
            } else {
                // Fallback to colored square with initial
                const itemIcon = this.scene.add.graphics();
                const iconColor = this.getItemColor(item.id);
                itemIcon.fillStyle(iconColor, 1);
                itemIcon.fillRoundedRect(-15, -15, 30, 30, 4);
                itemContainer.add(itemIcon);

                // Item initial
                const initial = this.scene.add.text(0, 0, item.name[0], {
                    fontSize: '16px',
                    fontFamily: 'Arial',
                    color: '#ffffff',
                    fontStyle: 'bold'
                }).setOrigin(0.5);
                itemContainer.add(initial);
            }

            // Make item clickable
            itemContainer.setSize(container.slotSize, container.slotSize);
            itemContainer.setInteractive({ useHandCursor: true });

            // Store item reference
            itemContainer.itemData = item;
            itemContainer.itemIndex = i;

            // Hover effect
            itemContainer.on('pointerover', () => {
                this.scene.tweens.add({
                    targets: itemContainer,
                    scaleX: 1.15,
                    scaleY: 1.15,
                    duration: 100
                });
                // Show tooltip
                this.showItemTooltip(item, itemContainer);
            });

            itemContainer.on('pointerout', () => {
                this.scene.tweens.add({
                    targets: itemContainer,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 100
                });
                this.hideItemTooltip();
            });

            // Click handler
            itemContainer.on('pointerdown', () => {
                if (container.onItemClick) {
                    container.onItemClick(item, i);
                }
            });
        });
    }

    /**
     * Show tooltip for an item
     */
    showItemTooltip(item, target) {
        this.hideItemTooltip();

        const screenW = this.scene.scale.width;
        const tooltip = this.scene.add.container(screenW / 2, 70);
        tooltip.setDepth(500);
        tooltip.setScrollFactor(0);
        this.itemTooltip = tooltip;

        // Determine usage info based on item type
        let usageText = '';
        let usageColor = '#888888';
        if (item.type === 'passive') {
            usageText = '⚡ PASSIVE - Triggers automatically';
            usageColor = '#88aaff';
        } else if (item.type === 'active') {
            if (item.timing === 'before_roll') {
                usageText = '🎯 USE: Before rolling dice';
                usageColor = '#88ff88';
            } else if (item.timing === 'after_roll') {
                usageText = '🎯 USE: After any dice roll';
                usageColor = '#88ff88';
            } else if (item.timing === 'during_encounter') {
                usageText = '🎯 USE: During monster encounter';
                usageColor = '#ffaa88';
            } else {
                usageText = '🎯 ACTIVE - Click to use on your turn';
                usageColor = '#88ff88';
            }
        }

        // Background - taller to fit more info
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x0d0d1a, 0.95);
        bg.fillRoundedRect(-160, -35, 320, 70, 8);
        bg.lineStyle(2, this.getItemColor(item.id), 1);
        bg.strokeRoundedRect(-160, -35, 320, 70, 8);
        tooltip.add(bg);

        // Name with rarity color
        const rarityColors = { common: '#ffffff', uncommon: '#44ff88', rare: '#ffaa44' };
        const nameColor = rarityColors[item.rarity] || '#ffffff';
        const name = this.scene.add.text(0, -22, item.name, {
            fontSize: '14px',
            fontFamily: 'Georgia, serif',
            color: nameColor,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        tooltip.add(name);

        // Description
        const desc = this.scene.add.text(0, -4, item.description, {
            fontSize: '11px',
            fontFamily: 'Arial',
            color: '#cccccc'
        }).setOrigin(0.5);
        tooltip.add(desc);

        // Usage info
        const usage = this.scene.add.text(0, 18, usageText, {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: usageColor,
            fontStyle: 'italic'
        }).setOrigin(0.5);
        tooltip.add(usage);

        // Fade in
        tooltip.setAlpha(0);
        this.scene.tweens.add({
            targets: tooltip,
            alpha: 1,
            duration: 150
        });
    }

    /**
     * Hide item tooltip
     */
    hideItemTooltip() {
        if (this.itemTooltip) {
            this.itemTooltip.destroy();
            this.itemTooltip = null;
        }
    }

    /**
     * Show item modal for using an active item
     * @param {Object} item - Item data
     * @param {Object} player - Player who owns the item
     * @param {Function} callback - Called with { used: boolean, effect: Object }
     */
    showItemUseModal(item, player, callback) {
        this.isModalOpen = true;

        const screenW = this.scene.scale.width;
        const screenH = this.scene.scale.height;
        const centerX = screenW / 2;
        const centerY = screenH / 2;

        // Store elements for cleanup
        const modalElements = [];

        // Overlay - directly on scene with scrollFactor 0
        const overlay = this.scene.add.rectangle(centerX, centerY, screenW, screenH, 0x000000, 0.85);
        overlay.setDepth(250);
        overlay.setScrollFactor(0);
        overlay.setInteractive();
        modalElements.push(overlay);

        // Modal background
        const modalW = 350;
        const modalH = 300;
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x1a1a2e, 1);
        bg.fillRoundedRect(centerX - modalW/2, centerY - modalH/2, modalW, modalH, 12);
        bg.lineStyle(3, 0xc9a227, 1);
        bg.strokeRoundedRect(centerX - modalW/2, centerY - modalH/2, modalW, modalH, 12);
        bg.setDepth(251);
        bg.setScrollFactor(0);
        modalElements.push(bg);

        // Item name
        const nameText = this.scene.add.text(centerX, centerY - 100, item.name.toUpperCase(), {
            fontSize: '22px',
            fontFamily: 'Georgia, serif',
            color: '#c9a227',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        nameText.setDepth(252);
        nameText.setScrollFactor(0);
        modalElements.push(nameText);

        // Item icon
        const spriteKey = item.spriteKey || `item_${item.id}`;
        if (this.scene.textures.exists(spriteKey)) {
            const icon = this.scene.add.image(centerX, centerY - 30, spriteKey);
            icon.setDisplaySize(64, 64);
            icon.setDepth(252);
            icon.setScrollFactor(0);
            modalElements.push(icon);
        }

        // Description
        const descText = this.scene.add.text(centerX, centerY + 35, item.description, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#cccccc',
            wordWrap: { width: modalW - 40 },
            align: 'center'
        }).setOrigin(0.5);
        descText.setDepth(252);
        descText.setScrollFactor(0);
        modalElements.push(descText);

        // Cleanup function
        const closeModal = (result) => {
            modalElements.forEach(el => {
                if (el && el.destroy) el.destroy();
            });
            this.isModalOpen = false;
            callback(result);
        };

        // Use button - directly on scene
        const useBtnX = centerX - 80;
        const useBtnY = centerY + 100;
        const useBtnBg = this.scene.add.graphics();
        useBtnBg.fillStyle(0x28a745, 1);
        useBtnBg.fillRoundedRect(useBtnX - 70, useBtnY - 20, 140, 40, 8);
        useBtnBg.setDepth(252);
        useBtnBg.setScrollFactor(0);
        modalElements.push(useBtnBg);

        const useBtnText = this.scene.add.text(useBtnX, useBtnY, 'USE', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        useBtnText.setDepth(253);
        useBtnText.setScrollFactor(0);
        modalElements.push(useBtnText);

        const useBtnHit = this.scene.add.rectangle(useBtnX, useBtnY, 140, 40, 0x000000, 0);
        useBtnHit.setDepth(254);
        useBtnHit.setScrollFactor(0);
        useBtnHit.setInteractive({ useHandCursor: true });
        useBtnHit.on('pointerover', () => {
            useBtnBg.clear();
            useBtnBg.fillStyle(0x32c95f, 1);
            useBtnBg.fillRoundedRect(useBtnX - 70, useBtnY - 20, 140, 40, 8);
        });
        useBtnHit.on('pointerout', () => {
            useBtnBg.clear();
            useBtnBg.fillStyle(0x28a745, 1);
            useBtnBg.fillRoundedRect(useBtnX - 70, useBtnY - 20, 140, 40, 8);
        });
        useBtnHit.on('pointerdown', () => closeModal({ used: true, effect: item.effect }));
        modalElements.push(useBtnHit);

        // Cancel button - directly on scene
        const cancelBtnX = centerX + 80;
        const cancelBtnY = centerY + 100;
        const cancelBtnBg = this.scene.add.graphics();
        cancelBtnBg.fillStyle(0x666666, 1);
        cancelBtnBg.fillRoundedRect(cancelBtnX - 70, cancelBtnY - 20, 140, 40, 8);
        cancelBtnBg.setDepth(252);
        cancelBtnBg.setScrollFactor(0);
        modalElements.push(cancelBtnBg);

        const cancelBtnText = this.scene.add.text(cancelBtnX, cancelBtnY, 'CANCEL', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        cancelBtnText.setDepth(253);
        cancelBtnText.setScrollFactor(0);
        modalElements.push(cancelBtnText);

        const cancelBtnHit = this.scene.add.rectangle(cancelBtnX, cancelBtnY, 140, 40, 0x000000, 0);
        cancelBtnHit.setDepth(254);
        cancelBtnHit.setScrollFactor(0);
        cancelBtnHit.setInteractive({ useHandCursor: true });
        cancelBtnHit.on('pointerover', () => {
            cancelBtnBg.clear();
            cancelBtnBg.fillStyle(0x888888, 1);
            cancelBtnBg.fillRoundedRect(cancelBtnX - 70, cancelBtnY - 20, 140, 40, 8);
        });
        cancelBtnHit.on('pointerout', () => {
            cancelBtnBg.clear();
            cancelBtnBg.fillStyle(0x666666, 1);
            cancelBtnBg.fillRoundedRect(cancelBtnX - 70, cancelBtnY - 20, 140, 40, 8);
        });
        cancelBtnHit.on('pointerdown', () => closeModal({ used: false }));
        modalElements.push(cancelBtnHit);

        // Close on overlay click
        overlay.on('pointerdown', () => closeModal({ used: false }));
    }

    /**
     * Get color for item type
     */
    getItemColor(itemId) {
        const colors = {
            armor_shard: 0x4A9EBF,
            speed_potion: 0xFFCC00,
            spell_scroll: 0x9A4ADF,
            smoke_bomb: 0x555555,
            holy_shield: 0xFFFFFF
        };
        return colors[itemId] || 0x888888;
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    /**
     * Create a styled button
     */
    createButton(x, y, text, callback, color = 0xc9a227) {
        const container = this.scene.add.container(x, y);
        container.setSize(160, 40);
        container.setScrollFactor(0); // Fixed to screen, not affected by camera

        const bg = this.scene.add.graphics();
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(-80, -20, 160, 40, 8);
        bg.lineStyle(2, 0x000000, 0.5);
        bg.strokeRoundedRect(-80, -20, 160, 40, 8);
        container.add(bg);

        const label = this.scene.add.text(0, 0, text, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(label);

        // Make the container itself interactive instead of a separate hitArea
        container.setInteractive(new Phaser.Geom.Rectangle(-80, -20, 160, 40), Phaser.Geom.Rectangle.Contains);
        container.input.cursor = 'pointer';

        container.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(Phaser.Display.Color.ValueToColor(color).lighten(20).color, 1);
            bg.fillRoundedRect(-80, -20, 160, 40, 8);
            bg.lineStyle(2, 0x000000, 0.5);
            bg.strokeRoundedRect(-80, -20, 160, 40, 8);
        });

        container.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(color, 1);
            bg.fillRoundedRect(-80, -20, 160, 40, 8);
            bg.lineStyle(2, 0x000000, 0.5);
            bg.strokeRoundedRect(-80, -20, 160, 40, 8);
        });

        container.on('pointerdown', callback);

        return container;
    }

    // =========================================================================
    // ABILITY CHOICE MODALS
    // =========================================================================

    /**
     * Show Kaelen's Parkour choice modal
     * @param {Function} callback - Called with { spaces: number, extraTurn: boolean }
     */
    showParkourChoice(callback) {
        this.isModalOpen = true;
        this.abilityChoiceContainer = this.scene.add.container(0, 0);
        this.abilityChoiceContainer.setDepth(200);
        this.abilityChoiceContainer.setScrollFactor(0);

        // Get screen dimensions for centering
        const screenW = this.scene.scale.width;
        const screenH = this.scene.scale.height;
        const cx = screenW / 2;
        const cy = screenH / 2;

        // Modal dimensions
        const modalW = 600;
        const modalH = 280;

        // Background overlay - covers full screen
        const overlay = this.scene.add.rectangle(cx, cy, screenW, screenH, 0x000000, 0.8);
        overlay.setScrollFactor(0);
        this.abilityChoiceContainer.add(overlay);

        // Modal box - centered
        const modalBg = this.scene.add.graphics();
        modalBg.fillStyle(0x1a1a2e, 1);
        modalBg.fillRoundedRect(cx - modalW/2, cy - modalH/2, modalW, modalH, 16);
        modalBg.lineStyle(4, 0x2A9D8F, 1);
        modalBg.strokeRoundedRect(cx - modalW/2, cy - modalH/2, modalW, modalH, 16);
        modalBg.setScrollFactor(0);
        this.abilityChoiceContainer.add(modalBg);

        // Title
        const title = this.scene.add.text(cx, cy - 100, 'PARKOUR ABILITY', {
            fontSize: '28px',
            fontFamily: 'Georgia, serif',
            color: '#2A9D8F',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        title.setScrollFactor(0);
        this.abilityChoiceContainer.add(title);

        // Description
        const desc = this.scene.add.text(cx, cy - 60, 'You rolled a 6! Choose your move:', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#cccccc'
        }).setOrigin(0.5);
        desc.setScrollFactor(0);
        this.abilityChoiceContainer.add(desc);

        // Option 1: Move 6 spaces
        const option1Btn = this.createButton(cx - 180, cy + 20, 'Move 6 Spaces', () => {
            this.closeAbilityChoice();
            callback({ spaces: 6, extraTurn: false });
        }, 0x2A9D8F);
        this.abilityChoiceContainer.add(option1Btn);

        // Option 2: Move 3 spaces + extra turn
        const option2Btn = this.createButton(cx + 180, cy + 20, 'Move 3 + Extra Turn', () => {
            this.closeAbilityChoice();
            callback({ spaces: 3, extraTurn: true });
        }, 0xc9a227);
        this.abilityChoiceContainer.add(option2Btn);

        // Hint text
        const hint = this.scene.add.text(cx, cy + 90, 'Extra turn lets you roll again immediately!', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#888888'
        }).setOrigin(0.5);
        hint.setScrollFactor(0);
        this.abilityChoiceContainer.add(hint);
    }

    /**
     * Close ability choice modal
     */
    closeAbilityChoice() {
        if (this.abilityChoiceContainer) {
            this.abilityChoiceContainer.destroy();
            this.abilityChoiceContainer = null;
            this.isModalOpen = false;
        }
    }

    /**
     * Show Elara's Arcane Insight choice modal after rolling
     * @param {number} myRoll - Current player's roll
     * @param {number} targetRoll - Target player's roll (player behind)
     * @param {string} targetName - Name of player behind
     * @param {Function} callback - Called with { swap: boolean }
     */
    showArcaneInsightChoice(myRoll, targetRoll, targetName, callback) {
        this.isModalOpen = true;
        this.abilityChoiceContainer = this.scene.add.container(0, 0);
        this.abilityChoiceContainer.setDepth(200);
        this.abilityChoiceContainer.setScrollFactor(0);

        const screenW = this.scene.scale.width;
        const screenH = this.scene.scale.height;
        const cx = screenW / 2;
        const cy = screenH / 2;

        // Background overlay
        const overlay = this.scene.add.rectangle(cx, cy, screenW, screenH, 0x000000, 0.85);
        overlay.setScrollFactor(0);
        this.abilityChoiceContainer.add(overlay);

        // Modal box
        const modalBg = this.scene.add.graphics();
        modalBg.fillStyle(0x1a1a2e, 1);
        modalBg.fillRoundedRect(cx - 300, cy - 160, 600, 320, 16);
        modalBg.lineStyle(4, 0x457B9D, 1);
        modalBg.strokeRoundedRect(cx - 300, cy - 160, 600, 320, 16);
        this.abilityChoiceContainer.add(modalBg);

        // Title
        const title = this.scene.add.text(cx, cy - 120, '✨ ARCANE INSIGHT ✨', {
            fontSize: '28px',
            fontFamily: 'Georgia, serif',
            color: '#457B9D',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0);
        this.abilityChoiceContainer.add(title);

        // Description
        const desc = this.scene.add.text(cx, cy - 75, 'Swap your dice roll with the player behind you?', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#cccccc'
        }).setOrigin(0.5).setScrollFactor(0);
        this.abilityChoiceContainer.add(desc);

        // Show the rolls
        const rollComparison = this.scene.add.text(cx, cy - 30, `Your roll: ${myRoll}  ⟷  ${targetName}'s roll: ${targetRoll}`, {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0);
        this.abilityChoiceContainer.add(rollComparison);

        // Warning about one-time use
        const warning = this.scene.add.text(cx, cy + 10, '(This ability can only be used ONCE per game!)', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ff8888'
        }).setOrigin(0.5).setScrollFactor(0);
        this.abilityChoiceContainer.add(warning);

        // Option 1: Swap rolls
        const swapBtn = this.createButton(cx - 120, cy + 70, `Swap (get ${targetRoll})`, () => {
            this.closeAbilityChoice();
            callback({ swap: true });
        }, 0x457B9D);
        this.abilityChoiceContainer.add(swapBtn);

        // Option 2: Keep your roll
        const keepBtn = this.createButton(cx + 120, cy + 70, `Keep (stay ${myRoll})`, () => {
            this.closeAbilityChoice();
            callback({ swap: false });
        }, 0x666666);
        this.abilityChoiceContainer.add(keepBtn);

        // Hint
        const hint = this.scene.add.text(cx, cy + 130, 'If you swap, both players use the exchanged rolls!', {
            fontSize: '13px',
            fontFamily: 'Arial',
            color: '#888888'
        }).setOrigin(0.5).setScrollFactor(0);
        this.abilityChoiceContainer.add(hint);
    }

    /**
     * Show portal choice modal - player decides whether to enter
     * @param {Object} portal - Portal data from EncounterData
     * @param {Player} player - The player who landed on the portal
     * @param {Function} callback - Called with boolean (true = entered, false = skipped)
     * @param {Object} prerolledEffect - Optional: Elara's scrying preview of the effect
     */
    showPortalChoiceModal(portal, player, callback, prerolledEffect = null) {
        this.isModalOpen = true;
        this.portalElements = [];

        const screenW = this.scene.scale.width;
        const screenH = this.scene.scale.height;
        const cx = screenW / 2;
        const cy = screenH / 2;

        // Background overlay
        const overlay = this.scene.add.rectangle(cx, cy, screenW * 2, screenH * 2, 0x000000, 0.85);
        overlay.setDepth(199);
        overlay.setScrollFactor(0);
        overlay.setInteractive();
        this.portalElements.push(overlay);

        // Modal dimensions - taller when Elara's scrying preview is shown
        const modalW = 450;
        const hasScrying = prerolledEffect && player.characterData && player.characterData.id === 'elara';
        const modalH = hasScrying ? 450 : 380;

        // Portal color for theming
        const portalColor = portal.color || 0x8844ff;

        // Glow effect
        const glow = this.scene.add.graphics();
        glow.fillStyle(portalColor, 0.15);
        glow.fillRoundedRect(cx - modalW/2 - 15, cy - modalH/2 - 15, modalW + 30, modalH + 30, 24);
        glow.setDepth(200);
        glow.setScrollFactor(0);
        this.portalElements.push(glow);

        // Modal background
        const modalBg = this.scene.add.graphics();
        modalBg.fillStyle(0x0d0d1a, 1);
        modalBg.fillRoundedRect(cx - modalW/2, cy - modalH/2, modalW, modalH, 16);
        modalBg.fillStyle(0x1a1a2e, 0.5);
        modalBg.fillRoundedRect(cx - modalW/2 + 4, cy - modalH/2 + 4, modalW - 8, modalH * 0.4, 14);
        modalBg.lineStyle(3, portalColor, 1);
        modalBg.strokeRoundedRect(cx - modalW/2, cy - modalH/2, modalW, modalH, 16);
        modalBg.setDepth(200);
        modalBg.setScrollFactor(0);
        this.portalElements.push(modalBg);

        // Portal name
        const name = this.scene.add.text(cx, cy - modalH/2 + 35, portal.name.toUpperCase(), {
            fontSize: '24px',
            fontFamily: 'Georgia, serif',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        name.setDepth(201);
        name.setScrollFactor(0);
        this.portalElements.push(name);

        // Portal title/subtitle
        if (portal.title) {
            const title = this.scene.add.text(cx, cy - modalH/2 + 60, portal.title, {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: Phaser.Display.Color.ValueToColor(portalColor).rgba
            }).setOrigin(0.5);
            title.setDepth(201);
            title.setScrollFactor(0);
            this.portalElements.push(title);
        }

        // Portal image - try encounter image first
        const imgKey = `encounter_${portal.id}`;
        const imgY = cy - 30;
        if (this.scene.textures.exists(imgKey)) {
            const img = this.scene.add.image(cx, imgY, imgKey);
            const frame = this.scene.textures.getFrame(imgKey);
            const maxSize = 180;
            const scale = Math.min(maxSize / frame.width, maxSize / frame.height);
            img.setScale(scale);
            img.setDepth(201);
            img.setScrollFactor(0);
            this.portalElements.push(img);
        } else {
            // Fallback: colored portal circle
            const portalGfx = this.scene.add.graphics();
            portalGfx.fillStyle(portalColor, 0.3);
            portalGfx.fillCircle(cx, imgY, 60);
            portalGfx.lineStyle(4, portalColor, 0.8);
            portalGfx.strokeCircle(cx, imgY, 60);
            portalGfx.lineStyle(2, portalColor, 0.5);
            portalGfx.strokeCircle(cx, imgY, 70);
            portalGfx.setDepth(201);
            portalGfx.setScrollFactor(0);
            this.portalElements.push(portalGfx);

            // Portal type indicator
            const typeLabel = portal.portalType === 'balanced' ? '?' :
                             portal.portalType === 'risky' ? '!' : '!!!';
            const typeText = this.scene.add.text(cx, imgY, typeLabel, {
                fontSize: '48px',
                fontFamily: 'Georgia, serif',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);
            typeText.setDepth(202);
            typeText.setScrollFactor(0);
            this.portalElements.push(typeText);
        }

        // Description
        const desc = this.scene.add.text(cx, cy + 70, portal.description, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#cccccc',
            align: 'center',
            wordWrap: { width: modalW - 40 }
        }).setOrigin(0.5);
        desc.setDepth(201);
        desc.setScrollFactor(0);
        this.portalElements.push(desc);

        // Risk indicator text
        const riskText = portal.portalType === 'balanced' ? 'Low Risk - Balanced Outcomes' :
                        portal.portalType === 'risky' ? 'High Risk - High Reward!' :
                        'EXTREME CHAOS - Anything Can Happen!';
        const risk = this.scene.add.text(cx, cy + 100, riskText, {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: Phaser.Display.Color.ValueToColor(portalColor).rgba,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        risk.setDepth(201);
        risk.setScrollFactor(0);
        this.portalElements.push(risk);

        // Elara's Scrying preview - show what effect would happen
        let btnY = cy + 150;
        if (hasScrying) {
            const goodEffects = ['move', 'loot', 'armor', 'cleanse', 'none', 'buff', 'steal_item', 'double_roll'];
            const isGood = goodEffects.includes(prerolledEffect.type) && (prerolledEffect.value === undefined || prerolledEffect.value > 0);
            const previewColor = isGood ? '#44ff44' : '#ff4444';

            const scryLabel = this.scene.add.text(cx, cy + 120, 'SCRYING REVEALS:', {
                fontSize: '11px',
                fontFamily: 'Arial',
                color: '#aa88ff',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            scryLabel.setDepth(201);
            scryLabel.setScrollFactor(0);
            this.portalElements.push(scryLabel);

            const scryText = this.scene.add.text(cx, cy + 140, prerolledEffect.message, {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: previewColor,
                align: 'center',
                wordWrap: { width: modalW - 60 }
            }).setOrigin(0.5);
            scryText.setDepth(201);
            scryText.setScrollFactor(0);
            this.portalElements.push(scryText);

            // Push buttons below scrying text
            btnY = cy + 190;
        }

        // Enter button
        const enterBtn = this.createButton(cx - 100, btnY, 'ENTER', () => {
            this.closePortalChoice();
            callback(true);
        }, portalColor);
        enterBtn.setDepth(202);
        this.portalElements.push(enterBtn);

        // Skip button
        const skipBtn = this.createButton(cx + 100, btnY, 'SKIP', () => {
            this.closePortalChoice();
            callback(false);
        }, 0x666666);
        skipBtn.setDepth(202);
        this.portalElements.push(skipBtn);
    }

    /**
     * Close portal choice modal
     */
    closePortalChoice() {
        if (this.portalElements) {
            this.portalElements.forEach(el => el.destroy());
            this.portalElements = null;
        }
        this.isModalOpen = false;
    }

    /**
     * Show Spell Scroll reroll choice modal
     * @param {number} currentRoll - The roll value to potentially reroll
     * @param {string} rollType - 'movement' or 'encounter'
     * @param {Function} callback - Called with { reroll: boolean }
     */
    showRerollChoice(currentRoll, rollType, callback) {
        this.isModalOpen = true;
        this.rerollElements = [];

        const screenW = this.scene.scale.width;
        const screenH = this.scene.scale.height;
        const cx = screenW / 2;
        const cy = screenH / 2;

        // Background overlay - scene level, not in container
        const overlay = this.scene.add.rectangle(cx, cy, screenW * 2, screenH * 2, 0x000000, 0.85);
        overlay.setDepth(199);
        overlay.setScrollFactor(0);
        overlay.setInteractive(); // Blocks clicks to game behind
        this.rerollElements.push(overlay);

        // Modal box
        const modalW = 400;
        const modalH = 280;
        const modalBg = this.scene.add.graphics();
        modalBg.fillStyle(0x0d0d1a, 1);
        modalBg.fillRoundedRect(cx - modalW/2, cy - modalH/2, modalW, modalH, 16);
        modalBg.fillStyle(0x1a1a2e, 0.5);
        modalBg.fillRoundedRect(cx - modalW/2 + 4, cy - modalH/2 + 4, modalW - 8, modalH * 0.4, 14);
        modalBg.lineStyle(3, 0x9A4ADF, 1);
        modalBg.strokeRoundedRect(cx - modalW/2, cy - modalH/2, modalW, modalH, 16);
        modalBg.setDepth(200);
        modalBg.setScrollFactor(0);
        this.rerollElements.push(modalBg);

        // Title
        const title = this.scene.add.text(cx, cy - 100, 'SPELL SCROLL', {
            fontSize: '26px',
            fontFamily: 'Georgia, serif',
            color: '#9A4ADF',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        title.setDepth(200);
        title.setScrollFactor(0);
        this.rerollElements.push(title);

        // Current roll display
        const rollText = this.scene.add.text(cx, cy - 50, `Current ${rollType} roll: ${currentRoll}`, {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);
        rollText.setDepth(200);
        rollText.setScrollFactor(0);
        this.rerollElements.push(rollText);

        // Description
        const desc = this.scene.add.text(cx, cy - 10, 'Use your Spell Scroll to re-roll?\nYou must keep the second result!', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#cccccc',
            align: 'center'
        }).setOrigin(0.5);
        desc.setDepth(200);
        desc.setScrollFactor(0);
        this.rerollElements.push(desc);

        // Reroll button
        const rerollBtn = this.createButton(cx - 100, cy + 60, 'REROLL', () => {
            this.closeRerollChoice();
            callback({ reroll: true });
        }, 0x9A4ADF);
        rerollBtn.setDepth(201);
        this.rerollElements.push(rerollBtn);

        // Keep button
        const keepBtn = this.createButton(cx + 100, cy + 60, 'KEEP ROLL', () => {
            this.closeRerollChoice();
            callback({ reroll: false });
        }, 0x666666);
        keepBtn.setDepth(201);
        this.rerollElements.push(keepBtn);

        // Warning hint
        const hint = this.scene.add.text(cx, cy + 115, 'Warning: New roll cannot be changed!', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ff8866'
        }).setOrigin(0.5);
        hint.setDepth(200);
        hint.setScrollFactor(0);
        this.rerollElements.push(hint);
    }

    /**
     * Close reroll choice modal
     */
    closeRerollChoice() {
        // Destroy all elements (they're all scene-level now)
        if (this.rerollElements) {
            this.rerollElements.forEach(el => el.destroy());
            this.rerollElements = null;
        }
        // Clear any countdown timer
        if (this.rerollCountdownTimer) {
            clearInterval(this.rerollCountdownTimer);
            this.rerollCountdownTimer = null;
        }
        this.spellScrollWindowActive = false;
        this.isModalOpen = false;
    }

    /**
     * Show timed reroll popup with countdown
     * @param {number} currentRoll - The current roll value
     * @param {string} rollType - Type of roll (movement, encounter)
     * @param {number} countdownSeconds - Seconds to countdown (default 3)
     * @param {function} callback - Callback with {reroll: boolean, expired: boolean}
     */
    showTimedRerollChoice(currentRoll, rollType, countdownSeconds, callback) {
        this.isModalOpen = true;
        this.spellScrollWindowActive = true;
        this.spellScrollCallback = callback;
        this.rerollElements = [];

        const screenW = this.scene.scale.width;
        const screenH = this.scene.scale.height;
        const cx = screenW / 2;
        const cy = screenH / 2;

        // Background overlay - semi-transparent, doesn't block game
        const overlay = this.scene.add.rectangle(cx, cy, screenW * 2, screenH * 2, 0x000000, 0.4);
        overlay.setDepth(199);
        overlay.setScrollFactor(0);
        overlay.setInteractive();
        this.rerollElements.push(overlay);

        // Compact notification bar at top
        const barWidth = 320;
        const barHeight = 80;
        const barY = 60;

        const barBg = this.scene.add.graphics();
        barBg.fillStyle(0x0d0d1a, 0.95);
        barBg.fillRoundedRect(cx - barWidth/2, barY - barHeight/2, barWidth, barHeight, 12);
        barBg.lineStyle(2, 0x9A4ADF, 1);
        barBg.strokeRoundedRect(cx - barWidth/2, barY - barHeight/2, barWidth, barHeight, 12);
        barBg.setDepth(200);
        barBg.setScrollFactor(0);
        this.rerollElements.push(barBg);

        // Spell scroll icon/title
        const title = this.scene.add.text(cx - 100, barY - 20, '📜 SPELL SCROLL', {
            fontSize: '16px',
            fontFamily: 'Georgia, serif',
            color: '#9A4ADF',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0, 0.5);
        title.setDepth(200);
        title.setScrollFactor(0);
        this.rerollElements.push(title);

        // Countdown timer text (large)
        let timeLeft = countdownSeconds;
        const timerText = this.scene.add.text(cx + 110, barY, timeLeft.toString(), {
            fontSize: '36px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#ffcc00',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        timerText.setDepth(200);
        timerText.setScrollFactor(0);
        this.rerollElements.push(timerText);

        // Instruction text
        const instruction = this.scene.add.text(cx - 100, barY + 15, 'Click to REROLL or wait to keep', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#aaaaaa'
        }).setOrigin(0, 0.5);
        instruction.setDepth(200);
        instruction.setScrollFactor(0);
        this.rerollElements.push(instruction);

        // Make the bar clickable to reroll
        const clickZone = this.scene.add.rectangle(cx, barY, barWidth, barHeight, 0xffffff, 0);
        clickZone.setDepth(201);
        clickZone.setScrollFactor(0);
        clickZone.setInteractive({ useHandCursor: true });
        clickZone.on('pointerover', () => {
            barBg.clear();
            barBg.fillStyle(0x1a1a2e, 0.95);
            barBg.fillRoundedRect(cx - barWidth/2, barY - barHeight/2, barWidth, barHeight, 12);
            barBg.lineStyle(3, 0xBB6AF0, 1);
            barBg.strokeRoundedRect(cx - barWidth/2, barY - barHeight/2, barWidth, barHeight, 12);
        });
        clickZone.on('pointerout', () => {
            barBg.clear();
            barBg.fillStyle(0x0d0d1a, 0.95);
            barBg.fillRoundedRect(cx - barWidth/2, barY - barHeight/2, barWidth, barHeight, 12);
            barBg.lineStyle(2, 0x9A4ADF, 1);
            barBg.strokeRoundedRect(cx - barWidth/2, barY - barHeight/2, barWidth, barHeight, 12);
        });
        clickZone.on('pointerdown', () => {
            this.closeRerollChoice();
            callback({ reroll: true, expired: false });
        });
        this.rerollElements.push(clickZone);

        // Countdown timer
        this.rerollCountdownTimer = setInterval(() => {
            timeLeft--;
            if (timeLeft > 0) {
                timerText.setText(timeLeft.toString());
                // Flash effect as time runs out
                if (timeLeft <= 1) {
                    timerText.setColor('#ff6666');
                }
            } else {
                // Time's up - keep the roll
                this.closeRerollChoice();
                callback({ reroll: false, expired: true });
            }
        }, 1000);
    }

    /**
     * Check if spell scroll window is currently active
     * @returns {boolean} Whether the spell scroll usage window is open
     */
    isSpellScrollWindowActive() {
        return this.spellScrollWindowActive === true;
    }

    /**
     * Trigger spell scroll use from inventory click
     */
    triggerSpellScrollUse() {
        if (this.spellScrollWindowActive && this.spellScrollCallback) {
            const callback = this.spellScrollCallback;
            this.closeRerollChoice();
            callback({ reroll: true, expired: false });
        }
    }

    /**
     * Show toast notification
     * @param {string} message - The message to display
     * @param {string|number} typeOrDuration - Type: 'success', 'danger', 'warning', 'info' OR duration in ms
     */
    showToast(message, typeOrDuration = 'info') {
        // Handle both old signature (duration, isError) and new signature (type)
        let bgColor = 0x28a745; // Default green (success)
        let duration = 2500;

        if (typeof typeOrDuration === 'string') {
            switch (typeOrDuration) {
                case 'success':
                    bgColor = 0x28a745; // Green
                    break;
                case 'danger':
                case 'error':
                    bgColor = 0xcc4422; // Red
                    duration = 3000; // Show errors longer
                    break;
                case 'warning':
                    bgColor = 0xffa500; // Orange
                    break;
                case 'info':
                default:
                    bgColor = 0x17a2b8; // Blue/teal
                    break;
            }
        } else if (typeof typeOrDuration === 'number') {
            duration = typeOrDuration;
        }

        const screenW = this.scene.scale.width;
        const toast = this.scene.add.container(screenW / 2, 650);
        toast.setDepth(300);
        toast.setScrollFactor(0);

        const bg = this.scene.add.graphics();
        bg.fillStyle(bgColor, 1);
        bg.fillRoundedRect(-200, -20, 400, 40, 8);
        toast.add(bg);

        const text = this.scene.add.text(0, 0, message, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
            wordWrap: { width: 380 }
        }).setOrigin(0.5);
        toast.add(text);

        // Animate in
        toast.setAlpha(0);
        toast.y = 700;
        this.scene.tweens.add({
            targets: toast,
            alpha: 1,
            y: 650,
            duration: 200,
            ease: 'Power2'
        });

        // Animate out after duration
        this.scene.time.delayedCall(duration, () => {
            if (toast && toast.scene) {
                this.scene.tweens.add({
                    targets: toast,
                    alpha: 0,
                    y: 700,
                    duration: 200,
                    onComplete: () => {
                        if (toast && toast.destroy) {
                            toast.destroy();
                        }
                    }
                });
            }
        });
    }
}
