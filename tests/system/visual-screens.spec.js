/**
 * Visual tests for game screens (character select, board, win)
 */

import { test } from '@playwright/test';
import { startGame, callTestHook, screenshot } from './helpers.js';

test.describe('Visual Screen Tests', () => {
    test.setTimeout(30000);

    test('character select screen', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('canvas', { timeout: 15000 });
        await page.waitForTimeout(2000);
        await screenshot(page, 'screen-character-select');
    });

    test('game board - 2 players', async ({ page }) => {
        await startGame(page, 2);
        await screenshot(page, 'screen-board-2p');
    });

    test('game board - 4 players', async ({ page }) => {
        await startGame(page, 4);
        await screenshot(page, 'screen-board-4p');
    });

    test('win screen', async ({ page }) => {
        await startGame(page);
        await callTestHook(page, 'simulateWin', 0);
        await page.waitForTimeout(1500); // Wait for fireworks
        await screenshot(page, 'screen-win');
    });
});
