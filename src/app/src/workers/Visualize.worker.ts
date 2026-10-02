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

import type { BasicPosition } from 'app/definitions/general';
import {
    G0_PART,
    G1_PART,
    G2_PART,
    G3_PART,
    TOOLPATH_COLOR_HEXES,
} from 'app/features/Visualizer/constants';
import type { VISUALIZER_TYPES_T } from 'app/features/Visualizer/definitions';
import GCodeVirtualizer, {
    isTrimWhitespace,
    rotateAxis,
} from 'app/lib/GCodeVirtualizer';
import MotionPlanner, {
    type EstimatorConfig,
    estimateLineCount,
} from 'app/lib/timeEstimator/MotionPlanner';
import * as THREE from 'three';
import { ArcCurve } from 'three';

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
    needsVisualization?: boolean;
    svgOnly?: boolean;
    rapidOpacity?: number;
    estimatorConfig?: Partial<EstimatorConfig>;
    rotaryDiameterOffsetEnabled?: boolean;
    rotaryPreviewAxis?: 'X' | 'Y';
    rotaryCenterlineZ?: number;
    isSecondary: boolean;
    activeVisualizer: VISUALIZER_TYPES_T;
    theme?: Map<string, string>;
    profile?: boolean;
    profileSampleEvery?: number;
}

interface Modal {
    motion: string;
    plane?: string;
    units?: string;
    tool?: number;
}

type RotaryMetadata = {
    radius: number | null;
    centerlineZ: number | null;
    hasTransverseAxisMoves: boolean;
    hasAAxisMoves: boolean;
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

const pushFloat32_4 = (
    buffer: GrowableFloat32Buffer,
    a: number,
    b: number,
    c: number,
    d: number,
): void => {
    ensureFloat32Capacity(buffer, 4);
    const i = buffer.length;
    buffer.data[i] = a;
    buffer.data[i + 1] = b;
    buffer.data[i + 2] = c;
    buffer.data[i + 3] = d;
    buffer.length = i + 4;
};

const toUsedFloat32View = (buffer: GrowableFloat32Buffer): Float32Array =>
    buffer.data.subarray(0, buffer.length);

const toCompactFloat32Array = (view: Float32Array): Float32Array => {
    const fullLength = view.buffer.byteLength / Float32Array.BYTES_PER_ELEMENT;
    if (view.byteOffset === 0 && view.length === fullLength) {
        return view;
    }
    return new Float32Array(view);
};

// --- "segments-v1" toolpath output ------------------------------------------
//
// The 3D toolpath leaves the worker in the exact layout gviewer draws
// (loadFromSegments): segment-pair positions plus one attribute byte per vertex,
// in chunks that are transferred and uploaded as-is. Colour, laser power
// shading and progress greying are resolved in gviewer's shader, so the main
// thread never copies or re-packs the geometry.

// Mirrors @sienci/gviewer SEGMENT_ATTR_RAPID: set on rapid (G0) vertices; the
// low 7 bits of a cutting vertex are its palette slot (0 = first tool).
const SEGMENT_ATTR_RAPID = 0x80;

// Chunks start small and double, so small files stay small and big files end
// up in few draw calls; a chunk never splits a segment.
const MIN_CHUNK_VERTICES = 1 << 16;
const MAX_CHUNK_VERTICES = 1 << 20;

type SegmentChunk = {
    positions: Float32Array;
    attrs: Uint8Array;
    power: Float32Array | null;
    count: number;
};

class SegmentWriter {
    chunks: SegmentChunk[] = [];

    totalVertices = 0;

    private current: SegmentChunk | null = null;

    private nextCapacity = MIN_CHUNK_VERTICES;

    constructor(private readonly withPower: boolean) {}

    private startChunk(): SegmentChunk {
        const capacity = this.nextCapacity;
        this.nextCapacity = Math.min(MAX_CHUNK_VERTICES, capacity * 2);
        const chunk: SegmentChunk = {
            positions: new Float32Array(capacity * 3),
            attrs: new Uint8Array(capacity),
            power: this.withPower ? new Float32Array(capacity) : null,
            count: 0,
        };
        this.chunks.push(chunk);
        this.current = chunk;
        return chunk;
    }

    push(
        x1: number,
        y1: number,
        z1: number,
        x2: number,
        y2: number,
        z2: number,
        attr: number,
    ): void {
        let chunk = this.current;
        if (!chunk || chunk.count + 2 > chunk.attrs.length) {
            chunk = this.startChunk();
        }
        const v = chunk.count;
        const p = v * 3;
        chunk.positions[p] = x1;
        chunk.positions[p + 1] = y1;
        chunk.positions[p + 2] = z1;
        chunk.positions[p + 3] = x2;
        chunk.positions[p + 4] = y2;
        chunk.positions[p + 5] = z2;
        chunk.attrs[v] = attr;
        chunk.attrs[v + 1] = attr;
        chunk.count = v + 2;
        this.totalVertices += 2;
    }

    // Sets the power of every vertex written since `fromVertex` (the vertices of
    // the line just finished; a line can span a chunk boundary).
    fillPower(fromVertex: number, power: number): void {
        if (!this.withPower || power === 0) {
            return; // power arrays start zeroed
        }
        let remaining = this.totalVertices - fromVertex;
        for (let c = this.chunks.length - 1; c >= 0 && remaining > 0; c--) {
            const chunk = this.chunks[c];
            const n = Math.min(remaining, chunk.count);
            chunk.power!.fill(power, chunk.count - n, chunk.count);
            remaining -= n;
        }
    }

    // Chunks to transfer. Full chunks go as-is; a mostly empty last chunk is
    // trimmed so its unused capacity isn't kept alive on the main thread.
    finish(): SegmentChunk[] {
        return this.chunks
            .filter((chunk) => chunk.count > 0)
            .map((chunk) => {
                if (chunk.count >= chunk.attrs.length * 0.75) {
                    return chunk;
                }
                return {
                    positions: chunk.positions.slice(0, chunk.count * 3),
                    attrs: chunk.attrs.slice(0, chunk.count),
                    power: chunk.power
                        ? chunk.power.slice(0, chunk.count)
                        : null,
                    count: chunk.count,
                };
            });
    }
}

// Patterns for cylinder diameter in NC/comment headers (e.g. DeskProto "(Cylinder Dia: 64.38)")
const ROTARY_DIAMETER_PATTERNS = [
    /Cylinder\s*Dia\s*:\s*([0-9.+-]+)/i, // Matches: "Cylinder Dia : 64.38", allows '.' '+' '-'
    /Cylinder\s*Dia(?:meter)?\s*[=:]\s*([0-9]+[.,][0-9]+|[0-9]+)/i, // Matches: "Cylinder Dia: 64.38" or "Cylinder Diameter=64.38"
    /(?:Cylinder\s+)?Dia(?:meter)?\s*[=:]\s*([0-9]+[.,][0-9]+|[0-9]+)/i, // Matches: "Cylinder Diameter=64.38", "Dia: 64.38", "Cylinder Dia: 64.38"
    /\(.*?Cylinder\s*Dia(?:meter)?\s*[=:]\s*([0-9]+[.,][0-9]+|[0-9]+)/i, // Matches when inside parens, e.g. "(Cylinder Dia: 64.38)"
];

// RotatoCAM subtracts this datum from posted Z. Its metadata is explicitly
// metric, including in G20 programs. Only consume the supported comment contract.
const parsePostedCenterlineZ = (raw: string): number | null => {
    const comments = /^[\t ]*(?:;[\t ]*([^\r\n]*)|\(([^\r\n)]*)\)[\t ]*)$/gm;
    let centerlineZ: number | null = null;
    for (const match of raw.matchAll(comments)) {
        const comment = (match[1] ?? match[2]).trim();
        if (!/^rotatocam-meta:/i.test(comment)) continue;
        const fields = comment
            .slice(comment.indexOf(':') + 1)
            .trim()
            .split(/\s+/);
        const values = new Map<string, string>();
        for (const field of fields) {
            const pair = field.split('=');
            if (pair.length !== 2 || values.has(pair[0].toLowerCase()))
                return null;
            values.set(pair[0].toLowerCase(), pair[1]);
        }
        const offset = values.get('z_zero_offset') ?? '';
        if (
            values.get('radial')?.toLowerCase() !== 'z' ||
            values.get('units')?.toLowerCase() !== 'mm' ||
            !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(offset)
        )
            return null;
        const parsed = -Number(offset);
        if (!Number.isFinite(parsed)) return null;
        if (centerlineZ !== null && centerlineZ !== parsed) return null;
        centerlineZ = parsed === 0 ? 0 : parsed;
    }
    return centerlineZ;
};

const parseRotaryMetadata = (
    raw: string,
    rotaryPreviewAxis: 'X' | 'Y',
): RotaryMetadata => {
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

    // Scan the axis perpendicular to the rotary centerline. Axial moves must
    // not suppress the optional stock-radius offset for Y-aligned jobs.
    const transverseAxisCode = rotaryPreviewAxis === 'Y' ? 88 : 89;
    let hasTransverseAxisMoves = false;
    let hasAAxisMoves = false;
    let inParenComment = false;
    for (
        let i = 0;
        i < raw.length && !(hasTransverseAxisMoves && hasAAxisMoves);
        i++
    ) {
        const ch = raw.charCodeAt(i);
        if (ch === 40) {
            inParenComment = true;
            continue;
        } // '('
        if (ch === 41) {
            inParenComment = false;
            continue;
        } // ')'
        if (ch === 59) {
            // ';'
            while (i < raw.length && raw.charCodeAt(i) !== 10) i++;
            continue;
        }
        if (inParenComment) continue;
        const isA = ch === 65 || ch === 97;
        const isTransverse =
            ch === transverseAxisCode || ch === transverseAxisCode + 32;
        if (!isA && !isTransverse) continue;
        const next = raw.charCodeAt(i + 1);
        if (
            (next >= 48 && next <= 57) ||
            next === 43 ||
            next === 45 ||
            next === 46
        ) {
            if (isA) hasAAxisMoves = true;
            if (isTransverse) hasTransverseAxisMoves = true;
        }
    }

    return {
        radius,
        centerlineZ: parsePostedCenterlineZ(raw),
        hasTransverseAxisMoves,
        hasAAxisMoves,
    };
};

self.onmessage = ({ data }: { data: WorkerData }) => {
    const {
        content,
        jobId = 0,
        visualizer,
        isLaser = false,
        needsVisualization = true,
        svgOnly: svgOnlyRequested = false,
        rapidOpacity = 0.5,
        estimatorConfig = {},
        rotaryDiameterOffsetEnabled = true,
        rotaryPreviewAxis = 'X',
        rotaryCenterlineZ: requestedCenterlineZ = 0,
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

    const rotationAxis = rotaryPreviewAxis === 'Y' ? 'y' : 'x';
    const {
        radius: rotaryRadius,
        centerlineZ: postedCenterlineZ,
        hasTransverseAxisMoves,
        hasAAxisMoves,
    } = parseRotaryMetadata(content, rotaryPreviewAxis);
    // G-code positions have already been converted to mm by the virtualizer.
    // The explicit centerline is also in mm, independent of G20/G21.
    const hasPostedCenterline = hasAAxisMoves && postedCenterlineZ !== null;
    const rotaryCenterlineZ = hasAAxisMoves
        ? (postedCenterlineZ ??
          (Number.isFinite(requestedCenterlineZ) ? requestedCenterlineZ : 0))
        : 0;
    markProfile(profiler, 'after_rotary_scan');
    sampleHeap(profiler, 'after_rotary_scan');

    const shouldOffsetRotaryRadius =
        rotaryDiameterOffsetEnabled &&
        !hasPostedCenterline &&
        rotaryCenterlineZ === 0 &&
        rotaryRadius !== null &&
        !hasTransverseAxisMoves;
    const applyRotaryRadiusOffset = (value: number): number =>
        shouldOffsetRotaryRadius
            ? value + (rotaryRadius as number)
            : value - rotaryCenterlineZ;

    // svgOnly: pendant top-down mode — stream deduplicated 2D segment groups
    // during parsing and skip the 3D segments entirely.
    const svgOnly = svgOnlyRequested && needsVisualization && !isSecondary;
    const usePower = isLaser && needsVisualization && !svgOnly;
    const segments = new SegmentWriter(usePower);

    let tcCounter = 1;
    let toolChangeIndex = 0;
    let lastToolchangeVertex = -1;
    let currentTool = 0;
    const toolchanges: number[] = [];
    // Palette slot of cutting moves: 0 for the first tool, then 1 + palette index.
    let paletteSlot = 0;

    const asRgb = (color: THREE.Color): [number, number, number] => [
        color.r,
        color.g,
        color.b,
    ];
    const firstToolColor = new THREE.Color(theme?.get(G1_PART) ?? '#FFF');
    // Slot k's colour for gviewer: slot 0 = the theme's cutting colour (what the
    // ToolTimeline legend shows for tool 1), slots 1.. = TOOLPATH_COLOR_HEXES.
    const paletteHex = [firstToolColor, ...toolpathColors].map(
        (color) => `#${color.getHexString()}`,
    );

    // Per-motion colours, used for the pendant's 2D groups.
    const motionColor = {
        G0: asRgb(new THREE.Color(theme?.get(G0_PART) ?? '#FFF')),
        G1: asRgb(firstToolColor),
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

    // svgOnly state: color-keyed groups of 2D segments [x1,y1,x2,y2], deduped
    // on a 0.01mm grid so repeated depth passes and pure-Z moves are dropped.
    type Svg2DGroup = {
        hexColor: string;
        opacity: number;
        positions: GrowableFloat32Buffer;
        seen: Set<number>;
    };
    const svg2DGroups = new Map<string, Svg2DGroup>();
    let svg2DKept = 0;
    let svg2DDupeDrops = 0;
    let svg2DDegenerateDrops = 0;
    let svg2DCachedRgb: [number, number, number] | null = null;
    let svg2DCachedOpacity = -1;
    let svg2DCachedGroup: Svg2DGroup | null = null;
    const rgbToHex = (rgb: [number, number, number]): string => {
        const ch = (v: number) =>
            Math.round(Math.min(1, Math.max(0, v)) * 255)
                .toString(16)
                .padStart(2, '0');
        return `#${ch(rgb[0])}${ch(rgb[1])}${ch(rgb[2])}`;
    };
    const getSvg2DGroup = (motion: string, opacity: number): Svg2DGroup => {
        const rgb = getMotionColor(motion);
        // Motion colors change only on toolchange, so a one-entry cache keyed
        // by array identity avoids per-segment hex/map work.
        if (rgb === svg2DCachedRgb && opacity === svg2DCachedOpacity) {
            return svg2DCachedGroup!;
        }
        const hexColor = rgbToHex(rgb);
        const key = `${hexColor}|${Math.round(opacity * 100)}`;
        let group = svg2DGroups.get(key);
        if (!group) {
            group = {
                hexColor,
                opacity,
                positions: { data: new Float32Array(4096), length: 0 },
                seen: new Set(),
            };
            svg2DGroups.set(key, group);
        }
        svg2DCachedRgb = rgb;
        svg2DCachedOpacity = opacity;
        svg2DCachedGroup = group;
        return group;
    };
    const mixHash2 = (a: number, b: number): number => {
        let h = Math.imul(a, 0x85ebca6b) ^ Math.imul(b, 0xc2b2ae35);
        h ^= h >>> 15;
        h = Math.imul(h, 0x27d4eb2f);
        h ^= h >>> 13;
        return h >>> 0;
    };
    const emitSvg2DSegment = (
        motion: string,
        opacity: number,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
    ): void => {
        let qx1 = Math.round(x1 * 100);
        let qy1 = Math.round(y1 * 100);
        let qx2 = Math.round(x2 * 100);
        let qy2 = Math.round(y2 * 100);
        // No XY extent (plunge/retract/micro-move) — invisible from above
        if (qx1 === qx2 && qy1 === qy2) {
            svg2DDegenerateDrops++;
            return;
        }
        // Canonical endpoint order so opposite-direction passes dedupe too
        if (qx1 > qx2 || (qx1 === qx2 && qy1 > qy2)) {
            let t = qx1;
            qx1 = qx2;
            qx2 = t;
            t = qy1;
            qy1 = qy2;
            qy2 = t;
        }
        const group = getSvg2DGroup(motion, opacity);
        // 53-bit key: 32 bits from one endpoint hash + 21 from the other.
        // A collision only drops one segment from an already-overdrawn preview.
        const key = mixHash2(qx1, qy1) * 0x200000 + (mixHash2(qx2, qy2) >>> 11);
        if (group.seen.has(key)) {
            svg2DDupeDrops++;
            return;
        }
        group.seen.add(key);
        svg2DKept++;
        pushFloat32_4(group.positions, x1, y1, x2, y2);
    };

    // Every drawn segment goes through here: 3D segments for the visualizer, or
    // the top-down 2D projection (x, y) for the pendant.
    const emitSegment = (
        motion: string,
        isRapid: boolean,
        opacity: number,
        x1: number,
        y1: number,
        z1: number,
        x2: number,
        y2: number,
        z2: number,
    ): void => {
        if (svgOnly) {
            emitSvg2DSegment(motion, opacity, x1, y1, x2, y2);
            return;
        }
        segments.push(
            x1,
            y1,
            z1,
            x2,
            y2,
            z2,
            isRapid ? SEGMENT_ATTR_RAPID : paletteSlot,
        );
    };

    // Laser specific state variables
    let maxSpindleSpeed = 0;
    let spindleSpeed = 0;

    let progress = 0;
    let currentLines = 0;
    let totalLines = 0;
    // Lone CRs end a Sender line too; counted for sizing per-line arrays
    let loneCRs = 0;
    for (let i = 0; i < content.length; i++) {
        const ch = content.charCodeAt(i);
        if (ch === 10) {
            totalLines++;
        } else if (ch === 13 && content.charCodeAt(i + 1) !== 10) {
            loneCRs++;
        }
    }

    const updateSpindleState = (spindleSpeedUpdate: number | null) => {
        if (
            typeof spindleSpeedUpdate === 'number' &&
            Number.isFinite(spindleSpeedUpdate)
        ) {
            spindleSpeed = spindleSpeedUpdate;
            maxSpindleSpeed = Math.max(maxSpindleSpeed, spindleSpeedUpdate);
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

        toolchanges.push(segments.totalVertices);
        if (segments.totalVertices === lastToolchangeVertex) {
            return;
        }
        lastToolchangeVertex = segments.totalVertices;

        // The first tool keeps the theme's cutting color (no palette swap), acting
        // as palette index 0; the array proper starts at index 1 for the second
        // tool onward, matching ToolTimeline's getToolpathColor(count).
        const isFirstToolChange = toolChangeIndex === 0;
        toolChangeIndex++;
        if (isFirstToolChange) {
            return;
        }

        const paletteIndex = getComplementaryColour(tcCounter);
        tcCounter++;
        const nextColor = toolpathColors[paletteIndex] ?? toolpathColors[0];
        if (!nextColor) {
            return;
        }
        paletteSlot = 1 + paletteIndex;
        const rgb = asRgb(nextColor);
        motionColor.G1 = rgb;
        motionColor.G2 = rgb;
        motionColor.G3 = rgb;
    };

    // A-axis moves are drawn as a helix of <= 5 degree steps around the selected centerline.
    const addHelix = (
        motion: string,
        isRapid: boolean,
        opacity: number,
        v1: BasicPosition,
        v2: BasicPosition,
    ) => {
        // Use Math.max(1,...) — no artificial minimum; small-angle moves get 1 segment
        const segmentCount = Math.max(
            1,
            Math.ceil(Math.abs((v2.a || 0) - (v1.a || 0)) / 5),
        );

        // Reusable scalars — no per-iteration object allocation
        let prevX = 0,
            prevY = 0,
            prevZ = 0;
        for (let i = 0; i <= segmentCount; i++) {
            const t = i / segmentCount;
            const interpolatedA = (v1.a || 0) + ((v2.a || 0) - (v1.a || 0)) * t;

            // Interpolate position
            const interpolatedX = v1.x + (v2.x - v1.x) * t;
            const interpolatedY = v1.y + (v2.y - v1.y) * t;
            const interpolatedZ = applyRotaryRadiusOffset(
                v1.z + (v2.z - v1.z) * t,
            );

            // Inverse A rotation into the stock frame; restore the work Z datum.
            const angle = -interpolatedA * (Math.PI / 180);
            const sinA = Math.sin(angle);
            const cosA = Math.cos(angle);
            const currX =
                rotationAxis === 'y'
                    ? interpolatedX * cosA + interpolatedZ * sinA
                    : interpolatedX;
            const currY =
                rotationAxis === 'y'
                    ? interpolatedY
                    : interpolatedY * cosA - interpolatedZ * sinA;
            const currZ =
                (rotationAxis === 'y'
                    ? -interpolatedX * sinA + interpolatedZ * cosA
                    : interpolatedY * sinA + interpolatedZ * cosA) +
                rotaryCenterlineZ;

            if (i > 0) {
                emitSegment(
                    motion,
                    isRapid,
                    opacity,
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
    };

    const addLine = (modal: Modal, v1: BasicPosition, v2: BasicPosition) => {
        if (!needsVisualization) {
            return;
        }
        const { motion, tool } = modal;
        registerToolChange(tool);

        const isRapid = motion === 'G0';
        const opacity = isRapid ? rapidOpacity : 1;

        // Check if A-axis rotation is involved
        if (Math.abs((v2.a || 0) - (v1.a || 0)) > 0.001) {
            addHelix(motion, isRapid, opacity, v1, v2);
            return;
        }

        // No A-axis rotation, use simple linear interpolation
        const newV1 = rotateAxis(rotationAxis, {
            x: v1.x,
            y: v1.y,
            z: applyRotaryRadiusOffset(v1.z),
            a: v1.a || 0,
        });
        const newV2 = rotateAxis(rotationAxis, {
            x: v2.x,
            y: v2.y,
            z: applyRotaryRadiusOffset(v2.z),
            a: v2.a || 0,
        });
        emitSegment(
            motion,
            isRapid,
            opacity,
            newV1.x,
            newV1.y,
            newV1.z + rotaryCenterlineZ,
            newV2.x,
            newV2.y,
            newV2.z + rotaryCenterlineZ,
        );
    };

    // The parser routes G0/G1 containing A here, including fixed-A positioning.
    // Preserve rapid attributes, SVG output and the same interpolation as addLine.
    const addCurve = addLine;

    const addArcCurve = (
        modal: Modal,
        v1: BasicPosition,
        v2: BasicPosition,
        v0: BasicPosition,
    ) => {
        if (!needsVisualization) {
            return;
        }
        const { motion, plane, tool } = modal;
        registerToolChange(tool);

        const isClockwise = motion === 'G2';
        const radius = Math.sqrt((v1.x - v0.x) ** 2 + (v1.y - v0.y) ** 2);
        const startAngle = Math.atan2(v1.y - v0.y, v1.x - v0.x);
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
        const divisions = Math.max(
            4,
            Math.min(Math.ceil(arcLength / 0.75), 25),
        );
        const points = arcCurve.getPoints(divisions);
        const pointCount = Math.max(points.length - 1, 1);

        // Point i of the arc in 3D: XY-plane (x, y, z), ZX-plane (y, z, x),
        // YZ-plane (z, x, y). Its first two components are the top-down view.
        let prevA = 0,
            prevB = 0,
            prevC = 0;
        for (let i = 0; i < points.length; ++i) {
            const point = points[i];
            const z = ((v2.z - v1.z) / pointCount) * i + v1.z;

            let a: number, b: number, c: number;
            if (plane === 'G17') {
                a = point.x;
                b = point.y;
                c = z;
            } else if (plane === 'G18') {
                a = point.y;
                b = z;
                c = point.x;
            } else if (plane === 'G19') {
                a = z;
                b = point.x;
                c = point.y;
            } else {
                continue;
            }

            if (i > 0) {
                emitSegment(motion, false, 1, prevA, prevB, prevC, a, b, c);
            }
            prevA = a;
            prevB = b;
            prevC = c;
        }
    };

    let fileInfo = null;
    const vm = new GCodeVirtualizer({
        addLine,
        addArcCurve,
        addCurve,
        collate: true,
        estimator: new MotionPlanner(
            { ...estimatorConfig, laserMode: isLaser },
            estimateLineCount(content),
        ),
    });

    // Direct per-line hook rather than vm.on('data'): the EventEmitter polyfill
    // allocates an arguments array on every emit. Runs after each line with
    // tokens has been drawn.
    let lineStartVertex = 0;
    vm.onData = (spindleSpeedUpdate: number | null) => {
        if (profiler) {
            profiler.counts.vm_data_events =
                (profiler.counts.vm_data_events || 0) + 1;
        }

        if (usePower) {
            // A line's vertices take the spindle speed in effect after the line.
            updateSpindleState(spindleSpeedUpdate);
            const spindleIsOn =
                vm.modal.spindle === 'M3' || vm.modal.spindle === 'M4';
            segments.fillPower(lineStartVertex, spindleIsOn ? spindleSpeed : 0);
        }
        lineStartVertex = segments.totalVertices;

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

    // Per-line output is indexed by the server Sender's lines (the non-blank
    // lines of the file), which is what `received`/`currentLineRunning` count
    // and what the server indexes estimates by. Every CR, LF or CRLF ends a
    // line, matching the Sender's split and the estimator's beginLine calls.
    const maxSenderLines = totalLines + loneCRs + 1;
    const prefixEndVertex = new Uint32Array(svgOnly ? 0 : maxSenderLines);
    let senderLines = 0;
    let senderLineHasContent = false;

    const finishSenderLine = () => {
        if (senderLineHasContent && !svgOnly) {
            prefixEndVertex[senderLines] = segments.totalVertices;
        }
        if (senderLineHasContent) {
            senderLines++;
        }
        senderLineHasContent = false;
    };

    markProfile(profiler, 'before_parse_loop');
    let virtualizedLines = 0;
    const contentLength = content.length;
    let lineStart = 0;
    for (let i = 0; i < contentLength; i++) {
        const ch = content.charCodeAt(i);
        if (ch !== 10 && ch !== 13) {
            if (!senderLineHasContent && !isTrimWhitespace(ch)) {
                senderLineHasContent = true;
            }
            continue;
        }

        vm.virtualize(content.slice(lineStart, i));
        virtualizedLines++;

        if (
            ch === 13 &&
            i + 1 < contentLength &&
            content.charCodeAt(i + 1) === 10
        ) {
            i++;
        }
        finishSenderLine();
        lineStart = i + 1;
    }

    // Match split(/\r\n|\r|\n/) behavior by emitting the final line, including
    // a trailing empty line when the content ends with a newline.
    vm.virtualize(content.slice(lineStart, contentLength));
    virtualizedLines++;
    finishSenderLine();

    markProfile(profiler, 'after_parse_loop');
    sampleHeap(profiler, 'after_parse_loop');

    // One time (seconds) and LINE_KIND per Sender line, from the estimator
    const { lineTime, lineKind } = vm.getData();
    fileInfo = vm.generateFileStats();
    fileInfo.toolchanges = toolchanges;

    markProfile(profiler, 'before_typed_array_build');
    const chunks = segments.finish();
    const linePrefix = prefixEndVertex.slice(0, senderLines);
    markProfile(profiler, 'after_typed_array_build');
    sampleHeap(profiler, 'after_typed_array_build');

    if (profiler) {
        profiler.counts.virtualized_lines = virtualizedLines;
        profiler.counts.lines_with_data = currentLines;
        profiler.counts.sender_lines = senderLines;
        profiler.counts.segment_vertices = segments.totalVertices;
        profiler.counts.segment_chunks = chunks.length;
        profiler.counts.toolchanges_len = toolchanges.length;
        profiler.counts.svg2d_segments_kept = svg2DKept;
        profiler.counts.svg2d_dupe_drops = svg2DDupeDrops;
        profiler.counts.svg2d_degenerate_drops = svg2DDegenerateDrops;
        profiler.counts.estimates_len = lineTime.length;
        profiler.counts.invalid_lines_len = fileInfo.invalidLineCount ?? 0;
        profiler.counts.spindle_tool_event_count = Object.keys(
            fileInfo.spindleToolEvents || {},
        ).length;
    }

    const effectiveVisualizer = activeVisualizer ?? visualizer;

    const geometryMessage: {
        type: 'geometryReady';
        jobId: number;
        visualizer?: VISUALIZER_TYPES_T;
        format: 'segments-v1';
        rotary: { axis: 'X' | 'Y'; centerlineZ: number };
        chunks: {
            positions: ArrayBuffer;
            attrs: ArrayBuffer;
            power?: ArrayBuffer;
            vertexCount: number;
        }[];
        totalVertices: number;
        prefixEndVertex: ArrayBuffer;
        paletteHex: string[];
        isLaser: boolean;
        maxPower: number;
        info: any;
        needsVisualization: boolean;
        parsedData: {
            info: any;
            invalidLines: string[];
            invalidLineCount: number;
        };
        isSecondary?: boolean;
        activeVisualizer?: VISUALIZER_TYPES_T;
        svgSegmentGroups?: {
            hexColor: string;
            opacity: number;
            positionsBuffer: ArrayBuffer;
            positionsLen: number;
            stride?: 4 | 6;
        }[];
        svgMeta?: { minZ: number; maxZ: number };
    } = {
        type: 'geometryReady',
        jobId,
        visualizer: effectiveVisualizer,
        format: 'segments-v1',
        rotary: {
            axis: rotationAxis === 'y' ? 'Y' : 'X',
            centerlineZ: rotaryCenterlineZ,
        },
        chunks: chunks.map((chunk) => ({
            positions: chunk.positions.buffer as ArrayBuffer,
            attrs: chunk.attrs.buffer as ArrayBuffer,
            power: chunk.power?.buffer as ArrayBuffer | undefined,
            vertexCount: chunk.count,
        })),
        totalVertices: segments.totalVertices,
        prefixEndVertex: linePrefix.buffer,
        paletteHex,
        isLaser,
        maxPower: maxSpindleSpeed,
        info: fileInfo,
        needsVisualization,
        parsedData: {
            info: fileInfo,
            invalidLines: fileInfo.invalidLines || [],
            invalidLineCount: fileInfo.invalidLineCount ?? 0,
        },
        isSecondary,
        activeVisualizer: effectiveVisualizer,
    };

    const transferList: ArrayBuffer[] = [linePrefix.buffer];
    for (const chunk of geometryMessage.chunks) {
        transferList.push(chunk.positions, chunk.attrs);
        if (chunk.power) {
            transferList.push(chunk.power);
        }
    }

    if (svgOnly) {
        geometryMessage.svgSegmentGroups = Array.from(svg2DGroups.values()).map(
            (group) => {
                const positions = toCompactFloat32Array(
                    toUsedFloat32View(group.positions),
                );
                transferList.push(positions.buffer as ArrayBuffer);
                return {
                    hexColor: group.hexColor,
                    opacity: group.opacity,
                    positionsBuffer: positions.buffer as ArrayBuffer,
                    positionsLen: positions.length,
                    stride: 4 as const,
                };
            },
        );
        geometryMessage.svgMeta = {
            minZ: fileInfo.bbox?.min?.z ?? 0,
            maxZ: fileInfo.bbox?.max?.z ?? 0,
        };
    }

    // Per Sender line estimates, transferred rather than copied.
    const parsedDataToSend = {
        lineTime,
        lineKind,
        info: fileInfo,
        invalidLines: fileInfo.invalidLines,
    };
    const metadataTransfer: ArrayBuffer[] = [
        lineTime.buffer as ArrayBuffer,
        lineKind.buffer as ArrayBuffer,
    ];

    markProfile(profiler, 'before_post_message');
    if (profiler) {
        profiler.bytes.transfer_total_bytes = transferList.reduce(
            (acc, buffer) => acc + buffer.byteLength,
            0,
        );
        profiler.bytes.estimates_bytes =
            lineTime.byteLength + lineKind.byteLength;
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
                parseLoop: durationBetween(
                    'before_parse_loop',
                    'after_parse_loop',
                ),
                typedArrayBuild: durationBetween(
                    'before_typed_array_build',
                    'after_typed_array_build',
                ),
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
        postMessage(metadataMessage, metadataTransfer);
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
    postMessage(metadataMessage, metadataTransfer);
};
