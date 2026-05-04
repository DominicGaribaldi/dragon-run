import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // Test environment
        environment: 'jsdom',

        // Include patterns
        include: [
            'tests/unit/**/*.test.js',
            'tests/integration/**/*.test.js'
        ],

        // Exclude patterns
        exclude: [
            'tests/system/**/*',
            'node_modules/**/*'
        ],

        // Coverage configuration
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            reportsDirectory: './coverage',
            include: ['js/**/*.js'],
            exclude: [
                'js/game.js', // Main orchestration file - tested via system tests
                'js/ProceduralGraphics.js' // Rendering - tested visually
            ],
            thresholds: {
                // Data modules should have high coverage
                'js/ItemData.js': { lines: 90, functions: 90 },
                'js/CharacterData.js': { lines: 90, functions: 90 },
                'js/EncounterData.js': { lines: 80, functions: 80 },
                // Logic classes
                'js/Inventory.js': { lines: 80, functions: 80 },
                'js/Player.js': { lines: 70, functions: 70 },
                'js/Board.js': { lines: 60, functions: 60 },
                // UI - lower threshold due to Phaser dependencies
                'js/GameUI.js': { lines: 40, functions: 40 }
            }
        },

        // Globals (like describe, it, expect)
        globals: true,

        // Setup files
        setupFiles: ['./tests/setup.js'],

        // Reporter
        reporters: ['verbose'],

        // Timeouts
        testTimeout: 10000,
        hookTimeout: 10000
    },

    // Resolve aliases for cleaner imports
    resolve: {
        alias: {
            '@': '/js',
            '@mocks': '/tests/mocks'
        }
    }
});
