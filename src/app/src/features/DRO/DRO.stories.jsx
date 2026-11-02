import { expect, spyOn, within } from 'storybook/test';
import controller from 'app/lib/controller';

import DRO from './index';

const meta = {
    component: DRO,
    tags: ['ai-generated'],
    // Machine and workspace state are applied by .storybook/machine-state.js
    parameters: {
        docs: { story: { inline: false, height: '300px' } },
        machine: { preset: 'idle' },
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

const zeroAll = (canvas) =>
    canvas.getByRole('button', { name: /^Zero all axes/ });

export const Idle = {
    play: async ({ canvas, userEvent }) => {
        const command = spyOn(controller, 'command');
        await userEvent.click(
            canvas.getByRole('button', { name: /^Zero X axis/ }),
        );
        await expect(command).toHaveBeenCalledWith('gcode', 'G10 L20 P0 X0');
    },
};

export const Positioned = {
    parameters: {
        machine: {
            preset: 'idle',
            mpos: { x: -412.25, y: -301.5, z: -12.75 },
            wpos: { x: 120.5, y: 80.25, z: 3.1 },
        },
    },
    play: async ({ canvas }) => {
        await expect(canvas.getByTestId('wcs-input-X')).toHaveValue(120.5);
        await expect(canvas.getByTestId('mpos-X')).toHaveTextContent('-412.25');
    },
};

export const Inches = {
    parameters: {
        machine: { preset: 'idle', mpos: { x: 25.4, y: 50.8, z: -12.7 } },
        workspace: { units: 'in' },
    },
    play: async ({ canvas }) => {
        await expect(
            canvas.getByRole('button', { name: /Current units are in/ }),
        ).toBeVisible();
        await expect(canvas.getByTestId('mpos-X')).toHaveTextContent(
            /^1(\.0+)?$/,
        );
    },
};

export const HomingEnabled = {
    parameters: {
        machine: { preset: 'idle', settings: { $22: '1' }, hasHomed: true },
    },
    play: async ({ canvas }) => {
        await expect(
            canvas.getByRole('button', { name: 'Home' }),
        ).toBeEnabled();
        await expect(
            canvas.getByRole('button', { name: 'Go to Back Left Corner' }),
        ).toBeEnabled();
    },
};

export const SingleAxisHoming = {
    parameters: {
        machine: { preset: 'idle', settings: { $22: '3' }, hasHomed: true },
    },
    play: async ({ canvas, userEvent }) => {
        await userEvent.click(
            canvas.getByRole('switch', { name: 'Toggle single axis homing' }),
        );
        await expect(
            canvas.getByRole('button', { name: /^Home X axis/ }),
        ).toBeVisible();
    },
};

export const ZeroWarning = {
    parameters: { workspace: { shouldWarnZero: true } },
    play: async ({ canvas, canvasElement, userEvent }) => {
        const command = spyOn(controller, 'command');
        await userEvent.click(
            canvas.getByRole('button', { name: 'Zero X axis' }),
        );
        await expect(command).not.toHaveBeenCalled();

        // AlertDialog portals to document.body
        const dialog = await within(
            canvasElement.ownerDocument.body,
        ).findByRole('alertdialog');
        await userEvent.click(
            within(dialog).getByRole('button', { name: 'Continue' }),
        );
        await expect(command).toHaveBeenCalledWith('gcode', 'G10 L20 P0 X0');
    },
};

export const RotaryMode = {
    parameters: { workspace: { mode: 'ROTARY' } },
    play: async ({ canvas }) => {
        await expect(
            canvas.getByRole('button', { name: /^Go to XA zero/ }),
        ).toBeVisible();
        await expect(
            canvas.getByRole('button', { name: /^Zero A axis/ }),
        ).toBeVisible();
    },
};

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
    play: async ({ canvas }) => {
        await expect(zeroAll(canvas)).toBeDisabled();
    },
};

export const RunningJob = {
    parameters: {
        machine: { preset: 'running', wpos: { x: 54.2, y: 18.9, z: -1.5 } },
    },
    play: async ({ canvas }) => {
        await expect(zeroAll(canvas)).toBeDisabled();
    },
};
