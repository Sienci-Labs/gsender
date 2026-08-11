/*
 * Bilinear Interpolation utilities for Height Map
 * Calculates Z-offset for any point within the probed grid
 */

import { HeightMapData, HeightMapPoint } from '../definitions';

/**
 * Find the four surrounding points for a given XY coordinate
 * For out-of-bounds coordinates, selects the nearest edge cell
 */
export const findSurroundingPoints = (
    x: number,
    y: number,
    mapData: HeightMapData,
): { p00: HeightMapPoint; p10: HeightMapPoint; p01: HeightMapPoint; p11: HeightMapPoint } | null => {
    const { bounds, points } = mapData;

    // Sort points into a grid structure
    const uniqueX = [...new Set(points.map((p) => p.x))].sort((a, b) => a - b);
    const uniqueY = [...new Set(points.map((p) => p.y))].sort((a, b) => a - b);

    if (uniqueX.length < 2 || uniqueY.length < 2) {
        // Not enough points for interpolation
        return null;
    }

    // Clamp coordinates to bounds for extrapolation
    // This allows us to use edge values for out-of-bounds points
    const clampedX = Math.max(bounds.minX, Math.min(bounds.maxX, x));
    const clampedY = Math.max(bounds.minY, Math.min(bounds.maxY, y));

    // Find the bounding X coordinates using clamped value
    let x0Index = 0;
    for (let i = 0; i < uniqueX.length - 1; i++) {
        if (clampedX >= uniqueX[i] && clampedX <= uniqueX[i + 1]) {
            x0Index = i;
            break;
        }
        // If we're at or beyond the last interval, use the last valid pair
        if (i === uniqueX.length - 2) {
            x0Index = i;
        }
    }

    // Find the bounding Y coordinates using clamped value
    let y0Index = 0;
    for (let i = 0; i < uniqueY.length - 1; i++) {
        if (clampedY >= uniqueY[i] && clampedY <= uniqueY[i + 1]) {
            y0Index = i;
            break;
        }
        // If we're at or beyond the last interval, use the last valid pair
        if (i === uniqueY.length - 2) {
            y0Index = i;
        }
    }

    const x0 = uniqueX[x0Index];
    const x1 = uniqueX[x0Index + 1] ?? x0;
    const y0 = uniqueY[y0Index];
    const y1 = uniqueY[y0Index + 1] ?? y0;

    // Find the four corner points
    const p00 = points.find((p) => p.x === x0 && p.y === y0);
    const p10 = points.find((p) => p.x === x1 && p.y === y0);
    const p01 = points.find((p) => p.x === x0 && p.y === y1);
    const p11 = points.find((p) => p.x === x1 && p.y === y1);

    if (!p00 || !p10 || !p01 || !p11) {
        return null;
    }

    return { p00, p10, p01, p11 };
};

/**
 * Perform bilinear interpolation to get Z value at a given XY coordinate
 * For out-of-bounds coordinates, uses nearest edge points and extrapolates
 */
export const bilinearInterpolate = (
    x: number,
    y: number,
    mapData: HeightMapData,
): number | null => {
    const surrounding = findSurroundingPoints(x, y, mapData);

    if (!surrounding) {
        return null;
    }

    const { p00, p10, p01, p11 } = surrounding;

    // Handle edge case where all points are the same
    if (p00.x === p10.x && p00.y === p01.y) {
        return p00.z;
    }

    // Weights are clamped to [0,1], which holds the nearest measured edge value
    // outside the grid instead of projecting the last cell's gradient onward.
    //
    // Unclamped, the gradient runs without limit: on a 0.02mm/mm tilt that is
    // 1.40mm of offset 50mm outside the map and 4.40mm at 200mm -- offsets far
    // larger than anything the probe actually measured, applied to Z on the
    // strength of two edge points. Outside the probed area there is no data;
    // the honest assumption is that the surface continues at the height last
    // seen, which also bounds the result by the map's own range and keeps it
    // continuous with the interior.
    //
    // This is not a rare path. edgeInset defaults to 2mm so probe points stay
    // clear of the edge of the stock, so a normal job cuts outside the map all
    // the way round.
    const xRange = p10.x - p00.x;
    const yRange = p01.y - p00.y;

    const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

    // Handle edge cases
    const xWeight = xRange > 0 ? clamp01((x - p00.x) / xRange) : 0;
    const yWeight = yRange > 0 ? clamp01((y - p00.y) / yRange) : 0;

    const z =
        p00.z * (1 - xWeight) * (1 - yWeight) +
        p10.z * xWeight * (1 - yWeight) +
        p01.z * (1 - xWeight) * yWeight +
        p11.z * xWeight * yWeight;

    return z;
};

/**
 * Get Z offset for a coordinate
 * For out-of-bounds coordinates, extrapolates from nearest edge points
 * Returns 0 only if no map data is available or interpolation fails
 */
export const getZOffset = (
    x: number,
    y: number,
    mapData: HeightMapData | null,
): number => {
    if (!mapData || !mapData.points || mapData.points.length === 0) {
        return 0;
    }

    const z = bilinearInterpolate(x, y, mapData);
    return z ?? 0;
};

/**
 * Check if a point is within the height map bounds
 */
export const isWithinBounds = (
    x: number,
    y: number,
    mapData: HeightMapData,
): boolean => {
    const { bounds } = mapData;
    return (
        x >= bounds.minX &&
        x <= bounds.maxX &&
        y >= bounds.minY &&
        y <= bounds.maxY
    );
};

/**
 * Calculate the grid points for probing based on configuration
 */
export const calculateProbeGrid = (
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
    gridSpacing: number,
    usePointCount: boolean,
    pointCountX: number,
    pointCountY: number,
): { x: number; y: number }[] => {
    const points: { x: number; y: number }[] = [];

    let xPoints: number[];
    let yPoints: number[];

    if (usePointCount) {
        // Use specified point count
        const xStep = pointCountX > 1 ? (maxX - minX) / (pointCountX - 1) : 0;
        const yStep = pointCountY > 1 ? (maxY - minY) / (pointCountY - 1) : 0;

        xPoints = Array.from({ length: pointCountX }, (_, i) =>
            Number((minX + i * xStep).toFixed(3)),
        );
        yPoints = Array.from({ length: pointCountY }, (_, i) =>
            Number((minY + i * yStep).toFixed(3)),
        );
    } else {
        // Use grid spacing
        const xCount = Math.ceil((maxX - minX) / gridSpacing) + 1;
        const yCount = Math.ceil((maxY - minY) / gridSpacing) + 1;

        xPoints = Array.from({ length: xCount }, (_, i) =>
            Number(Math.min(minX + i * gridSpacing, maxX).toFixed(3)),
        );
        yPoints = Array.from({ length: yCount }, (_, i) =>
            Number(Math.min(minY + i * gridSpacing, maxY).toFixed(3)),
        );

        // Ensure max values are included.
        //
        // Compared with a tolerance, and pushed rounded, because the points
        // above are rounded to three decimals while maxX/maxY are not. An exact
        // comparison treats 60 and 59.99999999999999 as different and appends a
        // second column a fraction of a nanometre from the first -- which gives
        // the height map a zero-width cell and makes bilinear interpolation
        // divide by nothing. Unreachable while every bound is typed in whole
        // millimetres; routine once bounds arrive from a unit conversion.
        const round = (v: number) => Number(v.toFixed(3));
        const closeEnough = (a: number, b: number) => Math.abs(a - b) < 1e-6;

        if (!closeEnough(xPoints[xPoints.length - 1], maxX)) {
            xPoints.push(round(maxX));
        }
        if (!closeEnough(yPoints[yPoints.length - 1], maxY)) {
            yPoints.push(round(maxY));
        }
    }

    // Generate grid points in a zigzag pattern for efficient probing
    for (let yi = 0; yi < yPoints.length; yi++) {
        const y = yPoints[yi];
        const xOrder = yi % 2 === 0 ? xPoints : [...xPoints].reverse();

        for (const x of xOrder) {
            points.push({ x, y });
        }
    }

    return points;
};

/**
 * Derive probe bounds from a toolpath bounding box, pulled in by `inset` on
 * every side.
 *
 * Probing at the exact toolpath extents puts probe points on the outermost
 * edge of the stock, where a probe can miss the surface or drop off the board
 * entirely. Insetting keeps them on solid material, at the cost of
 * extrapolating compensation for the toolpath outside the probed area.
 *
 * An inset that would collapse the area in either axis is rejected rather than
 * applied: a degenerate grid probes fewer points than the interpolator needs.
 */
export const deriveProbeBounds = (
    bbox: { min: { x: number; y: number }; max: { x: number; y: number } },
    inset: number,
): {
    bounds: { minX: number; maxX: number; minY: number; maxY: number };
    applied: number;
    rejected: boolean;
} => {
    const { min, max } = bbox;
    const wanted = Math.max(inset || 0, 0);
    const spanX = max.x - min.x;
    const spanY = max.y - min.y;

    const rejected = wanted > 0 && (wanted * 2 >= spanX || wanted * 2 >= spanY);
    const applied = rejected ? 0 : wanted;

    const round = (n: number): number => Number(n.toFixed(3));

    return {
        bounds: {
            minX: round(min.x + applied),
            maxX: round(max.x - applied),
            minY: round(min.y + applied),
            maxY: round(max.y - applied),
        },
        applied,
        rejected,
    };
};
