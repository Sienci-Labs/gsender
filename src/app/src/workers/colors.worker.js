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

/**
 * Generates a complementary color from a given Three.js Color instance.
 * Each call produces a different variation of the complementary color.
 * @param {THREE.Color} color - The input Three.js Color instance
 * @returns {THREE.Color} - A new Three.js Color instance with complementary color
 */
export const generateComplementaryColor = (color, tcCounter) => {
    // Convert to HSL for easier manipulation
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);

    // Base complementary hue (opposite on color wheel)
    let complementaryHue = (hsl.h + 0.5) % 1;

    // Add variation based on counter to generate different complementary colors
    const variations = [
        0, // Direct complement
        0.1, // Split complement 1
        -0.1, // Split complement 2
        0.15, // Triadic 1
        -0.15, // Triadic 2
        0.05, // Slight variation 1
        -0.05, // Slight variation 2
        0.2, // Wider split 1
        -0.2, // Wider split 2
    ];

    const variation = variations[tcCounter % variations.length];
    complementaryHue = (complementaryHue + variation + 1) % 1; // +1 ensures positive value

    // Adjust saturation and lightness for better contrast
    let newSaturation = hsl.s;
    let newLightness = hsl.l;

    // Apply different saturation/lightness adjustments based on counter
    const adjustmentIndex = Math.floor(tcCounter / variations.length) % 4;

    switch (adjustmentIndex) {
        case 0: // Keep original saturation, adjust lightness for contrast
            newLightness = hsl.l > 0.5 ? hsl.l - 0.3 : hsl.l + 0.3;
            break;
        case 1: // Boost saturation, moderate lightness
            newSaturation = Math.min(hsl.s + 0.2, 1);
            newLightness = hsl.l > 0.5 ? hsl.l - 0.2 : hsl.l + 0.2;
            break;
        case 2: // Reduce saturation, strong lightness contrast
            newSaturation = Math.max(hsl.s - 0.1, 0.1);
            newLightness = hsl.l > 0.5 ? hsl.l - 0.4 : hsl.l + 0.4;
            break;
        case 3: // High saturation, opposite lightness
            newSaturation = Math.min(hsl.s + 0.3, 1);
            newLightness = 1 - hsl.l;
            break;
    }

    // Clamp values to valid range
    newLightness = Math.max(0.1, Math.min(0.9, newLightness));
    newSaturation = Math.max(0.1, Math.min(1, newSaturation));

    // Create and return new Color with complementary values
    const complementaryColor = new THREE.Color();
    complementaryColor.setHSL(complementaryHue, newSaturation, newLightness);

    return complementaryColor;
};

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
    let tcCounter = 0;
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
        colors.forEach((colorTag, index) => {
            if (toolchanges.includes(index) && index > 20) {
                const newColor = generateComplementaryColor(
                    motionColor.G1,
                    tcCounter,
                );
                // Increment counter for next call
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

    const message = {
        colorArray: colorArray,
        savedColors: savedColors,
    };

    postMessage(message);
};
