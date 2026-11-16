import { expect } from 'storybook/test';
import {
    CARVE_LEFT,
    pendantParameters,
    withPendant,
} from '../../../../../../.storybook/pendant';

import PrepTab from './PrepTab';

// $30 / $31 = spindle max / min RPM, $32 = laser mode
const SPINDLE = { $30: '24000', $31: '6000', $32: '0' };
const LASER = { $30: '1000', $31: '0', $32: '1' };

const meta = {
    title: 'Pendant/Carve/PrepTab',
    component: PrepTab,
    tags: ['ai-generated'],
    decorators: [withPendant],
    // Setup mode's Prep tab: spindle / laser power card, coolant chips (when the
    // workspace has coolant buttons on) and the override faders. No props; state
    // comes from the machine state and workspace preferences.
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '560px' } },
        pendant: { width: CARVE_LEFT, height: 520 },
        machine: {
            preset: 'idle',
            settings: SPINDLE,
            modal: { spindle: 'M5', coolant: 'M9' },
            status: { ov: [100, 100, 100] },
        },
        appStore: { 'workspace.coolantFunctions': true },
    },
};

export default meta;

const button = (canvas, name) => canvas.getByRole('button', { name });

export const SpindleOff = {
    play: async ({ canvas }) => {
        await expect(button(canvas, 'Set spindle speed')).toBeEnabled();
        await expect(button(canvas, 'CW')).toBeEnabled();
        await expect(button(canvas, 'Mist')).toBeEnabled();
        await expect(button(canvas, 'Flood')).toBeEnabled();
    },
};

export const SpindleRunningClockwise = {
    parameters: {
        machine: {
            modal: { spindle: 'M3', coolant: 'M9' },
            status: { ov: [100, 100, 100], spindle: 18000 },
        },
    },
    play: async ({ canvas }) => {
        await expect(button(canvas, 'CW')).toBeVisible();
    },
};

export const SpindleRunningCounterClockwise = {
    parameters: {
        machine: {
            modal: { spindle: 'M4', coolant: 'M9' },
            status: { ov: [100, 100, 100], spindle: 12000 },
        },
    },
    play: async ({ canvas }) => {
        await expect(button(canvas, 'CCW')).toBeVisible();
    },
};

export const CoolantOn = {
    parameters: {
        machine: { modal: { spindle: 'M5', coolant: ['M7', 'M8'] } },
    },
    play: async ({ canvas }) => {
        await expect(button(canvas, 'Mist')).toBeVisible();
        await expect(button(canvas, 'Flood')).toBeVisible();
    },
};

export const WithoutCoolantButtons = {
    parameters: { appStore: { 'workspace.coolantFunctions': false } },
    play: async ({ canvas }) => {
        await expect(canvas.queryByRole('button', { name: 'Mist' })).toBeNull();
    },
};

export const OverridesChanged = {
    parameters: { machine: { status: { ov: [150, 50, 80] } } },
    play: async ({ canvas }) => {
        await expect(button(canvas, 'Set spindle speed')).toBeVisible();
    },
};

export const LaserMode = {
    parameters: { machine: { settings: LASER } },
    play: async ({ canvas }) => {
        await expect(button(canvas, 'Set laser power')).toBeEnabled();
        await expect(button(canvas, 'Air assist')).toBeEnabled();
        await expect(button(canvas, 'On')).toBeVisible();
    },
};

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
    play: async ({ canvas }) => {
        await expect(button(canvas, 'Set spindle speed')).toBeDisabled();
        await expect(button(canvas, 'CW')).toBeDisabled();
        await expect(button(canvas, 'Mist')).toBeDisabled();
    },
};

export const Running = {
    parameters: {
        machine: {
            preset: 'running',
            modal: { spindle: 'M3', coolant: 'M8' },
            status: { ov: [100, 100, 100], spindle: 18000 },
        },
    },
    play: async ({ canvas }) => {
        await expect(button(canvas, 'CW')).toBeVisible();
    },
};
