import { describe, it, expect } from 'vitest';
import { quantizeColors, nearestColor } from '../quantize.js';

/**
 * Helper: create an ImageData-compatible object from an array of [r,g,b,a] pixels.
 */
function makeImageData(pixels, width, height) {
    const data = new Uint8ClampedArray(pixels.flat());
    return { data, width, height };
}

/**
 * Helper: create a solid-color image.
 */
function solidImage(r, g, b, width = 4, height = 4) {
    const pixels = [];
    for (let i = 0; i < width * height; i++) {
        pixels.push([r, g, b, 255]);
    }
    return makeImageData(pixels, width, height);
}

describe('quantizeColors', () => {
    it('returns the correct number of colors for multi-color input', () => {
        // Create image with many distinct colors
        const pixels = [];
        for (let r = 0; r < 4; r++) {
            for (let g = 0; g < 4; g++) {
                for (let b = 0; b < 4; b++) {
                    pixels.push([r * 85, g * 85, b * 85, 255]);
                }
            }
        }
        // 64 pixels, 64 distinct colors
        const imageData = makeImageData(pixels, 8, 8);
        const palette = quantizeColors(imageData, 8);
        expect(palette).toHaveLength(8);
        palette.forEach((c, i) => {
            expect(c.index).toBe(i + 1);
            expect(c.r).toBeGreaterThanOrEqual(0);
            expect(c.r).toBeLessThanOrEqual(255);
            expect(c.g).toBeGreaterThanOrEqual(0);
            expect(c.g).toBeLessThanOrEqual(255);
            expect(c.b).toBeGreaterThanOrEqual(0);
            expect(c.b).toBeLessThanOrEqual(255);
        });
    });

    it('returns one color for single-color data', () => {
        const imageData = solidImage(100, 150, 200);
        const palette = quantizeColors(imageData, 5);
        expect(palette).toHaveLength(1);
        expect(palette[0]).toEqual({ index: 1, r: 100, g: 150, b: 200 });
    });

    it('returns two colors for two distinct colors', () => {
        const pixels = [];
        // 8 red pixels, 8 blue pixels
        for (let i = 0; i < 8; i++) pixels.push([255, 0, 0, 255]);
        for (let i = 0; i < 8; i++) pixels.push([0, 0, 255, 255]);
        const imageData = makeImageData(pixels, 4, 4);
        const palette = quantizeColors(imageData, 2);
        expect(palette).toHaveLength(2);

        const reds = palette.map(c => c.r);
        const blues = palette.map(c => c.b);
        // One color should be red-ish, other blue-ish
        expect(Math.max(...reds)).toBe(255);
        expect(Math.max(...blues)).toBe(255);
    });

    it('handles colorCount exceeding actual distinct colors', () => {
        // Only 2 distinct colors but asking for 10
        const pixels = [];
        for (let i = 0; i < 8; i++) pixels.push([255, 0, 0, 255]);
        for (let i = 0; i < 8; i++) pixels.push([0, 255, 0, 255]);
        const imageData = makeImageData(pixels, 4, 4);
        const palette = quantizeColors(imageData, 10);
        // Should return at most 2, since we can't split further
        expect(palette.length).toBeGreaterThanOrEqual(1);
        expect(palette.length).toBeLessThanOrEqual(10);
    });

    it('handles 1×1 image', () => {
        const imageData = makeImageData([[42, 100, 200, 255]], 1, 1);
        const palette = quantizeColors(imageData, 5);
        expect(palette).toHaveLength(1);
        expect(palette[0]).toEqual({ index: 1, r: 42, g: 100, b: 200 });
    });

    it('skips fully transparent pixels', () => {
        const pixels = [
            [255, 0, 0, 255],   // opaque red
            [0, 255, 0, 0],     // fully transparent - should be skipped
            [255, 0, 0, 255],   // opaque red
            [0, 0, 255, 0],     // fully transparent - should be skipped
        ];
        const imageData = makeImageData(pixels, 2, 2);
        const palette = quantizeColors(imageData, 5);
        expect(palette).toHaveLength(1);
        expect(palette[0].r).toBe(255);
        expect(palette[0].g).toBe(0);
        expect(palette[0].b).toBe(0);
    });

    it('returns palette with 1-based indices', () => {
        const pixels = [];
        for (let i = 0; i < 16; i++) pixels.push([i * 16, 0, 0, 255]);
        const imageData = makeImageData(pixels, 4, 4);
        const palette = quantizeColors(imageData, 4);
        palette.forEach((c, i) => {
            expect(c.index).toBe(i + 1);
        });
    });
});

describe('nearestColor', () => {
    const palette = [
        { index: 1, r: 255, g: 0, b: 0 },
        { index: 2, r: 0, g: 255, b: 0 },
        { index: 3, r: 0, g: 0, b: 255 },
    ];

    it('finds exact match', () => {
        expect(nearestColor(255, 0, 0, palette)).toBe(palette[0]);
        expect(nearestColor(0, 255, 0, palette)).toBe(palette[1]);
        expect(nearestColor(0, 0, 255, palette)).toBe(palette[2]);
    });

    it('finds nearest color for approximate values', () => {
        expect(nearestColor(250, 10, 10, palette)).toBe(palette[0]);
        expect(nearestColor(10, 240, 10, palette)).toBe(palette[1]);
        expect(nearestColor(10, 10, 240, palette)).toBe(palette[2]);
    });

    it('handles single-color palette', () => {
        const single = [{ index: 1, r: 128, g: 128, b: 128 }];
        expect(nearestColor(0, 0, 0, single)).toBe(single[0]);
        expect(nearestColor(255, 255, 255, single)).toBe(single[0]);
    });
});
