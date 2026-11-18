import { expect, waitFor } from 'storybook/test';
import {
    pendantParameters,
    TABLET,
    withoutRouter,
    withPendant,
} from '../../../../.storybook/pendant';

import PendantConfigView from './PendantConfigView';

// Mirrors app/src/features/Config/Config.stories.jsx where it applies. The
// pendant's Config tab: the desktop settings page without its side menu,
// kept mounted (hidden) after the first visit
const meta = {
    title: 'Pendant/PendantConfigView',
    component: PendantConfigView,
    tags: ['ai-generated'],
    decorators: [withoutRouter, withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: `${TABLET.height + 20}px` } },
        // Between the top bar and the bottom nav
        pendant: { width: TABLET.width, height: TABLET.height - 120 },
        machine: {
            preset: 'idle',
            type: 'Grbl',
            settings: { $100: '200', $101: '200', $102: '400' },
        },
    },
    args: { active: true },
    argTypes: {
        active: {
            description:
                'Whether the Config tab is shown; it stays mounted but hidden otherwise',
            control: { type: 'boolean' },
        },
    },
};

export default meta;

const search = (canvas) => canvas.findByPlaceholderText('Search Config');

export const Overview = {
    play: async ({ canvas }) => {
        await expect(await search(canvas)).toBeVisible();
    },
};

export const Search = {
    play: async ({ canvas, userEvent }) => {
        await userEvent.type(await search(canvas), 'baud');
        await waitFor(() =>
            expect(canvas.getAllByText(/baud/i).length).toBeGreaterThan(0),
        );
    },
};

export const FirmwareSettingsNeedConnection = {
    parameters: { machine: { preset: 'disconnected' } },
};

export const GrblHAL = {
    parameters: { machine: { preset: 'idle', type: 'grblHAL' } },
};

export const Hidden = {
    args: { active: false },
};
