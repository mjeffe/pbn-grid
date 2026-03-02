import { describe, it, expect } from 'vitest';
import { buildGrid } from '../grid.js';
import { generatePBNGrid } from '../index.js';

/**
 * Helper: create an ImageData-compatible object from a flat RGBA array.
 */
function makeImageData(rgbaArray, width, height) {
    return { data: new Uint8ClampedArray(rgbaArray), width, height };
}

/**
 * Helper: create a solid-color image of given dimensions.
 */
function solidImage(r, g, b, width, height) {
    const data = [];
    for (let i = 0; i < width * height; i++) {
        data.push(r, g, b, 255);
    }
    return makeImageData(data, width, height);
}

/**
 * Helper: create an image split vertically into two colors (left/right halves).
 */
function twoColorVerticalSplit(r1, g1, b1, r2, g2, b2, width, height) {
    const data = [];
    const half = Math.floor(width / 2);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (x < half) {
                data.push(r1, g1, b1, 255);
            } else {
                data.push(r2, g2, b2, 255);
            }
        }
    }
    return makeImageData(data, width, height);
}

describe('buildGrid', () => {
    it('solid-color image produces all same index', () => {
        const img = solidImage(100, 150, 200, 10, 10);
        const palette = [{ index: 1, r: 100, g: 150, b: 200 }];
        const grid = buildGrid(img, palette, 3, 3);

        expect(grid.length).toBe(3);
        expect(grid[0].length).toBe(3);
        for (const row of grid) {
            for (const cell of row) {
                expect(cell).toBe(1);
            }
        }
    });

    it('two-color vertical split maps to correct indices per column', () => {
        // 10px wide, left 5 = red, right 5 = blue
        const img = twoColorVerticalSplit(255, 0, 0, 0, 0, 255, 10, 10);
        const palette = [
            { index: 1, r: 255, g: 0, b: 0 },
            { index: 2, r: 0, g: 0, b: 255 },
        ];
        const grid = buildGrid(img, palette, 2, 1);

        expect(grid[0][0]).toBe(1); // left half → red
        expect(grid[0][1]).toBe(2); // right half → blue
    });

    it('handles 1×1 grid', () => {
        const img = solidImage(50, 60, 70, 4, 4);
        const palette = [{ index: 1, r: 50, g: 60, b: 70 }];
        const grid = buildGrid(img, palette, 1, 1);

        expect(grid.length).toBe(1);
        expect(grid[0].length).toBe(1);
        expect(grid[0][0]).toBe(1);
    });
});

describe('generatePBNGrid', () => {
    it('calculates grid dimensions constrainBy width (default)', () => {
        // 200×100 image, cellCount 20, constrain by width
        // gridWidth = 20, gridHeight = round(20 * 100/200) = 10
        const img = solidImage(128, 128, 128, 200, 100);
        const result = generatePBNGrid(img, { colorCount: 2, cellCount: 20 });

        expect(result.gridWidth).toBe(20);
        expect(result.gridHeight).toBe(10);
        expect(result.grid.length).toBe(10);
        expect(result.grid[0].length).toBe(20);
    });

    it('calculates grid dimensions constrainBy height', () => {
        // 100×200 image, cellCount 20, constrain by height
        // gridHeight = 20, gridWidth = round(20 * 100/200) = 10
        const img = solidImage(128, 128, 128, 100, 200);
        const result = generatePBNGrid(img, { colorCount: 2, cellCount: 20, constrainBy: 'height' });

        expect(result.gridHeight).toBe(20);
        expect(result.gridWidth).toBe(10);
    });

    it('applies defaults when options omitted', () => {
        const img = solidImage(128, 128, 128, 100, 100);
        const result = generatePBNGrid(img);

        expect(result.gridWidth).toBe(30);
        expect(result.gridHeight).toBe(30);
        expect(result.palette.length).toBeGreaterThanOrEqual(1);
    });

    it('returns PBNGridResult with correct shape', () => {
        const img = solidImage(200, 100, 50, 50, 50);
        const result = generatePBNGrid(img, { colorCount: 3, cellCount: 5 });

        expect(result).toHaveProperty('grid');
        expect(result).toHaveProperty('palette');
        expect(result).toHaveProperty('gridWidth');
        expect(result).toHaveProperty('gridHeight');
        expect(Array.isArray(result.grid)).toBe(true);
        expect(Array.isArray(result.palette)).toBe(true);
    });

    it('handles aspect ratio rounding correctly', () => {
        // 100×150 image, cellCount 10, constrain by width
        // gridWidth = 10, gridHeight = round(10 * 150/100) = 15
        const img = solidImage(128, 128, 128, 100, 150);
        const result = generatePBNGrid(img, { colorCount: 2, cellCount: 10 });

        expect(result.gridWidth).toBe(10);
        expect(result.gridHeight).toBe(15);
    });

    it('handles very small image', () => {
        // 1×1 image
        const img = solidImage(255, 0, 0, 1, 1);
        const result = generatePBNGrid(img, { colorCount: 2, cellCount: 1 });

        expect(result.gridWidth).toBe(1);
        expect(result.gridHeight).toBe(1);
        expect(result.grid.length).toBe(1);
        expect(result.grid[0].length).toBe(1);
    });
});
