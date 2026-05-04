/**
 * Visual tests for character ability modals
 */

import { test } from '@playwright/test';
import { startGame, callTestHook, screenshot, triggerEncounter } from './helpers.js';

test.describe('Visual Ability Tests', () => {
    test.setTimeout(30000);

    test('Kael parkour choice modal', async ({ page }) => {
        await startGame(page);
        await callTestHook(page, 'showParkourChoice');
        await screenshot(page, 'ability-parkour-choice');
    });

    test('Elara arcane insight modal', async ({ page }) => {
        await startGame(page);
        await callTestHook(page, 'showArcaneInsightChoice');
        await screenshot(page, 'ability-arcane-insight');
    });

    test('Elara portal scrying', async ({ page }) => {
        await startGame(page);
        await triggerEncounter(page, 'portal', 'portalBalanced');
        await screenshot(page, 'ability-portal-scrying');
    });

    test('spell scroll reroll choice', async ({ page }) => {
        await startGame(page);
        await callTestHook(page, 'showRerollChoice');
        await screenshot(page, 'ability-reroll-choice');
    });

    test('timed reroll choice (Grunt)', async ({ page }) => {
        await startGame(page);
        await callTestHook(page, 'showTimedRerollChoice');
        await screenshot(page, 'ability-timed-reroll');
    });
});
