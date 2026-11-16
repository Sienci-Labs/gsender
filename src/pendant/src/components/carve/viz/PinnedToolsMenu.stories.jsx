import { http, HttpResponse } from 'msw';
import { expect, fn, within } from 'storybook/test';
import {
    pendantParameters,
    withPendant,
} from '../../../../../../.storybook/pendant';

import PinnedToolsMenu from './PinnedToolsMenu';

const PIN_SETS = {
    none: [],
    one: ['surfacing'],
    several: [
        'surfacing',
        'movement-tuning',
        'squaring',
        'remote-file-receive',
    ],
};

// The classes VizStage gives its corner buttons
const CORNER_BUTTON =
    'flex h-10 w-10 items-center justify-center rounded-md border border-transparent text-content-muted disabled:opacity-40';

const meta = {
    title: 'Pendant/Carve/PinnedToolsMenu',
    component: PinnedToolsMenu,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '260px' } },
        pendant: { width: 320, height: 220, padding: 8 },
        // Tools pinned on the Tools page (workspace.pinnedTools)
        appStore: { 'workspace.pinnedTools': PIN_SETS.several },
        msw: {
            handlers: [
                // Plugins can contribute tools too; none installed here
                http.get('*/api/plugins', () =>
                    HttpResponse.json({ plugins: [] }),
                ),
            ],
        },
    },
    args: { disabled: false, onOpen: fn(), className: CORNER_BUTTON },
    argTypes: {
        disabled: {
            description:
                'Set outside setup mode: tools cannot be opened mid-job',
            control: { type: 'boolean' },
        },
        className: { table: { disable: true } },
    },
};

export default meta;

const trigger = (canvas) =>
    canvas.findByRole('button', { name: 'Pinned tools' });

export const Closed = {
    play: async ({ canvas }) => {
        await expect(await trigger(canvas)).toBeEnabled();
    },
};

export const Open = {
    play: async ({ args, canvas, canvasElement, userEvent }) => {
        await userEvent.click(await trigger(canvas));
        // The menu portals into the themed pendant frame
        const frame = within(canvasElement.ownerDocument.body);
        await expect(
            await frame.findByRole('button', { name: 'Movement Tuning' }),
        ).toBeVisible();
        await userEvent.click(frame.getByRole('button', { name: 'Surfacing' }));
        await expect(args.onOpen).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'surfacing' }),
        );
    },
};

export const OneTool = {
    parameters: { appStore: { 'workspace.pinnedTools': PIN_SETS.one } },
    play: async ({ canvas, canvasElement, userEvent }) => {
        await userEvent.click(await trigger(canvas));
        await expect(
            await within(canvasElement.ownerDocument.body).findByRole(
                'button',
                { name: 'Surfacing' },
            ),
        ).toBeVisible();
    },
};

export const Disabled = {
    args: { disabled: true },
    play: async ({ canvas }) => {
        await expect(await trigger(canvas)).toBeDisabled();
    },
};

export const NothingPinned = {
    parameters: { appStore: { 'workspace.pinnedTools': PIN_SETS.none } },
    play: async ({ canvas }) => {
        // No star at all when nothing is pinned
        await expect(canvas.queryByRole('button')).toBeNull();
    },
};
