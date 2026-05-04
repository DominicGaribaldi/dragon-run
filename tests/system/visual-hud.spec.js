/**
 * Visual tests for HUD elements (player cards, toasts)
 */

import { test } from '@playwright/test';
import { startGame, callTestHook, screenshot } from './helpers.js';

test.describe('Visual HUD Tests', () => {
    test.setTimeout(30000);

    test('player status cards - 2 players', async ({ page }) => {
        await startGame(page, 2);
        await screenshot(page, 'hud-status-2p');
    });

    test('player status cards - 4 players', async ({ page }) => {
        await startGame(page, 4);
        await screenshot(page, 'hud-status-4p');
    });

    test('toast - success type', async ({ page }) => {
        await startGame(page);
        await callTestHook(page, 'showToast', 'Armor Shard collected!', 'success');
        await page.waitForTimeout(300);
        await screenshot(page, 'hud-toast-success');
    });

    test('toast - warning type', async ({ page }) => {
        await startGame(page);
        await callTestHook(page, 'showToast', 'Your inventory is full!', 'warning');
        await page.waitForTimeout(300);
        await screenshot(page, 'hud-toast-warning');
    });

    test('toast - error type', async ({ page }) => {
        await startGame(page);
        await callTestHook(page, 'showToast', 'The dragon burns you!', 'danger');
        await page.waitForTimeout(300);
        await screenshot(page, 'hud-toast-error');
    });
});
