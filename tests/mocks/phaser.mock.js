/**
 * Mock Phaser objects for unit testing
 * Provides stub implementations of Phaser scene and game objects
 */

/**
 * Mock Graphics object
 */
export class MockGraphics {
    constructor() {
        this.depth = 0;
        this.visible = true;
        this.alpha = 1;
        this.x = 0;
        this.y = 0;
    }

    fillStyle() { return this; }
    fillRect() { return this; }
    fillRoundedRect() { return this; }
    fillCircle() { return this; }
    lineStyle() { return this; }
    strokeRect() { return this; }
    strokeRoundedRect() { return this; }
    strokeCircle() { return this; }
    beginPath() { return this; }
    moveTo() { return this; }
    lineTo() { return this; }
    strokePath() { return this; }
    clear() { return this; }
    setDepth(d) { this.depth = d; return this; }
    setScrollFactor() { return this; }
    setVisible(v) { this.visible = v; return this; }
    setAlpha(a) { this.alpha = a; return this; }
    destroy() {}
}

/**
 * Mock Text object
 */
export class MockText {
    constructor(x, y, text, style = {}) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.style = style;
        this.depth = 0;
        this.visible = true;
        this.alpha = 1;
        this.originX = 0;
        this.originY = 0;
    }

    setText(t) { this.text = t; return this; }
    setStyle(s) { this.style = { ...this.style, ...s }; return this; }
    setColor(c) { this.style.color = c; return this; }
    setOrigin(x, y = x) { this.originX = x; this.originY = y; return this; }
    setDepth(d) { this.depth = d; return this; }
    setScrollFactor() { return this; }
    setVisible(v) { this.visible = v; return this; }
    setAlpha(a) { this.alpha = a; return this; }
    setScale(s) { return this; }
    destroy() {}
}

/**
 * Mock Sprite object
 */
export class MockSprite {
    constructor(x, y, texture, frame = 0) {
        this.x = x;
        this.y = y;
        this.texture = texture;
        this.frame = frame;
        this.depth = 0;
        this.visible = true;
        this.alpha = 1;
        this.scaleX = 1;
        this.scaleY = 1;
        this.currentAnim = null;
    }

    setDisplaySize(w, h) { return this; }
    setScale(x, y = x) { this.scaleX = x; this.scaleY = y; return this; }
    setOrigin(x, y = x) { return this; }
    setDepth(d) { this.depth = d; return this; }
    setScrollFactor() { return this; }
    setVisible(v) { this.visible = v; return this; }
    setAlpha(a) { this.alpha = a; return this; }
    setFrame(f) { this.frame = f; return this; }
    play(anim) { this.currentAnim = anim; return this; }
    stop() { this.currentAnim = null; return this; }
    destroy() {}
}

/**
 * Mock Image object
 */
export class MockImage extends MockSprite {
    constructor(x, y, texture) {
        super(x, y, texture, 0);
    }
}

/**
 * Mock Container object
 */
export class MockContainer {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
        this.children = [];
        this.depth = 0;
        this.visible = true;
        this.alpha = 1;
    }

    add(child) { this.children.push(child); return this; }
    remove(child) {
        const idx = this.children.indexOf(child);
        if (idx > -1) this.children.splice(idx, 1);
        return this;
    }
    sendToBack(child) { return this; }
    bringToTop(child) { return this; }
    setDepth(d) { this.depth = d; return this; }
    setScrollFactor() { return this; }
    setVisible(v) { this.visible = v; return this; }
    setAlpha(a) { this.alpha = a; return this; }
    setPosition(x, y) { this.x = x; this.y = y; return this; }
    setSize(w, h) { return this; }
    setInteractive() { return this; }
    destroy() { this.children = []; }
}

/**
 * Mock Rectangle object
 */
export class MockRectangle {
    constructor(x, y, width, height, color, alpha = 1) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.fillColor = color;
        this.alpha = alpha;
        this.depth = 0;
        this.visible = true;
    }

    setDepth(d) { this.depth = d; return this; }
    setScrollFactor() { return this; }
    setVisible(v) { this.visible = v; return this; }
    setInteractive() { return this; }
    on(event, callback) { return this; }
    destroy() {}
}

/**
 * Mock Tween object
 */
export class MockTween {
    constructor(config = {}) {
        this.config = config;
        this.isPlaying = false;
    }

    play() { this.isPlaying = true; return this; }
    stop() { this.isPlaying = false; return this; }
    remove() {}
}

/**
 * Mock Scene - the main entry point for tests
 */
export function createMockScene() {
    const tweens = [];
    const timers = [];

    return {
        // Scene properties
        scale: {
            width: 1280,
            height: 720
        },

        // Add factory
        add: {
            graphics: () => new MockGraphics(),
            text: (x, y, text, style) => new MockText(x, y, text, style),
            sprite: (x, y, texture, frame) => new MockSprite(x, y, texture, frame),
            image: (x, y, texture) => new MockImage(x, y, texture),
            container: (x, y) => new MockContainer(x, y),
            rectangle: (x, y, w, h, color, alpha) => new MockRectangle(x, y, w, h, color, alpha)
        },

        // Texture manager
        textures: {
            exists: (key) => false, // Override in tests as needed
            getFrame: (key) => ({ width: 64, height: 64 })
        },

        // Animation manager
        anims: {
            exists: (key) => false, // Override in tests as needed
            create: () => {}
        },

        // Tween manager
        tweens: {
            add: (config) => {
                const tween = new MockTween(config);
                tweens.push(tween);
                // Auto-complete tween for testing
                if (config.onComplete) {
                    setTimeout(() => config.onComplete(), 0);
                }
                return tween;
            },
            killTweensOf: (target) => {
                // Remove tweens targeting this object
            }
        },

        // Time manager
        time: {
            delayedCall: (delay, callback, args, scope) => {
                const timer = { delay, callback, args, scope };
                timers.push(timer);
                // For testing, execute immediately or store for manual triggering
                return {
                    remove: () => {
                        const idx = timers.indexOf(timer);
                        if (idx > -1) timers.splice(idx, 1);
                    }
                };
            },
            addEvent: (config) => {
                return { remove: () => {} };
            }
        },

        // Input manager
        input: {
            keyboard: {
                on: () => {}
            },
            on: () => {}
        },

        // Cameras
        cameras: {
            main: {
                scrollX: 0,
                scrollY: 0,
                pan: () => {},
                centerOn: () => {}
            }
        },

        // Helper to get all pending timers (for test assertions)
        _getTimers: () => timers,
        _getTweens: () => tweens,

        // Helper to execute all pending timers
        _flushTimers: () => {
            const pending = [...timers];
            timers.length = 0;
            pending.forEach(t => t.callback.apply(t.scope, t.args));
        }
    };
}

export default { createMockScene, MockGraphics, MockText, MockSprite, MockContainer };
