import { expect } from 'storybook/test';
import {
    LEGACY_CARD,
    pendantParameters,
    withPendant,
} from '../../../../.storybook/pendant';

import ProgressAreaWrapper from './ProgressAreaWrapper';

const FILE = { name: 'sign.nc', total: 4000 };

// sender.status as the server reports it
const sender = (received) => ({
    total: FILE.total,
    sent: received,
    received,
    elapsedTime: 754000,
    remainingTime: 1760,
});

// Lines-sent bar under the legacy carve screen's job controls: a thin track
// while idle that grows into a labelled bar while a job runs or is paused.
// Progress comes from the machine state's `file` and `sender`
const meta = {
    title: 'Pendant/Legacy/ProgressAreaWrapper',
    component: ProgressAreaWrapper,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '100px' } },
        pendant: { width: LEGACY_CARD, height: 64, padding: '8px 0' },
        machine: { preset: 'running', file: FILE, sender: sender(1200) },
    },
};

export default meta;

export const NoFile = {
    parameters: { machine: { preset: 'idle', file: null, sender: null } },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Line 0 / 0')).toBeVisible();
    },
};

export const FileLoaded = {
    parameters: { machine: { preset: 'idle', file: FILE, sender: null } },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Line 0 / 4000')).toBeVisible();
    },
};

export const Running = {
    play: async ({ canvas }) => {
        await expect(await canvas.findByText('30%')).toBeVisible();
    },
};

export const JustStarted = {
    parameters: {
        machine: { preset: 'running', file: FILE, sender: sender(0) },
    },
};

export const NearlyDone = {
    parameters: {
        machine: { preset: 'running', file: FILE, sender: sender(3880) },
    },
    play: async ({ canvas }) => {
        await expect(await canvas.findByText('97%')).toBeVisible();
    },
};

export const Paused = {
    parameters: {
        machine: { preset: 'hold', file: FILE, sender: sender(1200) },
    },
};
