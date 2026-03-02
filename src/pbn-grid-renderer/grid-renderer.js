/**
 * Render the PBN grid onto a 2D canvas context.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number[][]} grid - 2D array [row][col] of 1-based palette indices
 * @param {number} gridWidth - number of columns
 * @param {number} gridHeight - number of rows
 * @param {{ cellSize: number, lineColor: string, lineWidth: number, numberColor: string, fontSize: number }} opts
 */
export function renderGrid(ctx, grid, gridWidth, gridHeight, opts) {
    const { cellSize, lineColor, lineWidth, numberColor, fontSize } = opts;
    const totalWidth = gridWidth * cellSize;
    const totalHeight = gridHeight * cellSize;

    // Fill entire grid area with white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    // Draw cell numbers
    ctx.fillStyle = numberColor;
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let row = 0; row < gridHeight; row++) {
        for (let col = 0; col < gridWidth; col++) {
            const x = col * cellSize + cellSize / 2;
            const y = row * cellSize + cellSize / 2;
            ctx.fillText(String(grid[row][col]), x, y);
        }
    }

    // Draw grid lines
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;

    // Vertical lines
    for (let col = 0; col <= gridWidth; col++) {
        const x = col * cellSize;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, totalHeight);
        ctx.stroke();
    }

    // Horizontal lines
    for (let row = 0; row <= gridHeight; row++) {
        const y = row * cellSize;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(totalWidth, y);
        ctx.stroke();
    }
}
