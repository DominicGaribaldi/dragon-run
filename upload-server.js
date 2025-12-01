/**
 * Dragon Run Asset Upload Server
 *
 * This server handles file uploads from the admin panel
 * and saves them to the correct asset folders.
 * It also processes images to add transparency and resize if needed.
 *
 * Run with: node upload-server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = 3002;
const ASSETS_BASE = path.join(__dirname, 'assets', 'images');
const AUDIO_BASE = path.join(__dirname, 'assets', 'audio');

// Check if ImageMagick is available
let hasImageMagick = false;
try {
    execSync('which magick || which convert', { stdio: 'ignore' });
    hasImageMagick = true;
    console.log('✓ ImageMagick detected - image processing enabled');
} catch {
    console.log('⚠ ImageMagick not found - images will be saved without processing');
}

// Expected dimensions for different asset types
// All sprite sheets and icons will be resized and have backgrounds removed
const expectedDimensions = {
    'char_': { width: 256, height: 256, frameSize: 64, description: '4x4 grid, 64px frames' },
    'dragon_': { width: 512, height: 512, frameSize: 128, description: '4x4 grid, 128px frames' },
    'knight_': { width: 256, height: 256, frameSize: 64, description: '4x4 grid, 64px frames' },
    'monster_': { width: 256, height: 256, frameSize: 64, description: '4x4 grid, 64px frames' },
    'fx_': { width: 256, height: 256, frameSize: 64, description: '4x4 grid, 64px frames' },
    'item_': { width: 64, height: 64, description: 'single 64x64 icon' },
    'tile_': { width: 64, height: 64, description: 'single 64x64 tile' },
    'ui_dice': { width: 256, height: 256, frameSize: 64, description: '4x4 grid, 64px frames' }
    // Note: ui_, bg_ assets without specific size constraints get background removal only
};

// Assets that should NOT have background removal (full artwork, not sprites)
const skipBackgroundRemoval = [
    'bg_',              // Background images
    'card_',            // Character card artwork
    'encounter_',       // Encounter card artwork
    'ui_character_select', // Character select screen background
    'ui_logo'           // Logo artwork
];

// Get expected dimensions for an asset
function getExpectedDimensions(assetId) {
    for (const [prefix, dims] of Object.entries(expectedDimensions)) {
        if (assetId.startsWith(prefix)) {
            return dims;
        }
    }
    return null;
}

// Check if asset should skip background removal
function shouldSkipBackgroundRemoval(assetId) {
    return skipBackgroundRemoval.some(prefix => assetId.startsWith(prefix));
}

// Process image: remove background colors for transparency, optionally resize
function processImage(inputPath, outputPath, assetId) {
    if (!hasImageMagick) {
        // Just copy the file if no ImageMagick
        fs.copyFileSync(inputPath, outputPath);
        return { processed: false, message: 'No ImageMagick - saved without processing' };
    }

    const dims = getExpectedDimensions(assetId);
    const skipBgRemoval = shouldSkipBackgroundRemoval(assetId);

    // If no processing needed, just copy the file
    if (!dims && skipBgRemoval) {
        fs.copyFileSync(inputPath, outputPath);
        return { processed: false, message: 'Saved without processing (artwork asset)' };
    }

    let command = 'magick';
    let args = [`"${inputPath}"`];

    // Resize if needed
    if (dims) {
        args.push(`-resize ${dims.width}x${dims.height}!`);
    }

    // Only apply background removal for sprite assets (not artwork)
    if (!skipBgRemoval) {
        // Make white and near-white colors transparent (catches most AI-generated backgrounds)
        // Using 20% fuzz to catch off-white and light gray backgrounds
        args.push(
            '-fuzz 20%',
            '-transparent white'
        );

        // Also target common gray backgrounds from AI generators
        args.push(
            '-fuzz 10%',
            '-transparent "rgb(204,204,204)"',
            '-transparent "rgb(200,200,200)"',
            '-transparent "rgb(210,210,210)"',
            '-transparent "rgb(220,220,220)"',
            '-transparent "rgb(230,230,230)"',
            '-transparent "rgb(240,240,240)"'
        );
    }

    args.push(`"${outputPath}"`);

    try {
        execSync(`${command} ${args.join(' ')}`, { stdio: 'pipe' });
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
        // Fallback: just copy the file
        fs.copyFileSync(inputPath, outputPath);
        return { processed: false, message: 'Processing failed - saved original', error: err.message };
    }
}

// Asset path mappings based on asset ID prefixes
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

// Determine the correct folder for an asset
function getAssetFolder(assetId) {
    for (const [prefix, folder] of Object.entries(pathMappings)) {
        if (assetId.startsWith(prefix)) {
            return folder;
        }
    }
    return 'misc';
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

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/upload') {
        const chunks = [];

        req.on('data', chunk => chunks.push(chunk));

        req.on('end', () => {
            try {
                const buffer = Buffer.concat(chunks);
                const contentType = req.headers['content-type'];
                const boundary = contentType.split('boundary=')[1];

                const parts = parseMultipart(buffer, boundary);

                const assetId = parts.assetId;
                const filename = parts.filename || (parts.file && parts.file.filename);
                const fileData = parts.file && parts.file.data;

                if (!assetId || !fileData) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing assetId or file' }));
                    return;
                }

                const folder = getAssetFolder(assetId);
                const targetDir = path.join(ASSETS_BASE, folder);
                const targetPath = path.join(targetDir, filename);

                // Ensure directory exists
                if (!fs.existsSync(targetDir)) {
                    fs.mkdirSync(targetDir, { recursive: true });
                }

                // Save to temp file first for processing
                const tempPath = path.join(targetDir, `_temp_${filename}`);
                fs.writeFileSync(tempPath, fileData);

                // Process the image (transparency, resize)
                const processResult = processImage(tempPath, targetPath, assetId);

                // Clean up temp file
                if (fs.existsSync(tempPath)) {
                    fs.unlinkSync(tempPath);
                }

                console.log(`✓ Saved: ${targetPath}`);
                console.log(`  ${processResult.message}`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    path: `assets/images/${folder}/${filename}`,
                    message: `Saved to ${folder}/${filename}`,
                    processing: processResult
                }));

            } catch (error) {
                console.error('Upload error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    } else if (req.method === 'POST' && req.url === '/delete') {
        // Handle file deletion
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const { assetId, filename } = JSON.parse(body);

                if (!assetId || !filename) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing assetId or filename' }));
                    return;
                }

                const folder = getAssetFolder(assetId);
                const targetPath = path.join(ASSETS_BASE, folder, filename);

                if (fs.existsSync(targetPath)) {
                    fs.unlinkSync(targetPath);
                    console.log(`✗ Deleted: ${targetPath}`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        message: `Deleted ${folder}/${filename}`
                    }));
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'File not found' }));
                }
            } catch (error) {
                console.error('Delete error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    } else if (req.method === 'POST' && req.url === '/upload-audio') {
        // Handle audio file uploads
        const chunks = [];

        req.on('data', chunk => chunks.push(chunk));

        req.on('end', () => {
            try {
                const buffer = Buffer.concat(chunks);
                const contentType = req.headers['content-type'];
                const boundary = contentType.split('boundary=')[1];

                const parts = parseMultipart(buffer, boundary);

                const assetId = parts.assetId;
                const filename = parts.filename || (parts.file && parts.file.filename);
                const fileData = parts.file && parts.file.data;

                if (!assetId || !fileData) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing assetId or file' }));
                    return;
                }

                // Ensure audio directory exists
                if (!fs.existsSync(AUDIO_BASE)) {
                    fs.mkdirSync(AUDIO_BASE, { recursive: true });
                }

                const targetPath = path.join(AUDIO_BASE, filename);

                // Save the audio file directly (no processing needed)
                fs.writeFileSync(targetPath, fileData);

                console.log(`✓ Audio saved: ${targetPath}`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    path: `assets/audio/${filename}`,
                    message: `Saved audio: ${filename}`
                }));

            } catch (error) {
                console.error('Audio upload error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    } else if (req.method === 'POST' && req.url === '/delete-audio') {
        // Handle audio file deletion
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const { assetId, filename } = JSON.parse(body);

                if (!filename) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing filename' }));
                    return;
                }

                // Try to find and delete the file with any extension
                const baseName = filename.replace(/\.[^.]+$/, '');
                const extensions = ['.mp3', '.ogg', '.wav', '.m4a'];
                let deleted = false;

                for (const ext of extensions) {
                    const targetPath = path.join(AUDIO_BASE, baseName + ext);
                    if (fs.existsSync(targetPath)) {
                        fs.unlinkSync(targetPath);
                        console.log(`✗ Audio deleted: ${targetPath}`);
                        deleted = true;
                    }
                }

                // Also try exact filename
                const exactPath = path.join(AUDIO_BASE, filename);
                if (fs.existsSync(exactPath)) {
                    fs.unlinkSync(exactPath);
                    console.log(`✗ Audio deleted: ${exactPath}`);
                    deleted = true;
                }

                if (deleted) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        message: `Deleted audio: ${filename}`
                    }));
                } else {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        message: `File not found (may already be deleted): ${filename}`
                    }));
                }
            } catch (error) {
                console.error('Audio delete error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    } else if (req.method === 'GET' && req.url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'Upload server running', port: PORT, hasImageMagick }));
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

server.listen(PORT, () => {
    console.log(`\n🐉 Dragon Run Asset Upload Server`);
    console.log(`   Running on http://localhost:${PORT}`);
    console.log(`   `);
    console.log(`   Image endpoints:`);
    console.log(`   POST /upload - Upload an image asset`);
    console.log(`   POST /delete - Delete an image asset`);
    console.log(`   `);
    console.log(`   Audio endpoints:`);
    console.log(`   POST /upload-audio - Upload an audio file`);
    console.log(`   POST /delete-audio - Delete an audio file`);
    console.log(`   `);
    console.log(`   GET /status - Check server status\n`);
});
