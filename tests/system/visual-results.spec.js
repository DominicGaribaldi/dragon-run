/**
 * Visual tests for encounter roll results
 */

import { test } from '@playwright/test';
import { startGame, callTestHook, screenshot } from './helpers.js';

test.describe('Visual Result Tests', () => {
    test.setTimeout(30000);

    test('roll result - monster success', async ({ page }) => {
        await startGame(page);
        await callTestHook(page, 'showRollResult', true, 5);
        await page.waitForTimeout(300);
        await screenshot(page, 'result-monster-success');
    });

    test('roll result - monster failure', async ({ page }) => {
        await startGame(page);
        await callTestHook(page, 'showRollResult', false, 2);
        await page.waitForTimeout(300);
        await screenshot(page, 'result-monster-failure');
    });

    test('stun notification toast', async ({ page }) => {
        await startGame(page);
        await callTestHook(page, 'showToast', 'Player is stunned! Skipping turn...', 'warning');
        await page.waitForTimeout(300);
        await screenshot(page, 'result-stun-toast');
    });
});
