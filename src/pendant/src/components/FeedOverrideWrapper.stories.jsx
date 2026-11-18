import { expect } from 'storybook/test';
import {
    LEGACY_CARD,
    pendantParameters,
    withPendant,
} from '../../../../.storybook/pendant';

import FeedOverrideWrapper from './FeedOverrideWrapper';

// Feed and spindle override sliders under the legacy carve screen's
// visualizer card. Override percentages and live feed/speed come from the
// machine state (status.ov, status.feedrate, status.spindle); the spindle
// slider only shows with workspace.spindleFunctions on
const meta = {
    title: 'Pendant/FeedOverrideWrapper',
    component: FeedOverrideWrapper,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '220px' } },
        pendant: { width: LEGACY_CARD, height: 180, padding: '12px 0' },
        machine: { preset: 'idle' },
    },
};

export default meta;

const RUNNING_STATUS = {
    ov: [120, 100, 90],
    feedrate: 1440,
    spindle: 16200,
};

export const Idle = {
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Feed')).toBeVisible();
    },
};

export const RunningWithOverrides = {
    parameters: { machine: { preset: 'running', status: RUNNING_STATUS } },
};

export const WithSpindle = {
    parameters: {
        machine: { preset: 'running', status: RUNNING_STATUS },
        workspace: { spindleFunctions: true },
    },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Spindle')).toBeVisible();
    },
};

export const LaserMode = {
    parameters: {
        machine: { preset: 'running', status: RUNNING_STATUS },
        workspace: { spindleFunctions: true },
        appStore: { 'widgets.spindle.mode': 'laser' },
    },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Laser')).toBeVisible();
    },
};

export const Imperial = {
    parameters: {
        machine: { preset: 'running', status: RUNNING_STATUS },
        workspace: { units: 'in' },
    },
};

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
};
