import { expect, spyOn } from 'storybook/test';
import controller from 'app/lib/controller';

import SpindleWidget from './index';

const meta = {
    component: SpindleWidget,
    tags: ['ai-generated'],
    // Machine state is applied by .storybook/machine-state.js
    parameters: {
        docs: { story: { inline: false, height: '680px' } },
        machine: { preset: 'idle' },
    },
    decorators: [
        (Story) => (
            <div className="h-64 w-[420px]">
                <Story />
            </div>
        ),
    ],
};

export default meta;

export const Idle = {
    play: async ({ canvas, userEvent }) => {
        const command = spyOn(controller, 'command');
        await userEvent.click(
            canvas.getByRole('button', {
                name: 'Start spindle clockwise (M3)',
            }),
        );
        await expect(command).toHaveBeenCalledWith(
            'gcode',
            expect.stringMatching(/^M3 S\d+$/),
        );
        await userEvent.click(
            canvas.getByRole('button', { name: 'Stop spindle (M5)' }),
        );
        await expect(command).toHaveBeenCalledWith('gcode', 'M5 S0');
    },
};

export const SpindleRunning = {
    parameters: { machine: { preset: 'idle', modal: { spindle: 'M3' } } },
};

export const LaserMode = {
    parameters: { machine: { preset: 'idle', settings: { $32: '1' } } },
    play: async ({ canvas }) => {
        // Laser controls replace the M3/M4/M5 buttons when $32 (laser mode) is on
        await expect(
            canvas.getByRole('button', { name: 'Laser On' }),
        ).toBeEnabled();
        await expect(
            canvas.queryByRole('button', {
                name: 'Start spindle clockwise (M3)',
            }),
        ).toBeNull();
    },
};

export const MultipleSpindles = {
    parameters: {
        machine: {
            preset: 'idle',
            spindles: [
                { id: 0, label: 'Router (PWM)', enabled: true, laser: false },
                { id: 1, label: 'Laser (PWM2)', enabled: false, laser: true },
            ],
        },
    },
    play: async ({ canvas }) => {
        // react-select exposes its input as a textbox; the chosen spindle renders beside it
        await expect(
            canvas.getByRole('textbox', { name: 'Select spindle' }),
        ).toBeEnabled();
        await expect(canvas.getByText('Router (PWM)')).toBeVisible();
    },
};

export const RunningJob = {
    parameters: { machine: { preset: 'running', modal: { spindle: 'M3' } } },
    play: async ({ canvas }) => {
        await expect(
            canvas.getByRole('button', { name: 'Stop spindle (M5)' }),
        ).toBeDisabled();
    },
};

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
};
