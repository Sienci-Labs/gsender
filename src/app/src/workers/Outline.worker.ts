/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

import concaveman from 'concaveman';
import GCodeVirtualizer from 'app/lib/GCodeVirtualizer';
import { OUTLINE_MODE_RAPIDLESS_SQUARE } from 'app/constants';

self.onmessage = ({ data }) => {
    const { isLaser = false, parsedData = [], mode, bbox, zTravel, content = '', outlineSpeed = null } = data;
    const parsedOutlineSpeed = Number(outlineSpeed);
    const hasCustomOutlineSpeed = Number.isFinite(parsedOutlineSpeed) && parsedOutlineSpeed > 0;
    const movementModal = isLaser || hasCustomOutlineSpeed ? 'G1' : 'G0';
    const movementFeed = movementModal === 'G1'
        ? (hasCustomOutlineSpeed ? parsedOutlineSpeed : 3000)
        : null;

    type OutlinePoint = [number | string, number | string];

    const pushOutlinePreamble = (gCode: string[]) => {
        gCode.push('%X0=posx,Y0=posy,Z0=posz');
        gCode.push('%MM=modal.distance');
        gCode.push(`G21 G91 G0 Z${zTravel}`);
        gCode.push('G21 G90');
        gCode.push(movementFeed !== null ? `${movementModal} F${movementFeed}` : movementModal);
        if (isLaser) {
            gCode.push('M3 S1');
        }
    };

    const pushOutlineMoves = (gCode: string[], points: OutlinePoint[]) => {
        points.forEach(([x, y]) => {
            gCode.push(`X${x} Y${y}`);
        });
    };

    const finalizeOutlineGCode = (gCode: string[]) => {
        if (isLaser) {
            gCode.push('M5 S0');
        }
        gCode.push('X[X0] Y[Y0]');
        gCode.push(`G21 G91 G0 Z-${zTravel}`);
        gCode.push('[MM]');
        return gCode;
    };

    const buildOutlineFromPoints = (points: OutlinePoint[], closeLoop = false) => {
        const gCode = [];
        pushOutlinePreamble(gCode);
        pushOutlineMoves(gCode, points);

        if (closeLoop && points.length > 0) {
            const [x, y] = points[0];
            gCode.push(`X${x} Y${y}`);
        }

        return finalizeOutlineGCode(gCode);
    };

    const getOutlineGcode = (concavity = Infinity) => {
        // 1. Extract 2D [x, y] points (parsedData is flat: x0,y0,z0,x1,y1,z1,...)
        const points2D = [];
        for (let i = 0; i < parsedData.length; i += 3) {
            points2D.push([
                parseFloat(parsedData[i].toFixed(3)),
                parseFloat(parsedData[i + 1].toFixed(3)),
            ]);
        }

        // 2. Deduplicate on 0.5mm grid for efficiency on large files
        const seen = new Set();
        const deduped = [];
        for (const [x, y] of points2D) {
            const key = `${Math.round(x * 2)},${Math.round(y * 2)}`;
            if (!seen.has(key)) {
                seen.add(key);
                deduped.push([x, y]);
            }
        }

        // 3. Compute concave hull; remove duplicate closing point
        let hull = concaveman(deduped, concavity).slice(0, -1);

        // 4. Ensure clockwise winding (negative signed area in standard XY)
        // Shoelace cross-product variant: sum of (x2-x1)*(y2+y1)
        const area = hull.reduce((sum, pt, i) => {
            const next = hull[(i + 1) % hull.length];
            return sum + (next[0] - pt[0]) * (next[1] + pt[1]);
        }, 0);
        if (area > 0) {
            hull.reverse();
        }

        // 5. Rotate hull to start at vertex nearest to (0, 0)
        let startIdx = 0;
        let minDist = Infinity;
        hull.forEach(([x, y], i) => {
            const d = x * x + y * y;
            if (d < minDist) {
                minDist = d;
                startIdx = i;
            }
        });
        const orderedHull = [...hull.slice(startIdx), ...hull.slice(0, startIdx)];

        return convertPointsToGCode(orderedHull);
    };

    const getSimpleOutline = () => {
        if (parsedData && parsedData.length <= 0) {
            return buildOutlineFromPoints([
                [`[${bbox.min.x}]`, `[${bbox.min.y}]`],
                [`[${bbox.min.x}]`, `[${bbox.max.y}]`],
                [`[${bbox.max.x}]`, `[${bbox.max.y}]`],
                [`[${bbox.max.x}]`, `[${bbox.min.y}]`],
                [`[${bbox.min.x}]`, `[${bbox.min.y}]`],
            ]);
        } else {
            return buildOutlineFromPoints([
                ['[xmin]', '[ymin]'],
                ['[xmin]', '[ymax]'],
                ['[xmax]', '[ymax]'],
                ['[xmax]', '[ymin]'],
                ['[xmin]', '[ymin]'],
            ]);
        }
    };

    const getRapidlessSquareOutline = (fileContent: string) => {
        let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;

        const updateBounds = (v1: any, v2: any) => {
            for (const v of [v1, v2]) {
                if (v.x < xmin) xmin = v.x;
                if (v.x > xmax) xmax = v.x;
                if (v.y < ymin) ymin = v.y;
                if (v.y > ymax) ymax = v.y;
            }
        };

        const vm = new GCodeVirtualizer({
            addLine: (modal: any, v1: any, v2: any) => {
                if (modal.motion !== 'G0') updateBounds(v1, v2);
            },
            addArcCurve: (modal: any, v1: any, v2: any, v0: any) => {
                // Always include the chord endpoints
                updateBounds(v1, v2);

                // Compute arc extrema
                const r = Math.sqrt((v1.x - v0.x) ** 2 + (v1.y - v0.y) ** 2);
                if (r === 0) return;

                const startAngle = Math.atan2(v1.y - v0.y, v1.x - v0.x);
                const endAngle   = Math.atan2(v2.y - v0.y, v2.x - v0.x);
                const isCCW = modal.motion === 'G3';

                // Helper: is angle theta (normalized to [0, 2π)) within the arc sweep?
                const normalize = (a: number) => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
                const sa = normalize(startAngle);
                const ea = normalize(endAngle);

                const inSweep = (theta: number): boolean => {
                    const t = normalize(theta);
                    if (isCCW) {
                        return sa <= ea ? (t >= sa && t <= ea) : (t >= sa || t <= ea);
                    } else {
                        // CW: sweep goes from sa down to ea
                        return sa >= ea ? (t <= sa && t >= ea) : (t <= sa || t >= ea);
                    }
                };

                // Check the 4 axis-aligned extrema
                for (const theta of [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2]) {
                    if (inSweep(theta)) {
                        const ex = { x: v0.x + r * Math.cos(theta), y: v0.y + r * Math.sin(theta) };
                        updateBounds(ex, ex);
                    }
                }
            },
            addCurve: (modal: any, v1: any, v2: any) => {
                if (modal.motion !== 'G0') updateBounds(v1, v2);
            },
        });

        // Parse line-by-line (same pattern as Visualize.worker.ts)
        const len = fileContent.length;
        let lineStart = 0;
        for (let i = 0; i < len; i++) {
            const ch = fileContent.charCodeAt(i);
            if (ch !== 10 && ch !== 13) continue;
            vm.virtualize(fileContent.slice(lineStart, i));
            if (ch === 13 && i + 1 < len && fileContent.charCodeAt(i + 1) === 10) i++;
            lineStart = i + 1;
        }
        vm.virtualize(fileContent.slice(lineStart));

        if (!isFinite(xmin)) {
            // No cutting moves found — fall back to regular square
            return getSimpleOutline();
        }
        console.log('bounds', xmin, xmax, ymin, ymax);
        return buildOutlineFromPoints([
            [xmin.toFixed(3), ymin.toFixed(3)],
            [xmin.toFixed(3), ymax.toFixed(3)],
            [xmax.toFixed(3), ymax.toFixed(3)],
            [xmax.toFixed(3), ymin.toFixed(3)],
            [xmin.toFixed(3), ymin.toFixed(3)],
        ]);
    };

    function convertPointsToGCode(points: number[][]) {
        const outlinePoints: OutlinePoint[] = points.map(([x, y]) => [x, y]);
        return buildOutlineFromPoints(outlinePoints, true);
    }

    let outlineGcode;
    if (mode === 'Square') {
        outlineGcode = getSimpleOutline();
    } else if (mode === OUTLINE_MODE_RAPIDLESS_SQUARE) {
        outlineGcode = getRapidlessSquareOutline(content);
    } else {
        outlineGcode = getOutlineGcode();
    }
    postMessage({ outlineGcode });
};
