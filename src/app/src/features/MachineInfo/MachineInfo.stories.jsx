import { expect, spyOn, waitFor, within } from 'storybook/test';
import controller from 'app/lib/controller';

import MachineInfo from './index';

const meta = {
    component: MachineInfo,
    tags: ['ai-generated'],
    // Machine state is applied by .storybook/machine-state.js
    parameters: {
        machine: {
            preset: 'idle',
            modal: { wcs: 'G55', units: 'G20', spindle: 'M3', coolant: 'M8' },
            status: { pinState: { X: true, P: true }, currentTool: 3 },
        },
    },
    decorators: [
        (Story) => (
            <div className="flex h-[440px] w-[460px] justify-end p-2">
                <Story />
            </div>
        ),
    ],
};

export default meta;

// The info panel is a Radix popover portalled to document.body
const openInfo = async (canvas, canvasElement, userEvent) => {
    await userEvent.click(
        canvas.getByRole('button', { name: 'Machine Information' }),
    );
    const body = within(canvasElement.ownerDocument.body);
    // Wait out the popover's fade-in so visibility assertions are meaningful
    await waitFor(async () =>
        expect(await body.findByText('CNC Modals')).toBeVisible(),
    );
    return body;
};

// Value shown on the right of a label row (ModalRow / PinRow)
const rowValue = (body, label) => body.getByText(label).nextElementSibling;

export const Connected = {
    play: async ({ canvas, canvasElement, userEvent }) => {
        const body = await openInfo(canvas, canvasElement, userEvent);
        await expect(rowValue(body, 'Coordinate system')).toHaveTextContent(
            'G55',
        );
        await expect(rowValue(body, 'Units')).toHaveTextContent('G20');
        await expect(rowValue(body, 'Coolant')).toHaveTextContent('M8');
        await expect(
            rowValue(body, 'X limit').firstElementChild,
        ).toHaveAttribute('title', 'On');
        await expect(
            rowValue(body, 'Y limit').firstElementChild,
        ).toHaveAttribute('title', 'Off');
        await expect(
            rowValue(body, 'Probe/TLS').firstElementChild,
        ).toHaveAttribute('title', 'On');
        await expect(body.getByText('T3')).toBeVisible();
    },
};

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
    play: async ({ canvas, canvasElement, userEvent }) => {
        const body = await openInfo(canvas, canvasElement, userEvent);
        await expect(rowValue(body, 'Coordinate system')).toHaveTextContent(
            '-',
        );
        await expect(rowValue(body, 'X limit')).toHaveTextContent('-');
        await expect(
            body.getByRole('switch', { name: 'Lock stepper motors' }),
        ).toBeDisabled();
    },
};

export const LockStepperMotors = {
    beforeEach: () => {
        // The toggle reads $1 from the live controller rather than Redux
        const previous = controller.settings;
        controller.settings = { settings: { $1: '25' } };
        return () => {
            controller.settings = previous;
        };
    },
    play: async ({ canvas, canvasElement, userEvent }) => {
        const command = spyOn(controller, 'command');
        const body = await openInfo(canvas, canvasElement, userEvent);
        await userEvent.click(
            body.getByRole('switch', { name: 'Lock stepper motors' }),
        );
        await expect(command).toHaveBeenCalledWith('gcode', ['$1=255', '$$']);
    },
};

export const Pinned = {
    play: async ({ canvas, canvasElement, userEvent }) => {
        const body = await openInfo(canvas, canvasElement, userEvent);
        await userEvent.click(
            body.getByRole('button', { name: 'Pin machine information' }),
        );

        // A pinned panel ignores outside clicks and Escape
        await userEvent.click(canvasElement.ownerDocument.body);
        await userEvent.keyboard('{Escape}');
        await expect(body.getByText('CNC Modals')).toBeVisible();
        await expect(
            body.getByRole('button', { name: 'Unpin machine information' }),
        ).toBeVisible();
    },
};
