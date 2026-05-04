/**
 * Shared test helpers for Playwright visual tests
 */

import { expect } from '@playwright/test';

const SCREENSHOT_DIR = 'tests/screenshots';

/**
 * Start the game and skip to gameplay with specified number of players
 * @param {import('@playwright/test').Page} page
 * @param {number} playerCount - Number of players (default 2)
 */
export async function startGame(page, playerCount = 2) {
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 15000 });

    // Wait for Phaser and board to fully initialize
    await page.waitForFunction(
        () => window.__TEST__?.isBoardReady?.(),
        { timeout: 15000 }
    );
    await page.waitForTimeout(500);

    // Skip character select and jump to gameplay
    if (playerCount === 2) {
        await page.evaluate(() => window.__TEST__.skipCharacterSelect());
    } else {
        await page.evaluate((n) => window.__TEST__.skipCharacterSelectN(n), playerCount);
    }
    await page.waitForTimeout(1000);

    // Verify we're in gameplay
    const state = await page.evaluate(() => window.__TEST__.getGameState());
    expect(state).toBe('waiting');
}

/**
 * Trigger an encounter and wait for the modal to render
 * @param {import('@playwright/test').Page} page
 * @param {string} type - Encounter type: 'monster', 'dragon', 'special', 'portal', 'knight'
 * @param {string} id - Encounter ID
 */
export async function triggerEncounter(page, type, id) {
    const result = await page.evaluate(
        ([t, i]) => window.__TEST__.triggerEncounter(t, i),
        [type, id]
    );
    expect(result).toBe('ok');
    await page.waitForTimeout(500);
}

/**
 * Call a __TEST__ hook and verify it returned 'ok'
 * @param {import('@playwright/test').Page} page
 * @param {string} method - Method name on window.__TEST__
 * @param  {...any} args - Arguments to pass
 */
export async function callTestHook(page, method, ...args) {
    const result = await page.evaluate(
        ([m, a]) => window.__TEST__[m](...a),
        [method, args]
    );
    expect(result).toBe('ok');
    await page.waitForTimeout(500);
}

/**
 * Take a screenshot with a standardized path
 * @param {import('@playwright/test').Page} page
 * @param {string} name - Screenshot filename (without extension)
 */
export async function screenshot(page, name) {
    await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}.png` });
}

/**
 * Close any open modal
 * @param {import('@playwright/test').Page} page
 */
export async function closeModal(page) {
    await page.evaluate(() => window.__TEST__.closeModal());
    await page.waitForTimeout(300);
}
