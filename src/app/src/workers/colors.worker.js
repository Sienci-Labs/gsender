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
import {
    BACKGROUND_PART,
    CUTTING_PART,
    G0_PART,
    G1_PART,
    G2_PART,
    G3_PART,
    LASER_PART,
} from 'app/features/Visualizer/constants';

onmessage = function ({ data }) {
    const {
        colors,
        frames,
        spindleSpeeds,
        isLaser = false,
        spindleChanges,
        theme,
    } = data;
    let savedColors = [];

    const updateLaserModeColors = () => {
        const defaultColor = new THREE.Color(theme.get(LASER_PART));
        const fillColor = new THREE.Color(theme.get(BACKGROUND_PART));
        const maxSpindleValue = Math.max(...[...spindleSpeeds]);

        const calculateOpacity = (speed) =>
            maxSpindleValue === 0 ? 1 : speed / maxSpindleValue;

        for (let i = 0; i < frames.length; i++) {
            const { spindleOn, spindleSpeed } = spindleChanges[i];
            const offsetIndex = frames[i] * 4;
            if (spindleOn) {
                let opacity = calculateOpacity(spindleSpeed);
                const color = [...defaultColor.toArray(), opacity];
                savedColors.splice(offsetIndex, 8, ...color, ...color);
            } else {
                const color = [...fillColor.toArray(), 0.05];
                savedColors.splice(offsetIndex, 8, ...color, ...color);
            }
        }
    };

    /* Turns our array of Three colors into a float typed array we can set as a bufferAttribute */
    const getColorTypedArray = (colors, motionColor) => {
        const colorArray = [];
        colors.forEach((colorTag) => {
            const [motion, opacity] = colorTag;
            const color = motionColor[motion] || motionColor.default;
            colorArray.push(...color.toArray(), opacity);
        });
        savedColors = colorArray;

        if (isLaser && spindleSpeeds.size > 0) {
            updateLaserModeColors();
        }

        return new Float32Array(colorArray);
    };

    const defaultColor = new THREE.Color(theme.get(CUTTING_PART));
    // Get line colors for current theme
    const motionColor = {
        G0: new THREE.Color(theme.get(G0_PART)),
        G1: new THREE.Color(theme.get(G1_PART)),
        G2: new THREE.Color(theme.get(G2_PART)),
        G3: new THREE.Color(theme.get(G3_PART)),
        default: defaultColor,
    };

    //this.geometry.setFromPoints(this.vertices);
    const colorArray = getColorTypedArray(colors, motionColor);

    const message = {
        colorArray: colorArray,
        savedColors: savedColors,
    };

    postMessage(message);
};
