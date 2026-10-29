import { expect, fn, spyOn, within } from 'storybook/test';
import controller from 'app/lib/controller';

import Connection from './index';

const PORTS = [{ port: 'COM4', manufacturer: 'Arduino', inuse: false }];

const meta = {
    component: Connection,
    tags: ['ai-generated'],
    // Port list is applied to Redux by .storybook/machine-state.js
    parameters: { machine: { preset: 'disconnected', ports: PORTS } },
    beforeEach: () => {
        // refreshPorts() reconnects the socket and asks the server for ports on mount
        // and on hover; keep stories off the network
        spyOn(controller, 'reconnect').mockImplementation(() => {});
        spyOn(controller, 'listPorts').mockImplementation(() => {});
    },
    decorators: [
        (Story) => (
            <div className="h-72 w-[320px] p-2">
                <Story />
            </div>
        ),
    ],
};

export default meta;

// Opens the port popover, which Radix portals to document.body
const openPorts = async (canvas, canvasElement, userEvent) => {
    await userEvent.click(
        canvas.getByRole('button', { name: /Connect to CNC/ }),
    );
    return within(canvasElement.ownerDocument.body);
};

// Stub controller.openPort to answer its callback with the given error (null = success)
const openPortReplies = (err) =>
    spyOn(controller, 'openPort').mockImplementation(
        (_port, _options, callback) => callback(err),
    );

export const Disconnected = {
    play: async ({ canvas, canvasElement, userEvent }) => {
        const body = await openPorts(canvas, canvasElement, userEvent);
        await expect(
            await body.findByRole('button', { name: /COM4/ }),
        ).toBeVisible();
    },
};

export const NoPortsFound = {
    parameters: { machine: { preset: 'disconnected', ports: [] } },
    play: async ({ canvas, canvasElement, userEvent }) => {
        const body = await openPorts(canvas, canvasElement, userEvent);
        await expect(
            await body.findByText('No USB devices found'),
        ).toBeVisible();
    },
};

export const ConnectSucceeds = {
    play: async ({ canvas, canvasElement, userEvent }) => {
        const openPort = openPortReplies(null);
        const body = await openPorts(canvas, canvasElement, userEvent);
        await userEvent.click(
            await body.findByRole('button', { name: /COM4/ }),
        );

        await expect(openPort).toHaveBeenCalledWith(
            'COM4',
            expect.objectContaining({ baudrate: 115200, network: false }),
            expect.any(Function),
        );
        await expect(await canvas.findByText('COM4')).toBeVisible();
    },
};

export const ConnectFails = {
    play: async ({ canvas, canvasElement, userEvent }) => {
        openPortReplies('Error: Port busy');
        const body = await openPorts(canvas, canvasElement, userEvent);
        await userEvent.click(
            await body.findByRole('button', { name: /COM4/ }),
        );
        await expect(
            await canvas.findByText('Unable to connect.'),
        ).toBeVisible();
    },
};

export const Disconnect = {
    play: async ({ canvas, canvasElement, userEvent }) => {
        openPortReplies(null);
        const closePort = spyOn(controller, 'closePort').mockImplementation(
            fn(),
        );
        const body = await openPorts(canvas, canvasElement, userEvent);
        await userEvent.click(
            await body.findByRole('button', { name: /COM4/ }),
        );
        await canvas.findByText('COM4');

        // Disconnect is a div[role=button] nested inside the trigger <button>
        await userEvent.click(
            canvas.getByRole('button', { name: 'Disconnect' }),
        );
        await expect(closePort).toHaveBeenCalledWith(
            'COM4',
            expect.any(Function),
        );
        await expect(await canvas.findByText('Connect to CNC')).toBeVisible();
    },
};
