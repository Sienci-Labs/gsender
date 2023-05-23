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
import Toolpath, { rotateAxis } from '../lib/GcodeToolpath';

onmessage = function({ data }) {
    const { content, visualizer, isLaser = false, shouldRenderSVG = false } = data;

    // Common state variables
    let vertices = [];
    const colors = [];
    const frames = [];

    // Laser specific state variables
    const spindleSpeeds = new Set();
    let spindleSpeed = 0;
    let spindleOn = false;
    let spindleChanges = [];

    // SVG specific state variables
    let SVGVertices = [];
    let paths = [];
    let currentMotion = '';
    let progress = 0;
    let currentLines = 0;
    let totalLines = (content.match(/\n/g) || []).length;

    /**
     * Updates local state with any spindle changes in line
     * @param words
     */
    const updateSpindleStateFromLine = ({ words }) => {
        const spindleMatches = words.filter((word) => word[0] === 'S');
        const [spindleCommand, spindleValue] = spindleMatches[0] || [];
        if (spindleCommand) {
            spindleSpeeds.add(spindleValue);
            spindleSpeed = spindleValue;
            spindleOn = spindleValue > 0;
        }
    };

    // create path for the vertices of the last motion
    const createPath = (motion) => {
        let verticesStr = 'M';
        for (let i = 0; i < SVGVertices.length; i++) {
            verticesStr += SVGVertices[i].x1 + ',' + SVGVertices[i].y1 + ',' + SVGVertices[i].x2 + ',' + SVGVertices[i].y2 + ',';
        }
        paths.push({
            motion: motion,
            path: verticesStr,
            strokeWidth: 10,
            fill: 'none'
        });
    };

    // Split handlers for regular, laser, and SVG visualization
    // Each handle Line and Arc Curves differently
    const handlers = {
        normal: {
            // @param {object} modal The modal object.
            // @param {object} v1 A 3D vector of the start point.
            // @param {object} v2 A 3D vector of the end point.
            addLine: (modal, v1, v2) => {
                const { motion } = modal;

                const newV1 = rotateAxis('y', v1);
                v1.y = newV1.y;
                v1.z = newV1.z;

                const newV2 = rotateAxis('y', v2);
                v2.y = newV2.y;
                v2.z = newV2.z;

                const opacity = (motion === 'G0') ? 0.5 : 1;
                const color = [motion, opacity];
                colors.push(color, color);
                vertices.push(
                    v1.x, v1.y, v1.z,
                    v2.x, v2.y, v2.z
                );
            },
            addCurve: (modal, v1, v2) => {
                const { motion } = modal;

                const updatedV1 = rotateAxis('y', v1);
                const updatedV2 = rotateAxis('y', v2);

                const radius = v2.z;
                let startAngle = Math.atan2(updatedV1.z, updatedV1.y);
                let endAngle = Math.atan2(updatedV2.z, updatedV2.y);
                const isClockwise = v2.a > v1.a;

                const arcCurve = new THREE.ArcCurve(
                    0,
                    0,
                    radius,
                    startAngle,
                    endAngle,
                    isClockwise
                );

                const DEGREES_PER_LINE_SEGMENT = 5;

                const angleDiff = Math.abs(v2.a - v1.a);
                const divisions = Math.ceil(angleDiff / DEGREES_PER_LINE_SEGMENT);
                const points = arcCurve.getPoints(divisions);
                const color = [motion, 1];

                for (let i = 0; i < points.length; ++i) {
                    const point = points[i];
                    vertices.push(v2.x, point.x, point.y);
                    colors.push(color);
                }
            },
            // @param {object} modal The modal object.
            // @param {object} v1 A 3D vector of the start point.
            // @param {object} v2 A 3D vector of the end point.
            // @param {object} v0 A 3D vector of the fixed point.
            addArcCurve: (modal, v1, v2, v0) => {
                const { motion, plane } = modal;
                const isClockwise = (motion === 'G2');
                const radius = Math.sqrt(
                    ((v1.x - v0.x) ** 2) + ((v1.y - v0.y) ** 2)
                );
                let startAngle = Math.atan2(v1.y - v0.y, v1.x - v0.x);
                let endAngle = Math.atan2(v2.y - v0.y, v2.x - v0.x);

                // Draw full circle if startAngle and endAngle are both zero
                if (startAngle === endAngle) {
                    endAngle += (2 * Math.PI);
                }

                const arcCurve = new THREE.ArcCurve(
                    v0.x, // aX
                    v0.y, // aY
                    radius, // aRadius
                    startAngle, // aStartAngle
                    endAngle, // aEndAngle
                    isClockwise // isClockwise
                );
                const divisions = 30;
                const points = arcCurve.getPoints(divisions);

                const color = [motion, 1];
                for (let i = 0; i < points.length; ++i) {
                    const point = points[i];
                    const z = ((v2.z - v1.z) / points.length) * i + v1.z;

                    if (plane === 'G17') { // XY-plane
                        vertices.push(point.x, point.y, z);
                    } else if (plane === 'G18') { // ZX-plane
                        vertices.push(point.y, z, point.x);
                    } else if (plane === 'G19') { // YZ-plane
                        vertices.push(z, point.x, point.y);
                    }
                    colors.push(color);
                }
            }
        },
        laser: {
            addLine: (modal, v1, v2) => {
                const { addLine: dAddLine } = handlers.normal;
                dAddLine(modal, v1, v2);
            },
            addArcCurve: (modal, v1, v2, v0) => {
                const { addArcCurve: dAddArcCurve } = handlers.normal;
                dAddArcCurve(modal, v1, v2, v0);
            }
        },
        svg: {
            addLine: (modal, v1, v2, v0) => {
                const { motion } = modal;
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
                    x1: v1.x,
                    y1: v1.y,
                    x2: v2.x,
                    y2: v2.y
                });
            },
            addArcCurve: (modal, v1, v2, v0) => {
                const { motion, plane } = modal;
                const isClockwise = (motion === 'G2');
                const radius = Math.sqrt(
                    ((v1.x - v0.x) ** 2) + ((v1.y - v0.y) ** 2)
                );
                let startAngle = Math.atan2(v1.y - v0.y, v1.x - v0.x);
                let endAngle = Math.atan2(v2.y - v0.y, v2.x - v0.x);

                // Draw full circle if startAngle and endAngle are both zero
                if (startAngle === endAngle) {
                    endAngle += (2 * Math.PI);
                }

                const arcCurve = new THREE.ArcCurve(
                    v0.x, // aX
                    v0.y, // aY
                    radius, // aRadius
                    startAngle, // aStartAngle
                    endAngle, // aEndAngle
                    isClockwise // isClockwise
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

                    if (plane === 'G17') { // XY-plane
                        SVGVertices.push({
                            x1: pointA.x,
                            y1: pointA.y,
                            x2: pointB.x,
                            y2: pointB.y
                        });
                    } else if (plane === 'G18') { // ZX-plane
                        SVGVertices.push({
                            x1: pointA.y,
                            y1: z,
                            x2: pointB.y,
                            y2: z
                        });
                    } else if (plane === 'G19') { // YZ-plane
                        SVGVertices.push({
                            x1: z,
                            y1: pointA.x,
                            x2: z,
                            y2: pointB.x
                        });
                    }
                }
            }
        }
    };

    // Determine which handler to use - normal by default, SVG if selected, then laser if selected
    let handlerKey = 'normal';
    if (shouldRenderSVG) {
        handlerKey = 'svg';
    } else if (isLaser) {
        handlerKey = 'laser';
    }

    const { addLine, addCurve, addArcCurve } = handlers[handlerKey];

    const toolpath = new Toolpath({
        addLine,
        addCurve,
        addArcCurve
    });
    const start = Date.now();

    toolpath
        .loadFromString(content, (err, data) => {
            if (err) {
                console.error(err);
            }
        })
        .on('data', (data) => {
            const vertexIndex = vertices.length / 3;
            frames.push(vertexIndex);

            let spindleValues = {};
            if (isLaser) {
                updateSpindleStateFromLine(data);
                spindleValues = {
                    spindleOn,
                    spindleSpeed
                };

                spindleChanges.push(spindleValues); //TODO:  Make this work for laser mode
            }

            currentLines++;
            const newProgress = Math.floor(currentLines / totalLines * 100);
            if (newProgress !== progress) {
                progress = newProgress;
                postMessage(progress);
            }
        })
        .on('end', () => {
            console.log(`Duration: ${Date.now() - start} ms`);
            let tFrames = new Uint32Array(frames);
            let tVertices = new Float32Array(vertices);

            const message = {
                vertices: tVertices,
                colors,
                frames: tFrames,
                visualizer,
            };

            // create path for the last motion
            if (shouldRenderSVG) {
                createPath(currentMotion);
                paths = JSON.parse(JSON.stringify(paths));
                message.paths = paths;
            }

            if (isLaser) {
                message.spindleSpeeds = spindleSpeeds;
                message.isLaser = isLaser;
                message.spindleChanges = spindleChanges;
            }

            postMessage(message);
        });
};
