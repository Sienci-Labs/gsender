import { http, HttpResponse } from 'msw';
import { expect, fn, spyOn, waitFor, within } from 'storybook/test';
import api from 'app/api';
import controller from 'app/lib/controller';

import RemoteFileReceive from './index';

const IP_LIST = [
    {
        address: '192.168.0.50',
        iface: 'wlan0',
        kind: 'wifi',
        label: 'Wi-Fi',
        usable: true,
        recommended: true,
    },
    {
        address: '127.0.0.1',
        iface: 'lo',
        kind: 'loopback',
        label: 'This device only',
        usable: false,
        recommended: false,
    },
];

const FILES = [
    {
        name: 'sign.nc',
        savedName: '1750000000000-sign.nc',
        size: 20480,
        receivedAt: 1750000000000,
    },
    {
        name: 'pocket.gcode',
        savedName: '1750000100000-pocket.gcode',
        size: 1536000,
        receivedAt: 1750000100000,
    },
];

// The tablet-side receive server's settings API, held in memory so the switch,
// "New code" and deletes show up when the panel refreshes
const receiveServer = (msw, initial) => {
    let settings = {
        enabled: false,
        running: false,
        port: 8010,
        token: null,
        files: [],
        ...initial,
    };
    msw.use(
        http.get('*/api/remoteFileReceive', () => HttpResponse.json(settings)),
        http.put('*/api/remoteFileReceive', async ({ request }) => {
            const { enabled, port } = await request.json();
            settings = {
                ...settings,
                enabled,
                running: enabled,
                port,
                token: enabled ? '482913' : null,
            };
            return HttpResponse.json(settings);
        }),
        http.post('*/api/remoteFileReceive/token', () => {
            settings = { ...settings, token: '771204' };
            return HttpResponse.json({ token: settings.token });
        }),
        http.get('*/api/remoteFileReceive/files/:name', ({ params }) =>
            HttpResponse.json({
                name: params.name,
                gcode: 'G21\nG0 X5\nM30\n',
            }),
        ),
        http.delete('*/api/remoteFileReceive/files', async ({ request }) => {
            const { names } = await request.json();
            settings = {
                ...settings,
                files: settings.files.filter(
                    (f) => !names.includes(f.savedName),
                ),
            };
            return HttpResponse.json({ deleted: names });
        }),
        http.get('*/api/remoteFileReceive/desktops', () =>
            HttpResponse.json({
                desktops: [
                    { id: 'desk-1', name: 'Shop PC', pairedAt: 1750000000000 },
                ],
            }),
        ),
    );
};

const ON = { enabled: true, running: true, token: '482913' };
// Story parameters merge over the file's, so off has to be spelled out
const OFF = { enabled: false, running: false, token: null };

// Deliver a controller event to its listeners, as the socket handler does
const emit = (eventName, ...args) =>
    controller.listeners[eventName].forEach((listener) => listener(...args));

const body = (canvasElement) => within(canvasElement.ownerDocument.body);

const meta = {
    component: RemoteFileReceive,
    tags: ['ai-generated'],
    args: { onOpenFile: fn() },
    parameters: {
        docs: { story: { inline: false, height: '720px' } },
        // ipList is applied to Redux by .storybook/machine-state.js
        machine: { preset: 'idle', ipList: IP_LIST },
        receive: ON,
    },
    beforeEach: ({ msw, parameters }) => {
        receiveServer(msw, parameters.receive);
        // Asks the server for this device's addresses on mount
        spyOn(controller, 'listAllIps').mockImplementation(() => {});
        spyOn(api.remoteFileReceive, 'update');
    },
    decorators: [
        (Story) => (
            <div className="w-[560px] p-4">
                <Story />
            </div>
        ),
    ],
};

export default meta;

export const TurnedOff = {
    parameters: { receive: OFF },
    play: async ({ canvas }) => {
        await expect(canvas.getByRole('switch')).not.toBeChecked();
        // Pairing details only show while the receiver is running
        await expect(canvas.queryByText('Pairing code')).toBeNull();
    },
};

export const TurnOn = {
    parameters: { receive: OFF },
    play: async ({ canvas, canvasElement, userEvent }) => {
        // The switch ignores clicks until the current settings have loaded
        await waitFor(async () => {
            await userEvent.click(canvas.getByRole('switch'));
            await expect(api.remoteFileReceive.update).toHaveBeenCalled();
        });
        // Toasts fade in
        await waitFor(() =>
            expect(
                body(canvasElement).getByText('Remote file receive turned on'),
            ).toBeVisible(),
        );
        await expect(await canvas.findByText('482913')).toBeVisible();
    },
};

export const TurnedOn = {
    play: async ({ canvas }) => {
        await expect(await canvas.findByText('482913')).toBeVisible();
        await expect(canvas.getByRole('switch')).toBeChecked();
        await expect(canvas.getByText(/192\.168\.0\.50:8010/)).toBeVisible();
        await expect(await canvas.findByText('Shop PC')).toBeVisible();
        await expect(
            canvas.getByText(/Files sent here with "Add to library"/),
        ).toBeVisible();
    },
};

export const NoNetwork = {
    parameters: { machine: { preset: 'idle', ipList: [] } },
    play: async ({ canvas }) => {
        await expect(
            await canvas.findByText('No network connection detected.'),
        ).toBeVisible();
    },
};

export const NewPairingCode = {
    play: async ({ canvas, userEvent }) => {
        await userEvent.click(
            await canvas.findByRole('button', { name: 'New code' }),
        );
        await expect(await canvas.findByText('771204')).toBeVisible();
    },
};

export const ReceivedFiles = {
    parameters: { receive: { ...ON, files: FILES } },
    play: async ({ args, canvas, userEvent }) => {
        await expect(await canvas.findByText('sign.nc')).toBeVisible();
        await expect(canvas.getByText('pocket.gcode')).toBeVisible();

        await userEvent.click(
            canvas.getByRole('button', { name: 'Load sign.nc' }),
        );
        await waitFor(() =>
            expect(args.onOpenFile).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'sign.nc',
                    savedName: '1750000000000-sign.nc',
                }),
            ),
        );
    },
};

export const DeleteSelectedFiles = {
    parameters: { receive: { ...ON, files: FILES } },
    play: async ({ canvas, canvasElement, userEvent }) => {
        await canvas.findByText('sign.nc');
        await userEvent.click(canvas.getByLabelText('Select all'));
        await userEvent.click(
            canvas.getByRole('button', { name: 'Delete (2)' }),
        );

        const confirm = within(
            await body(canvasElement).findByRole('alertdialog'),
        );
        // The dialog fades in
        await waitFor(() =>
            expect(
                confirm.getByText(/Delete 2 files from this tablet/),
            ).toBeVisible(),
        );
        await userEvent.click(confirm.getByRole('button', { name: 'Delete' }));

        await expect(
            await canvas.findByText(/Files sent here with "Add to library"/),
        ).toBeVisible();
    },
};

export const ReceivingFile = {
    play: async ({ canvas }) => {
        await canvas.findByText('482913');
        emit('remote:file-incoming:start', { name: 'sign.nc', size: 20480 });
        emit('remote:file-incoming:progress', 35);
        await expect(
            await canvas.findByText('Receiving sign.nc…'),
        ).toBeVisible();
        await expect(canvas.getByText('35%')).toBeVisible();
    },
};

export const TransferFailed = {
    play: async ({ canvas }) => {
        await canvas.findByText('482913');
        emit('remote:file-incoming:start', { name: 'sign.nc', size: 20480 });
        emit('remote:file-incoming:error', 'Connection lost');
        await expect(await canvas.findByText('sign.nc failed')).toBeVisible();
        await expect(canvas.getByText('Connection lost')).toBeVisible();
    },
};
