/**
 * pbn-grid-core — public API
 *
 * @typedef {import('./quantize.js').PBNColor} PBNColor
 * @typedef {{ grid: number[][], palette: PBNColor[], gridWidth: number, gridHeight: number }} PBNGridResult
 */

import { quantizeColors } from './quantize.js';
import { buildGrid } from './grid.js';

export { quantizeColors } from './quantize.js';
export { buildGrid } from './grid.js';

const DEFAULTS = {
    colorCount: 10,
    constrainBy: 'width',
    cellCount: 30,
};

/**
 * Generate a paint-by-number grid from image pixel data.
 *
 * @param {{ data: Uint8ClampedArray, width: number, height: number }} imageData
 * @param {{ colorCount?: number, constrainBy?: string, cellCount?: number }} [options]
 * @returns {PBNGridResult}
 */
export function generatePBNGrid(imageData, options) {
    const opts = { ...DEFAULTS, ...options };
    const { width, height } = imageData;

    let gridWidth, gridHeight;
    if (opts.constrainBy === 'height') {
        gridHeight = opts.cellCount;
        gridWidth = Math.round(opts.cellCount * (width / height));
    } else {
        gridWidth = opts.cellCount;
        gridHeight = Math.round(opts.cellCount * (height / width));
    }

    // Ensure at least 1 cell in each dimension
    gridWidth = Math.max(1, gridWidth);
    gridHeight = Math.max(1, gridHeight);

    const palette = quantizeColors(imageData, opts.colorCount);
    const grid = buildGrid(imageData, palette, gridWidth, gridHeight);

    return { grid, palette, gridWidth, gridHeight };
}
