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

const toolpathColors = [
    new THREE.Color(0.29, 0.56, 0.89), // #4A90E2
    new THREE.Color(0.94, 0.54, 0.31), // #F08A4F
    new THREE.Color(0.84, 0.26, 0.59), // #D74296
    new THREE.Color(0.26, 0.84, 0.73), // #42D7BA
    new THREE.Color(0.65, 0.84, 0.26), // #A7D742
    new THREE.Color(0.77, 0.3, 0.21), // #C44C36
    new THREE.Color(0.63, 0.26, 0.84), // #A142D7
    new THREE.Color(0.26, 0.59, 0.84), // #4296D7
    new THREE.Color(0.84, 0.73, 0.26), // #D7BA42
    new THREE.Color(0.26, 0.84, 0.39), // #42D763
    new THREE.Color(0.84, 0.26, 0.77), // #D742C4
    new THREE.Color(0.84, 0.26, 0.26), // #D74242
];

/**
 * Always returns the index into `toolpathColors` for a given tool-change counter.
 * Wraps via modulus when the counter exceeds the palette length.
 */
const getComplementaryColour = (tcCounter) => {
    const len = toolpathColors.length;
    if (len === 0) return 0;
    return ((tcCounter % len) + len) % len;
};

// ... existing code ...

onmessage = function ({ data }) {
    const {
        colors,
        frames,
        spindleSpeeds,
        isLaser = false,
        spindleChanges,
        theme,
        toolchanges,
    } = data;
    let tcCounter = 1;
    let savedColors = [];

    const updateLaserModeColors = () => {
        const defaultColor = new THREE.Color(theme.get(LASER_PART));
        const fillColor = new THREE.Color(theme.get(BACKGROUND_PART));
        const maxSpindleValue = Math.max(...spindleSpeeds);

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
        colors.forEach((colorTag, index) => {
            if (toolchanges?.includes(index) && index > 20) {
                const paletteIndex = getComplementaryColour(tcCounter);
                const newColor = toolpathColors[paletteIndex].clone();

                // Increment counter for next toolchange
                tcCounter++;

                motionColor.G1 = newColor;
                motionColor.G2 = newColor;
                motionColor.G3 = newColor;
            }
            const [motion, opacity] = colorTag;
            const color = motionColor[motion];
            colorArray.push(...color.toArray(), opacity);
        });
        savedColors = colorArray;

        if (isLaser && spindleSpeeds.size > 0) {
            updateLaserModeColors();
        }

        return new Float32Array(colorArray);
    };

    // Get line colors for current theme
    const motionColor = {
        G0: new THREE.Color(theme.get(G0_PART)),
        G1: new THREE.Color(theme.get(G1_PART)),
        G2: new THREE.Color(theme.get(G2_PART)),
        G3: new THREE.Color(theme.get(G3_PART)),
        default: new THREE.Color('#FFF'),
    };

    //this.geometry.setFromPoints(this.vertices);
    const colorArray = getColorTypedArray(colors, motionColor);
    const savedColorsTyped = new Float32Array(savedColors);

    const message = {
        colorArrayBuffer: colorArray.buffer,
        savedColorsBuffer: savedColorsTyped.buffer,
    };

    postMessage(message, [colorArray.buffer, savedColorsTyped.buffer]);
};
