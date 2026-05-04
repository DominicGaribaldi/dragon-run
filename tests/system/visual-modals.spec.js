/**
 * Visual tests for game modals (help, legend, inventory, encounters)
 */

import { test } from '@playwright/test';
import { startGame, triggerEncounter, callTestHook, screenshot } from './helpers.js';

test.describe('Visual Modal Tests', () => {
    test.setTimeout(30000);

    test('help guide modal', async ({ page }) => {
        await startGame(page);
        await callTestHook(page, 'showHelpGuide');
        await screenshot(page, 'modal-help-guide');
    });

    test('legend overlay', async ({ page }) => {
        await startGame(page);
        await callTestHook(page, 'showLegend');
        await screenshot(page, 'modal-legend');
    });

    test('inventory modal', async ({ page }) => {
        await startGame(page);
        await callTestHook(page, 'showInventory', 0);
        await screenshot(page, 'modal-inventory');
    });

    test('knight encounter - Griffin Rider', async ({ page }) => {
        await startGame(page);
        await triggerEncounter(page, 'knight', 'griffin');
        await screenshot(page, 'modal-knight-griffin');
    });

    test('knight encounter - Champion', async ({ page }) => {
        await startGame(page);
        await triggerEncounter(page, 'knight', 'champion');
        await screenshot(page, 'modal-knight-champion');
    });

    test('blacksmith - Rusty Anvil', async ({ page }) => {
        await startGame(page);
        await triggerEncounter(page, 'special', 'rustyAnvil');
        await screenshot(page, 'modal-blacksmith');
    });

    test('treasure chest', async ({ page }) => {
        await startGame(page);
        await triggerEncounter(page, 'special', 'lootChest');
        await screenshot(page, 'modal-treasure-chest');
    });
});
