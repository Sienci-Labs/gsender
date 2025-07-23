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

import { ArcCurve, Vector3 } from 'three';

import GCodeVirtualizer, { rotateAxis } from 'app/lib/GCodeVirtualizer';

interface WorkerData {
    content: string;
    visualizer: any;
    isLaser?: boolean;
    shouldIncludeSVG?: boolean;
    needsVisualization?: boolean;
    parsedData?: any;
    isNewFile?: boolean;
    accelerations?: any;
    maxFeedrates?: any;
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
}

interface SpindleValues {
    spindleOn: boolean;
    spindleSpeed: number;
}

self.onmessage = function ({ data }: { data: WorkerData }) {
    const {
        content,
        visualizer,
        isLaser = false,
        shouldIncludeSVG = false,
        needsVisualization = true,
        parsedData = {},
        isNewFile = false,
        accelerations,
        maxFeedrates,
    } = data;

    // Common state variables
    let vertices: number[] = [];
    const colors: [string, number][] = [];
    const frames: number[] = [];

    // Laser specific state variables
    const spindleSpeeds = new Set<number>();
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
            spindleSpeeds.add(Number(spindleValue));
            spindleSpeed = Number(spindleValue);
            spindleOn = Number(spindleValue) > 0;
        }
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
            addLine: (modal: Modal, v1: Vector3, v2: Vector3) => {
                if (needsVisualization) {
                    const { motion, units } = modal;

                    const newV1 = rotateAxis('y', v1);
                    v1.y = newV1.y;
                    v1.z = newV1.z;

                    const newV2 = rotateAxis('y', v2);
                    v2.y = newV2.y;
                    v2.z = newV2.z;

                    // normal
                    const opacity = motion === 'G0' ? 0.5 : 1;
                    const color: [string, number] = [motion, opacity];
                    colors.push(color, color);
                    vertices.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);

                    // svg
                    if (shouldIncludeSVG) {
                        const multiplier = units === 'G21' ? 1 : 25.4 // We need to make path bigger for inches
                        svgInitialization(motion);
                        SVGVertices.push({
                            x1: v1.x * multiplier,
                            y1: v1.y * multiplier,
                            x2: v2.x * multiplier,
                            y2: v2.y * multiplier,
                        });
                    }
                }
            },
            // For rotary visualization
            addCurve: (modal: Modal, v1: Vector3, v2: Vector3) => {
                const { motion, units } = modal;

                const updatedV1 = rotateAxis('y', v1);
                const updatedV2 = rotateAxis('y', v2);

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
            },
            addArcCurve: (
                modal: Modal,
                v1: Vector3,
                v2: Vector3,
                v0: Vector3,
            ) => {
                if (needsVisualization) {
                    const { motion, plane, units} = modal;
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
            addLine: (modal: Modal, v1: Vector3, v2: Vector3) => {
                const { addLine: dAddLine } = handlers.normal;
                dAddLine(modal, v1, v2);
            },
            addArcCurve: (
                modal: Modal,
                v1: Vector3,
                v2: Vector3,
                v0: Vector3,
            ) => {
                const { addArcCurve: dAddArcCurve } = handlers.normal;
                dAddArcCurve(modal, v1, v2, v0);
            },
        },
        svg: {
            addLine: (modal: Modal, v1: Vector3, v2: Vector3) => {
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
                v1: Vector3,
                v2: Vector3,
                v0: Vector3,
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
    console.log(vm.vmState);
    parsedDataToSend = {
        data: [],
        estimates: estimates,
        info: fileInfo,
        modalChanges: [],
        feedrateChanges: [],
    };

    let tFrames = new Uint32Array(frames);
    let tVertices = new Float32Array(vertices);

    // create path for the last motion
    if (shouldIncludeSVG) {
        createPath(currentMotion);
    }
    paths = JSON.parse(JSON.stringify(paths));

    const message: {
        vertices: Float32Array;
        paths: Path[];
        colors: [string, number][];
        frames: Uint32Array;
        visualizer: any;
        info: any;
        needsVisualization: boolean;
        parsedData: any;
        spindleSpeeds?: Set<number>;
        spindleChanges?: SpindleValues[];
        isLaser?: boolean;
    } = {
        vertices: tVertices,
        paths,
        colors,
        frames: tFrames,
        visualizer,
        info: fileInfo,
        needsVisualization,
        parsedData: parsedDataToSend,
    };

    if (isLaser) {
        message.spindleSpeeds = spindleSpeeds;
        message.isLaser = isLaser;
        message.spindleChanges = spindleChanges;
    }

    self.postMessage(message);
};
