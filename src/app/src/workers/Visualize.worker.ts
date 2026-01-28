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

import { ArcCurve } from 'three';

import GCodeVirtualizer, { rotateAxis } from 'app/lib/GCodeVirtualizer';
import { BasicPosition } from 'app/definitions/general';
import { VISUALIZER_TYPES_T } from 'app/features/Visualizer/definitions';

interface WorkerData {
    content: string;
    isLaser?: boolean;
    shouldIncludeSVG?: boolean;
    needsVisualization?: boolean;
    accelerations?: any;
    maxFeedrates?: any;
    atcEnabled?: boolean;
    isSecondary: boolean;
    activeVisualizer: VISUALIZER_TYPES_T;
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

interface SpindleValues {
    spindleOn: boolean;
    spindleSpeed: number;
}

type RotaryMetadata = {
    radius: number | null;
    hasYAxisMoves: boolean;
};

const parseGcodeComments = (line: string): string =>
    line.replace(/\([^\)]*\)/g, '').replace(/;.*$/, '');

const parseRotaryMetadata = (raw: string): RotaryMetadata => {
    const diameterMatch = raw.match(/Cylinder\s*Dia\s*:\s*([0-9.+-]+)/i);
    const diameter = diameterMatch ? Number(diameterMatch[1]) : Number.NaN;
    const radius =
        Number.isFinite(diameter) && diameter > 0 ? diameter / 2 : null;

    const hasYAxisMoves = raw
        .split(/\r?\n/)
        .some((line) =>
            /(^|[^A-Z])Y[-+]?\d*\.?\d+/i.test(parseGcodeComments(line)),
        );

    return { radius, hasYAxisMoves };
};

self.onmessage = function ({ data }: { data: WorkerData }) {
    const {
        content,
        isLaser = false,
        shouldIncludeSVG = false,
        needsVisualization = true,
        // parsedData = {},
        // isNewFile = false,
        accelerations,
        maxFeedrates,
        atcEnabled,
        isSecondary,
        activeVisualizer,
    } = data;

    const { radius: rotaryRadius, hasYAxisMoves } = parseRotaryMetadata(content);
    const shouldOffsetRotaryRadius = rotaryRadius !== null && !hasYAxisMoves;
    const applyRotaryRadiusOffset = (value: number): number =>
        shouldOffsetRotaryRadius ? value + (rotaryRadius as number) : value;

    // Common state variables
    let vertices: number[] = [];
    const colors: [string, number][] = [];
    const frames: number[] = [];
    let currentTool = 0;
    const toolchanges: number[] = [];

    // Laser specific state variables
    const spindleSpeeds: number[] = [];
    let spindleSpeed = 0;
    let spindleOn = false;
    let spindleChanges: SpindleValues[] = [];

    // SVG specific state variables
    let SVGVertices: SVGVertex[] = [];
    let paths: Path[] = [];
    let currentMotion = '';
    let progress = 0;
    let currentLines = 0;
    let totalLines = (content.match(/\n/g) || []).length;

    /**
     * Updates local state with any spindle changes in line
     * @param words
     */
    const updateSpindleStateFromLine = ({ words }: { words: string[][] }) => {
        const spindleMatches = words.filter((word) => word[0] === 'S');
        const [spindleCommand, spindleValue] = spindleMatches[0] || [];
        if (spindleCommand) {
            spindleSpeeds.push(Number(spindleValue));
            spindleSpeed = Number(spindleValue);
            spindleOn = Number(spindleValue) > 0;
        }
    };

    const isNewTool = (t: number) => {
        if (currentTool !== t) {
            currentTool = t;
            return true;
        }
        return false;
    };

    // create path for the vertices of the last motion
    const createPath = (motion: string) => {
        let verticesStr = 'M';
        for (let i = 0; i < SVGVertices.length; i++) {
            verticesStr +=
                SVGVertices[i].x1 +
                ',' +
                SVGVertices[i].y1 +
                ',' +
                SVGVertices[i].x2 +
                ',' +
                SVGVertices[i].y2 +
                ',';
        }
        paths.push({
            motion: motion,
            path: verticesStr,
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
        frames.push(vertexIndex);

        currentLines++;
        const newProgress = Math.floor((currentLines / totalLines) * 100);
        if (newProgress !== progress) {
            progress = newProgress;
            postMessage(progress);
        }
    };

    // Split handlers for regular, laser, and SVG visualization
    // Each handle Line and Arc Curves differently
    const handlers = {
        normal: {
            addLine: (modal: Modal, v1: BasicPosition, v2: BasicPosition) => {
                if (needsVisualization) {
                    const { motion, units, tool } = modal;

                    if (isNewTool(tool)) {
                        toolchanges.push(colors.length);
                    }

                    // Check if A-axis rotation is involved
                    const hasARotation =
                        Math.abs((v2.a || 0) - (v1.a || 0)) > 0.001;

                    if (hasARotation) {
                        // Create helical motion with intermediate points
                        const segments = Math.max(
                            8,
                            Math.ceil(Math.abs((v2.a || 0) - (v1.a || 0)) / 5),
                        ); // At least 8 segments, or one per 5 degrees
                        const opacity = motion === 'G0' ? 0.5 : 1;
                        const color: [string, number] = [motion, opacity];

                        let previousRotated: any = null;
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

                            // Apply A-axis rotation around X-axis
                            const rotated = rotateAxis('x', {
                                x: interpolatedX,
                                y: interpolatedY,
                                z: interpolatedZ,
                                a: interpolatedA,
                            });

                            if (i > 0) {
                                // Add line segment from previous point to current point
                                colors.push(color, color);
                                vertices.push(
                                    previousRotated.x,
                                    previousRotated.y,
                                    previousRotated.z,
                                    rotated.x,
                                    rotated.y,
                                    rotated.z,
                                );

                                // SVG
                                if (shouldIncludeSVG) {
                                    const multiplier =
                                        units === 'G21' ? 1 : 25.4;
                                    svgInitialization(motion);
                                    SVGVertices.push({
                                        x1: previousRotated.x * multiplier,
                                        y1: previousRotated.y * multiplier,
                                        x2: rotated.x * multiplier,
                                        y2: rotated.y * multiplier,
                                    });
                                }
                            }

                            // Store current point for next iteration
                            previousRotated = rotated;
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
                        const color: [string, number] = [motion, opacity];
                        colors.push(color, color);
                        vertices.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);

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
                if (isNewTool(tool)) {
                    toolchanges.push(colors.length);
                }
                // Check if A-axis rotation is involved
                const hasARotation =
                    Math.abs((v2.a || 0) - (v1.a || 0)) > 0.001;

                if (hasARotation) {
                    // Create helical curve with A-axis rotation
                    const segments = Math.max(
                        8,
                        Math.ceil(Math.abs((v2.a || 0) - (v1.a || 0)) / 5),
                    );
                    const color: [string, number] = [motion, 1];

                    let previousRotated: any = null;
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

                        // Apply A-axis rotation around X-axis
                        const rotated = rotateAxis('x', {
                            x: interpolatedX,
                            y: interpolatedY,
                            z: interpolatedZ,
                            a: interpolatedA,
                        });

                        if (i > 0) {
                            // Add line segment from previous point to current point
                            colors.push(color, color);
                            vertices.push(
                                previousRotated.x,
                                previousRotated.y,
                                previousRotated.z,
                                rotated.x,
                                rotated.y,
                                rotated.z,
                            );
                        }

                        previousRotated = rotated;
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
                    const color: [string, number] = [motion, 1];

                    for (let i = 0; i < points.length; ++i) {
                        const point = points[i];
                        vertices.push(v2.x, point.x, point.y);
                        colors.push(color);
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
                    if (isNewTool(tool)) {
                        toolchanges.push(colors.length);
                    }

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

                    const color: [string, number] = [motion, 1];

                    // svg
                    if (shouldIncludeSVG) {
                        svgInitialization(motion);
                    }

                    for (let i = 0; i < points.length; ++i) {
                        const point = points[i];
                        const pointA = points[i - 1];
                        const pointB = points[i];
                        const z = ((v2.z - v1.z) / points.length) * i + v1.z;

                        if (plane === 'G17') {
                            // XY-plane
                            vertices.push(point.x, point.y, z);
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
                            vertices.push(point.y, z, point.x);
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
                            vertices.push(z, point.x, point.y);
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
                        colors.push(color);
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
                    const z = ((v2.z - v1.z) / points.length) * i + v1.z;

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
        let spindleValues = {
            spindleOn: false,
            spindleSpeed: 0,
        };
        if (isLaser && needsVisualization) {
            updateSpindleStateFromLine(data);
            spindleValues = {
                spindleOn,
                spindleSpeed,
            };

            spindleChanges.push(spindleValues); //TODO:  Make this work for laser mode
        }
        onData();
    });

    const lines = content.split(/\r?\n/).reverse();

    while (lines.length) {
        let line = lines.pop();
        vm.virtualize(line);
    }

    const { estimates } = vm.getData();
    //const modalChanges = vm.getModalChanges();
    //const feedrateChanges = vm.getFeedrateChanges();
    fileInfo = vm.generateFileStats();
    fileInfo.toolchanges = toolchanges;

    parsedDataToSend = {
        estimates: estimates,
        info: fileInfo,
        modalChanges: [],
        feedrateChanges: [],
        invalidLines: fileInfo.invalidLines,
    };

    let tFrames = new Uint32Array(frames);
    let tVertices = new Float32Array(vertices);
    let tSpindleSpeeds = new Float32Array(spindleSpeeds);

    // create path for the last motion
    if (shouldIncludeSVG) {
        createPath(currentMotion);
    }
    paths = JSON.parse(JSON.stringify(paths));

    const message: {
        vertices: ArrayBuffer;
        paths: Path[];
        colors: [string, number][];
        frames: ArrayBuffer;
        info: any;
        needsVisualization: boolean;
        parsedData: any;
        spindleSpeeds?: ArrayBuffer;
        spindleChanges?: SpindleValues[];
        isLaser?: boolean;
        isSecondary: boolean;
        activeVisualizer: VISUALIZER_TYPES_T;
    } = {
        vertices: tVertices.buffer,
        paths,
        colors,
        frames: tFrames.buffer,
        info: fileInfo,
        needsVisualization,
        parsedData: parsedDataToSend,
        isSecondary,
        activeVisualizer,
    };

    if (isLaser) {
        message.spindleSpeeds = tSpindleSpeeds.buffer;
        message.isLaser = isLaser;
        message.spindleChanges = spindleChanges;
    }

    postMessage(message, [
        tVertices.buffer,
        tFrames.buffer,
        tSpindleSpeeds.buffer,
    ]);
};
