/**
 * Vitest setup file
 * Runs before each test file
 */

import { vi } from 'vitest';

// Mock console methods to reduce noise (but capture for assertions)
global.console = {
    ...console,
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
};

// Helper to reset console mocks between tests
beforeEach(() => {
    vi.clearAllMocks();
});

// Helper to seed random for deterministic tests
global.seedRandom = (seed) => {
    let s = seed;
    Math.random = () => {
        s = Math.sin(s) * 10000;
        return s - Math.floor(s);
    };
};

// Reset Math.random after each test
afterEach(() => {
    Math.random = Math.random.bind(Math);
});
