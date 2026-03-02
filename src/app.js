import { generatePBNGrid } from './pbn-grid-core/index.js';
import { renderPBNGrid } from './pbn-grid-renderer/index.js';

const imageInput = document.getElementById('image-input');
const preview = document.getElementById('preview');
const colorCountInput = document.getElementById('color-count');
const constrainBySelect = document.getElementById('constrain-by');
const cellCountInput = document.getElementById('cell-count');
const warning = document.getElementById('warning');
const generateBtn = document.getElementById('generate-btn');
const result = document.getElementById('result');
const canvas = document.getElementById('result-canvas');
const downloadBtn = document.getElementById('download-btn');
const printBtn = document.getElementById('print-btn');

let storedImageData = null;

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
        const dataURL = evt.target.result;
        preview.src = dataURL;

        const img = new Image();
        img.onload = () => {
            const offscreen = document.createElement('canvas');
            offscreen.width = img.width;
            offscreen.height = img.height;
            const ctx = offscreen.getContext('2d');
            ctx.drawImage(img, 0, 0);
            storedImageData = ctx.getImageData(0, 0, img.width, img.height);
            generateBtn.disabled = false;
        };
        img.src = dataURL;
    };
    reader.readAsDataURL(file);
});

generateBtn.addEventListener('click', () => {
    if (!storedImageData) return;

    const options = {
        colorCount: parseInt(colorCountInput.value, 10),
        constrainBy: constrainBySelect.value,
        cellCount: parseInt(cellCountInput.value, 10),
    };

    const gridResult = generatePBNGrid(storedImageData, options);
    renderPBNGrid(canvas, gridResult);

    result.style.display = '';

    if (gridResult.gridWidth > 60 || gridResult.gridHeight > 60) {
        warning.textContent = `Grid is ${gridResult.gridWidth}×${gridResult.gridHeight} cells — `
            + 'large grids may be hard to read when printed.';
        warning.style.display = '';
    } else {
        warning.style.display = 'none';
    }
});

downloadBtn.addEventListener('click', () => {
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pbn-grid.png';
        a.click();
        URL.revokeObjectURL(url);
    });
});

printBtn.addEventListener('click', () => {
    const dataURL = canvas.toDataURL();
    const win = window.open('', '_blank');
    win.document.write(
        `<html><head><title>Print PBN Grid</title></head><body style="margin:0">`
        + `<img src="${dataURL}" style="max-width:100%" onload="window.print()">`
        + `</body></html>`
    );
    win.document.close();
});
