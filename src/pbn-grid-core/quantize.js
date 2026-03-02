/**
 * Color quantization using the median-cut algorithm.
 *
 * @typedef {{ index: number, r: number, g: number, b: number }} PBNColor
 */

/**
 * Collect RGB pixels from RGBA image data, skipping fully transparent pixels.
 * @param {Uint8ClampedArray} data - RGBA pixel data
 * @returns {number[][]} Array of [r, g, b] tuples
 */
function collectPixels(data) {
    const pixels = [];
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] === 0) continue;
        pixels.push([data[i], data[i + 1], data[i + 2]]);
    }
    return pixels;
}

/**
 * Find the color channel (0=R, 1=G, 2=B) with the largest range in a bucket.
 * @param {number[][]} pixels
 * @returns {number}
 */
function channelWithLargestRange(pixels) {
    let minR = 255, maxR = 0;
    let minG = 255, maxG = 0;
    let minB = 255, maxB = 0;

    for (const p of pixels) {
        if (p[0] < minR) minR = p[0];
        if (p[0] > maxR) maxR = p[0];
        if (p[1] < minG) minG = p[1];
        if (p[1] > maxG) maxG = p[1];
        if (p[2] < minB) minB = p[2];
        if (p[2] > maxB) maxB = p[2];
    }

    const rangeR = maxR - minR;
    const rangeG = maxG - minG;
    const rangeB = maxB - minB;

    if (rangeR >= rangeG && rangeR >= rangeB) return 0;
    if (rangeG >= rangeR && rangeG >= rangeB) return 1;
    return 2;
}

/**
 * Compute the average color of a bucket of pixels.
 * @param {number[][]} pixels
 * @returns {{ r: number, g: number, b: number }}
 */
function averageColor(pixels) {
    let totalR = 0, totalG = 0, totalB = 0;
    for (const p of pixels) {
        totalR += p[0];
        totalG += p[1];
        totalB += p[2];
    }
    const len = pixels.length;
    return {
        r: Math.round(totalR / len),
        g: Math.round(totalG / len),
        b: Math.round(totalB / len),
    };
}

/**
 * Perform median-cut on a list of pixel buckets until we have `targetCount` buckets.
 * @param {number[][][]} buckets
 * @param {number} targetCount
 * @returns {number[][][]}
 */
function medianCut(buckets, targetCount) {
    while (buckets.length < targetCount) {
        // Find the bucket with the largest range to split
        let bestBucketIdx = 0;
        let bestRange = -1;

        for (let i = 0; i < buckets.length; i++) {
            const bucket = buckets[i];
            if (bucket.length < 2) continue;

            const ch = channelWithLargestRange(bucket);
            let min = 255, max = 0;
            for (const p of bucket) {
                if (p[ch] < min) min = p[ch];
                if (p[ch] > max) max = p[ch];
            }
            const range = max - min;
            if (range > bestRange) {
                bestRange = range;
                bestBucketIdx = i;
            }
        }

        // If no bucket can be split (all have range 0 or single pixels), stop
        if (bestRange <= 0) break;

        const bucket = buckets[bestBucketIdx];
        const ch = channelWithLargestRange(bucket);

        // Sort by the channel with the largest range and split at the median
        bucket.sort((a, b) => a[ch] - b[ch]);
        const mid = Math.floor(bucket.length / 2);
        const lower = bucket.slice(0, mid);
        const upper = bucket.slice(mid);

        buckets.splice(bestBucketIdx, 1, lower, upper);
    }

    return buckets;
}

/**
 * Quantize image colors to `colorCount` colors using median-cut.
 *
 * @param {{ data: Uint8ClampedArray, width: number, height: number }} imageData
 * @param {number} colorCount
 * @returns {PBNColor[]}
 */
export function quantizeColors(imageData, colorCount) {
    const pixels = collectPixels(imageData.data);

    if (pixels.length === 0) {
        return [{ index: 1, r: 0, g: 0, b: 0 }];
    }

    let buckets = medianCut([pixels], colorCount);

    // Build palette from bucket averages
    return buckets.map((bucket, i) => {
        const avg = averageColor(bucket);
        return { index: i + 1, r: avg.r, g: avg.g, b: avg.b };
    });
}

/**
 * Find the nearest palette color to the given RGB value using Euclidean distance.
 *
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @param {PBNColor[]} palette
 * @returns {PBNColor}
 */
export function nearestColor(r, g, b, palette) {
    let best = palette[0];
    let bestDist = Infinity;

    for (const color of palette) {
        const dr = r - color.r;
        const dg = g - color.g;
        const db = b - color.b;
        const dist = dr * dr + dg * dg + db * db;
        if (dist < bestDist) {
            bestDist = dist;
            best = color;
        }
    }

    return best;
}
