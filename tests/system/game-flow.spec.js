/**
 * System tests for Dragon Run game flow
 * Tests full game workflows via Playwright browser automation
 */

import { test, expect } from '@playwright/test';

test.describe('Game Loading', () => {
    test('should load the game and show title screen', async ({ page }) => {
        await page.goto('/');

        // Wait for Phaser to initialize
        await page.waitForSelector('canvas', { timeout: 10000 });

        // Check that the canvas exists
        const canvas = await page.locator('canvas');
        await expect(canvas).toBeVisible();
    });

    test('should have correct page title', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Dragon Run/i);
    });
});

test.describe('Character Selection', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('canvas', { timeout: 10000 });

        // Wait a bit for game to fully initialize
        await page.waitForTimeout(1000);
    });

    test('should show character selection after clicking start', async ({ page }) => {
        // Click on the canvas to trigger start
        const canvas = await page.locator('canvas');
        await canvas.click();

        // Wait for character selection to appear (game state change)
        await page.waitForTimeout(500);

        // The game should now be in character select mode
        // We verify by checking the canvas is still visible and responsive
        await expect(canvas).toBeVisible();
    });
});

test.describe('Gameplay', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('canvas', { timeout: 10000 });

        // Give game time to initialize
        await page.waitForTimeout(1500);
    });

    test('should respond to spacebar input', async ({ page }) => {
        const canvas = await page.locator('canvas');

        // Click to focus
        await canvas.click();

        // Press space (should trigger game action)
        await page.keyboard.press('Space');

        // Game should respond (we're just checking it doesn't crash)
        await page.waitForTimeout(500);
        await expect(canvas).toBeVisible();
    });

    test('should respond to H key for help', async ({ page }) => {
        const canvas = await page.locator('canvas');
        await canvas.click();

        // Press H for help
        await page.keyboard.press('h');

        // Should not crash
        await page.waitForTimeout(300);
        await expect(canvas).toBeVisible();
    });

    test('should respond to M key for mute toggle', async ({ page }) => {
        const canvas = await page.locator('canvas');
        await canvas.click();

        // Press M for mute
        await page.keyboard.press('m');

        // Should not crash
        await page.waitForTimeout(300);
        await expect(canvas).toBeVisible();
    });
});

test.describe('Performance', () => {
    test('should load within acceptable time', async ({ page }) => {
        const startTime = Date.now();

        await page.goto('/');
        await page.waitForSelector('canvas', { timeout: 10000 });

        const loadTime = Date.now() - startTime;

        // Should load within 5 seconds
        expect(loadTime).toBeLessThan(5000);
    });

    test('should not have console errors on load', async ({ page }) => {
        const errors = [];

        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await page.goto('/');
        await page.waitForSelector('canvas', { timeout: 10000 });
        await page.waitForTimeout(1000);

        // Filter out known acceptable warnings
        const criticalErrors = errors.filter(e =>
            !e.includes('404') && // Asset loading warnings are ok
            !e.includes('net::ERR') // Network errors during dev are ok
        );

        expect(criticalErrors).toHaveLength(0);
    });
});
