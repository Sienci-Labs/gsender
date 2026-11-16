import { expect } from 'storybook/test';
import { pendantParameters, withPendant } from '../../../../.storybook/pendant';

import DepthGauge from './DepthGauge';

// $22 = homing enabled, $132 = Z max travel (mm)
const HOMING = { $22: '1', $132: '120' };
const FILE = {
    name: 'pocket.nc',
    total: 4000,
    bbox: {
        min: { x: 0, y: 0, z: -12 },
        max: { x: 200, y: 150, z: 5 },
        delta: { x: 200, y: 150, z: 17 },
    },
};

const meta = {
    title: 'Pendant/DepthGauge',
    component: DepthGauge,
    tags: ['ai-generated'],
    decorators: [withPendant],
    // The Z-axis depth strip beside the jog pad. It has no props: everything is
    // read from the machine state (work Z, homing, Z travel) and the loaded file's
    // Z range. Fills its parent's height.
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '400px' } },
        pendant: { width: 130, height: 360, padding: 8 },
        machine: {
            preset: 'idle',
            settings: HOMING,
            hasHomed: true,
            mpos: { x: 0, y: 0, z: -40 },
            wpos: { x: 0, y: 0, z: 10 },
        },
    },
};

export default meta;

const gauge = (canvasElement) =>
    canvasElement.querySelector('[data-testid="pendant-frame"] > div');

export const Homed = {
    play: async ({ canvas, canvasElement }) => {
        await expect(gauge(canvasElement)).not.toBeEmptyDOMElement();
        await expect(canvas.queryByText('Not homed')).toBeNull();
    },
};

export const HomedWithJob = {
    parameters: {
        machine: {
            preset: 'idle',
            settings: HOMING,
            hasHomed: true,
            wpos: { x: 0, y: 0, z: 10 },
            file: FILE,
        },
    },
    play: async ({ canvasElement }) => {
        await expect(gauge(canvasElement)).not.toBeEmptyDOMElement();
    },
};

export const BelowJobBottom = {
    parameters: {
        machine: {
            preset: 'idle',
            settings: HOMING,
            hasHomed: true,
            wpos: { x: 0, y: 0, z: -20 },
            file: FILE,
        },
    },
    play: async ({ canvasElement }) => {
        await expect(gauge(canvasElement)).not.toBeEmptyDOMElement();
    },
};

export const NotHomed = {
    parameters: {
        machine: {
            preset: 'idle',
            settings: HOMING,
            hasHomed: false,
            wpos: { x: 0, y: 0, z: 10 },
        },
    },
    play: async ({ canvas }) => {
        await expect(await canvas.findByText('Not homed')).toBeVisible();
    },
};

export const NotHomedWithJob = {
    parameters: {
        machine: {
            preset: 'idle',
            settings: HOMING,
            hasHomed: false,
            wpos: { x: 0, y: 0, z: 2 },
            file: FILE,
        },
    },
    play: async ({ canvas }) => {
        await expect(await canvas.findByText('Not homed')).toBeVisible();
    },
};

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
    play: async ({ canvasElement }) => {
        // Keeps its space but draws nothing
        await expect(gauge(canvasElement)).toBeEmptyDOMElement();
    },
};
