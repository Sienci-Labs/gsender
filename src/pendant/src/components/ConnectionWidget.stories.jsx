import { expect, fireEvent, spyOn, waitFor, within } from 'storybook/test';
import controller from 'app/lib/controller';
import {
    pendantParameters,
    stubPendantConnection,
    withPendant,
} from '../../../../.storybook/pendant';

import ConnectionWidget from './ConnectionWidget';

const PORTS = [{ port: 'COM4', manufacturer: 'Arduino', inuse: false }];
const UNRECOGNIZED = [
    {
        port: '/dev/tty.Bluetooth-Incoming-Port',
        manufacturer: '',
        inuse: false,
    },
];

// Mirrors app/src/features/Connection/Connection.stories.jsx. The pendant's
// connection pill (legacy top bar; the carve top bar's status badge wraps it):
// Connect to CNC opens a port list, a quick tap while connected shows the
// port and firmware, a hold disconnects. It keeps its connection state
// locally, so stories drive it through the stubbed controller
// (stubPendantConnection) and the ports listed in the machine state
const meta = {
    title: 'Pendant/ConnectionWidget',
    component: ConnectionWidget,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '440px' } },
        pendant: { width: 360, height: 400, padding: 8 },
        machine: { preset: 'disconnected', ports: PORTS },
    },
    beforeEach: stubPendantConnection,
    args: { compact: false },
    argTypes: {
        compact: {
            description:
                'Badge-sized pills for the disconnected / connecting / error states',
            control: { type: 'boolean' },
        },
        renderConnected: { table: { disable: true } },
    },
};

export default meta;

const openPorts = async (canvas, canvasElement, userEvent) => {
    await userEvent.click(
        canvas.getByRole('button', { name: /Connect to CNC/ }),
    );
    return within(canvasElement.ownerDocument.body);
};

// Pills and port rows pop in
const visible = (element) => waitFor(() => expect(element).toBeVisible());

const replyToOpenPort = (err) =>
    controller.openPort.mockImplementation((_port, _options, callback) =>
        callback(err),
    );

export const Disconnected = {
    play: async ({ canvas }) => {
        await visible(canvas.getByRole('button', { name: /Connect to CNC/ }));
    },
};

export const Compact = {
    args: { compact: true },
};

export const PortList = {
    play: async ({ canvas, canvasElement, userEvent }) => {
        const body = await openPorts(canvas, canvasElement, userEvent);
        await visible(await body.findByText('COM4'));
    },
};

// No USB devices: only the saved network address is offered
export const NoPortsFound = {
    parameters: { machine: { preset: 'disconnected', ports: [] } },
    play: async ({ canvas, canvasElement, userEvent }) => {
        const body = await openPorts(canvas, canvasElement, userEvent);
        await visible(await body.findByText('Recognized'));
        await expect(body.queryByText('COM4')).toBeNull();
    },
};

export const UnrecognizedPorts = {
    parameters: {
        machine: {
            preset: 'disconnected',
            ports: PORTS,
            unrecognizedPorts: UNRECOGNIZED,
        },
    },
    play: async ({ canvas, canvasElement, userEvent }) => {
        const body = await openPorts(canvas, canvasElement, userEvent);
        await userEvent.click(await body.findByText('Unrecognized Ports'));
    },
};

// The controller never answers, so it stays connecting
export const Connecting = {
    play: async ({ canvas, canvasElement, userEvent }) => {
        controller.openPort.mockImplementation(() => {});
        const body = await openPorts(canvas, canvasElement, userEvent);
        await userEvent.click(await body.findByText('COM4'));
        await expect(await canvas.findByText('Connecting…')).toBeVisible();
    },
};

export const ConnectSucceeds = {
    play: async ({ canvas, canvasElement, userEvent }) => {
        replyToOpenPort(null);
        const body = await openPorts(canvas, canvasElement, userEvent);
        await userEvent.click(await body.findByText('COM4'));
        await expect(controller.openPort).toHaveBeenCalledWith(
            'COM4',
            expect.anything(),
            expect.any(Function),
        );
    },
};

export const ConnectFails = {
    play: async ({ canvas, canvasElement, userEvent }) => {
        replyToOpenPort('Error: Port busy');
        const body = await openPorts(canvas, canvasElement, userEvent);
        await userEvent.click(await body.findByText('COM4'));
        await visible(await canvas.findByText('Connection failed'));
    },
};

// Already connected on COM4: the widget reconnects on mount
export const Connected = {
    parameters: { machine: { preset: 'idle', port: 'COM4' } },
    play: async ({ canvas }) => {
        await visible(await canvas.findByText('COM4'));
    },
};

// A quick tap on the connected pill shows the port and firmware
export const ConnectionInfo = {
    parameters: { machine: { preset: 'idle', port: 'COM4' } },
    play: async ({ canvas }) => {
        const pill = (await canvas.findByText('COM4')).closest('button');
        await fireEvent.pointerDown(pill);
        await fireEvent.pointerUp(pill);
        await waitFor(() =>
            expect(
                canvas.getByText(/Hold the button to disconnect/),
            ).toBeVisible(),
        );
    },
};

export const Disconnect = {
    parameters: { machine: { preset: 'idle', port: 'COM4' } },
    play: async ({ canvas }) => {
        spyOn(controller, 'closePort').mockImplementation(() => {});
        const pill = (await canvas.findByText('COM4')).closest('button');
        // Held past the hold-to-activate time
        await fireEvent.pointerDown(pill);
        await waitFor(
            () =>
                expect(controller.closePort).toHaveBeenCalledWith(
                    'COM4',
                    expect.any(Function),
                ),
            { timeout: 3000 },
        );
    },
};
