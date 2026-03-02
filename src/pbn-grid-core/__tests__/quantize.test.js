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

describe('quantizeColors — over-quantize and merge', () => {
    it('preserves distinct minority colors', () => {
        // 95% brown/tan pixels, 5% vivid blue
        const pixels = [];
        const brownCount = 190;
        const blueCount = 10;
        for (let i = 0; i < brownCount; i++) {
            // Slight variation in browns
            const shade = 100 + (i % 40);
            pixels.push([shade, Math.round(shade * 0.7), Math.round(shade * 0.4), 255]);
        }
        for (let i = 0; i < blueCount; i++) {
            pixels.push([20, 40, 220, 255]);
        }
        const imageData = makeImageData(pixels, 20, 10);
        const palette = quantizeColors(imageData, 4);
        expect(palette).toHaveLength(4);

        // At least one palette entry should be blue-ish (b > r and b > g)
        const hasBlue = palette.some(c => c.b > 150 && c.b > c.r && c.b > c.g);
        expect(hasBlue).toBe(true);
    });

    it('merges similar colors together', () => {
        // 3 near-identical grays + 3 distinct colors
        const pixels = [];
        // Gray cluster: 120,120,120 / 122,122,122 / 118,118,118
        for (let i = 0; i < 30; i++) pixels.push([120, 120, 120, 255]);
        for (let i = 0; i < 30; i++) pixels.push([122, 122, 122, 255]);
        for (let i = 0; i < 30; i++) pixels.push([118, 118, 118, 255]);
        // Distinct: red, green, blue
        for (let i = 0; i < 30; i++) pixels.push([220, 30, 30, 255]);
        for (let i = 0; i < 30; i++) pixels.push([30, 220, 30, 255]);
        for (let i = 0; i < 30; i++) pixels.push([30, 30, 220, 255]);

        const imageData = makeImageData(pixels, 18, 10);
        const palette = quantizeColors(imageData, 4);
        expect(palette).toHaveLength(4);

        // Grays should collapse — at most 1-2 gray entries
        const grays = palette.filter(c =>
            Math.abs(c.r - c.g) < 30 && Math.abs(c.g - c.b) < 30 && c.r > 80 && c.r < 160
        );
        expect(grays.length).toBeLessThanOrEqual(2);
    });

    it('pixel-weighted merge produces result closer to dominant color', () => {
        // Many pixels of color A, few of color B (close in RGB space)
        const pixels = [];
        for (let i = 0; i < 100; i++) pixels.push([200, 50, 50, 255]);   // dominant red
        for (let i = 0; i < 10; i++) pixels.push([180, 60, 60, 255]);    // similar, minority
        // Add a very different color so these two must merge
        for (let i = 0; i < 50; i++) pixels.push([30, 30, 220, 255]);    // blue

        const imageData = makeImageData(pixels, 16, 10);
        const palette = quantizeColors(imageData, 2);
        expect(palette).toHaveLength(2);

        // The red-ish entry should be closer to [200,50,50] than [180,60,60]
        const redEntry = palette.find(c => c.r > c.b);
        expect(redEntry).toBeDefined();
        expect(redEntry.r).toBeGreaterThan(190);
    });

    it('handles colorCount >= distinct colors without error', () => {
        // Only 2 distinct colors, asking for 10
        const pixels = [];
        for (let i = 0; i < 8; i++) pixels.push([255, 0, 0, 255]);
        for (let i = 0; i < 8; i++) pixels.push([0, 255, 0, 255]);
        const imageData = makeImageData(pixels, 4, 4);
        const palette = quantizeColors(imageData, 10);
        // Should return what it can — no crash
        expect(palette.length).toBeGreaterThanOrEqual(1);
        expect(palette.length).toBeLessThanOrEqual(10);
        palette.forEach((c, i) => {
            expect(c.index).toBe(i + 1);
        });
    });

    it('is deterministic — same input produces same output', () => {
        const pixels = [];
        for (let r = 0; r < 4; r++) {
            for (let g = 0; g < 4; g++) {
                for (let b = 0; b < 4; b++) {
                    pixels.push([r * 85, g * 85, b * 85, 255]);
                }
            }
        }
        const imageData = makeImageData(pixels, 8, 8);
        const result1 = quantizeColors(imageData, 6);
        const result2 = quantizeColors(imageData, 6);
        expect(result1).toEqual(result2);
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
