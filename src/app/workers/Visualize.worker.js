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

import Toolpath from 'gcode-toolpath';
import * as THREE from 'three';

onmessage = function({ data }) {
    const { content, visualizer, isLaser = false, shouldRenderSVG = false } = data;
    let vertices = [];
    let SVGVertices = [];
    let spindleChanges = [];
    let paths = [];
    let currentMotion = '';
    const colors = [];
    const frames = [];
    // Laser mode variables
    const spindleSpeeds = new Set();
    let spindleSpeed = 0;
    let spindleOn = false;

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

    const toolpath = new Toolpath({
        // @param {object} modal The modal object.
        // @param {object} v1 A 3D vector of the start point.
        // @param {object} v2 A 3D vector of the end point.
        addLine: (modal, v1, v2) => {
            const { motion } = modal;

            if (!shouldRenderSVG) {
                const opacity = (motion === 'G0') ? 0.1 : 1;
                const color = [motion, opacity];
                colors.push(color, color);
                vertices.push(
                    v1.x, v1.y, v1.z,
                    v2.x, v2.y, v2.z
                );
            } else {
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

            if (!shouldRenderSVG) {
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
            } else {
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
    });


    toolpath.loadFromStringSync(content, (line, index) => {
        let spindleValues = {};
        if (isLaser) {
            updateSpindleStateFromLine(line);
            //console.log(`Spindle: ${spindleOn} - ${line.line}`);
            spindleValues = {
                spindleOn,
                spindleSpeed
            };
        }
        frames.push(vertices.length / 3);
        spindleChanges.push(spindleValues); //TODO:  Make this work for laser mode
    });

    let tFrames = new Uint32Array(frames);
    let tVertices = new Float32Array(vertices);

    // create path for the last motion
    createPath(currentMotion);
    paths = JSON.parse(JSON.stringify(paths));
    postMessage({
        vertices: tVertices,
        colors,
        frames: tFrames,
        visualizer,
        spindleSpeeds,
        isLaser,
        paths
    });
};
