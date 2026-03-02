#!/usr/bin/env node

import { readdir, readFile, writeFile, unlink, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, extname, basename } from 'node:path';
import sharp from 'sharp';
import { generatePBNGrid } from '../src/pbn-grid-core/index.js';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const DEFAULT_SOURCE_DIR = 'puzzles/source-images';
const MANIFEST_PATH = 'src/puzzles/manifest.json';
const PUZZLES_DIR = 'src/puzzles';

function parseArgs(argv) {
    const args = argv.slice(2);
    const result = {
        sourceDir: DEFAULT_SOURCE_DIR,
        colorCount: 10,
        cellCount: 30,
        constrainBy: 'width',
        force: false,
    };

    let i = 0;
    while (i < args.length) {
        const arg = args[i];
        if (arg === '--color-count') {
            result.colorCount = parseInt(args[++i], 10);
        } else if (arg === '--cell-count') {
            result.cellCount = parseInt(args[++i], 10);
        } else if (arg === '--constrain-by') {
            result.constrainBy = args[++i];
        } else if (arg === '--force') {
            result.force = true;
        } else if (!arg.startsWith('--')) {
            result.sourceDir = arg;
        }
        i++;
    }

    return result;
}

async function loadManifest() {
    try {
        const data = await readFile(MANIFEST_PATH, 'utf-8');
        return JSON.parse(data);
    } catch {
        return { options: {}, puzzles: [] };
    }
}

async function hashFile(filePath) {
    const data = await readFile(filePath);
    return createHash('sha256').update(data).digest('hex');
}

function titleFromFilename(filename) {
    const name = basename(filename, extname(filename));
    // Replace hyphens/underscores with spaces, capitalize first letter of each word
    return name
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function loadImageData(filePath) {
    const image = sharp(filePath).removeAlpha().ensureAlpha();
    const { width, height } = await image.metadata();
    const rawBuffer = await image.raw().toBuffer();
    const data = new Uint8ClampedArray(rawBuffer.buffer, rawBuffer.byteOffset, rawBuffer.byteLength);
    return { data, width, height };
}

async function main() {
    const config = parseArgs(process.argv);

    // Ensure output directory exists
    await mkdir(PUZZLES_DIR, { recursive: true });

    // Scan source directory for images
    let files;
    try {
        const entries = await readdir(config.sourceDir);
        files = entries
            .filter((f) => IMAGE_EXTENSIONS.has(extname(f).toLowerCase()))
            .sort();
    } catch (err) {
        console.error(`Error reading source directory "${config.sourceDir}": ${err.message}`);
        process.exit(1);
    }

    if (files.length === 0) {
        console.log(`No image files found in "${config.sourceDir}".`);
        return;
    }

    const manifest = await loadManifest();
    const existingByFilename = new Map(manifest.puzzles.map((p) => [p.filename, p]));

    // Determine next available ID
    const maxId = manifest.puzzles.reduce((max, p) => Math.max(max, p.id), 0);
    let nextId = maxId + 1;

    const stats = { added: 0, updated: 0, removed: 0, skipped: 0 };
    const newPuzzles = [];

    for (const filename of files) {
        const filePath = join(config.sourceDir, filename);
        const hash = await hashFile(filePath);
        const existing = existingByFilename.get(filename);

        if (existing && existing.hash === hash && !config.force) {
            // Unchanged — skip
            newPuzzles.push(existing);
            stats.skipped++;
            console.log(`  skip: #${existing.id} — ${existing.title} (unchanged)`);
            continue;
        }

        const id = existing ? existing.id : nextId++;
        const title = existing ? existing.title : titleFromFilename(filename);
        const action = existing ? 'update' : 'add';

        console.log(`  ${action}: #${id} — ${title} (${filename})`);

        const imageData = await loadImageData(filePath);
        const result = generatePBNGrid(imageData, {
            colorCount: config.colorCount,
            cellCount: config.cellCount,
            constrainBy: config.constrainBy,
        });

        await writeFile(join(PUZZLES_DIR, `${id}.json`), JSON.stringify(result));

        newPuzzles.push({ id, filename, hash, title });

        if (action === 'add') stats.added++;
        else stats.updated++;
    }

    // Remove entries for deleted source images
    const currentFilenames = new Set(files);
    for (const entry of manifest.puzzles) {
        if (!currentFilenames.has(entry.filename)) {
            console.log(`  remove: #${entry.id} — ${entry.title} (source deleted)`);
            try {
                await unlink(join(PUZZLES_DIR, `${entry.id}.json`));
            } catch {
                // File may already be gone
            }
            stats.removed++;
        }
    }

    // Sort puzzles by ID for consistent output
    newPuzzles.sort((a, b) => a.id - b.id);

    const updatedManifest = {
        options: {
            colorCount: config.colorCount,
            cellCount: config.cellCount,
            constrainBy: config.constrainBy,
        },
        puzzles: newPuzzles,
    };

    await writeFile(MANIFEST_PATH, JSON.stringify(updatedManifest, null, 4) + '\n');

    console.log(`\nDone: ${stats.added} added, ${stats.updated} updated, ${stats.removed} removed, ${stats.skipped} skipped.`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
