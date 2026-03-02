/**
 * Legend renderer — draws the color legend below the paint-by-number grid
 * and calculates its dimensions.
 *
 * @typedef {import('../pbn-grid-core/index.js').PBNColor} PBNColor
 */

const SWATCH_SIZE = 20;
const ENTRY_GAP = 15;
const SWATCH_GAP = 4;
const NUMBER_GAP = 4;
const TOP_PADDING = 20;
const FONT = '14px sans-serif';
const MUTED_COLOR = '#999999';

/**
 * Measure the pixel width of a palette entry's index number.
 *
 * @param {CanvasRenderingContext2D | null} ctx
 * @param {number} index
 * @returns {number}
 */
function measureNumberWidth(ctx, index) {
    if (ctx) {
        ctx.font = FONT;
        return ctx.measureText(String(index)).width;
    }
    // Rough estimate when no context is available (~8px per character at 14px font)
    return String(index).length * 8;
}

/**
 * Compute the width of a single legend entry.
 *
 * @param {CanvasRenderingContext2D | null} ctx
 * @param {number} index
 * @returns {number}
 */
function entryWidth(ctx, index) {
    return measureNumberWidth(ctx, index) + NUMBER_GAP + SWATCH_SIZE + SWATCH_GAP + SWATCH_SIZE;
}

/**
 * Calculate the height needed for the legend area.
 *
 * @param {PBNColor[]} palette
 * @param {number} canvasWidth
 * @returns {{ width: number, height: number }}
 */
export function calculateLegendDimensions(palette, canvasWidth) {
    let rows = 1;
    let cursorX = 0;

    for (let i = 0; i < palette.length; i++) {
        const w = entryWidth(null, palette[i].index);
        if (cursorX > 0 && cursorX + w > canvasWidth) {
            rows++;
            cursorX = 0;
        }
        cursorX += w + ENTRY_GAP;
    }

    const height = TOP_PADDING + rows * (SWATCH_SIZE + ENTRY_GAP);

    return { width: canvasWidth, height };
}

/**
 * Render the color legend at the given position on the canvas.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {PBNColor[]} palette
 * @param {number} x — left x position
 * @param {number} y — top y position (should already account for grid height)
 * @param {number} canvasWidth — available width for wrapping
 */
export function renderLegend(ctx, palette, x, y, canvasWidth) {
    let cursorX = x;
    let cursorY = y + TOP_PADDING;

    ctx.font = FONT;
    ctx.textBaseline = 'middle';

    for (let i = 0; i < palette.length; i++) {
        const color = palette[i];
        const w = entryWidth(ctx, color.index);

        if (cursorX > x && cursorX - x + w > canvasWidth) {
            cursorX = x;
            cursorY += SWATCH_SIZE + ENTRY_GAP;
        }

        const centerY = cursorY + SWATCH_SIZE / 2;

        // Index number
        ctx.fillStyle = MUTED_COLOR;
        const numW = measureNumberWidth(ctx, color.index);
        ctx.fillText(String(color.index), cursorX, centerY);

        // Color swatch
        const swatchX = cursorX + numW + NUMBER_GAP;
        ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
        ctx.fillRect(swatchX, cursorY, SWATCH_SIZE, SWATCH_SIZE);
        ctx.strokeStyle = MUTED_COLOR;
        ctx.lineWidth = 1;
        ctx.strokeRect(swatchX, cursorY, SWATCH_SIZE, SWATCH_SIZE);

        // Blank swatch
        const blankX = swatchX + SWATCH_SIZE + SWATCH_GAP;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(blankX, cursorY, SWATCH_SIZE, SWATCH_SIZE);
        ctx.strokeStyle = MUTED_COLOR;
        ctx.strokeRect(blankX, cursorY, SWATCH_SIZE, SWATCH_SIZE);

        cursorX += w + ENTRY_GAP;
    }
}
