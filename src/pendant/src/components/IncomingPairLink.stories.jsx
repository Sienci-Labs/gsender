import { expect, waitFor, within } from 'storybook/test';
import controller from 'app/lib/controller';
import { toast } from 'app/lib/toaster';
import { pendantParameters, withPendant } from '../../../../.storybook/pendant';

import IncomingPairLink from './IncomingPairLink';

// Renders nothing itself: it answers gsender:// pairing links opened on the
// tablet (a `gsender:pair` window event from the Android shell) and the
// server's remote:pair-complete event with toasts.
const meta = {
    title: 'Pendant/IncomingPairLink',
    component: IncomingPairLink,
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

export const Paired = {
    play: async ({ canvasElement }) => {
        controller.listeners['remote:pair-complete'].forEach((listener) =>
            listener({ desktopName: 'Shop PC' }),
        );
        await toastShows(canvasElement, 'Paired with Shop PC');
    },
};

export const NotAPairingLink = {
    play: async ({ canvasElement }) => {
        window.dispatchEvent(
            new CustomEvent('gsender:pair', {
                detail: { url: 'https://example.com/' },
            }),
        );
        await toastShows(
            canvasElement,
            "That link isn't a gSender pairing code",
        );
    },
};
