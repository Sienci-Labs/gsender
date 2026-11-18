import { http, HttpResponse } from 'msw';
import { expect, fn } from 'storybook/test';
import {
    pendantParameters,
    TABLET,
    withoutRouter,
    withPendant,
} from '../../../../.storybook/pendant';

import PendantToolsView from './PendantToolsView';

// The pendant's Tools tab: a card per built-in tool and installed plugin,
// each with a star to pin it to the carve screen (workspace.pinnedTools).
// Opening a card shows the tool full-screen with a Back button
const meta = {
    title: 'Pendant/PendantToolsView',
    component: PendantToolsView,
    tags: ['ai-generated'],
    decorators: [withoutRouter, withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: `${TABLET.height + 20}px` } },
        // Between the top bar and the bottom nav
        pendant: { width: TABLET.width, height: TABLET.height - 120 },
        machine: { preset: 'idle' },
        appStore: { 'workspace.pinnedTools': [] },
        msw: {
            handlers: [
                http.get('*/api/plugins', () =>
                    HttpResponse.json({ plugins: [] }),
                ),
            ],
        },
    },
    args: { onShowCarve: fn() },
};

export default meta;

export const Default = {
    play: async ({ canvas }) => {
        await expect(
            canvas.getByRole('heading', { name: 'Tools' }),
        ).toBeVisible();
    },
};

export const PinnedTools = {
    parameters: {
        appStore: {
            'workspace.pinnedTools': ['surfacing', 'squaring'],
        },
    },
};

export const OpenSurfacing = {
    play: async ({ canvas, userEvent }) => {
        await userEvent.click(await canvas.findByText('Surfacing'));
        await expect(
            await canvas.findByRole('button', { name: 'Back' }),
        ).toBeVisible();
    },
};

export const OpenMovementTuning = {
    play: async ({ canvas, userEvent }) => {
        await userEvent.click(await canvas.findByText('Movement Tuning'));
        await expect(
            await canvas.findByRole('button', { name: 'Back' }),
        ).toBeVisible();
    },
};

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
};
