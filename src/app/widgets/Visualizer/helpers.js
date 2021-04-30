/*
 *     This file is part of gSender.
 *
 *     gSender is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     gSender is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 */

import * as THREE from 'three';
import STLLoader from 'app/lib/three/STLLoader';

const getBoundingBox = (object) => {
    const box = new THREE.Box3().setFromObject(object);
    const boundingBox = {
        min: {
            x: box.min.x === Infinity ? 0 : box.min.x,
            y: box.min.y === Infinity ? 0 : box.min.y,
            z: box.min.z === Infinity ? 0 : box.min.z
        },
        max: {
            x: box.max.x === -Infinity ? 0 : box.max.x,
            y: box.max.y === -Infinity ? 0 : box.max.y,
            z: box.max.z === -Infinity ? 0 : box.max.z
        }
    };

    return boundingBox;
};

const loadSTL = (url) => new Promise(resolve => {
    new STLLoader().load(url, resolve);
});

const loadTexture = (url) => new Promise(resolve => {
    new THREE.TextureLoader().load(url, resolve);
});

const calculateJobTime = ({ lines, currentPos, options: { maxFeed = 1000 } }) => {
    // if (lines.length === 0) {
    //     return 0;
    // }

    // let count = 0;
    // for (const line of lines) {
    //     if (line.includes('G0') || line.includes('G1')) {
    //         count += 1;
    //     }
    // }

    // return count;

    const machineState = {
        incremental: false,
        units: 'mm',
        inverseFeed: false,
    };

    let from = currentPos;
    let time = 0;
    const acceleration = [30, 30, 15];
    let lastMoveAxisFeeds = [0, 0, 0];


    /**
     * https://github.com/CrispyConductor/tightcnc
     */
    const calculateJobTimeHelper = ({
        from,
        to,
        feedrate = null,
        travel = null,
        incremental = false,
        options
    }) => {
        try {
            if (incremental) {
                for (let axisNum = 0; axisNum < this.vmState.pos.length; axisNum++) {
                    to[axisNum] = (to[axisNum] || 0) + from[axisNum];
                }
            }

            if (!travel) {
                let travelSq = 0;
                for (let axisNum = 0; axisNum < from.length; axisNum++) {
                    if (to[axisNum] === null || to[axisNum] === undefined) {
                        to[axisNum] = from[axisNum];
                    }

                    travelSq += Math.pow((to[axisNum] || 0) - (from[axisNum] || 0), 2);
                }
                travel = Math.sqrt(travelSq);
            }

            let moveTime = 0;

            if (options.inverseFeed && feedrate) {
                // Handle time calc if inverse feed
                // Calculate the minimum amount of time this move would take so we can compare it to the requested time
                let minTime = 0;
                for (let axisNum = 0; axisNum < to.length && axisNum < from.length; axisNum++) {
                    let axisTravel = Math.abs(from[axisNum] - to[axisNum]);
                    let axisFeed = Array.isArray(options.maxFeed) ? options.maxFeed[axisNum] : options.maxFeed;
                    let travelTime = axisTravel / (axisFeed || 1000) * 60;
                    if (travelTime > minTime) {
                        minTime = travelTime;
                    }
                }

                // Calculate move time
                let movementTime = 60 / feedrate;
                if (movementTime < minTime) {
                    moveTime = minTime;
                }
            } else {
                //moveTime = (travel / feed) * 60; // <-- naive (infinite acceleration) move time calculation
                // NOTE: The below code to account for acceleration could certainly be improved; but to large extent, it's
                // actually controller-specific.  The accuracy of these time estimates will vary.
                // Approximate move time (making a few not necessarily true assumptions) is calculated by
                // starting with the move's time if it were operating at the full feed rate the whole time (infinite acceleration),
                // then deducting the extra time it would have taken to change from the previous move's feed to this move's feed.
                // This is calculated on a per-axis basis, taking the per-axis components of the feed rate.
                // calculate linear distance travelled (this, and other parts of this method, will need to be adjusted for nonlinear moves)
                let linearDist = 0;
                for (let axisNum = 0; axisNum < to.length; axisNum++) {
                    let d = to[axisNum] - from[axisNum];
                    linearDist += d * d;
                }
                linearDist = Math.sqrt(linearDist);
                // Determine the axis that will require the most amount of time to change velocity
                let maxAccelTime = 0; // minutes
                let axisAccelTimes = [];
                let accelMin = null;
                for (let axisNum = 0; axisNum < to.length; axisNum++) {
                    let accel = Array.isArray(options.acceleration) ? options.acceleration[axisNum] : options.acceleration;
                    if (accelMin === null || accel < accelMin) {
                        accelMin = accel;
                    }
                    let diff = to[axisNum] - from[axisNum];
                    // calculate feed component for this axis (may be negative to indicate negative direction)
                    let axisFeed;
                    if (!feedrate) { // G0
                        axisFeed = Array.isArray(options.maxFeed) ? options.maxFeed[axisNum] : options.maxFeed;
                    } else {
                        axisFeed = diff / linearDist * feedrate; // in units/min
                    }
                    // Get and update the last move's axis feed rate
                    let lastMoveAxisFeed = lastMoveAxisFeeds[axisNum];
                    lastMoveAxisFeeds[axisNum] = axisFeed;

                    // console.log(axisFeed, lastMoveAxisFeed);
                    // calculate amount of time it would take to accelerate between the feeds
                    let accelTime = Math.abs(axisFeed - lastMoveAxisFeed) / accel; // min
                    if (accelTime > maxAccelTime) {
                        maxAccelTime = accelTime;
                    }
                    axisAccelTimes[axisNum] = accelTime;
                }
                // Determine the distance travelled for that acceleration time
                let accelDist = Math.abs((1 / 2) * accelMin * (maxAccelTime * maxAccelTime));
                if (accelDist > travel) {
                    accelDist = travel;
                }
                // Calcualate the base move time (time when travelling over move at max feed, minus the distances for acceleration)
                if (!feedrate) { // G0
                    moveTime = 0;
                    for (let axisNum = 0; axisNum < to.length && axisNum < from.length; axisNum++) {
                        let accel = Array.isArray(options.acceleration) ? options.acceleration[axisNum] : options.acceleration;
                        let axisAccelTime = axisAccelTimes[axisNum];
                        let axisAccelDist = Math.abs((1 / 2) * accel * (axisAccelTime * axisAccelTime));
                        let axisTravel = Math.abs(to[axisNum] - from[axisNum]);
                        if (axisAccelDist > axisTravel) {
                            axisAccelDist = axisTravel;
                        }
                        axisTravel -= axisAccelDist;
                        let axisFeed = Array.isArray(options.maxFeed) ? options.maxFeed[axisNum] : options.maxFeed;
                        let travelTime = axisTravel / (axisFeed || 1000); // minutes
                        travelTime += axisAccelTime;
                        // console.log(axisAccelTime, travelTime);
                        if (travelTime > moveTime) {
                            moveTime = travelTime;
                        }
                    }
                } else {
                    moveTime = (travel - accelDist) / feedrate; // minutes
                    // Add time to accelerate
                    moveTime += maxAccelTime;
                }
                // convert to seconds
                moveTime *= 60;
            }

            if (options.minMoveTime && moveTime < options.minMoveTime) {
                moveTime = options.minMoveTime;
            }

            return moveTime;
        } catch (error) {
            return 0;
        }
    };

    for (const line of lines) {
        let to = [];
        let feedrate;
        const lineItems = line.split(' ');

        for (const item of lineItems) {
            if (item[0] === 'X') {
                const val = Number(item.slice(1));
                to[0] = val;
            }

            if (item[0] === 'Y') {
                const val = Number(item.slice(1));
                to[1] = val;
            }

            if (item[0] === 'Z') {
                const val = Number(item.slice(1));
                to[2] = val;
            }

            if (item[0] === 'F') {
                feedrate = Number(item.slice(1));
            }
        }

        if (line.includes('G20')) {
            machineState.units = 'in';
        }

        if (line.includes('G21')) {
            machineState.units = 'mm';
        }

        if (line.includes('G93')) {
            machineState.inverseFeed = true;
        }

        if (line.includes('G94')) {
            machineState.inverseFeed = false;
        }

        if (line.includes('G0') || line.includes('G1')) {
            time += calculateJobTimeHelper({
                from,
                to,
                feedrate,
                lastMoveAxisFeeds,
                options: {
                    maxFeed,
                    acceleration,
                    inverseFeed: machineState.inverseFeed,
                    minMoveTime: 1,
                }
            });
        }
        from = to;
    }

    return time;
};

export {
    getBoundingBox,
    loadSTL,
    loadTexture,
    calculateJobTime
};
