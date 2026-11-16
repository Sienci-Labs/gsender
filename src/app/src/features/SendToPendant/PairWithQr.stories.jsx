import { delay, http, HttpResponse } from 'msw';
import { expect, fn, waitFor } from 'storybook/test';

import { PairWithQr } from './PairWithQr';

const QR = {
    nonce: 'nonce-1',
    payload: 'gsender-pair:{"id":"desk-1","name":"Shop PC","nonce":"nonce-1"}',
};

const qrIssued = http.post('*/api/pendantPairing/qr', () =>
    HttpResponse.json(QR),
);
const notScannedYet = http.post('*/api/pendantPairing/claim', () =>
    HttpResponse.json({ paired: false }),
);

const meta = {
    component: PairWithQr,
    tags: ['ai-generated'],
    args: { onPaired: fn(), onUseCode: fn(), onCancel: fn() },
    parameters: {
        docs: { story: { inline: false, height: '420px' } },
        msw: { handlers: [qrIssued, notScannedYet] },
    },
    decorators: [
        (Story) => (
            <div className="w-[420px] p-4">
                <Story />
            </div>
        ),
    ],
};

export default meta;

export const WaitingForScan = {
    play: async ({ args, canvas, userEvent }) => {
        await expect(
            await canvas.findByText('Waiting for a tablet to scan…'),
        ).toBeVisible();
        await userEvent.click(
            canvas.getByRole('button', { name: 'Use pairing code instead' }),
        );
        await expect(args.onUseCode).toHaveBeenCalled();
        await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
        await expect(args.onCancel).toHaveBeenCalled();
    },
};

export const CreatingCode = {
    parameters: {
        msw: {
            handlers: [
                http.post('*/api/pendantPairing/qr', async () => {
                    await delay('infinite');
                }),
            ],
        },
    },
    play: async ({ canvasElement }) => {
        // Spinner placeholder holds the QR's space until the code arrives
        await expect(
            canvasElement.querySelector('svg[viewBox="0 0 200 200"]'),
        ).toBeNull();
    },
};

export const CodeFailed = {
    parameters: {
        msw: {
            handlers: [
                http.post('*/api/pendantPairing/qr', () =>
                    HttpResponse.json({ msg: 'failed' }, { status: 500 }),
                ),
            ],
        },
    },
    play: async ({ canvas }) => {
        await expect(
            await canvas.findByText('Could not create a pairing code'),
        ).toBeVisible();
    },
};

export const TabletScanned = {
    parameters: {
        msw: {
            handlers: [
                qrIssued,
                http.post('*/api/pendantPairing/claim', () =>
                    HttpResponse.json({
                        paired: true,
                        tablet: {
                            id: 'tab-shop',
                            name: 'Shop Tablet',
                            host: '192.168.0.50',
                            port: 8010,
                            key: 'key-shop',
                        },
                    }),
                ),
            ],
        },
    },
    play: async ({ args }) => {
        await waitFor(() =>
            expect(args.onPaired).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Shop Tablet',
                    paired: true,
                    online: true,
                }),
            ),
        );
    },
};
