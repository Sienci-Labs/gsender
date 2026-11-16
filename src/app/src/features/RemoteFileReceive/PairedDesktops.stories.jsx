import { http, HttpResponse } from 'msw';
import { expect, spyOn, waitFor, within } from 'storybook/test';

import PairedDesktops from './PairedDesktops';

const DESKTOPS = [
    { id: 'desk-1', name: 'Shop PC', pairedAt: 1750000000000 },
    { id: 'desk-2', name: 'Office Laptop', pairedAt: 1751000000000 },
];

// Serves the tablet's paired-desktop list; forgetting one removes it
const desktopServer = (msw, initial) => {
    let desktops = [...initial];
    msw.use(
        http.get('*/api/remoteFileReceive/desktops', () =>
            HttpResponse.json({ desktops }),
        ),
        http.delete('*/api/remoteFileReceive/desktops/:id', ({ params }) => {
            desktops = desktops.filter((d) => d.id !== params.id);
            return HttpResponse.json({});
        }),
    );
};

const meta = {
    component: PairedDesktops,
    tags: ['ai-generated'],
    args: { running: true },
    argTypes: {
        running: {
            description:
                'Whether Remote File Receive is on; pairing is disabled when off',
            control: { type: 'boolean' },
        },
    },
    parameters: {
        docs: { story: { inline: false, height: '360px' } },
        desktops: DESKTOPS,
    },
    beforeEach: ({ msw, parameters }) => {
        desktopServer(msw, parameters.desktops);
    },
    decorators: [
        (Story) => (
            <div className="w-[480px] p-2">
                <Story />
            </div>
        ),
    ],
};

export default meta;

export const NoDesktops = {
    parameters: { desktops: [] },
    play: async ({ canvas }) => {
        await expect(
            canvas.getByText(/On the desktop, open Send to Pendant/),
        ).toBeVisible();
        await expect(
            canvas.getByRole('button', { name: 'Pair with desktop' }),
        ).toBeEnabled();
    },
};

export const WithDesktops = {
    play: async ({ canvas }) => {
        await expect(await canvas.findByText('Shop PC')).toBeVisible();
        await expect(canvas.getByText('Office Laptop')).toBeVisible();
    },
};

export const ForgetDesktop = {
    play: async ({ canvas, userEvent }) => {
        await canvas.findByText('Shop PC');
        await userEvent.click(
            canvas.getAllByRole('button', { name: /Forget/ })[0],
        );
        await waitFor(() => expect(canvas.queryByText('Shop PC')).toBeNull());
        await expect(canvas.getByText('Office Laptop')).toBeVisible();
    },
};

export const ReceiveTurnedOff = {
    args: { running: false },
    play: async ({ canvas }) => {
        await expect(
            canvas.getByRole('button', { name: 'Pair with desktop' }),
        ).toBeDisabled();
    },
};

export const ScanWithoutCamera = {
    beforeEach: () => {
        spyOn(navigator.mediaDevices, 'getUserMedia').mockRejectedValue(
            new DOMException('Permission denied', 'NotAllowedError'),
        );
    },
    play: async ({ canvas, canvasElement, userEvent }) => {
        await userEvent.click(
            canvas.getByRole('button', { name: 'Pair with desktop' }),
        );
        const dialog = within(
            await within(canvasElement.ownerDocument.body).findByRole(
                'dialog',
                { name: 'Scan pairing code' },
            ),
        );
        // The dialog fades in
        await waitFor(() =>
            expect(dialog.getByText(/Could not open the camera/)).toBeVisible(),
        );
    },
};
