/**
 * Test module exports
 * Loads browser-global source files and exports them for testing
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsDir = path.join(__dirname, '../../js');

// Helper to load a browser-global module
function loadBrowserGlobal(filename) {
    const code = fs.readFileSync(path.join(jsDir, filename), 'utf-8');
    // Wrap the code to return the global it defines
    // The source files define `const XxxData = {...}` so we extract and return it
    const wrapped = `
        ${code}
        return { ItemData, CharacterData, EncounterData, Inventory };
    `;
    try {
        const fn = new Function(wrapped);
        return fn();
    } catch (e) {
        // If the variable isn't defined, return undefined
        return {};
    }
}

// Load all modules together since they may reference each other
const allCode = [
    fs.readFileSync(path.join(jsDir, 'ItemData.js'), 'utf-8'),
    fs.readFileSync(path.join(jsDir, 'CharacterData.js'), 'utf-8'),
    fs.readFileSync(path.join(jsDir, 'EncounterData.js'), 'utf-8'),
    fs.readFileSync(path.join(jsDir, 'Inventory.js'), 'utf-8')
].join('\n');

const wrapped = `
    ${allCode}
    return { ItemData, CharacterData, EncounterData, Inventory };
`;

const globals = new Function(wrapped)();

export const ItemData = globals.ItemData;
export const CharacterData = globals.CharacterData;
export const EncounterData = globals.EncounterData;
export const Inventory = globals.Inventory;

export default globals;
