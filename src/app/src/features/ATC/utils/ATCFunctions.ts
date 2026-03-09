import { toast } from 'app/lib/toaster';
import store from 'app/store';
import reduxStore from 'app/store/redux';
import get from 'lodash/get';
import controller from 'app/lib/controller.ts';
import {
    IToolListing,
    ToolInstance,
} from 'app/features/ATC/components/ToolTable.tsx';
import { ToolFlags } from 'app/features/ATC/types.ts';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib.ts';
import * as THREE from 'three';
import { TOOLPATH_COLOR_HEXES } from 'app/features/Visualizer/constants';
import pubsub from 'pubsub-js';

export function unimplemented() {
    toast.info('Unimplemented :(');
}

export function mapToolNicknamesAndStatus(
    tools: IToolListing,
    rackSize: number = 0,
): ToolInstance[] {
    const toolsArray: ToolInstance[] = [];

    if (!tools) {
        return [];
    }

    Object.values(tools).forEach((tool) => {
        tool = { ...tool };
        tool.nickname = lookupToolName(tool.id);
        const flags = getToolFlags(tool.id, rackSize, tool.toolOffsets.z);
        tool.status = flags.probeState;
        tool.isManual = flags.isManual;
        toolsArray.push(tool);
    });
    return toolsArray;
}

export function getToolFlags(
    toolNumber: number,
    rackSize: number,
    zOffset: number,
): ToolFlags {
    return {
        probeState: zOffset < 0 ? 'probed' : 'unprobed',
        isManual: toolNumber > rackSize,
    };
}

function setToolStatus(tool: ToolInstance, rackSize): ToolInstance {
    const flags = getToolFlags(tool.id, rackSize, tool.toolOffsets.z);
    tool.status = flags.probeState;
    tool.isManual = flags.isManual;
    return tool;
}

export function lookupToolName(id: number): string {
    return store.get(`widgets.atc.toolMap.${id}`, '-');
}

export function setToolName(id, value) {
    let toolMap = store.get(`widgets.atc.toolMap`);
    toolMap = {
        ...toolMap,
        [id]: value,
    };
    store.set(`widgets.atc.toolMap`, toolMap);
    pubsub.publish('toolmap:updated', { id, value, toolMap });
}

export function lookupSpecificTool(
    toolID = -1,
    toolTable = {},
    rackSize: number = 0,
): ToolInstance {
    let tool = Object.values(toolTable).find((tool) => tool.id === toolID);
    if (!tool) {
        return null;
    }
    tool = { ...tool };
    tool.nickname = lookupToolName(tool.id);
    tool = setToolStatus(tool, rackSize);
    return tool;
}

export function getToolAxisOffset(tool, axis, table: ToolInstance[]): string {
    const tableTool = table.find((tool) => tool.id === tool);
    if (!tableTool) {
        return 'Empty';
    }

    return get(tableTool, `toolOffsets.${axis}`, '-') as string;
}

export function unloadTool() {
    controller.command('gcode', ['M6T0', '$#']);
}

export function releaseToolFromSpindle() {
    controller.command('gcode', ['G65 P900', '$#']);
}

export function loadTool(toolID) {
    controller.command('gcode', [`M6 T${toolID}`]);
}

export function loadAndSaveToRack(toolID) {
    controller.command('gcode', [`G65 P901 Q${toolID}`, '$#']);
}


export type LoadToolMode = 'load' | 'manual' | 'unload' | 'loadAndSave';

export function isATCAvailable() {
    const reduxState = reduxStore.getState();
    const atcFlag = get(reduxState, 'controller.settings.info.NEWOPT.ATC', '0');
    return atcFlag === '1';
}

export function isKeepoutEnabled() {
    const reduxState = reduxStore.getState();
    const keepoutFlag = get(
        reduxState,
        'controller.state.status.keepout.flags',
        [],
    );
    return keepoutFlag.includes('E');
}

export function sendATCHomingDialog() {
    const hasATC = isATCAvailable();
    const keepoutEnabled = isKeepoutEnabled();
    const warningEnabled = store.get('widgets.atc.warnOnHome', false);
    if (hasATC && !keepoutEnabled && warningEnabled) {
        Confirm({
            title: 'Homing Collision Warning',
            content:
                'Keepout Disabled. Ensure that your homing cycle will not collide with the ATC rack before homing.',
            onConfirm: () => {
                controller.command('homing');
            },
            confirmLabel: 'Home',
        });
    } else {
        controller.command('homing');
    }
}

const toolpathColors = TOOLPATH_COLOR_HEXES.map((hex) => new THREE.Color(hex));

/**
 * Always returns the index into `toolpathColors` for a given tool-change counter.
 * Wraps via modulus when the counter exceeds the palette length.
 */
export const getComplementaryColour = (tcCounter) => {
    const len = toolpathColors.length;
    if (len === 0) return 0;
    return ((tcCounter % len) + len) % len;
};

export const getToolpathColor = (tcCounter) => {
    const paletteIndex = getComplementaryColour(tcCounter);
    const color = toolpathColors[paletteIndex];
    return color ? color.clone() : new THREE.Color('#FFF');
};

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
