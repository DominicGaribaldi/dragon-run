/**
 * Visual screenshot tests for encounter modals
 * Captures screenshots at each encounter type to verify modal display
 */

import { test } from '@playwright/test';
import { startGame, triggerEncounter, screenshot } from './helpers.js';

const SCREENSHOT_DIR = 'tests/screenshots';

test.describe('Visual Encounter Tests', () => {
    test.setTimeout(30000);

    test('01 - character select screen', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('canvas', { timeout: 15000 });
        await page.waitForTimeout(2000);

        await page.screenshot({ path: `${SCREENSHOT_DIR}/01-character-select.png` });
    });

    test('02 - game board', async ({ page }) => {
        await startGame(page);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/02-game-board.png` });
    });

    test('03 - knight encounter (Hedge Knight)', async ({ page }) => {
        await startGame(page);
        await triggerEncounter(page, 'knight', 'hedge');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/03-knight-encounter.png` });
    });

    test('04 - monster encounter (Milk Baby)', async ({ page }) => {
        await startGame(page);
        await triggerEncounter(page, 'monster', 'milkbaby');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/04-monster-milkbaby.png` });
    });

    test('05 - monster encounter (Goblin Tax Collector)', async ({ page }) => {
        await startGame(page);
        await triggerEncounter(page, 'monster', 'taxgoblin');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/05-goblin-tax-collector.png` });
    });

    test('06 - monster encounter (Mimic)', async ({ page }) => {
        await startGame(page);
        await triggerEncounter(page, 'monster', 'mimic');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/06-monster-mimic.png` });
    });

    test('07 - monster encounter (Vampires)', async ({ page }) => {
        await startGame(page);
        await triggerEncounter(page, 'monster', 'vampires');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/07-monster-vampires.png` });
    });

    test('08 - monster encounter (Hypno-Toad)', async ({ page }) => {
        await startGame(page);
        await triggerEncounter(page, 'monster', 'hypnotoad');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/08-monster-hypnotoad.png` });
    });

    test('09 - monster encounter (Hill Giant)', async ({ page }) => {
        await startGame(page);
        await triggerEncounter(page, 'monster', 'hillgiant');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/09-monster-hillgiant.png` });
    });

    test('10 - dragon encounter (Slime-Tooth)', async ({ page }) => {
        await startGame(page);
        await triggerEncounter(page, 'dragon', 'slimetooth');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/10-dragon-slimetooth.png` });
    });

    test('11 - dragon encounter (Frost-Fang)', async ({ page }) => {
        await startGame(page);
        await triggerEncounter(page, 'dragon', 'frostfang');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/11-dragon-frostfang.png` });
    });

    test('12 - dragon encounter (Ignis)', async ({ page }) => {
        await startGame(page);
        await triggerEncounter(page, 'dragon', 'ignis');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/12-dragon-ignis.png` });
    });

    test('13 - treasure chest', async ({ page }) => {
        await startGame(page);
        await triggerEncounter(page, 'special', 'lootChest');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/13-treasure-chest.png` });
    });

    test('14 - blacksmith (Rusty Anvil)', async ({ page }) => {
        await startGame(page);
        await triggerEncounter(page, 'special', 'rustyAnvil');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/14-blacksmith-anvil.png` });
    });

    test('15 - portal (Balanced)', async ({ page }) => {
        await startGame(page);
        await triggerEncounter(page, 'portal', 'portalBalanced');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/15-portal-balanced.png` });
    });

    test('16 - portal (Risky)', async ({ page }) => {
        await startGame(page);
        await triggerEncounter(page, 'portal', 'portalRisky');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/16-portal-risky.png` });
    });

    test('17 - portal (Chaotic)', async ({ page }) => {
        await startGame(page);
        await triggerEncounter(page, 'portal', 'portalChaotic');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/17-portal-chaotic.png` });
    });
});
