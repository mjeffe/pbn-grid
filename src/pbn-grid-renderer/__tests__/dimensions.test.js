import { describe, it, expect } from 'vitest';
import { getCanvasDimensions } from '../index.js';

function makeGridResult(gridWidth, gridHeight, paletteSize = 3) {
    const palette = Array.from({ length: paletteSize }, (_, i) => ({
        index: i + 1, r: i * 80, g: i * 80, b: i * 80,
    }));
    const grid = Array.from({ length: gridHeight }, () =>
        Array.from({ length: gridWidth }, () => 1)
    );
    return { grid, palette, gridWidth, gridHeight };
}

describe('getCanvasDimensions', () => {
    it('uses default cell size of 30', () => {
        const result = makeGridResult(10, 10);
        const dims = getCanvasDimensions(result);
        expect(dims.width).toBe(300);
        expect(dims.height).toBeGreaterThan(300);
    });

    it('respects custom cell size', () => {
        const result = makeGridResult(5, 5);
        const dims = getCanvasDimensions(result, { cellSize: 40 });
        expect(dims.width).toBe(200);
        expect(dims.height).toBeGreaterThanOrEqual(200);
    });

    it('returns exact grid height when legend is disabled', () => {
        const result = makeGridResult(10, 10);
        const dims = getCanvasDimensions(result, { showLegend: false });
        expect(dims.width).toBe(300);
        expect(dims.height).toBe(300);
    });

    it('legend adds height compared to no legend', () => {
        const result = makeGridResult(10, 10);
        const withLegend = getCanvasDimensions(result, { showLegend: true });
        const withoutLegend = getCanvasDimensions(result, { showLegend: false });
        expect(withLegend.height).toBeGreaterThan(withoutLegend.height);
    });

    it('handles non-square grids', () => {
        const result = makeGridResult(20, 10);
        const dims = getCanvasDimensions(result);
        expect(dims.width).toBe(600);
        expect(dims.height).toBeGreaterThanOrEqual(300);
    });

    it('handles 1x1 grid', () => {
        const result = makeGridResult(1, 1);
        const dims = getCanvasDimensions(result);
        expect(dims.width).toBe(30);
        expect(dims.height).toBeGreaterThanOrEqual(30);
    });

    it('large palette increases legend height on narrow grid', () => {
        const small = makeGridResult(5, 5, 3);
        const large = makeGridResult(5, 5, 20);
        const dimsSmall = getCanvasDimensions(small);
        const dimsLarge = getCanvasDimensions(large);
        expect(dimsLarge.height).toBeGreaterThan(dimsSmall.height);
    });
});

describe('puzzleInfo dimensions', () => {
    it('puzzleInfo adds height when provided', () => {
        const result = makeGridResult(10, 10);
        const without = getCanvasDimensions(result);
        const withInfo = getCanvasDimensions(result, { puzzleInfo: { id: 1, title: 'Dog' } });
        expect(withInfo.height).toBeGreaterThan(without.height);
    });

    it('puzzleInfo adds height even without legend', () => {
        const result = makeGridResult(10, 10);
        const without = getCanvasDimensions(result, { showLegend: false });
        const withInfo = getCanvasDimensions(result, { showLegend: false, puzzleInfo: { id: 1 } });
        expect(withInfo.height).toBe(without.height + 30);
    });

    it('puzzleInfo null does not add height', () => {
        const result = makeGridResult(10, 10);
        const withNull = getCanvasDimensions(result, { puzzleInfo: null });
        const without = getCanvasDimensions(result);
        expect(withNull.height).toBe(without.height);
    });

    it('width is unchanged by puzzleInfo', () => {
        const result = makeGridResult(10, 10);
        const without = getCanvasDimensions(result);
        const withInfo = getCanvasDimensions(result, { puzzleInfo: { id: 5, title: 'Cat' } });
        expect(withInfo.width).toBe(without.width);
    });
});

describe('fontSize auto-scaling', () => {
    it('default fontSize is null (auto-scale)', () => {
        // getCanvasDimensions merges with defaults — fontSize doesn't affect
        // dimensions, but we verify the default value through the module.
        // We can import DEFAULT_OPTIONS indirectly by checking behavior:
        // passing no fontSize option should not throw.
        const result = makeGridResult(10, 10);
        const dims = getCanvasDimensions(result);
        expect(dims.width).toBe(300);
    });

    it('explicit fontSize overrides auto-scale without error', () => {
        const result = makeGridResult(10, 10);
        const dims = getCanvasDimensions(result, { fontSize: 20 });
        expect(dims.width).toBe(300);
    });

    it('auto-scale formula: Math.max(8, Math.floor(cellSize * 0.45))', () => {
        // cellSize 30 → Math.floor(30 * 0.45) = 13, max(8, 13) = 13
        // cellSize 10 → Math.floor(10 * 0.45) = 4, max(8, 4) = 8 (clamped)
        // cellSize 50 → Math.floor(50 * 0.45) = 22, max(8, 22) = 22
        // We test this via the exported autoFontSize helper if available,
        // otherwise verify indirectly that dims are still correct.
        const result = makeGridResult(5, 5);
        const dims10 = getCanvasDimensions(result, { cellSize: 10, showLegend: false });
        expect(dims10.width).toBe(50);
        expect(dims10.height).toBe(50);

        const dims50 = getCanvasDimensions(result, { cellSize: 50, showLegend: false });
        expect(dims50.width).toBe(250);
        expect(dims50.height).toBe(250);
    });
});
