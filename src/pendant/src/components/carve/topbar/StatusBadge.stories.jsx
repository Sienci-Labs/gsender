import { expect, waitFor } from 'storybook/test';
import {
    pendantParameters,
    stubPendantConnection,
    withPendant,
} from '../../../../../../.storybook/pendant';

import StatusBadge from './StatusBadge';

const CARVE_MODES = [
    'disconnected',
    'setup',
    'running',
    'holdJob',
    'holdIdle',
    'alarm',
    'toolchange',
];

const meta = {
    title: 'Pendant/Carve/StatusBadge',
    component: StatusBadge,
    tags: ['ai-generated'],
    decorators: [withPendant],
    // `mode` picks the badge's tone; the label, port and firmware come from the
    // machine state (.storybook/machine-state.js), so stories set both
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '120px' } },
        pendant: { width: 320, padding: 8 },
        machine: { preset: 'idle', port: 'COM4' },
    },
    beforeEach: stubPendantConnection,
    args: { mode: 'setup' },
    argTypes: {
        mode: {
            description:
                'Carve screen mode (resolved from connection, workflow and active state in the app)',
            control: { type: 'select' },
            options: CARVE_MODES,
        },
    },
};

export default meta;

const badge = (canvas, name) => canvas.findByRole('button', { name });

export const Disconnected = {
    args: { mode: 'disconnected' },
    parameters: { machine: { preset: 'disconnected' } },
    play: async ({ canvas }) => {
        // The pill pops in
        await waitFor(() =>
            expect(canvas.getByText('Connect to CNC')).toBeVisible(),
        );
    },
};

export const Idle = {
    play: async ({ canvas }) => {
        await expect(await badge(canvas, /on COM4, Idle/)).toBeVisible();
    },
};

export const NetworkConnection = {
    parameters: { machine: { preset: 'idle', port: '192.168.5.1' } },
    play: async ({ canvas }) => {
        await expect(
            await badge(canvas, /on 192\.168\.5\.1, Idle/),
        ).toBeVisible();
    },
};

export const Jogging = {
    parameters: {
        machine: {
            preset: 'idle',
            port: 'COM4',
            status: { activeState: 'Jog' },
        },
    },
    play: async ({ canvas }) => {
        await expect(await badge(canvas, /Jogging/)).toBeVisible();
    },
};

export const Homing = {
    parameters: {
        machine: {
            preset: 'idle',
            port: 'COM4',
            status: { activeState: 'Home' },
        },
    },
    play: async ({ canvas }) => {
        await expect(await badge(canvas, /Homing/)).toBeVisible();
    },
};

export const Running = {
    args: { mode: 'running' },
    parameters: { machine: { preset: 'running', port: 'COM4' } },
    play: async ({ canvas }) => {
        await expect(await badge(canvas, /Run\./)).toBeVisible();
    },
};

export const HoldDuringJob = {
    args: { mode: 'holdJob' },
    parameters: { machine: { preset: 'hold', port: 'COM4' } },
    play: async ({ canvas }) => {
        await expect(await badge(canvas, /Hold/)).toBeVisible();
    },
};

export const HoldWhileIdle = {
    args: { mode: 'holdIdle' },
    parameters: {
        machine: {
            preset: 'idle',
            port: 'COM4',
            status: { activeState: 'Hold' },
        },
    },
    play: async ({ canvas }) => {
        await expect(await badge(canvas, /Hold/)).toBeVisible();
    },
};

export const DoorOpen = {
    args: { mode: 'holdIdle' },
    parameters: {
        machine: {
            preset: 'idle',
            port: 'COM4',
            status: { activeState: 'Door' },
        },
    },
    play: async ({ canvas }) => {
        await expect(await badge(canvas, /Door/)).toBeVisible();
    },
};

export const Alarm = {
    args: { mode: 'alarm' },
    parameters: {
        machine: { preset: 'alarm', port: 'COM4', status: { alarmCode: 1 } },
    },
    play: async ({ canvas }) => {
        await expect(await badge(canvas, /Alarm/)).toBeVisible();
    },
};

export const ToolChange = {
    args: { mode: 'toolchange' },
    parameters: {
        machine: {
            preset: 'hold',
            port: 'COM4',
            status: { activeState: 'Tool' },
        },
    },
    play: async ({ canvas }) => {
        await expect(await badge(canvas, /Tool change/)).toBeVisible();
    },
};
