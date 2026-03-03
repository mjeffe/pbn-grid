import { generatePBNGrid } from './pbn-grid-core/index.js';
import { renderPBNGrid } from './pbn-grid-renderer/index.js';

const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

const puzzleFilter = document.getElementById('puzzle-filter');
const showTitles = document.getElementById('show-titles');
const puzzleList = document.getElementById('puzzle-list');
const puzzleEmpty = document.getElementById('puzzle-empty');

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
let manifestPuzzles = [];
let currentPuzzle = null;

tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
        tabButtons.forEach((b) => b.classList.remove('active'));
        tabContents.forEach((c) => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
        result.style.display = 'none';
    });
});

function renderPuzzleList(puzzles) {
    puzzleList.innerHTML = '';
    if (puzzles.length === 0) {
        puzzleEmpty.textContent = puzzleFilter.value.trim()
            ? 'No matching puzzles.'
            : 'No puzzles available.';
        puzzleEmpty.style.display = '';
        return;
    }
    puzzleEmpty.style.display = 'none';
    puzzles.forEach((puzzle) => {
        const item = document.createElement('div');
        item.className = 'puzzle-item';
        const idSpan = `<span class="puzzle-id">#${puzzle.id}</span>`;
        item.innerHTML = (showTitles.checked && puzzle.title) ? `${idSpan} — ${puzzle.title}` : idSpan;
        item.addEventListener('click', () => loadPuzzle(puzzle));
        puzzleList.appendChild(item);
    });
}

async function loadPuzzle(puzzle) {
    try {
        const resp = await fetch(`puzzles/${puzzle.id}.json`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        currentPuzzle = { puzzle, gridResult: await resp.json() };
        renderCurrentPuzzle();
        result.style.display = 'block';
    } catch (err) {
        console.error('Failed to load puzzle:', err);
    }
}

function renderCurrentPuzzle() {
    if (!currentPuzzle) return;
    const { puzzle, gridResult } = currentPuzzle;
    const puzzleInfo = { id: puzzle.id };
    if (showTitles.checked && puzzle.title) {
        puzzleInfo.title = puzzle.title;
    }
    renderPBNGrid(canvas, gridResult, { puzzleInfo });
}

puzzleFilter.addEventListener('input', () => {
    const filter = puzzleFilter.value.toLowerCase();
    const filtered = manifestPuzzles.filter((p) =>
        String(p.id).includes(filter) || (p.title && p.title.toLowerCase().includes(filter))
    );
    renderPuzzleList(filtered);
});

showTitles.addEventListener('change', () => {
    const filter = puzzleFilter.value.toLowerCase();
    const filtered = filter
        ? manifestPuzzles.filter((p) =>
            String(p.id).includes(filter) || (p.title && p.title.toLowerCase().includes(filter))
        )
        : manifestPuzzles;
    renderPuzzleList(filtered);
    renderCurrentPuzzle();
});

fetch('puzzles/manifest.json')
    .then((resp) => {
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return resp.json();
    })
    .then((data) => {
        manifestPuzzles = data.puzzles || [];
        renderPuzzleList(manifestPuzzles);
    })
    .catch(() => {
        manifestPuzzles = [];
        renderPuzzleList([]);
    });

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
        const dataURL = evt.target.result;
        preview.src = dataURL;
        preview.style.display = '';

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

    result.style.display = 'block';

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
