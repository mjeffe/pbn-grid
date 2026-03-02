/**
 * Grid generation — maps image pixels to a 2D array of palette indices.
 */

import { nearestColor } from './quantize.js';

/**
 * Build a 2D grid of palette indices by dividing the image into cells
 * and finding the dominant quantized color in each cell.
 *
 * @param {{ data: Uint8ClampedArray, width: number, height: number }} imageData
 * @param {import('./quantize.js').PBNColor[]} palette
 * @param {number} gridWidth  — number of columns
 * @param {number} gridHeight — number of rows
 * @returns {number[][]} 2D array [row][col] of 1-based palette indices
 */
export function buildGrid(imageData, palette, gridWidth, gridHeight) {
    const { data, width, height } = imageData;
    const cellW = width / gridWidth;
    const cellH = height / gridHeight;
    const grid = [];

    for (let row = 0; row < gridHeight; row++) {
        const rowArr = [];
        for (let col = 0; col < gridWidth; col++) {
            const startX = Math.floor(col * cellW);
            const startY = Math.floor(row * cellH);
            const endX = Math.floor((col + 1) * cellW);
            const endY = Math.floor((row + 1) * cellH);

            // Count occurrences of each palette index in this cell region
            const counts = new Map();
            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                    const i = (y * width + x) * 4;
                    if (data[i + 3] === 0) continue;
                    const matched = nearestColor(data[i], data[i + 1], data[i + 2], palette);
                    counts.set(matched.index, (counts.get(matched.index) || 0) + 1);
                }
            }

            // Pick the most frequent palette index (default to first palette entry)
            let bestIndex = palette[0].index;
            let bestCount = 0;
            for (const [idx, cnt] of counts) {
                if (cnt > bestCount) {
                    bestCount = cnt;
                    bestIndex = idx;
                }
            }

            rowArr.push(bestIndex);
        }
        grid.push(rowArr);
    }

    return grid;
}
