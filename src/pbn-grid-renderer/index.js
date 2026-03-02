import { renderGrid } from './grid-renderer.js';
import { renderLegend, calculateLegendDimensions } from './legend-renderer.js';

const DEFAULT_OPTIONS = {
    cellSize: 30,
    lineColor: '#cccccc',
    lineWidth: 0.5,
    numberColor: '#999999',
    fontSize: null,
    showLegend: true,
};

/**
 * Auto-calculate font size from cell size.
 * @param {number} cellSize
 * @returns {number}
 */
function autoFontSize(cellSize) {
    return Math.max(8, Math.floor(cellSize * 0.45));
}

/**
 * Resolve fontSize — use auto-scaling when null.
 * @param {number|null} fontSize
 * @param {number} cellSize
 * @returns {number}
 */
function resolveFontSize(fontSize, cellSize) {
    return fontSize != null ? fontSize : autoFontSize(cellSize);
}

/**
 * @typedef {Object} RenderOptions
 * @property {number} [cellSize=30]
 * @property {string} [lineColor='#cccccc']
 * @property {number} [lineWidth=0.5]
 * @property {string} [numberColor='#999999']
 * @property {number|null} [fontSize=null] - When null, auto-scales as Math.max(8, Math.floor(cellSize * 0.45))
 * @property {boolean} [showLegend=true]
 */

/**
 * Calculates required canvas dimensions without rendering.
 *
 * @param {import('../core/index.js').PBNGridResult} gridResult
 * @param {RenderOptions} [options]
 * @returns {{ width: number, height: number }}
 */
function getCanvasDimensions(gridResult, options) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const gridPixelWidth = gridResult.gridWidth * opts.cellSize;
    const gridPixelHeight = gridResult.gridHeight * opts.cellSize;

    let totalHeight = gridPixelHeight;
    if (opts.showLegend) {
        const legendDimensions = calculateLegendDimensions(gridResult.palette, gridPixelWidth);
        totalHeight += legendDimensions.height;
    }

    return { width: gridPixelWidth, height: totalHeight };
}

/**
 * Renders the grid and legend onto the provided canvas element.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {import('../core/index.js').PBNGridResult} gridResult
 * @param {RenderOptions} [options]
 */
function renderPBNGrid(canvas, gridResult, options) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const dimensions = getCanvasDimensions(gridResult, opts);

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    opts.fontSize = resolveFontSize(opts.fontSize, opts.cellSize);

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    renderGrid(ctx, gridResult.grid, gridResult.gridWidth, gridResult.gridHeight, opts);

    if (opts.showLegend) {
        renderLegend(ctx, gridResult.palette, 0, gridResult.gridHeight * opts.cellSize, canvas.width);
    }
}

export { renderPBNGrid, getCanvasDimensions };
