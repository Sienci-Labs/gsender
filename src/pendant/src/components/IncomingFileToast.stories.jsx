import { expect, waitFor, within } from 'storybook/test';
import controller from 'app/lib/controller';
import { toast } from 'app/lib/toaster';
import { pendantParameters, withPendant } from '../../../../.storybook/pendant';

import IncomingFileToast from './IncomingFileToast';

// Deliver a controller event to its listeners, as the socket handler does
const emit = (eventName, ...args) =>
    controller.listeners[eventName].forEach((listener) => listener(...args));

// Renders nothing itself: it turns the remote:file-incoming:* events into one
// toast that updates in place, so the transfer is visible from any tab.
const meta = {
    title: 'Pendant/IncomingFileToast',
    component: IncomingFileToast,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '200px' } },
        pendant: { height: 160 },
    },
    beforeEach: () => () => toast.dismiss(),
};

export default meta;

// Toasts render in the document body and fade in
const toastShows = (canvasElement, text) =>
    waitFor(() =>
        expect(
            within(canvasElement.ownerDocument.body).getByText(text),
        ).toBeVisible(),
    );

export const Receiving = {
    play: async ({ canvasElement }) => {
        emit('remote:file-incoming:start', { name: 'sign.nc', size: 20480 });
        await toastShows(canvasElement, 'Receiving sign.nc… 0%');
        emit('remote:file-incoming:progress', 40);
        await toastShows(canvasElement, 'Receiving sign.nc… 40%');
    },
};

export const Complete = {
    play: async ({ canvasElement }) => {
        emit('remote:file-incoming:start', { name: 'sign.nc', size: 20480 });
        emit('remote:file-incoming:complete');
        await toastShows(canvasElement, 'Received sign.nc');
    },
};

export const Failed = {
    play: async ({ canvasElement }) => {
        emit('remote:file-incoming:start', { name: 'sign.nc', size: 20480 });
        emit('remote:file-incoming:error', 'Connection lost');
        await toastShows(canvasElement, 'Connection lost');
    },
};
