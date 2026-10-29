import { expect, spyOn, waitFor, within } from 'storybook/test';
import controller from 'app/lib/controller';

import MovementTuning from './index';

const meta = {
    component: MovementTuning,
    tags: ['ai-generated'],
    // Machine state is applied by .storybook/machine-state.js; $100-$102 are steps/mm
    parameters: {
        machine: {
            preset: 'idle',
            settings: { $100: '200', $101: '200', $102: '400' },
        },
    },
    decorators: [
        (Story) => (
            <div className="h-[720px] w-[1200px] p-4">
                <Story />
            </div>
        ),
    ],
};

export default meta;

const button = (canvas, name) => canvas.getByRole('button', { name });

// The wizard opens on a landing page; its single sub-wizard is a card to start
const start = async (canvas, userEvent) => {
    await userEvent.click(
        await canvas.findByRole('button', { name: /Movement Tuning/ }),
    );
};

// The wizard advances with Next once the current step is complete
const next = async (canvas, userEvent) => {
    await waitFor(() => expect(button(canvas, /Next/)).toBeEnabled());
    await userEvent.click(button(canvas, /Next/));
};

// Axis picker is a react-select; its label isn't associated, so its input is an unnamed textbox
const chooseAxis = async (canvas, userEvent, label) => {
    await start(canvas, userEvent);
    await userEvent.click(await canvas.findByRole('textbox'));
    await userEvent.click(await canvas.findByText(label));
};

// Mark, move the axis its default distance, then report how far it actually went
const runTuning = async (
    canvas,
    userEvent,
    axis,
    measured,
    { started = false } = {},
) => {
    if (!started) {
        await start(canvas, userEvent);
    }
    await next(canvas, userEvent);
    await userEvent.click(
        await canvas.findByRole('button', { name: 'Mark First Location' }),
    );
    await next(canvas, userEvent);
    await userEvent.click(
        await canvas.findByRole('button', { name: new RegExp(`Move ${axis}`) }),
    );
    await next(canvas, userEvent);

    const measuredInput = await canvas.findByRole('spinbutton');
    await userEvent.clear(measuredInput);
    await userEvent.type(measuredInput, String(measured));
    // ControlledInput reports its value on blur
    await userEvent.tab();
    await userEvent.click(button(canvas, 'Set Distance Travelled'));
    await next(canvas, userEvent);
};

const updateFirmware = async (canvas, canvasElement, userEvent) => {
    await userEvent.click(
        await canvas.findByRole('button', { name: 'Update step/mm' }),
    );
    const dialog = await within(canvasElement.ownerDocument.body).findByRole(
        'alertdialog',
        { name: 'Update Firmware' },
    );
    await userEvent.click(
        within(dialog).getByRole('button', { name: 'Update Firmware' }),
    );
};

export const AxisSelection = {
    play: async ({ canvas, userEvent }) => {
        await start(canvas, userEvent);
        await expect(await canvas.findByText('Axis to Tune')).toBeVisible();
        await expect(canvas.getByText('X-Axis')).toBeVisible();
        // Choosing an axis needs nothing else, so the wizard can move on
        await waitFor(() => expect(button(canvas, /Next/)).toBeEnabled());
    },
};

export const NotConnected = {
    parameters: { machine: { preset: 'disconnected' } },
    play: async ({ canvas }) => {
        await expect(await canvas.findByText(/not connected/i)).toBeVisible();
    },
};

export const XAxisNeedsCorrection = {
    play: async ({ canvas, canvasElement, userEvent }) => {
        const command = spyOn(controller, 'command');
        await runTuning(canvas, userEvent, 'X', 99);

        // Moves with a jog command, so the machine's modal state is untouched
        await expect(command).toHaveBeenCalledWith('gcode', [
            '$J=G21 G91 X100 F1000',
        ]);
        await expect(
            await canvas.findByText(/movement was\s+off by/),
        ).toHaveTextContent('off by 1 mm.');

        await updateFirmware(canvas, canvasElement, userEvent);
        // 200 steps/mm * 100 / 99
        await expect(command).toHaveBeenCalledWith('gcode', [
            '$100=202.02',
            '$$',
        ]);
    },
};

export const AccurateAxis = {
    play: async ({ canvas, userEvent }) => {
        await runTuning(canvas, userEvent, 'X', 100);
        await expect(
            await canvas.findByText(/X-axis looks accurate/),
        ).toBeVisible();
    },
};

export const TuneZAxis = {
    play: async ({ canvas, userEvent }) => {
        const command = spyOn(controller, 'command');
        await chooseAxis(canvas, userEvent, 'Z-Axis');
        // Z tunes downward: it moves -50 mm
        await runTuning(canvas, userEvent, 'Z', -50, { started: true });
        await expect(command).toHaveBeenCalledWith('gcode', [
            '$J=G21 G91 Z-50 F1000',
        ]);
        await expect(
            await canvas.findByText(/Z-axis looks accurate/),
        ).toBeVisible();
    },
};

export const ZMeasuredAsPositiveDistance = {
    play: async ({ canvas, canvasElement, userEvent }) => {
        const command = spyOn(controller, 'command');
        await chooseAxis(canvas, userEvent, 'Z-Axis');
        // Z moves -50 mm; a ruler reading of 49 is naturally entered as positive
        await runTuning(canvas, userEvent, 'Z', 49, { started: true });
        await expect(
            await canvas.findByText(/movement was\s+off by/),
        ).toHaveTextContent('off by 1 mm.');

        await updateFirmware(canvas, canvasElement, userEvent);
        // 400 steps/mm * 50 / 49, never negative
        await expect(command).toHaveBeenCalledWith('gcode', [
            '$102=408.16',
            '$$',
        ]);
    },
};

export const ZMeasuredAsPositiveExactDistance = {
    play: async ({ canvas, userEvent }) => {
        await chooseAxis(canvas, userEvent, 'Z-Axis');
        await runTuning(canvas, userEvent, 'Z', 50, { started: true });
        await expect(
            await canvas.findByText(/Z-axis looks accurate/),
        ).toBeVisible();
    },
};
