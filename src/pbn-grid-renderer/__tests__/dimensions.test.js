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
