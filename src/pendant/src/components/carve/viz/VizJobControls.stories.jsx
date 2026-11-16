import { expect } from 'storybook/test';
import {
    pendantParameters,
    withPendant,
} from '../../../../../../.storybook/pendant';

import VizJobControls from './VizJobControls';

const FILE = { name: 'sign.nc', total: 4000 };

const meta = {
    title: 'Pendant/Carve/VizJobControls',
    component: VizJobControls,
    tags: ['ai-generated'],
    decorators: [
        // Pinned to the bottom-left corner of the visualizer stage
        (Story) => (
            <div className="relative flex-1 bg-surface-sunken">
                <Story />
            </div>
        ),
        withPendant,
    ],
    // `mode` decides whether the controls show and what the first slot is
    // (Start / Pause / Resume); enabled state comes from the machine state
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '140px' } },
        pendant: { width: 360, height: 90 },
        machine: { preset: 'idle' },
    },
    args: { mode: 'setup' },
    argTypes: {
        mode: {
            description:
                'Carve screen mode (resolved from connection, workflow and active state in the app)',
            control: { type: 'select' },
            options: [
                'disconnected',
                'setup',
                'running',
                'holdJob',
                'holdIdle',
                'alarm',
                'toolchange',
            ],
        },
    },
};

export default meta;

const button = (canvas, name) => canvas.getByRole('button', { name });

export const ReadyToStart = {
    parameters: { machine: { preset: 'idle', file: FILE } },
    play: async ({ canvas }) => {
        await expect(button(canvas, /Start/)).toBeEnabled();
        await expect(button(canvas, /Stop/)).toBeVisible();
    },
};

export const NoFileLoaded = {
    parameters: { machine: { preset: 'idle' } },
    play: async ({ canvas }) => {
        // Nothing to start, so the controls stay out of the way
        await expect(canvas.queryByRole('button')).toBeNull();
    },
};

export const DisconnectedWithFile = {
    args: { mode: 'disconnected' },
    parameters: { machine: { preset: 'disconnected', file: FILE } },
    play: async ({ canvas }) => {
        await expect(button(canvas, /Start/)).toBeDisabled();
    },
};

export const Running = {
    args: { mode: 'running' },
    parameters: {
        machine: {
            preset: 'running',
            file: FILE,
            sender: { sent: 1200, total: 4000 },
        },
    },
    play: async ({ canvas }) => {
        await expect(button(canvas, /Pause/)).toBeEnabled();
        await expect(button(canvas, /Stop/)).toBeEnabled();
    },
};

export const HoldDuringJob = {
    args: { mode: 'holdJob' },
    parameters: {
        machine: {
            preset: 'hold',
            file: FILE,
            sender: { sent: 1200, total: 4000 },
        },
    },
    play: async ({ canvas }) => {
        await expect(button(canvas, /Resume/)).toBeEnabled();
        await expect(button(canvas, /Stop/)).toBeEnabled();
    },
};

export const HiddenInAlarm = {
    args: { mode: 'alarm' },
    parameters: {
        machine: { preset: 'alarm', file: FILE, status: { alarmCode: 1 } },
    },
    play: async ({ canvas }) => {
        await expect(canvas.queryByRole('button')).toBeNull();
    },
};
