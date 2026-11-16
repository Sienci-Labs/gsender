import { expect } from 'storybook/test';
import {
    pendantParameters,
    withPendant,
} from '../../../../../../.storybook/pendant';

import InfoGlass from './InfoGlass';

const meta = {
    title: 'Pendant/Carve/InfoGlass',
    component: InfoGlass,
    tags: ['ai-generated'],
    decorators: [
        // Pinned to the top-right corner of the visualizer stage
        (Story) => (
            <div className="relative flex-1 bg-surface-sunken">
                <Story />
            </div>
        ),
        withPendant,
    ],
    // No props: the modal state and asserted input pins come from the machine state
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '120px' } },
        pendant: { width: 360, height: 70 },
        machine: {
            preset: 'idle',
            modal: { units: 'G21', distance: 'G90', motion: 'G0' },
        },
    },
};

export default meta;

export const MetricAbsolute = {
    play: async ({ canvas }) => {
        await expect(canvas.getByText('mm')).toBeVisible();
        await expect(canvas.getByText('abs')).toBeVisible();
        await expect(canvas.getByText('rapid')).toBeVisible();
    },
};

export const ImperialIncremental = {
    parameters: {
        machine: {
            preset: 'idle',
            modal: { units: 'G20', distance: 'G91', motion: 'G1' },
        },
    },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('in')).toBeVisible();
        await expect(canvas.getByText('inc')).toBeVisible();
        await expect(canvas.getByText('feed')).toBeVisible();
    },
};

export const Probing = {
    parameters: {
        machine: {
            preset: 'running',
            modal: { units: 'G21', distance: 'G91', motion: 'G38.2' },
            status: { pinState: { P: true } },
        },
    },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('probe')).toBeVisible();
        await expect(canvas.getByTitle('P: asserted')).toBeVisible();
    },
};

export const LimitPinsAsserted = {
    parameters: {
        machine: {
            preset: 'alarm',
            modal: { units: 'G21', distance: 'G90', motion: 'G0' },
            status: { alarmCode: 1, pinState: { X: true, Y: true, Z: true } },
        },
    },
    play: async ({ canvas }) => {
        await expect(canvas.getByTitle('X: asserted')).toBeVisible();
        await expect(canvas.getByTitle('Z: asserted')).toBeVisible();
    },
};

export const AllPinsAsserted = {
    parameters: {
        machine: {
            preset: 'idle',
            modal: { units: 'G21', distance: 'G90', motion: 'G2' },
            status: {
                pinState: {
                    X: true,
                    Y: true,
                    Z: true,
                    A: true,
                    P: true,
                    D: true,
                    H: true,
                },
            },
        },
    },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('cw arc')).toBeVisible();
        await expect(canvas.getByTitle('H: asserted')).toBeVisible();
    },
};

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
    play: async ({ canvas }) => {
        await expect(canvas.getAllByText('-')).toHaveLength(3);
    },
};
