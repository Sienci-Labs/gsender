import { delay, http, HttpResponse } from 'msw';
import { expect, waitFor, within } from 'storybook/test';

import { TabletConnect } from './TabletConnect';

const SHOP = {
    id: 'tab-shop',
    name: 'Shop Tablet',
    host: '192.168.0.50',
    port: 8010,
    key: 'key-shop',
    paired: true,
    online: true,
};
const GARAGE = {
    id: 'tab-garage',
    name: 'Garage Pendant',
    host: '192.168.0.61',
    port: 8010,
    key: 'key-garage',
    paired: true,
    online: false,
};

// The desktop server's discovery + pairing endpoints, backed by an in-memory
// tablet list so forgetting or pairing shows up on the next refresh
const pairingServer = (msw, initial) => {
    let tablets = [...initial];
    msw.use(
        http.post('*/api/pendantPairing/discover', () =>
            HttpResponse.json({
                desktopId: 'desk-1',
                browsing: true,
                tablets,
            }),
        ),
        http.post('*/api/pendantPairing/qr', () =>
            HttpResponse.json({
                nonce: 'nonce-1',
                payload: 'gsender-pair:{"id":"desk-1","nonce":"nonce-1"}',
            }),
        ),
        http.post('*/api/pendantPairing/claim', async ({ request }) => {
            const body = await request.json();
            // QR polling: nobody has scanned yet
            if (body.nonce) return HttpResponse.json({ paired: false });
            if (body.code !== '123456') {
                return HttpResponse.json(
                    { msg: 'That pairing code is not correct' },
                    { status: 401 },
                );
            }
            tablets = [SHOP];
            return HttpResponse.json({ paired: true, tablet: SHOP });
        }),
        http.delete('*/api/pendantPairing/tablets/:id', ({ params }) => {
            tablets = tablets.filter((t) => t.id !== params.id);
            return HttpResponse.json({});
        }),
    );
};

// The tablet's own Remote File Receive server, which the renderer posts to directly
const tabletReceives = (resolver) =>
    http.post('http://192.168.0.50:8010/pendant/file', resolver);

const gcodeFile = (name) =>
    new File(['G21\nG90\nG0 X10 Y10\nM30\n'], name, { type: 'text/plain' });

const addFiles = async (canvas, userEvent, ...names) => {
    await canvas.findByText("Files go to Shop Tablet's file library.");
    await userEvent.upload(
        canvas.getByTestId('tablet-connect-file-input'),
        names.map(gcodeFile),
    );
};

const body = (canvasElement) => within(canvasElement.ownerDocument.body);

// Toasts render in the document body and fade in
const toastShows = (canvasElement, text) =>
    waitFor(() => expect(body(canvasElement).getByText(text)).toBeVisible());

const meta = {
    component: TabletConnect,
    tags: ['ai-generated'],
    parameters: {
        docs: { story: { inline: false, height: '640px' } },
        machine: { preset: 'idle' },
        tablets: [SHOP],
        msw: { handlers: [tabletReceives(() => HttpResponse.json({}))] },
    },
    beforeEach: ({ msw, parameters }) => {
        // useSendToTablet remembers the last tablet sent to
        window.localStorage.removeItem('sendToPendant.lastTabletId');
        pairingServer(msw, parameters.tablets);
    },
    decorators: [
        (Story) => (
            <div className="p-4">
                <Story />
            </div>
        ),
    ],
};

export default meta;

export const NoTabletsPaired = {
    parameters: { tablets: [] },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('No pendant paired yet')).toBeVisible();
        await expect(
            canvas.getByText('Pair a tablet to send files to it.'),
        ).toBeVisible();
        await expect(
            canvas.getByRole('button', { name: 'Send' }),
        ).toBeDisabled();
    },
};

export const TabletPaired = {
    play: async ({ canvas }) => {
        await expect(await canvas.findByText('Shop Tablet')).toBeVisible();
        await expect(canvas.getByText('Online')).toBeVisible();
        // Nothing to send yet
        await expect(
            canvas.getByRole('button', { name: 'Send' }),
        ).toBeDisabled();
    },
};

export const SeveralTablets = {
    parameters: { tablets: [SHOP, GARAGE] },
    play: async ({ canvas, userEvent }) => {
        await userEvent.click(
            await canvas.findByRole('button', { name: /Change/ }),
        );
        await userEvent.click(
            canvas.getByRole('button', { name: /Garage Pendant/ }),
        );
        await expect(
            await canvas.findByText(
                "Files go to Garage Pendant's file library.",
            ),
        ).toBeVisible();
    },
};

export const ForgetTablet = {
    play: async ({ canvas, userEvent }) => {
        await userEvent.click(
            await canvas.findByRole('button', { name: 'Forget this tablet' }),
        );
        await expect(
            await canvas.findByText('No pendant paired yet'),
        ).toBeVisible();
    },
};

export const PairingWithQr = {
    parameters: { tablets: [] },
    play: async ({ canvas, userEvent }) => {
        await userEvent.click(
            canvas.getByRole('button', { name: 'Pair with QR code' }),
        );
        await expect(
            await canvas.findByText('Waiting for a tablet to scan…'),
        ).toBeVisible();
    },
};

export const PairingWithCode = {
    parameters: { tablets: [] },
    play: async ({ canvas, canvasElement, userEvent }) => {
        await userEvent.click(
            canvas.getByRole('button', { name: /Enter IP & code instead/ }),
        );
        const pair = canvas.getByRole('button', { name: 'Pair' });
        await expect(pair).toBeDisabled();

        await userEvent.type(
            canvas.getByLabelText('Tablet IP'),
            '192.168.0.50',
        );
        await userEvent.type(canvas.getByLabelText(/Pairing code/), '123456');
        await userEvent.click(pair);

        await toastShows(canvasElement, 'Paired with Shop Tablet');
        await expect(await canvas.findByText('Online')).toBeVisible();
    },
};

export const PairingCodeRejected = {
    parameters: { tablets: [] },
    play: async ({ canvas, canvasElement, userEvent }) => {
        await userEvent.click(
            canvas.getByRole('button', { name: /Enter IP & code instead/ }),
        );
        await userEvent.type(
            canvas.getByLabelText('Tablet IP'),
            '192.168.0.50',
        );
        await userEvent.type(canvas.getByLabelText(/Pairing code/), '000000');
        await userEvent.click(canvas.getByRole('button', { name: 'Pair' }));

        await toastShows(canvasElement, 'That pairing code is not correct');
        // Stays on the form so the code can be corrected
        await expect(canvas.getByLabelText('Tablet IP')).toBeVisible();
    },
};

export const OneFileQueued = {
    play: async ({ canvas, userEvent }) => {
        await addFiles(canvas, userEvent, 'sign.nc');
        await expect(canvas.getByText('sign.nc')).toBeVisible();
        await expect(canvas.getByRole('switch')).toBeChecked();
        await expect(
            canvas.getByRole('button', { name: 'Send' }),
        ).toBeEnabled();
    },
};

export const SeveralFilesQueued = {
    play: async ({ canvas, userEvent }) => {
        await addFiles(canvas, userEvent, 'sign.nc', 'pocket.gcode');
        await expect(
            canvas.getByRole('button', { name: 'Send 2 files' }),
        ).toBeEnabled();
        // Only one file can be the active job
        await expect(canvas.getByRole('switch')).toBeDisabled();
        await expect(
            canvas.getByText(/multiple files go to the library/),
        ).toBeVisible();

        await userEvent.click(
            canvas.getByRole('button', { name: 'Remove pocket.gcode' }),
        );
        await expect(
            canvas.getByRole('button', { name: 'Send' }),
        ).toBeEnabled();
    },
};

export const UnsupportedFileRejected = {
    play: async ({ canvas, canvasElement }) => {
        await canvas.findByText("Files go to Shop Tablet's file library.");
        // Dropping bypasses the file input's accept filter
        const drop = new Event('drop', { bubbles: true });
        Object.defineProperty(drop, 'dataTransfer', {
            value: {
                files: [
                    new File(['not gcode'], 'photo.png', { type: 'image/png' }),
                ],
            },
        });
        canvas.getByText(/Drop g-code files here/).dispatchEvent(drop);
        await toastShows(canvasElement, 'photo.png: Unsupported file type');
    },
};

export const LoadedFileOffered = {
    parameters: {
        machine: {
            preset: 'idle',
            file: { name: 'loaded-job.nc', content: 'G21\nG0 X5\nM30\n' },
        },
    },
    play: async ({ canvas, userEvent }) => {
        await canvas.findByText("Files go to Shop Tablet's file library.");
        await userEvent.click(
            canvas.getByRole('button', { name: /Send loaded file/ }),
        );
        await expect(
            canvas.getByRole('button', { name: /Loaded file added/ }),
        ).toBeDisabled();
    },
};

export const Sending = {
    parameters: {
        msw: {
            handlers: [
                tabletReceives(async () => {
                    await delay('infinite');
                }),
            ],
        },
    },
    play: async ({ canvas, userEvent }) => {
        await addFiles(canvas, userEvent, 'sign.nc');
        await userEvent.click(canvas.getByRole('button', { name: 'Send' }));
        await expect(await canvas.findByText('Sending sign.nc…')).toBeVisible();
        await expect(
            canvas.getByRole('button', { name: /Sending…/ }),
        ).toBeDisabled();
    },
};

export const Sent = {
    play: async ({ canvas, canvasElement, userEvent }) => {
        await addFiles(canvas, userEvent, 'sign.nc');
        await userEvent.click(canvas.getByRole('button', { name: 'Send' }));
        await toastShows(
            canvasElement,
            'Added to the library and loaded on Shop Tablet',
        );
    },
};

export const TabletUnreachable = {
    parameters: {
        msw: { handlers: [tabletReceives(() => HttpResponse.error())] },
    },
    play: async ({ canvas, canvasElement, userEvent }) => {
        await addFiles(canvas, userEvent, 'sign.nc');
        await userEvent.click(canvas.getByRole('button', { name: 'Send' }));
        await toastShows(
            canvasElement,
            /Could not reach Shop Tablet at 192\.168\.0\.50:8010/,
        );
        // The queue is kept so the send can be retried
        await expect(
            canvas.getByRole('button', { name: 'Send' }),
        ).toBeEnabled();
    },
};

export const TabletForgotThisDesktop = {
    parameters: {
        msw: {
            handlers: [
                tabletReceives(() => HttpResponse.json({}, { status: 401 })),
            ],
        },
    },
    play: async ({ canvas, canvasElement, userEvent }) => {
        await addFiles(canvas, userEvent, 'sign.nc');
        await userEvent.click(canvas.getByRole('button', { name: 'Send' }));
        await toastShows(
            canvasElement,
            /Shop Tablet is no longer paired with this computer/,
        );
        // Drops the stale key and goes straight to re-pairing
        await waitFor(() =>
            expect(
                canvas.getByText('Waiting for a tablet to scan…'),
            ).toBeVisible(),
        );
    },
};

export const JobRunning = {
    parameters: { machine: { preset: 'running' } },
    play: async ({ canvas, userEvent }) => {
        await addFiles(canvas, userEvent, 'sign.nc');
        await expect(
            canvas.getByText('Sending is paused while a job is running.'),
        ).toBeVisible();
        await expect(
            canvas.getByRole('button', { name: 'Send' }),
        ).toBeDisabled();
    },
};
