import { expect, spyOn, waitFor, within } from 'storybook/test';
import controller from 'app/lib/controller';
import appStore from 'app/store';
import { ROTARY_TOGGLE_MACRO } from 'app/constants';

import RotaryNew from './index';

// Grbl's normal Y-axis firmware values, which rotary mode swaps out
const GRBL_IDLE = {
    preset: 'idle',
    type: 'Grbl',
    settings: { $101: '200', $111: '4000', $20: '0', $21: '0' },
};

const meta = {
    component: RotaryNew,
    tags: ['ai-generated'],
    // Machine and workspace state are applied by .storybook/machine-state.js
    parameters: { machine: GRBL_IDLE },
    decorators: [
        (Story) => (
            <div className="h-[260px] w-[460px] p-4">
                <Story />
            </div>
        ),
    ],
};

export default meta;

const body = (canvasElement) => within(canvasElement.ownerDocument.body);
const toggle = (canvas) =>
    canvas.getByRole('switch', { name: 'Toggle Rotary mode' });
const button = (canvas, name) => canvas.getByRole('button', { name });

// Confirm() renders through the shared ConfirmationDialog in the preview
const answerConfirm = async (canvasElement, userEvent, title, answer) => {
    const dialog = await body(canvasElement).findByRole('alertdialog', {
        name: title,
    });
    await userEvent.click(within(dialog).getByRole('button', { name: answer }));
};

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
    play: async ({ canvas }) => {
        await expect(toggle(canvas)).toBeDisabled();
    },
};

export const GrblDefaultMode = {
    play: async ({ canvas }) => {
        await expect(toggle(canvas)).not.toBeChecked();
        // On Grbl, rotary-only actions wait until rotary mode is on
        await expect(button(canvas, 'Rotary Surfacing')).toBeDisabled();
        await expect(button(canvas, 'Probe Rotary Z-Axis')).toBeDisabled();
        await expect(button(canvas, 'Y-Axis Alignment')).toBeEnabled();
    },
};

export const EnableRotaryMode = {
    play: async ({ canvas, canvasElement, userEvent }) => {
        const command = spyOn(controller, 'command');
        await userEvent.click(toggle(canvas));
        await answerConfirm(
            canvasElement,
            userEvent,
            'Enable Rotary Mode',
            'OK',
        );

        // Zeroes Y and swaps in the rotary axis's resolution and rate
        await expect(command).toHaveBeenCalledWith('gcode', [
            'G10 L20 P1 Y0',
            '$101=19.75308642',
            '$111=8000.00',
            '$20=0',
            '$21=0',
            '$$',
            ROTARY_TOGGLE_MACRO,
        ]);
        await expect(appStore.get('workspace.mode')).toBe('ROTARY');
        // The Grbl machine's own values are kept to restore later
        await expect(
            appStore.get('workspace.rotaryAxis.defaultFirmwareSettings'),
        ).toMatchObject({ $101: '200', $111: '4000' });
    },
};

export const CancelEnable = {
    play: async ({ canvas, canvasElement, userEvent }) => {
        const command = spyOn(controller, 'command');
        await userEvent.click(toggle(canvas));
        await answerConfirm(
            canvasElement,
            userEvent,
            'Enable Rotary Mode',
            'Cancel',
        );

        await waitFor(() =>
            expect(appStore.get('workspace.mode')).toBe('DEFAULT'),
        );
        await expect(command).not.toHaveBeenCalled();
        await waitFor(() => expect(toggle(canvas)).not.toBeChecked());
    },
};

export const DisableRotaryMode = {
    parameters: {
        workspace: { mode: 'ROTARY' },
        appStore: {
            'workspace.rotaryAxis.defaultFirmwareSettings': {
                $101: '200',
                $111: '4000',
                $20: '1',
                $21: '1',
            },
        },
    },
    play: async ({ canvas, userEvent }) => {
        const command = spyOn(controller, 'command');
        await expect(toggle(canvas)).toBeChecked();
        // In rotary mode the alignment cycle no longer applies
        await expect(button(canvas, 'Y-Axis Alignment')).toBeDisabled();

        await userEvent.click(toggle(canvas));
        // Restores the values saved when rotary mode was enabled
        await expect(command).toHaveBeenCalledWith('gcode', [
            '$101=200',
            '$111=4000',
            '$20=1',
            '$21=1',
            '$$',
            ROTARY_TOGGLE_MACRO,
        ]);
        await expect(appStore.get('workspace.mode')).toBe('DEFAULT');
    },
};

export const ProbeRotaryZ = {
    parameters: { machine: { ...GRBL_IDLE, type: 'grblHAL' } },
    play: async ({ canvas, canvasElement, userEvent }) => {
        const command = spyOn(controller, 'command');
        await userEvent.click(button(canvas, 'Probe Rotary Z-Axis'));
        await answerConfirm(
            canvasElement,
            userEvent,
            'Rotary Z-Axis probing',
            'Run',
        );
        await expect(command).toHaveBeenCalledWith(
            'gcode:safe',
            expect.anything(),
            'G21',
        );
    },
};

export const RunningJob = {
    parameters: {
        machine: { ...GRBL_IDLE, preset: 'running' },
        workspace: { mode: 'ROTARY' },
    },
    play: async ({ canvas }) => {
        await expect(button(canvas, 'Probe Rotary Z-Axis')).toBeDisabled();
        await expect(button(canvas, 'Y-Axis Alignment')).toBeDisabled();
    },
};
