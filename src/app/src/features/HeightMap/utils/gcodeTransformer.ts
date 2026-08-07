/*
 * G-code Transformation Engine for Height Map
 * Parses G-code, segments lines, and applies Z-offset adjustments
 */

import { HeightMapData } from '../definitions';
import { getZOffset, isWithinBounds } from './interpolation';

interface ParsedMove {
    type: 'G0' | 'G1' | 'G2' | 'G3' | 'other';
    originalLine: string;
    x?: number;
    y?: number;
    z?: number;
    f?: number;
    hasX: boolean;
    hasY: boolean;
    hasZ: boolean;
}

interface TransformOptions {
    segmentLength: number;
    warnOutsideBounds: boolean;
}

/**
 * Parse a G-code line to extract move information
 */
const parseGcodeLine = (
    line: string,
    currentX: number,
    currentY: number,
    currentZ: number,
): ParsedMove => {
    const trimmed = line.trim().toUpperCase();

    // Check for G0 or G1 moves - match with or without space after command
    // G0, G00, G1, G01 followed by space, X, Y, Z, or F
    const g0Match = trimmed.match(/^G0?0(?:\s|X|Y|Z|F)/i);
    const g1Match = trimmed.match(/^G0?1(?:\s|X|Y|Z|F)/i);

    if (!g0Match && !g1Match) {
        return {
            type: 'other',
            originalLine: line,
            hasX: false,
            hasY: false,
            hasZ: false,
        };
    }

    const type = g0Match ? 'G0' : 'G1';

    // Extract coordinates
    const xMatch = trimmed.match(/X(-?\d+\.?\d*)/i);
    const yMatch = trimmed.match(/Y(-?\d+\.?\d*)/i);
    const zMatch = trimmed.match(/Z(-?\d+\.?\d*)/i);
    const fMatch = trimmed.match(/F(\d+\.?\d*)/i);

    return {
        type,
        originalLine: line,
        x: xMatch ? parseFloat(xMatch[1]) : currentX,
        y: yMatch ? parseFloat(yMatch[1]) : currentY,
        z: zMatch ? parseFloat(zMatch[1]) : currentZ,
        f: fMatch ? parseFloat(fMatch[1]) : undefined,
        hasX: !!xMatch,
        hasY: !!yMatch,
        hasZ: !!zMatch,
    };
};

/**
 * Calculate distance between two points
 */
const distance2D = (x1: number, y1: number, x2: number, y2: number): number => {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
};

/**
 * Segment a line into smaller segments
 */
const segmentLine = (
    startX: number,
    startY: number,
    startZ: number,
    endX: number,
    endY: number,
    endZ: number,
    segmentLength: number,
): { x: number; y: number; z: number }[] => {
    const dist = distance2D(startX, startY, endX, endY);

    if (dist <= segmentLength) {
        return [{ x: endX, y: endY, z: endZ }];
    }

    const numSegments = Math.ceil(dist / segmentLength);
    const segments: { x: number; y: number; z: number }[] = [];

    for (let i = 1; i <= numSegments; i++) {
        const t = i / numSegments;
        segments.push({
            x: Number((startX + t * (endX - startX)).toFixed(4)),
            y: Number((startY + t * (endY - startY)).toFixed(4)),
            z: Number((startZ + t * (endZ - startZ)).toFixed(4)),
        });
    }

    return segments;
};

/**
 * Build a G-code line from coordinates
 */
const buildGcodeLine = (
    type: 'G0' | 'G1',
    x: number | undefined,
    y: number | undefined,
    z: number,
    f: number | undefined,
    hasX: boolean,
    hasY: boolean,
): string => {
    let line = type;

    if (hasX && x !== undefined) {
        line += ` X${x.toFixed(4)}`;
    }
    if (hasY && y !== undefined) {
        line += ` Y${y.toFixed(4)}`;
    }
    line += ` Z${z.toFixed(4)}`;

    if (f !== undefined) {
        line += ` F${f}`;
    }

    return line;
};

/**
 * Transform a single G-code line by applying height map Z-offset
 */
const transformLine = (
    parsed: ParsedMove,
    currentX: number,
    currentY: number,
    currentZ: number,
    mapData: HeightMapData,
    options: TransformOptions,
): string[] => {
    if (parsed.type === 'other') {
        return [parsed.originalLine];
    }

    const targetX = parsed.x ?? currentX;
    const targetY = parsed.y ?? currentY;
    const targetZ = parsed.z ?? currentZ;

    // For moves without Z (XY only rapid moves), we still need to consider Z offset
    // but we should preserve the rapid move nature
    if (!parsed.hasZ && !parsed.hasX && !parsed.hasY) {
        return [parsed.originalLine];
    }

    // If no XY movement, just apply Z offset at current position
    if (!parsed.hasX && !parsed.hasY) {
        const zOffset = getZOffset(currentX, currentY, mapData);
        const adjustedZ = targetZ + zOffset;
        return [buildGcodeLine(parsed.type, undefined, undefined, adjustedZ, parsed.f, false, false)];
    }

    // Calculate distance for segmentation
    const dist = distance2D(currentX, currentY, targetX, targetY);

    // If short move, no segmentation needed
    if (dist <= options.segmentLength) {
        const zOffset = getZOffset(targetX, targetY, mapData);
        const adjustedZ = targetZ + zOffset;
        return [buildGcodeLine(parsed.type, targetX, targetY, adjustedZ, parsed.f, parsed.hasX, parsed.hasY)];
    }

    // Segment the line
    const segments = segmentLine(
        currentX,
        currentY,
        currentZ,
        targetX,
        targetY,
        targetZ,
        options.segmentLength,
    );

    // Generate G-code for each segment
    const lines: string[] = [];
    for (const segment of segments) {
        const zOffset = getZOffset(segment.x, segment.y, mapData);
        const adjustedZ = segment.z + zOffset;
        // Only include feed rate on first segment
        const feedRate = lines.length === 0 ? parsed.f : undefined;
        lines.push(buildGcodeLine(parsed.type, segment.x, segment.y, adjustedZ, feedRate, true, true));
    }

    return lines;
};

/**
 * Transform entire G-code content by applying height map
 */
export const transformGcode = (
    gcode: string,
    mapData: HeightMapData,
    options: TransformOptions = { segmentLength: 1, warnOutsideBounds: true },
): { transformedGcode: string; warnings: string[] } => {
    const lines = gcode.split('\n');
    const transformedLines: string[] = [];
    const warnings: string[] = [];

    // Track current position
    let currentX = 0;
    let currentY = 0;
    let currentZ = 0;
    let absoluteMode = true; // G90 default
    let outsideBoundsWarned = false;

    // Add header comment
    transformedLines.push('; Height Map Applied by gSender');
    transformedLines.push(`; Map bounds: X[${mapData.bounds.minX}, ${mapData.bounds.maxX}] Y[${mapData.bounds.minY}, ${mapData.bounds.maxY}]`);
    transformedLines.push(`; Grid points: ${mapData.points.length}`);
    transformedLines.push('');

    for (const line of lines) {
        const trimmed = line.trim();

        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('(')) {
            transformedLines.push(line);
            continue;
        }

        // Check for absolute/incremental mode changes
        if (trimmed.match(/G90/i)) {
            absoluteMode = true;
            transformedLines.push(line);
            continue;
        }
        if (trimmed.match(/G91/i)) {
            absoluteMode = false;
            transformedLines.push(line);
            continue;
        }

        // Only transform in absolute mode
        if (!absoluteMode) {
            transformedLines.push(line);
            continue;
        }

        // Parse the line
        const parsed = parseGcodeLine(line, currentX, currentY, currentZ);

        // Check bounds warning
        if (
            options.warnOutsideBounds &&
            !outsideBoundsWarned &&
            (parsed.hasX || parsed.hasY)
        ) {
            const targetX = parsed.x ?? currentX;
            const targetY = parsed.y ?? currentY;
            if (!isWithinBounds(targetX, targetY, mapData)) {
                warnings.push(
                    `Warning: G-code extends outside height map bounds. Z-offset will be extrapolated from nearest edge points.`,
                );
                outsideBoundsWarned = true;
            }
        }

        // Transform the line
        if (parsed.type === 'G0' || parsed.type === 'G1') {
            const newLines = transformLine(
                parsed,
                currentX,
                currentY,
                currentZ,
                mapData,
                options,
            );
            transformedLines.push(...newLines);

            // Update current position
            currentX = parsed.x ?? currentX;
            currentY = parsed.y ?? currentY;
            currentZ = parsed.z ?? currentZ;
        } else {
            transformedLines.push(line);
        }
    }

    return {
        transformedGcode: transformedLines.join('\n'),
        warnings,
    };
};

/**
 * Validate G-code bounds against height map
 */
export const validateGcodeBounds = (
    gcode: string,
    mapData: HeightMapData,
): { valid: boolean; gcodeMinX: number; gcodeMaxX: number; gcodeMinY: number; gcodeMaxY: number } => {
    const lines = gcode.split('\n');

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const line of lines) {
        const xMatch = line.match(/X(-?\d+\.?\d*)/i);
        const yMatch = line.match(/Y(-?\d+\.?\d*)/i);

        if (xMatch) {
            const x = parseFloat(xMatch[1]);
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
        }
        if (yMatch) {
            const y = parseFloat(yMatch[1]);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }
    }

    const valid =
        minX >= mapData.bounds.minX &&
        maxX <= mapData.bounds.maxX &&
        minY >= mapData.bounds.minY &&
        maxY <= mapData.bounds.maxY;

    return {
        valid,
        gcodeMinX: minX === Infinity ? 0 : minX,
        gcodeMaxX: maxX === -Infinity ? 0 : maxX,
        gcodeMinY: minY === Infinity ? 0 : minY,
        gcodeMaxY: maxY === -Infinity ? 0 : maxY,
    };
};
