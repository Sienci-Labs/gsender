/*
 * Bilinear Interpolation utilities for Height Map
 * Calculates Z-offset for any point within the probed grid
 */

import { HeightMapData, HeightMapPoint } from '../definitions';

/**
 * Find the four surrounding points for a given XY coordinate
 * For out-of-bounds coordinates, clamps to the nearest edge points for extrapolation
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

    // Calculate interpolation weights using actual (not clamped) coordinates
    // This allows extrapolation beyond the grid - weights can be < 0 or > 1
    const xRange = p10.x - p00.x;
    const yRange = p01.y - p00.y;

    // Handle edge cases
    const xWeight = xRange > 0 ? (x - p00.x) / xRange : 0;
    const yWeight = yRange > 0 ? (y - p00.y) / yRange : 0;

    // Bilinear interpolation/extrapolation formula
    // When weights are outside [0,1], this extrapolates based on the gradient
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

        // Ensure max values are included
        if (xPoints[xPoints.length - 1] !== maxX) {
            xPoints.push(maxX);
        }
        if (yPoints[yPoints.length - 1] !== maxY) {
            yPoints.push(maxY);
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
