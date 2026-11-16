import { useEffect } from 'react';
import { expect, waitFor } from 'storybook/test';
import controller from 'app/lib/controller';
import { pendantParameters, withPendant } from '../../../../.storybook/pendant';

import IncomingFilePill from './IncomingFilePill';

// Deliver a controller event to its listeners, as the socket handler does
const emit = (eventName, ...args) =>
    controller.listeners[eventName].forEach((listener) => listener(...args));

// The pill has no props: it follows the remote:file-incoming:* events a desktop's
// Send to Pendant upload produces. This replays the events for the chosen state.
function Transfer({ transferState, name, percent, children }) {
    useEffect(() => {
        if (transferState === 'idle') return;
        emit('remote:file-incoming:start', { name, size: 20480 });
        emit('remote:file-incoming:progress', percent);
        if (transferState === 'complete') emit('remote:file-incoming:complete');
        if (transferState === 'error') {
            emit('remote:file-incoming:error', 'Connection lost');
        }
    }, [transferState, name, percent]);
    return children;
}

const meta = {
    title: 'Pendant/IncomingFilePill',
    component: IncomingFilePill,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '100px' } },
        pendant: { width: 220, height: 48, padding: 8 },
    },
    args: { transferState: 'receiving', name: 'sign.nc', percent: 40 },
    argTypes: {
        transferState: {
            description:
                'Transfer phase to replay. Complete and error clear themselves after 2 s / 4 s, as in the app',
            control: { type: 'inline-radio' },
            options: ['idle', 'receiving', 'complete', 'error'],
        },
        name: { control: { type: 'text' } },
        percent: { control: { type: 'range', min: 0, max: 100, step: 5 } },
    },
    render: (args) => (
        // Remount so each change of the controls replays from a fresh hook state
        <Transfer key={JSON.stringify(args)} {...args}>
            <IncomingFilePill />
        </Transfer>
    ),
};

export default meta;

// The pill pops in
const shows = (canvas, text) =>
    waitFor(() => expect(canvas.getByText(text)).toBeVisible());

export const Receiving = {
    play: async ({ canvas }) => {
        await shows(canvas, 'sign.nc');
        await expect(canvas.getByText('40%')).toBeVisible();
    },
};

export const LongFileName = {
    args: { name: 'cabinet-door-left-panel-v3-final.gcode', percent: 85 },
    play: async ({ canvas }) => {
        await shows(canvas, '85%');
    },
};

export const Complete = {
    args: { transferState: 'complete' },
    play: async ({ canvas }) => {
        await shows(canvas, 'Received');
    },
};

export const Failed = {
    args: { transferState: 'error' },
    play: async ({ canvas }) => {
        await shows(canvas, 'Failed');
    },
};

export const Idle = {
    args: { transferState: 'idle' },
    play: async ({ canvas }) => {
        await expect(canvas.queryByText('sign.nc')).toBeNull();
    },
};
