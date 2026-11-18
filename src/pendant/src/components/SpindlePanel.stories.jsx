import { expect } from 'storybook/test';
import {
    DRAWER_EXPANDED,
    DRAWER_MINIMAL,
    LEGACY,
    pendantParameters,
    withPendant,
} from '../../../../.storybook/pendant';

import SpindlePanel from './SpindlePanel';

const SPINDLES = [
    { id: 0, label: 'Router (PWM)', enabled: true, laser: false },
    { id: 1, label: 'Laser (PWM2)', enabled: false, laser: true },
];

// Mirrors app/src/features/Spindle/Spindle.stories.jsx. The pendant's spindle
// tab in the legacy carve screen's bottom drawer: Forward/Reverse/Stop (or
// Laser On/Test/Off in laser mode, $32=1) in the minimal drawer, plus the
// spindle picker, mode switch and speed/power slider when expanded
const meta = {
    title: 'Pendant/SpindlePanel',
    component: SpindlePanel,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: `${DRAWER_EXPANDED + 40}px` } },
        pendant: { width: LEGACY.width, height: DRAWER_EXPANDED },
        machine: { preset: 'idle' },
    },
    args: { mode: 'expanded' },
    argTypes: {
        mode: {
            description:
                'Bottom drawer height: minimal shows the buttons only, expanded adds the speed controls',
            control: { type: 'inline-radio' },
            options: ['minimal', 'expanded'],
        },
        // The carve screen's Prep tab swaps the card layout; not used by the drawer
        renderCard: { table: { disable: true } },
    },
};

export default meta;

export const Idle = {
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Forward')).toBeVisible();
        await expect(canvas.getByText('Stop')).toBeVisible();
    },
};

export const Minimal = {
    args: { mode: 'minimal' },
    parameters: { pendant: { width: LEGACY.width, height: DRAWER_MINIMAL } },
};

export const SpindleRunning = {
    parameters: { machine: { preset: 'idle', modal: { spindle: 'M3' } } },
};

export const SpindleReverse = {
    parameters: { machine: { preset: 'idle', modal: { spindle: 'M4' } } },
};

export const LaserMode = {
    parameters: { machine: { preset: 'idle', settings: { $32: '1' } } },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Laser On')).toBeVisible();
        await expect(canvas.queryByText('Forward')).toBeNull();
    },
};

export const MultipleSpindles = {
    parameters: { machine: { preset: 'idle', spindles: SPINDLES } },
};

export const RunningJob = {
    parameters: { machine: { preset: 'running', modal: { spindle: 'M3' } } },
};

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
};
