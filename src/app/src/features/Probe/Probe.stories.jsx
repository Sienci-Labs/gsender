import { expect, spyOn, within } from 'storybook/test';
import controller from 'app/lib/controller';
import reduxStore from 'app/store/redux';
import { updateControllerState } from 'app/store/redux/slices/controller.slice';

import ProbeWidget from './index';

// Simulate the touch plate closing the probe circuit, as a status report with Pn:P would
const touchProbe = () => {
    const { type, state } = reduxStore.getState().controller;
    reduxStore.dispatch(
        updateControllerState({
            type,
            state: {
                ...state,
                status: { ...state.status, pinState: { P: true } },
            },
        }),
    );
};

const meta = {
    component: ProbeWidget,
    tags: ['ai-generated'],
    // Machine state is applied by .storybook/machine-state.js
    parameters: { machine: { preset: 'idle' } },
    decorators: [
        (Story) => (
            <div className="h-48 w-[460px]">
                <Story />
            </div>
        ),
    ],
};

export default meta;

const routines = (canvas) =>
    canvas.getAllByRole('button', { name: /^Select probing routine/ });

export const Idle = {
    play: async ({ canvas, userEvent }) => {
        const [first, second] = routines(canvas);
        await expect(first).toHaveAttribute('aria-pressed', 'true');
        await userEvent.click(second);
        await expect(second).toHaveAttribute('aria-pressed', 'true');
        await expect(first).toHaveAttribute('aria-pressed', 'false');
    },
};

export const CircuitCheckThenProbe = {
    play: async ({ canvas, canvasElement, userEvent }) => {
        const command = spyOn(controller, 'command');
        await userEvent.click(canvas.getByRole('button', { name: 'Probe' }));

        // RunProbe opens in a dialog portalled to document.body
        const dialog = await within(
            canvasElement.ownerDocument.body,
        ).findByRole('dialog');
        await expect(
            within(dialog).getByRole('button', {
                name: /Waiting for probe circuit check/,
            }),
        ).toBeDisabled();

        touchProbe();
        await userEvent.click(
            await within(dialog).findByRole('button', { name: 'Start Probe' }),
        );
        await expect(command).toHaveBeenCalledWith(
            'gcode:safe',
            expect.any(Array),
            'G21',
        );
    },
};

export const CircuitCheckDisabled = {
    parameters: { appStore: { 'widgets.probe.connectivityTest': false } },
    play: async ({ canvas, canvasElement, userEvent }) => {
        await userEvent.click(canvas.getByRole('button', { name: 'Probe' }));
        const dialog = await within(
            canvasElement.ownerDocument.body,
        ).findByRole('dialog');
        await expect(
            within(dialog).getByRole('button', { name: 'Start Probe' }),
        ).toBeEnabled();
    },
};

export const TouchplateSwitcher = {
    parameters: { appStore: { 'widgets.probe.touchplateTypeSwitcher': true } },
    play: async ({ canvas }) => {
        await expect(
            canvas.getByRole('button', { name: 'Change Probe Type' }),
        ).toBeVisible();
    },
};

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
    play: async ({ canvas }) => {
        await expect(
            canvas.getByRole('button', { name: 'Probe' }),
        ).toBeDisabled();
    },
};
