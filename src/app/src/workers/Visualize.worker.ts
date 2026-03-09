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

import * as THREE from 'three';
import { ArcCurve } from 'three';

import GCodeVirtualizer, { rotateAxis } from 'app/lib/GCodeVirtualizer';
import { BasicPosition } from 'app/definitions/general';
import { VISUALIZER_TYPES_T } from 'app/features/Visualizer/definitions';
import {
    BACKGROUND_PART,
    G0_PART,
    G1_PART,
    G2_PART,
    G3_PART,
    LASER_PART,
    TOOLPATH_COLOR_HEXES,
} from 'app/features/Visualizer/constants';

const toolpathColors = TOOLPATH_COLOR_HEXES.map((hex) => new THREE.Color(hex));

const getComplementaryColour = (tcCounter: number): number => {
    const len = toolpathColors.length;
    if (len === 0) return 0;
    return ((tcCounter % len) + len) % len;
};

interface WorkerData {
    content: string;
    jobId?: number;
    visualizer?: VISUALIZER_TYPES_T;
    isLaser?: boolean;
    shouldIncludeSVG?: boolean;
    needsVisualization?: boolean;
    accelerations?: any;
    maxFeedrates?: any;
    atcEnabled?: boolean;
    rotaryDiameterOffsetEnabled?: boolean;
    isSecondary: boolean;
    activeVisualizer: VISUALIZER_TYPES_T;
    theme?: Map<string, string>;
    profile?: boolean;
    profileSampleEvery?: number;
}

interface SVGVertex {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

interface Path {
    motion: string;
    path: string;
    strokeWidth: number;
    fill: string;
}

interface Modal {
    motion: string;
    plane?: string;
    units?: string;
    tool?: number;
}

type RotaryMetadata = {
    radius: number | null;
    hasYAxisMoves: boolean;
};

type HeapSample = {
    tag: string;
    t: number;
    used?: number;
};

type WorkerProfile = {
    marks: Record<string, number>;
    heap: {
        supported: boolean;
        peak?: number;
        samples: HeapSample[];
    };
    counts: Record<string, number>;
    bytes: Record<string, number>;
    sampleEvery: number;
};

const nowMs = (): number =>
    typeof performance?.now === 'function' ? performance.now() : Date.now();

const getUsedHeapSize = (): number | undefined => {
    const perfMemory = (performance as any)?.memory;
    if (typeof perfMemory?.usedJSHeapSize === 'number') {
        return perfMemory.usedJSHeapSize;
    }
    return undefined;
};

const createProfiler = (
    enabled: boolean,
    sampleEvery: number,
): WorkerProfile | null => {
    if (!enabled) {
        return null;
    }
    const used = getUsedHeapSize();
    const safeSampleEvery = Number.isFinite(sampleEvery) ? sampleEvery : 10000;
    return {
        marks: {},
        heap: {
            supported: used !== undefined,
            peak: used,
            samples: [],
        },
        counts: {},
        bytes: {},
        sampleEvery: Math.max(1, safeSampleEvery),
    };
};

const markProfile = (profile: WorkerProfile | null, tag: string): void => {
    if (!profile) return;
    profile.marks[tag] = nowMs();
};

const sampleHeap = (profile: WorkerProfile | null, tag: string): void => {
    if (!profile) return;
    const used = getUsedHeapSize();
    profile.heap.samples.push({
        tag,
        t: nowMs(),
        used,
    });
    if (used !== undefined) {
        profile.heap.peak = Math.max(profile.heap.peak || 0, used);
    }
};

type GrowableFloat32Buffer = {
    data: Float32Array;
    length: number;
};

type GrowableUint32Buffer = {
    data: Uint32Array;
    length: number;
};

const growCapacity = (current: number, required: number): number => {
    let next = current > 0 ? current : 1;
    while (next < required) {
        next *= 2;
    }
    return next;
};

const ensureFloat32Capacity = (
    buffer: GrowableFloat32Buffer,
    additional: number,
): void => {
    const required = buffer.length + additional;
    if (required <= buffer.data.length) {
        return;
    }
    const next = new Float32Array(growCapacity(buffer.data.length, required));
    next.set(buffer.data.subarray(0, buffer.length));
    buffer.data = next;
};

const ensureUint32Capacity = (
    buffer: GrowableUint32Buffer,
    additional: number,
): void => {
    const required = buffer.length + additional;
    if (required <= buffer.data.length) {
        return;
    }
    const next = new Uint32Array(growCapacity(buffer.data.length, required));
    next.set(buffer.data.subarray(0, buffer.length));
    buffer.data = next;
};

const pushFloat32_3 = (
    buffer: GrowableFloat32Buffer,
    x: number,
    y: number,
    z: number,
): void => {
    ensureFloat32Capacity(buffer, 3);
    const i = buffer.length;
    buffer.data[i] = x;
    buffer.data[i + 1] = y;
    buffer.data[i + 2] = z;
    buffer.length = i + 3;
};

const pushFloat32_6 = (
    buffer: GrowableFloat32Buffer,
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
): void => {
    ensureFloat32Capacity(buffer, 6);
    const i = buffer.length;
    buffer.data[i] = x1;
    buffer.data[i + 1] = y1;
    buffer.data[i + 2] = z1;
    buffer.data[i + 3] = x2;
    buffer.data[i + 4] = y2;
    buffer.data[i + 5] = z2;
    buffer.length = i + 6;
};

const pushFloat32_4Repeat = (
    buffer: GrowableFloat32Buffer,
    a: number,
    b: number,
    c: number,
    d: number,
    repeat: number,
): void => {
    if (repeat <= 0) {
        return;
    }
    ensureFloat32Capacity(buffer, repeat * 4);
    let i = buffer.length;
    for (let n = 0; n < repeat; n++) {
        buffer.data[i] = a;
        buffer.data[i + 1] = b;
        buffer.data[i + 2] = c;
        buffer.data[i + 3] = d;
        i += 4;
    }
    buffer.length = i;
};

const pushUint32_1 = (buffer: GrowableUint32Buffer, value: number): void => {
    ensureUint32Capacity(buffer, 1);
    buffer.data[buffer.length] = value;
    buffer.length += 1;
};

const pushFloat32_1 = (buffer: GrowableFloat32Buffer, value: number): void => {
    ensureFloat32Capacity(buffer, 1);
    buffer.data[buffer.length] = value;
    buffer.length += 1;
};

const toUsedFloat32View = (buffer: GrowableFloat32Buffer): Float32Array =>
    buffer.data.subarray(0, buffer.length);

const toUsedUint32View = (buffer: GrowableUint32Buffer): Uint32Array =>
    buffer.data.subarray(0, buffer.length);

const toCompactFloat32Array = (view: Float32Array): Float32Array => {
    const fullLength = view.buffer.byteLength / Float32Array.BYTES_PER_ELEMENT;
    if (view.byteOffset === 0 && view.length === fullLength) {
        return view;
    }
    return new Float32Array(view);
};

const toCompactUint32Array = (view: Uint32Array): Uint32Array => {
    const fullLength = view.buffer.byteLength / Uint32Array.BYTES_PER_ELEMENT;
    if (view.byteOffset === 0 && view.length === fullLength) {
        return view;
    }
    return new Uint32Array(view);
};

// Patterns for cylinder diameter in NC/comment headers (e.g. DeskProto "(Cylinder Dia: 64.38)")
const ROTARY_DIAMETER_PATTERNS = [
    /Cylinder\s*Dia\s*:\s*([0-9.+-]+)/i, // Matches: "Cylinder Dia : 64.38", allows '.' '+' '-'
    /Cylinder\s*Dia(?:meter)?\s*[=:]\s*([0-9]+[.,][0-9]+|[0-9]+)/i, // Matches: "Cylinder Dia: 64.38" or "Cylinder Diameter=64.38"
    /(?:Cylinder\s+)?Dia(?:meter)?\s*[=:]\s*([0-9]+[.,][0-9]+|[0-9]+)/i, // Matches: "Cylinder Diameter=64.38", "Dia: 64.38", "Cylinder Dia: 64.38"
    /\(.*?Cylinder\s*Dia(?:meter)?\s*[=:]\s*([0-9]+[.,][0-9]+|[0-9]+)/i, // Matches when inside parens, e.g. "(Cylinder Dia: 64.38)"
];

const parseRotaryMetadata = (raw: string): RotaryMetadata => {
    let diameter = Number.NaN;
    for (const re of ROTARY_DIAMETER_PATTERNS) {
        const diameterMatch = raw.match(re);
        const numStr = diameterMatch?.[1];
        if (numStr) {
            diameter = Number(numStr.replace(',', '.'));
            if (Number.isFinite(diameter) && diameter > 0) break;
        }
    }

    const radius =
        Number.isFinite(diameter) && diameter > 0 ? diameter / 2 : null;

    // Single-pass scan for Y-axis moves — avoids .split() which allocates a full line array
    let hasYAxisMoves = false;
    let inParenComment = false;
    for (let i = 0; i < raw.length && !hasYAxisMoves; i++) {
        const ch = raw.charCodeAt(i);
        if (ch === 40) { inParenComment = true; continue; }   // '('
        if (ch === 41) { inParenComment = false; continue; }  // ')'
        if (ch === 59) {                                       // ';'
            while (i < raw.length && raw.charCodeAt(i) !== 10) i++;
            continue;
        }
        if (inParenComment) continue;
        if (ch === 89 || ch === 121) {  // 'Y' or 'y'
            const next = raw.charCodeAt(i + 1);
            if ((next >= 48 && next <= 57) || next === 43 || next === 45) {
                hasYAxisMoves = true;
            }
        }
    }

    return { radius, hasYAxisMoves };
};

self.onmessage = function ({ data }: { data: WorkerData }) {
    const {
        content,
        jobId = 0,
        visualizer,
        isLaser = false,
        shouldIncludeSVG = false,
        needsVisualization = true,
        // parsedData = {},
        // isNewFile = false,
        accelerations,
        maxFeedrates,
        atcEnabled,
        rotaryDiameterOffsetEnabled = true,
        isSecondary,
        activeVisualizer,
        theme,
        profile = false,
        profileSampleEvery = 10000,
    } = data;

    const profiler = createProfiler(profile, profileSampleEvery);
    markProfile(profiler, 'start');
    sampleHeap(profiler, 'start');
    if (profiler) {
        profiler.bytes.input_utf16_bytes = content.length * 2;
    }

    const { radius: rotaryRadius, hasYAxisMoves } = parseRotaryMetadata(content);
    markProfile(profiler, 'after_rotary_scan');
    sampleHeap(profiler, 'after_rotary_scan');

    const shouldOffsetRotaryRadius =
        rotaryDiameterOffsetEnabled && rotaryRadius !== null && !hasYAxisMoves;
    const applyRotaryRadiusOffset = (value: number): number =>
        shouldOffsetRotaryRadius ? value + (rotaryRadius as number) : value;

    // Common state variables
    const vertices: GrowableFloat32Buffer = {
        data: new Float32Array(4096),
        length: 0,
    };
    const colorValues: GrowableFloat32Buffer = {
        data: new Float32Array(4096),
        length: 0,
    };
    let colorVertexCount = 0;
    let tcCounter = 1;
    let lastToolchangeColorIndex = -1;
    const frames: GrowableUint32Buffer = {
        data: new Uint32Array(2048),
        length: 0,
    };
    let currentTool = 0;
    const toolchanges: number[] = [];
    const shouldBuildColors = needsVisualization && Boolean(theme);
    const asRgb = (color: THREE.Color): [number, number, number] => [
        color.r,
        color.g,
        color.b,
    ];
    const motionColor = {
        G0: asRgb(new THREE.Color(theme?.get(G0_PART) ?? '#FFF')),
        G1: asRgb(new THREE.Color(theme?.get(G1_PART) ?? '#FFF')),
        G2: asRgb(new THREE.Color(theme?.get(G2_PART) ?? '#FFF')),
        G3: asRgb(new THREE.Color(theme?.get(G3_PART) ?? '#FFF')),
        default: asRgb(new THREE.Color('#FFF')),
    };
    const getMotionColor = (motion: string): [number, number, number] => {
        if (motion === 'G0') return motionColor.G0;
        if (motion === 'G1') return motionColor.G1;
        if (motion === 'G2') return motionColor.G2;
        if (motion === 'G3') return motionColor.G3;
        return motionColor.default;
    };
    const pushMotionColor = (
        motion: string,
        opacity: number,
        count = 1,
    ): void => {
        colorVertexCount += count;
        if (!shouldBuildColors) {
            return;
        }

        const [r, g, b] = getMotionColor(motion);
        pushFloat32_4Repeat(colorValues, r, g, b, opacity, count);
    };

    // Laser specific state variables
    const spindleFrameSpeeds: GrowableFloat32Buffer = {
        data: new Float32Array(4096),
        length: 0,
    };
    let maxSpindleSpeed = 0;
    let spindleSpeed = 0;

    // SVG specific state variables
    let SVGVertices: SVGVertex[] = [];
    let paths: Path[] = [];
    let currentMotion = '';
    let progress = 0;
    let currentLines = 0;
    let totalLines = 0;
    for (let i = 0; i < content.length; i++) {
        if (content.charCodeAt(i) === 10) totalLines++;
    }

    /**
     * Updates local state with any spindle changes in line
     * @param words
     */
    const updateSpindleStateFromLine = (lineData: any) => {
        if (typeof lineData === 'number' && Number.isFinite(lineData)) {
            const nextSpindleSpeed = lineData;
            spindleSpeed = nextSpindleSpeed;
            maxSpindleSpeed = Math.max(maxSpindleSpeed, nextSpindleSpeed);
            return;
        }

        const words = Array.isArray(lineData?.words) ? lineData.words : [];
        const spindleMatches = words.filter((word) => word[0] === 'S');
        const [spindleCommand, spindleValue] = spindleMatches[0] || [];
        if (spindleCommand) {
            const nextSpindleSpeed = Number(spindleValue);
            spindleSpeed = nextSpindleSpeed;
            maxSpindleSpeed = Math.max(maxSpindleSpeed, nextSpindleSpeed);
        }
    };

    const isNewTool = (t: number | undefined) => {
        if (currentTool !== t) {
            currentTool = t;
            return true;
        }
        return false;
    };
    const registerToolChange = (tool: number | undefined): void => {
        if (!isNewTool(tool)) {
            return;
        }

        toolchanges.push(colorVertexCount);
        if (
            colorVertexCount <= 20 ||
            colorVertexCount === lastToolchangeColorIndex
        ) {
            return;
        }
        lastToolchangeColorIndex = colorVertexCount;

        const paletteIndex = getComplementaryColour(tcCounter);
        tcCounter++;
        const nextColor = toolpathColors[paletteIndex] ?? toolpathColors[0];
        if (!nextColor) {
            return;
        }
        const rgb = asRgb(nextColor);
        motionColor.G1 = rgb;
        motionColor.G2 = rgb;
        motionColor.G3 = rgb;
    };

    // create path for the vertices of the last motion
    const createPath = (motion: string) => {
        const parts: string[] = ['M'];
        for (let i = 0; i < SVGVertices.length; i++) {
            parts.push(
                SVGVertices[i].x1 +
                ',' +
                SVGVertices[i].y1 +
                ',' +
                SVGVertices[i].x2 +
                ',' +
                SVGVertices[i].y2 +
                ',',
            );
        }
        paths.push({
            motion: motion,
            path: parts.join(''),
            strokeWidth: 10,
            fill: 'none',
        });
    };

    const svgInitialization = (motion: string) => {
        // initialize
        if (currentMotion === '') {
            currentMotion = motion;
            // if the motion has changed, determine whether to create path
        } else if (currentMotion !== motion) {
            // treat G1-G3 as the same motion
            if (currentMotion === 'G0' || motion === 'G0') {
                createPath(currentMotion);
                // reset
                SVGVertices = [];
                currentMotion = motion;
            }
        }
    };

    const onData = () => {
        const vertexIndex = vertices.length / 3;
        pushUint32_1(frames, vertexIndex);

        currentLines++;
        if (
            profiler &&
            profiler.sampleEvery > 0 &&
            currentLines % profiler.sampleEvery === 0
        ) {
            sampleHeap(profiler, `line_${currentLines}`);
        }

        const newProgress = Math.floor((currentLines / totalLines) * 100);
        if (newProgress !== progress) {
            progress = newProgress;
            postMessage({
                type: 'progress',
                jobId,
                progress,
            });
        }
    };

    // Split handlers for regular, laser, and SVG visualization
    // Each handle Line and Arc Curves differently
    const handlers = {
        normal: {
            addLine: (modal: Modal, v1: BasicPosition, v2: BasicPosition) => {
                if (needsVisualization) {
                    const { motion, units, tool } = modal;
                    registerToolChange(tool);

                    // Check if A-axis rotation is involved
                    const hasARotation =
                        Math.abs((v2.a || 0) - (v1.a || 0)) > 0.001;

                    if (hasARotation) {
                        // Create helical motion with intermediate points
                        // Use Math.max(1,...) — no artificial minimum; small-angle moves get 1 segment
                        const segments = Math.max(
                            1,
                            Math.ceil(Math.abs((v2.a || 0) - (v1.a || 0)) / 5),
                        );
                        const opacity = motion === 'G0' ? 0.5 : 1;

                        // Reusable scalars — no per-iteration object allocation
                        let prevX = 0, prevY = 0, prevZ = 0;
                        for (let i = 0; i <= segments; i++) {
                            const t = i / segments;
                            const interpolatedA =
                                (v1.a || 0) + ((v2.a || 0) - (v1.a || 0)) * t;

                            // Interpolate position
                            const interpolatedX = v1.x + (v2.x - v1.x) * t;
                            const interpolatedY = v1.y + (v2.y - v1.y) * t;
                            const interpolatedZ = applyRotaryRadiusOffset(
                                v1.z + (v2.z - v1.z) * t,
                            );

                            // Inline x-axis rotation: angle = toRadians(-a)
                            const angle = -interpolatedA * (Math.PI / 180);
                            const sinA = Math.sin(angle);
                            const cosA = Math.cos(angle);
                            const currX = interpolatedX;
                            const currY = interpolatedY * cosA - interpolatedZ * sinA;
                            const currZ = interpolatedY * sinA + interpolatedZ * cosA;

                            if (i > 0) {
                                // Add line segment from previous point to current point
                                pushMotionColor(motion, opacity, 2);
                                pushFloat32_6(
                                    vertices,
                                    prevX,
                                    prevY,
                                    prevZ,
                                    currX,
                                    currY,
                                    currZ,
                                );

                                // SVG
                                if (shouldIncludeSVG) {
                                    const multiplier =
                                        units === 'G21' ? 1 : 25.4;
                                    svgInitialization(motion);
                                    SVGVertices.push({
                                        x1: prevX * multiplier,
                                        y1: prevY * multiplier,
                                        x2: currX * multiplier,
                                        y2: currY * multiplier,
                                    });
                                }
                            }

                            prevX = currX;
                            prevY = currY;
                            prevZ = currZ;
                        }
                    } else {
                        // No A-axis rotation, use simple linear interpolation
                        const newV1 = rotateAxis('x', {
                            x: v1.x,
                            y: v1.y,
                            z: applyRotaryRadiusOffset(v1.z),
                            a: v1.a || 0,
                        });
                        v1.x = newV1.x;
                        v1.y = newV1.y;
                        v1.z = newV1.z;

                        const newV2 = rotateAxis('x', {
                            x: v2.x,
                            y: v2.y,
                            z: applyRotaryRadiusOffset(v2.z),
                            a: v2.a || 0,
                        });
                        v2.x = newV2.x;
                        v2.y = newV2.y;
                        v2.z = newV2.z;

                        // normal
                        const opacity = motion === 'G0' ? 0.5 : 1;
                        pushMotionColor(motion, opacity, 2);
                        pushFloat32_6(
                            vertices,
                            v1.x,
                            v1.y,
                            v1.z,
                            v2.x,
                            v2.y,
                            v2.z,
                        );

                        // svg
                        if (shouldIncludeSVG) {
                            const multiplier = units === 'G21' ? 1 : 25.4; // We need to make path bigger for inches
                            svgInitialization(motion);
                            SVGVertices.push({
                                x1: v1.x * multiplier,
                                y1: v1.y * multiplier,
                                x2: v2.x * multiplier,
                                y2: v2.y * multiplier,
                            });
                        }
                    }
                }
            },
            // For rotary visualization
            addCurve: (modal: Modal, v1: BasicPosition, v2: BasicPosition) => {
                const { motion, tool } = modal;
                registerToolChange(tool);
                // Check if A-axis rotation is involved
                const hasARotation =
                    Math.abs((v2.a || 0) - (v1.a || 0)) > 0.001;

                if (hasARotation) {
                    // Create helical curve with A-axis rotation
                    // Use Math.max(1,...) — no artificial minimum; small-angle moves get 1 segment
                    const segments = Math.max(
                        1,
                        Math.ceil(Math.abs((v2.a || 0) - (v1.a || 0)) / 5),
                    );

                    // Reusable scalars — no per-iteration object allocation
                    let prevX = 0, prevY = 0, prevZ = 0;
                    for (let i = 0; i <= segments; i++) {
                        const t = i / segments;
                        const interpolatedA =
                            (v1.a || 0) + ((v2.a || 0) - (v1.a || 0)) * t;

                        // Interpolate position
                        const interpolatedX = v1.x + (v2.x - v1.x) * t;
                        const interpolatedY = v1.y + (v2.y - v1.y) * t;
                        const interpolatedZ = applyRotaryRadiusOffset(
                            v1.z + (v2.z - v1.z) * t,
                        );

                        // Inline x-axis rotation: angle = toRadians(-a)
                        const angle = -interpolatedA * (Math.PI / 180);
                        const sinA = Math.sin(angle);
                        const cosA = Math.cos(angle);
                        const currX = interpolatedX;
                        const currY = interpolatedY * cosA - interpolatedZ * sinA;
                        const currZ = interpolatedY * sinA + interpolatedZ * cosA;

                        if (i > 0) {
                            // Add line segment from previous point to current point
                            pushMotionColor(motion, 1, 2);
                            pushFloat32_6(
                                vertices,
                                prevX,
                                prevY,
                                prevZ,
                                currX,
                                currY,
                                currZ,
                            );
                        }

                        prevX = currX;
                        prevY = currY;
                        prevZ = currZ;
                    }
                } else {
                    // Original curve logic for non-A-axis rotation
                    const updatedV1 = rotateAxis('x', {
                        x: v1.x,
                        y: v1.y,
                        z: applyRotaryRadiusOffset(v1.z),
                        a: v1.a || 0,
                    });
                    const updatedV2 = rotateAxis('x', {
                        x: v2.x,
                        y: v2.y,
                        z: applyRotaryRadiusOffset(v2.z),
                        a: v2.a || 0,
                    });

                    const radius = v2.z;
                    let startAngle = Math.atan2(updatedV1.z, updatedV1.y);
                    let endAngle = Math.atan2(updatedV2.z, updatedV2.y);
                    const isClockwise = v2.z > v1.z;

                    const arcCurve = new ArcCurve(
                        0,
                        0,
                        radius,
                        startAngle,
                        endAngle,
                        isClockwise,
                    );

                    const DEGREES_PER_LINE_SEGMENT = 5;

                    const angleDiff = Math.abs(v2.z - v1.z);
                    const divisions = Math.ceil(
                        angleDiff / DEGREES_PER_LINE_SEGMENT,
                    );
                    const points = arcCurve.getPoints(divisions);

                    for (let i = 0; i < points.length; ++i) {
                        const point = points[i];
                        pushFloat32_3(vertices, v2.x, point.x, point.y);
                        pushMotionColor(motion, 1);
                    }
                }
            },
            addArcCurve: (
                modal: Modal,
                v1: BasicPosition,
                v2: BasicPosition,
                v0: BasicPosition,
            ) => {
                if (needsVisualization) {
                    const { motion, plane, units, tool } = modal;
                    registerToolChange(tool);

                    const multiplier = units === 'G21' ? 1 : 25.4;
                    const isClockwise = motion === 'G2';
                    const radius = Math.sqrt(
                        (v1.x - v0.x) ** 2 + (v1.y - v0.y) ** 2,
                    );
                    let startAngle = Math.atan2(v1.y - v0.y, v1.x - v0.x);
                    let endAngle = Math.atan2(v2.y - v0.y, v2.x - v0.x);

                    // Draw full circle if startAngle and endAngle are both zero
                    if (startAngle === endAngle) {
                        endAngle += 2 * Math.PI;
                    }

                    const arcCurve = new ArcCurve(
                        v0.x, // aX
                        v0.y, // aY
                        radius, // aRadius
                        startAngle, // aStartAngle
                        endAngle, // aEndAngle
                        isClockwise, // isClockwise
                    );
                    // Adaptive tessellation: ~0.75mm per segment, clamped to [4, 25]
                    const arcSpan = Math.abs(endAngle - startAngle);
                    const arcLength = arcSpan * radius;
                    const divisions = Math.max(4, Math.min(Math.ceil(arcLength / 0.75), 25));
                    const points = arcCurve.getPoints(divisions);
                    const pointCount = Math.max(points.length - 1, 1);

                    // svg
                    if (shouldIncludeSVG) {
                        svgInitialization(motion);
                    }

                    for (let i = 0; i < points.length; ++i) {
                        const point = points[i];
                        const pointA = points[i - 1];
                        const pointB = points[i];
                        const z = ((v2.z - v1.z) / pointCount) * i + v1.z;

                        if (plane === 'G17') {
                            // XY-plane
                            pushFloat32_3(vertices, point.x, point.y, z);
                            if (shouldIncludeSVG && i > 0) {
                                SVGVertices.push({
                                    x1: pointA.x * multiplier,
                                    y1: pointA.y * multiplier,
                                    x2: pointB.x * multiplier,
                                    y2: pointB.y * multiplier,
                                });
                            }
                        } else if (plane === 'G18') {
                            // ZX-plane
                            pushFloat32_3(vertices, point.y, z, point.x);
                            if (shouldIncludeSVG && i > 0) {
                                SVGVertices.push({
                                    x1: pointA.y * multiplier,
                                    y1: z * multiplier,
                                    x2: pointB.y * multiplier,
                                    y2: z * multiplier,
                                });
                            }
                        } else if (plane === 'G19') {
                            // YZ-plane
                            pushFloat32_3(vertices, z, point.x, point.y);
                            if (shouldIncludeSVG && i > 0) {
                                if (i > 0) {
                                    SVGVertices.push({
                                        x1: z * multiplier,
                                        y1: pointA.x * multiplier,
                                        x2: z * multiplier,
                                        y2: pointB.x * multiplier,
                                    });
                                }
                            }
                        }
                        pushMotionColor(motion, 1);
                    }
                }
            },
        },
        laser: {
            addLine: (modal: Modal, v1: BasicPosition, v2: BasicPosition) => {
                const { addLine: dAddLine } = handlers.normal;
                dAddLine(modal, v1, v2);
            },
            addArcCurve: (
                modal: Modal,
                v1: BasicPosition,
                v2: BasicPosition,
                v0: BasicPosition,
            ) => {
                const { addArcCurve: dAddArcCurve } = handlers.normal;
                dAddArcCurve(modal, v1, v2, v0);
            },
        },
        svg: {
            addLine: (modal: Modal, v1: BasicPosition, v2: BasicPosition) => {
                const { motion, units } = modal;
                const multiplier = units === 'G21' ? 1 : 25.4;
                // initialize
                if (currentMotion === '') {
                    currentMotion = motion;
                    // if the motion has changed, determine whether to create path
                } else if (currentMotion !== motion) {
                    // treat G1-G3 as the same motion
                    if (currentMotion === 'G0' || motion === 'G0') {
                        createPath(currentMotion);
                        // reset
                        SVGVertices = [];
                        currentMotion = motion;
                    }
                }
                SVGVertices.push({
                    x1: v1.x * multiplier,
                    y1: v1.y * multiplier,
                    x2: v2.x * multiplier,
                    y2: v2.y * multiplier,
                });
            },
            addArcCurve: (
                modal: Modal,
                v1: BasicPosition,
                v2: BasicPosition,
                v0: BasicPosition,
            ) => {
                const { motion, plane, units } = modal;
                const multiplier = units === 'G21' ? 1 : 25.4;
                const isClockwise = motion === 'G2';
                const radius = Math.sqrt(
                    (v1.x - v0.x) ** 2 + (v1.y - v0.y) ** 2,
                );
                let startAngle = Math.atan2(v1.y - v0.y, v1.x - v0.x);
                let endAngle = Math.atan2(v2.y - v0.y, v2.x - v0.x);

                // Draw full circle if startAngle and endAngle are both zero
                if (startAngle === endAngle) {
                    endAngle += 2 * Math.PI;
                }

                const arcCurve = new ArcCurve(
                    v0.x, // aX
                    v0.y, // aY
                    radius, // aRadius
                    startAngle, // aStartAngle
                    endAngle, // aEndAngle
                    isClockwise, // isClockwise
                );
                const divisions = 30;
                const points = arcCurve.getPoints(divisions);
                const pointCount = Math.max(points.length - 1, 1);
                // initialize
                if (currentMotion === '') {
                    currentMotion = motion;
                    // if the motion has changed, determine whether to create path
                } else if (currentMotion !== motion) {
                    // treat G1-G3 as the same motion
                    if (currentMotion === 'G0' || motion === 'G0') {
                        createPath(currentMotion);
                        // reset
                        SVGVertices = [];
                        currentMotion = motion;
                    }
                }
                for (let i = 1; i < points.length; ++i) {
                    const pointA = points[i - 1];
                    const pointB = points[i];
                    const z = ((v2.z - v1.z) / pointCount) * i + v1.z;

                    if (plane === 'G17') {
                        // XY-plane
                        SVGVertices.push({
                            x1: pointA.x * multiplier,
                            y1: pointA.y * multiplier,
                            x2: pointB.x * multiplier,
                            y2: pointB.y * multiplier,
                        });
                    } else if (plane === 'G18') {
                        // ZX-plane
                        SVGVertices.push({
                            x1: pointA.y * multiplier,
                            y1: z * multiplier,
                            x2: pointB.y * multiplier,
                            y2: z * multiplier,
                        });
                    } else if (plane === 'G19') {
                        // YZ-plane
                        SVGVertices.push({
                            x1: z * multiplier,
                            y1: pointA.x * multiplier,
                            x2: z * multiplier,
                            y2: pointB.x * multiplier,
                        });
                    }
                }
            },
        },
    };

    // Determine which handler to use - normal by default, then laser if selected
    let handlerKey = 'normal';

    if (isLaser) {
        handlerKey = 'laser';
    }

    // @ts-ignore
    const { addLine, addArcCurve, addCurve } =
        handlers[handlerKey as keyof typeof handlers];
    let fileInfo = null;
    let parsedDataToSend = null;
    const vm = new GCodeVirtualizer({
        addLine,
        addArcCurve,
        addCurve,
        collate: true,
        accelerations,
        maxFeedrates,
        atcEnabled,
    });

    vm.on('data', (data: any) => {
        if (profiler) {
            profiler.counts.vm_data_events =
                (profiler.counts.vm_data_events || 0) + 1;
        }

        if (isLaser && needsVisualization) {
            updateSpindleStateFromLine(data);
            const spindleIsOn = vm.modal.spindle === 'M3' || vm.modal.spindle === 'M4';
            pushFloat32_1(spindleFrameSpeeds, spindleIsOn ? spindleSpeed : 0);
        }
        onData();
    });

    markProfile(profiler, 'before_line_split');
    markProfile(profiler, 'after_line_split');
    sampleHeap(profiler, 'after_line_split');

    markProfile(profiler, 'before_parse_loop');
    let virtualizedLines = 0;
    const contentLength = content.length;
    let lineStart = 0;
    for (let i = 0; i < contentLength; i++) {
        const ch = content.charCodeAt(i);
        if (ch !== 10 && ch !== 13) {
            continue;
        }

        const line = content.slice(lineStart, i);
        vm.virtualize(line);
        virtualizedLines++;

        if (ch === 13 && i + 1 < contentLength && content.charCodeAt(i + 1) === 10) {
            i++;
        }
        lineStart = i + 1;
    }

    // Match split(/\r?\n/) behavior by emitting the final line, including
    // a trailing empty line when the content ends with a newline.
    vm.virtualize(content.slice(lineStart, contentLength));
    virtualizedLines++;

    markProfile(profiler, 'after_parse_loop');
    sampleHeap(profiler, 'after_parse_loop');

    const { estimates } = vm.getData();
    fileInfo = vm.generateFileStats();
    fileInfo.toolchanges = toolchanges;

    parsedDataToSend = {
        estimates: estimates,
        info: fileInfo,
        modalChanges: [],
        feedrateChanges: [],
        invalidLines: fileInfo.invalidLines,
    };

    markProfile(profiler, 'before_typed_array_build');
    const tFrames = toUsedUint32View(frames);
    const tVertices = toUsedFloat32View(vertices);
    const compactSpindleFrameSpeeds = isLaser
        ? toCompactFloat32Array(toUsedFloat32View(spindleFrameSpeeds))
        : new Float32Array(0);
    markProfile(profiler, 'after_typed_array_build');
    sampleHeap(profiler, 'after_typed_array_build');

    // create path for the last motion
    if (shouldIncludeSVG) {
        createPath(currentMotion);
    }
    let colorArray = new Float32Array(0);
    let savedColorsArray = new Float32Array(0);
    markProfile(profiler, 'before_color_build');
    if (needsVisualization && theme) {
        colorArray = toUsedFloat32View(colorValues);

        // Non-laser jobs can use colorArray directly; no duplicate saved buffer needed.
        if (isLaser) {
            savedColorsArray = new Float32Array(colorArray);
            if (spindleFrameSpeeds.length > 0 && savedColorsArray.length > 0) {
                const defaultColor = new THREE.Color(theme.get(LASER_PART) ?? '#FFF');
                const fillColor = new THREE.Color(theme.get(BACKGROUND_PART) ?? '#FFF');
                const laserR = defaultColor.r;
                const laserG = defaultColor.g;
                const laserB = defaultColor.b;
                const fillR = fillColor.r;
                const fillG = fillColor.g;
                const fillB = fillColor.b;
                const totalVertices = colorArray.length / 4;
                const frameCount = Math.min(tFrames.length, spindleFrameSpeeds.length);
                const calculateOpacity = (speed: number) => {
                    if (maxSpindleSpeed <= 0) {
                        return 1;
                    }
                    return Math.max(0, Math.min(speed / maxSpindleSpeed, 1));
                };

                let prevFrame = 0;
                for (let i = 0; i < frameCount; i++) {
                    const frameEnd = Math.min(tFrames[i], totalVertices);
                    if (frameEnd <= prevFrame) {
                        continue;
                    }

                    const speed = spindleFrameSpeeds.data[i];
                    const spindleIsOn = speed > 0;
                    const alpha = spindleIsOn ? calculateOpacity(speed) : 0.05;
                    const r = spindleIsOn ? laserR : fillR;
                    const g = spindleIsOn ? laserG : fillG;
                    const b = spindleIsOn ? laserB : fillB;

                    for (let vertexIndex = prevFrame; vertexIndex < frameEnd; vertexIndex++) {
                        const offset = vertexIndex * 4;
                        savedColorsArray[offset] = r;
                        savedColorsArray[offset + 1] = g;
                        savedColorsArray[offset + 2] = b;
                        savedColorsArray[offset + 3] = alpha;
                    }

                    prevFrame = frameEnd;
                }
            }
        }
    }
    markProfile(profiler, 'after_color_build');
    sampleHeap(profiler, 'after_color_build');

    const compactVertices = toCompactFloat32Array(tVertices);
    const compactFrames = toCompactUint32Array(tFrames);
    const compactColorArray = toCompactFloat32Array(colorArray);
    const compactSavedColorsArray = toCompactFloat32Array(savedColorsArray);

    if (profiler) {
        profiler.counts.virtualized_lines = virtualizedLines;
        profiler.counts.lines_with_data = currentLines;
        profiler.counts.frames_len = frames.length;
        profiler.counts.vertices_f32_len = tVertices.length;
        profiler.counts.color_values_len = colorValues.length;
        profiler.counts.color_vertices_len = colorVertexCount;
        profiler.counts.toolchanges_len = toolchanges.length;
        profiler.counts.spindle_frame_speeds_len = spindleFrameSpeeds.length;
        profiler.counts.paths_len = paths.length;
        profiler.counts.estimates_len = estimates.length;
        profiler.counts.invalid_lines_len = fileInfo.invalidLines?.length || 0;
        profiler.counts.spindle_tool_event_count = Object.keys(
            fileInfo.spindleToolEvents || {},
        ).length;
        profiler.bytes.vertices_bytes = compactVertices.byteLength;
        profiler.bytes.frames_bytes = compactFrames.byteLength;
        profiler.bytes.color_bytes = compactColorArray.byteLength;
        profiler.bytes.saved_color_bytes = compactSavedColorsArray.byteLength;
        profiler.bytes.spindle_frame_speeds_bytes = compactSpindleFrameSpeeds.byteLength;
        profiler.bytes.vertices_capacity_bytes = tVertices.buffer.byteLength;
        profiler.bytes.frames_capacity_bytes = tFrames.buffer.byteLength;
        profiler.bytes.color_capacity_bytes = colorArray.buffer.byteLength;
        profiler.bytes.saved_color_capacity_bytes = savedColorsArray.buffer.byteLength;
    }

    const effectiveVisualizer = activeVisualizer ?? visualizer;

    const geometryMessage: {
        type: 'geometryReady';
        jobId: number;
        visualizer?: VISUALIZER_TYPES_T;
        vertices: ArrayBuffer;
        paths: Path[];
        frames: ArrayBuffer;
        verticesLen: number;
        framesLen: number;
        colorArrayBuffer: ArrayBuffer;
        colorLen: number;
        savedColorsBuffer: ArrayBuffer;
        savedColorLen: number;
        info: any;
        needsVisualization: boolean;
        parsedData: {
            info: any;
            invalidLines: string[];
        };
        spindleFrameSpeeds?: ArrayBuffer;
        spindleFrameLen?: number;
        isLaser?: boolean;
        isSecondary?: boolean;
        activeVisualizer?: VISUALIZER_TYPES_T;
    } = {
        type: 'geometryReady',
        jobId,
        visualizer: effectiveVisualizer,
        vertices: compactVertices.buffer,
        paths,
        frames: compactFrames.buffer,
        verticesLen: tVertices.length,
        framesLen: tFrames.length,
        colorArrayBuffer: compactColorArray.buffer,
        colorLen: colorArray.length,
        savedColorsBuffer: compactSavedColorsArray.buffer,
        savedColorLen: savedColorsArray.length,
        info: fileInfo,
        needsVisualization,
        parsedData: {
            info: fileInfo,
            invalidLines: fileInfo.invalidLines || [],
        },
        isSecondary,
        activeVisualizer: effectiveVisualizer,
    };

    if (isLaser) {
        geometryMessage.spindleFrameSpeeds = compactSpindleFrameSpeeds.buffer;
        geometryMessage.spindleFrameLen = compactSpindleFrameSpeeds.length;
        geometryMessage.isLaser = isLaser;
    }

    const transferList: ArrayBuffer[] = [
        compactVertices.buffer,
        compactFrames.buffer,
        compactColorArray.buffer,
        compactSavedColorsArray.buffer,
    ];
    if (isLaser) {
        transferList.push(compactSpindleFrameSpeeds.buffer);
    }

    markProfile(profiler, 'before_post_message');
    if (profiler) {
        profiler.bytes.vertices_transfer_bytes = compactVertices.byteLength;
        profiler.bytes.frames_transfer_bytes = compactFrames.byteLength;
        profiler.bytes.color_transfer_bytes = compactColorArray.byteLength;
        profiler.bytes.saved_color_transfer_bytes =
            compactSavedColorsArray.byteLength;
        profiler.bytes.spindle_frame_speeds_transfer_bytes =
            compactSpindleFrameSpeeds.byteLength;
        profiler.bytes.transfer_total_bytes = transferList.reduce(
            (acc, buffer) => acc + buffer.byteLength,
            0,
        );
        profiler.bytes.transfer_capacity_total_bytes =
            tVertices.buffer.byteLength +
            tFrames.buffer.byteLength +
            colorArray.buffer.byteLength +
            savedColorsArray.buffer.byteLength +
            spindleFrameSpeeds.data.buffer.byteLength;
        profiler.bytes.transfer_saved_bytes =
            profiler.bytes.transfer_capacity_total_bytes -
            profiler.bytes.transfer_total_bytes;
        const durationBetween = (start: string, end: string): number => {
            const s = profiler.marks[start];
            const e = profiler.marks[end];
            if (typeof s !== 'number' || typeof e !== 'number') {
                return 0;
            }
            return Number((e - s).toFixed(3));
        };
        const vmStats =
            typeof (vm as any).getProfileStats === 'function'
                ? (vm as any).getProfileStats()
                : undefined;
        const metadataMessage: {
            type: 'metadataReady';
            jobId: number;
            visualizer?: VISUALIZER_TYPES_T;
            info: any;
            needsVisualization: boolean;
            parsedData: any;
            isSecondary?: boolean;
            activeVisualizer?: VISUALIZER_TYPES_T;
            profile?: {
                durationsMs: Record<string, number>;
                counts: Record<string, number>;
                bytes: Record<string, number>;
                heap: {
                    supported: boolean;
                    peak: number | null;
                    samples: HeapSample[];
                };
                vm?: Record<string, number>;
            };
        } = {
            type: 'metadataReady',
            jobId,
            visualizer: effectiveVisualizer,
            info: fileInfo,
            needsVisualization,
            parsedData: parsedDataToSend,
            isSecondary,
            activeVisualizer: effectiveVisualizer,
        };

        metadataMessage.profile = {
            durationsMs: {
                rotaryScan: durationBetween('start', 'after_rotary_scan'),
                lineSplit: durationBetween('before_line_split', 'after_line_split'),
                parseLoop: durationBetween('before_parse_loop', 'after_parse_loop'),
                typedArrayBuild: durationBetween(
                    'before_typed_array_build',
                    'after_typed_array_build',
                ),
                colorBuild: durationBetween('before_color_build', 'after_color_build'),
                total: durationBetween('start', 'before_post_message'),
            },
            counts: profiler.counts,
            bytes: profiler.bytes,
            heap: {
                supported: profiler.heap.supported,
                peak: profiler.heap.peak ?? null,
                samples: profiler.heap.samples,
            },
            vm: vmStats,
        };

        postMessage(geometryMessage, transferList);
        postMessage(metadataMessage);
        return;
    }

    const metadataMessage = {
        type: 'metadataReady' as const,
        jobId,
        visualizer: effectiveVisualizer,
        info: fileInfo,
        needsVisualization,
        parsedData: parsedDataToSend,
        isSecondary,
        activeVisualizer: effectiveVisualizer,
    };

    postMessage(geometryMessage, transferList);
    postMessage(metadataMessage);
};
