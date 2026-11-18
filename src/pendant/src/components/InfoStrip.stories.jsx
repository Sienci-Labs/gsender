import { expect } from 'storybook/test';
import {
    LEGACY,
    pendantParameters,
    withPendant,
} from '../../../../.storybook/pendant';

import InfoStrip from './InfoStrip';

const MODAL = {
    wcs: 'G54',
    plane: 'G17',
    units: 'G21',
    distance: 'G90',
    feedrate: 'G94',
    coolant: 'M9',
    spindle: 'M5',
};

// The strip under the legacy carve screen's top bar: current tool (grblHAL),
// parser modal state, input pins and the clock. All from the machine state
// (modal, status.pinState, status.currentTool, $32 for laser mode)
const meta = {
    title: 'Pendant/Legacy/InfoStrip',
    component: InfoStrip,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '100px' } },
        pendant: { width: LEGACY.width },
        machine: { preset: 'idle', modal: MODAL },
    },
};

export default meta;

export const Idle = {
    play: async ({ canvas }) => {
        await expect(canvas.getByText('G54')).toBeVisible();
        await expect(canvas.getByText('mm')).toBeVisible();
    },
};

export const SpindleAndCoolantOn = {
    parameters: {
        machine: {
            preset: 'running',
            modal: { ...MODAL, spindle: 'M3', coolant: 'M8', wcs: 'G55' },
        },
    },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('CW')).toBeVisible();
        await expect(canvas.getByText('flood')).toBeVisible();
    },
};

export const LaserOn = {
    parameters: {
        machine: {
            preset: 'running',
            settings: { $32: '1' },
            modal: { ...MODAL, spindle: 'M4' },
        },
    },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('laser')).toBeVisible();
    },
};

export const ImperialIncremental = {
    parameters: {
        machine: {
            preset: 'idle',
            modal: { ...MODAL, units: 'G20', distance: 'G91' },
        },
    },
};

// grblHAL reports the tool in the spindle and limit/probe/door pins
export const ToolAndPins = {
    parameters: {
        machine: {
            preset: 'idle',
            modal: MODAL,
            status: {
                currentTool: 3,
                pinState: { X: true, P: true, D: true },
            },
        },
    },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('T3')).toBeVisible();
    },
};

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
};
