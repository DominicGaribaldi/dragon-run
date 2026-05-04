/**
 * Dragon Run Asset Upload Server
 *
 * Local-only admin tool for uploading and deleting game assets.
 * NOT FOR PRODUCTION — bind 127.0.0.1, requires an ADMIN_TOKEN env var
 * for any mutating request, and validates every filename/asset id to
 * prevent path traversal and shell injection.
 *
 * Run with:
 *   ADMIN_TOKEN=$(openssl rand -hex 16) node upload-server.js
 *
 * The admin pages must include the token in the X-Admin-Token header.
 * If ADMIN_TOKEN is unset the server runs in "loopback dev mode" and
 * accepts requests from 127.0.0.1 only.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.UPLOAD_PORT || '3002', 10);
const HOST = '127.0.0.1';
const ASSETS_BASE = path.join(__dirname, 'assets', 'images');
const AUDIO_BASE = path.join(__dirname, 'assets', 'audio');
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || null;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_AUDIO_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_REQUEST_BYTES = MAX_AUDIO_BYTES + 1 * 1024 * 1024; // hard cap on incoming request

// Safe character classes
const ASSET_ID_REGEX = /^[a-zA-Z0-9_]+$/;
const FILENAME_REGEX = /^[a-zA-Z0-9._-]+$/; // no spaces, no slashes, no quotes

// Check if ImageMagick is available (probe with execFileSync — no shell)
let hasImageMagick = false;
let magickBinary = null;
for (const candidate of ['magick', 'convert']) {
    try {
        execFileSync(candidate, ['-version'], { stdio: 'ignore' });
        hasImageMagick = true;
        magickBinary = candidate;
        break;
    } catch {
        // try next candidate
    }
}
if (hasImageMagick) {
    console.log(`✓ ImageMagick detected (${magickBinary}) - image processing enabled`);
} else {
    console.log('⚠ ImageMagick not found - images will be saved without processing');
}

// Expected dimensions for different asset types
const expectedDimensions = {
    'char_': { width: 256, height: 256, frameSize: 64, description: '4x4 grid, 64px frames' },
    'dragon_': { width: 512, height: 512, frameSize: 128, description: '4x4 grid, 128px frames' },
    'knight_': { width: 256, height: 256, frameSize: 64, description: '4x4 grid, 64px frames' },
    'monster_': { width: 256, height: 256, frameSize: 64, description: '4x4 grid, 64px frames' },
    'fx_': { width: 256, height: 256, frameSize: 64, description: '4x4 grid, 64px frames' },
    'item_': { width: 64, height: 64, description: 'single 64x64 icon' },
    'tile_': { width: 64, height: 64, description: 'single 64x64 tile' },
    'ui_dice': { width: 256, height: 256, frameSize: 64, description: '4x4 grid, 64px frames' }
};

const skipBackgroundRemoval = [
    'bg_', 'card_', 'encounter_', 'ui_character_select', 'ui_logo'
];

const pathMappings = {
    'bg_': 'backgrounds',
    'card_': 'cards',
    'char_': 'characters',
    'dragon_': 'dragons',
    'knight_': 'knights',
    'monster_': 'monsters',
    'item_': 'items',
    'tile_': 'tiles',
    'ui_': 'ui',
    'fx_': 'effects',
    'encounter_': 'encounters'
};

function getExpectedDimensions(assetId) {
    for (const [prefix, dims] of Object.entries(expectedDimensions)) {
        if (assetId.startsWith(prefix)) return dims;
    }
    return null;
}

function shouldSkipBackgroundRemoval(assetId) {
    return skipBackgroundRemoval.some(prefix => assetId.startsWith(prefix));
}

function getAssetFolder(assetId) {
    for (const [prefix, folder] of Object.entries(pathMappings)) {
        if (assetId.startsWith(prefix)) return folder;
    }
    return 'misc';
}

/**
 * Resolve a user-supplied filename inside a base directory, refusing
 * any path that would escape the base (e.g. "../../etc/passwd").
 * Returns the absolute path on success, throws on traversal attempt.
 */
function safeResolveInside(baseDir, filename) {
    if (typeof filename !== 'string' || !FILENAME_REGEX.test(filename)) {
        throw new Error(`Invalid filename: ${JSON.stringify(filename)}`);
    }
    const safe = path.basename(filename); // strip any path separators just in case
    const resolved = path.resolve(baseDir, safe);
    const baseResolved = path.resolve(baseDir);
    if (resolved !== baseResolved && !resolved.startsWith(baseResolved + path.sep)) {
        throw new Error(`Path traversal blocked: ${filename}`);
    }
    return resolved;
}

function validateAssetId(assetId) {
    if (typeof assetId !== 'string' || !ASSET_ID_REGEX.test(assetId)) {
        throw new Error(`Invalid assetId: ${JSON.stringify(assetId)}`);
    }
    return assetId;
}

// Process image: remove background colors for transparency, optionally resize.
// Uses execFileSync with discrete args — no shell, no interpolation of paths.
function processImage(inputPath, outputPath, assetId) {
    if (!hasImageMagick) {
        fs.copyFileSync(inputPath, outputPath);
        return { processed: false, message: 'No ImageMagick - saved without processing' };
    }

    const dims = getExpectedDimensions(assetId);
    const skipBgRemoval = shouldSkipBackgroundRemoval(assetId);

    if (!dims && skipBgRemoval) {
        fs.copyFileSync(inputPath, outputPath);
        return { processed: false, message: 'Saved without processing (artwork asset)' };
    }

    const args = [inputPath];
    if (dims) {
        args.push('-resize', `${dims.width}x${dims.height}!`);
    }
    if (!skipBgRemoval) {
        args.push('-fuzz', '20%', '-transparent', 'white');
        args.push('-fuzz', '10%');
        for (const c of ['rgb(204,204,204)', 'rgb(200,200,200)', 'rgb(210,210,210)',
                         'rgb(220,220,220)', 'rgb(230,230,230)', 'rgb(240,240,240)']) {
            args.push('-transparent', c);
        }
    }
    args.push(outputPath);

    try {
        execFileSync(magickBinary, args, { stdio: 'pipe' });
        let message = '';
        if (dims && !skipBgRemoval) {
            message = `Processed with transparency & resized to ${dims.width}x${dims.height}`;
        } else if (dims) {
            message = `Resized to ${dims.width}x${dims.height} (no bg removal)`;
        } else if (!skipBgRemoval) {
            message = 'Processed with transparency';
        } else {
            message = 'Saved (artwork asset)';
        }
        return { processed: true, message };
    } catch (err) {
        fs.copyFileSync(inputPath, outputPath);
        return { processed: false, message: 'Processing failed - saved original', error: err.message };
    }
}

// Parse multipart form data (simple implementation)
function parseMultipart(buffer, boundary) {
    const parts = {};
    const boundaryBuffer = Buffer.from('--' + boundary);

    let start = buffer.indexOf(boundaryBuffer) + boundaryBuffer.length + 2;

    while (start < buffer.length) {
        const end = buffer.indexOf(boundaryBuffer, start);
        if (end === -1) break;

        const part = buffer.slice(start, end - 2);
        const headerEnd = part.indexOf('\r\n\r\n');

        if (headerEnd !== -1) {
            const headers = part.slice(0, headerEnd).toString();
            const content = part.slice(headerEnd + 4);

            const nameMatch = headers.match(/name="([^"]+)"/);
            const filenameMatch = headers.match(/filename="([^"]+)"/);

            if (nameMatch) {
                const name = nameMatch[1];
                if (filenameMatch) {
                    parts[name] = {
                        filename: filenameMatch[1],
                        data: content
                    };
                } else {
                    parts[name] = content.toString();
                }
            }
        }

        start = end + boundaryBuffer.length + 2;
    }

    return parts;
}

function jsonResponse(res, status, body) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
}

/**
 * Authorization gate. In production-token mode, requires X-Admin-Token
 * header to match ADMIN_TOKEN. In loopback-dev mode (no token set), requires
 * the connection to come from 127.0.0.1 / ::1.
 *
 * Returns true if authorized, false if not (and writes a 401/403 response).
 */
function authorize(req, res) {
    if (ADMIN_TOKEN) {
        const supplied = req.headers['x-admin-token'];
        if (!supplied || supplied !== ADMIN_TOKEN) {
            jsonResponse(res, 401, { error: 'Unauthorized: missing or invalid X-Admin-Token' });
            return false;
        }
        return true;
    }
    // No token set: only allow loopback callers.
    const addr = req.socket.remoteAddress;
    if (addr === '127.0.0.1' || addr === '::1' || addr === '::ffff:127.0.0.1') {
        return true;
    }
    jsonResponse(res, 403, { error: 'Forbidden: ADMIN_TOKEN unset and request not from loopback' });
    return false;
}

function withRequestBody(req, res, maxBytes, handler) {
    const chunks = [];
    let received = 0;
    req.on('data', chunk => {
        received += chunk.length;
        if (received > maxBytes) {
            req.destroy();
            jsonResponse(res, 413, { error: `Payload too large (max ${maxBytes} bytes)` });
            return;
        }
        chunks.push(chunk);
    });
    req.on('end', () => {
        if (received > maxBytes) return; // already responded
        try {
            handler(Buffer.concat(chunks));
        } catch (err) {
            console.error('[upload-server] Handler error:', err.message);
            jsonResponse(res, 400, { error: err.message });
        }
    });
}

const server = http.createServer((req, res) => {
    // Restrictive CORS — admin pages are served from same host.
    res.setHeader('Access-Control-Allow-Origin', `http://localhost:3001`);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'GET' && req.url === '/status') {
        jsonResponse(res, 200, {
            status: 'Upload server running',
            port: PORT,
            host: HOST,
            hasImageMagick,
            authMode: ADMIN_TOKEN ? 'token' : 'loopback-only'
        });
        return;
    }

    if (req.method === 'POST' && req.url === '/upload') {
        if (!authorize(req, res)) return;
        withRequestBody(req, res, MAX_REQUEST_BYTES, (buffer) => {
            const contentType = req.headers['content-type'] || '';
            const boundary = contentType.split('boundary=')[1];
            if (!boundary) throw new Error('Missing multipart boundary');

            const parts = parseMultipart(buffer, boundary);
            const assetId = validateAssetId(parts.assetId);
            const rawFilename = parts.filename || (parts.file && parts.file.filename);
            const fileData = parts.file && parts.file.data;

            if (!fileData) throw new Error('Missing file data');
            if (fileData.length > MAX_IMAGE_BYTES) {
                throw new Error(`Image too large (max ${MAX_IMAGE_BYTES} bytes)`);
            }

            const folder = getAssetFolder(assetId);
            const targetDir = path.join(ASSETS_BASE, folder);
            // Ensure folder exists, then validate that filename stays inside it.
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }
            const targetPath = safeResolveInside(targetDir, rawFilename);

            const tempPath = safeResolveInside(targetDir, `_temp_${path.basename(rawFilename)}`);
            fs.writeFileSync(tempPath, fileData);
            const processResult = processImage(tempPath, targetPath, assetId);
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

            console.log(`✓ Saved: ${targetPath}`);
            console.log(`  ${processResult.message}`);

            jsonResponse(res, 200, {
                success: true,
                path: `assets/images/${folder}/${path.basename(targetPath)}`,
                message: `Saved to ${folder}/${path.basename(targetPath)}`,
                processing: processResult
            });
        });
        return;
    }

    if (req.method === 'POST' && req.url === '/delete') {
        if (!authorize(req, res)) return;
        withRequestBody(req, res, 4096, (buffer) => {
            const { assetId, filename } = JSON.parse(buffer.toString('utf8'));
            validateAssetId(assetId);

            const folder = getAssetFolder(assetId);
            const targetPath = safeResolveInside(path.join(ASSETS_BASE, folder), filename);

            if (fs.existsSync(targetPath)) {
                fs.unlinkSync(targetPath);
                console.log(`✗ Deleted: ${targetPath}`);
                jsonResponse(res, 200, { success: true, message: `Deleted ${folder}/${path.basename(targetPath)}` });
            } else {
                jsonResponse(res, 404, { error: 'File not found' });
            }
        });
        return;
    }

    if (req.method === 'POST' && req.url === '/upload-audio') {
        if (!authorize(req, res)) return;
        withRequestBody(req, res, MAX_REQUEST_BYTES, (buffer) => {
            const contentType = req.headers['content-type'] || '';
            const boundary = contentType.split('boundary=')[1];
            if (!boundary) throw new Error('Missing multipart boundary');

            const parts = parseMultipart(buffer, boundary);
            const assetId = validateAssetId(parts.assetId);
            const rawFilename = parts.filename || (parts.file && parts.file.filename);
            const fileData = parts.file && parts.file.data;

            if (!fileData) throw new Error('Missing file data');
            if (fileData.length > MAX_AUDIO_BYTES) {
                throw new Error(`Audio too large (max ${MAX_AUDIO_BYTES} bytes)`);
            }

            if (!fs.existsSync(AUDIO_BASE)) fs.mkdirSync(AUDIO_BASE, { recursive: true });
            const targetPath = safeResolveInside(AUDIO_BASE, rawFilename);

            fs.writeFileSync(targetPath, fileData);
            console.log(`✓ Audio saved: ${targetPath} (assetId=${assetId})`);

            jsonResponse(res, 200, {
                success: true,
                path: `assets/audio/${path.basename(targetPath)}`,
                message: `Saved audio: ${path.basename(targetPath)}`
            });
        });
        return;
    }

    if (req.method === 'POST' && req.url === '/delete-audio') {
        if (!authorize(req, res)) return;
        withRequestBody(req, res, 4096, (buffer) => {
            const { filename } = JSON.parse(buffer.toString('utf8'));

            if (typeof filename !== 'string' || !FILENAME_REGEX.test(filename)) {
                throw new Error(`Invalid filename: ${JSON.stringify(filename)}`);
            }
            const baseName = path.basename(filename).replace(/\.[^.]+$/, '');
            if (!FILENAME_REGEX.test(baseName)) {
                throw new Error(`Invalid base filename`);
            }

            const extensions = ['.mp3', '.ogg', '.wav', '.m4a'];
            let deleted = false;

            for (const ext of extensions) {
                const targetPath = safeResolveInside(AUDIO_BASE, baseName + ext);
                if (fs.existsSync(targetPath)) {
                    fs.unlinkSync(targetPath);
                    console.log(`✗ Audio deleted: ${targetPath}`);
                    deleted = true;
                }
            }

            // Also try the exact filename
            try {
                const exactPath = safeResolveInside(AUDIO_BASE, filename);
                if (fs.existsSync(exactPath)) {
                    fs.unlinkSync(exactPath);
                    console.log(`✗ Audio deleted: ${exactPath}`);
                    deleted = true;
                }
            } catch { /* invalid filename — already validated baseName above */ }

            jsonResponse(res, 200, {
                success: true,
                message: deleted ? `Deleted audio: ${filename}` : `File not found: ${filename}`
            });
        });
        return;
    }

    jsonResponse(res, 404, { error: 'Not found' });
});

server.listen(PORT, HOST, () => {
    console.log(`\n🐉 Dragon Run Asset Upload Server`);
    console.log(`   Listening on http://${HOST}:${PORT}  (loopback only — never expose)`);
    if (ADMIN_TOKEN) {
        console.log(`   Auth: token mode (X-Admin-Token required on every mutating request)`);
    } else {
        console.log(`   Auth: loopback-only mode — set ADMIN_TOKEN to require a header.`);
        console.log(`         WARNING: never run this without ADMIN_TOKEN behind any proxy or remote host.`);
    }
    console.log(`   `);
    console.log(`   Image endpoints:  POST /upload   POST /delete`);
    console.log(`   Audio endpoints:  POST /upload-audio   POST /delete-audio`);
    console.log(`   Status:           GET  /status\n`);
});
