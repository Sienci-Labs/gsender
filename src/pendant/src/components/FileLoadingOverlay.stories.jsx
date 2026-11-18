import { expect } from 'storybook/test';
import {
    LEGACY_CARD,
    pendantParameters,
    withPendant,
} from '../../../../.storybook/pendant';

import FileLoadingOverlay from './FileLoadingOverlay';

// Shown over the visualizer while a loaded file's toolpath is built
// (legacy visualizer card and the carve screen's visualizer stage)
const meta = {
    title: 'Pendant/Legacy/FileLoadingOverlay',
    component: FileLoadingOverlay,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '200px' } },
        pendant: { width: LEGACY_CARD, height: 160, padding: 12 },
    },
    args: { fileName: 'sign-pocket.nc', progress: 45 },
    argTypes: {
        progress: {
            description: 'Toolpath build progress, 0-100',
            control: { type: 'range', min: 0, max: 100, step: 1 },
        },
        fileName: {
            description: 'Names over 28 characters are cut from the front',
            control: { type: 'select' },
            options: [
                'sign-pocket.nc',
                'customer-order-2291-walnut-charcuterie-board-final-v3.nc',
                '',
            ],
        },
    },
};

export default meta;

export const Starting = {
    args: { progress: 0 },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('0%')).toBeVisible();
    },
};

export const Halfway = {
    play: async ({ canvas }) => {
        await expect(canvas.getByText('45%')).toBeVisible();
    },
};

export const AlmostDone = { args: { progress: 96 } };

export const LongFileName = {
    args: {
        fileName: 'customer-order-2291-walnut-charcuterie-board-final-v3.nc',
    },
    play: async ({ canvas }) => {
        await expect(canvas.getByText(/^…/)).toBeVisible();
    },
};

export const NoFileName = {
    args: { fileName: '' },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('loading…')).toBeVisible();
    },
};
