import { expect, fireEvent, spyOn, waitFor } from 'storybook/test';
import controller from 'app/lib/controller';
import {
    LEGACY_CARD,
    pendantParameters,
    withPendant,
} from '../../../../.storybook/pendant';

import JoggingCard from './JoggingCard';

// Mirrors app/src/features/Jogging/Jogging.stories.jsx. The legacy carve
// screen's jog card (right column, under the DRO): step presets, the XY pad,
// Z and A. Whether it is enabled comes from the machine state; step sizes and
// feeds from app/store (widgets.axes.jog.<preset>) in the workspace units
const meta = {
    title: 'Pendant/Legacy/JoggingCard',
    component: JoggingCard,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '520px' } },
        pendant: { width: LEGACY_CARD, height: 480 },
        machine: { preset: 'idle' },
    },
    beforeEach() {
        // Jogs are socket commands
        spyOn(controller, 'command').mockImplementation(() => {});
    },
};

export default meta;

const jog = (canvas, name) => canvas.getByRole('button', { name });

// A press shorter than the long-press threshold is one step
const tap = async (button) => {
    await fireEvent.pointerDown(button);
    await fireEvent.pointerUp(button);
};

export const Idle = {
    play: async ({ canvas }) => {
        await tap(jog(canvas, 'Jog X plus'));
        await expect(controller.command).toHaveBeenCalledWith(
            'jog:feed',
            { X: 5 },
            3000,
            'mm',
        );
    },
};

export const PrecisePreset = {
    play: async ({ canvas, userEvent }) => {
        await userEvent.click(jog(canvas, 'Precise'));
        await expect(jog(canvas, 'Precise')).toHaveClass('bg-robin-500');
    },
};

export const RapidPreset = {
    play: async ({ canvas, userEvent }) => {
        await userEvent.click(jog(canvas, 'Rapid'));
        await expect(jog(canvas, 'Rapid')).toHaveClass('bg-robin-500');
        await tap(jog(canvas, 'Jog Y minus'));
        await expect(controller.command).toHaveBeenCalledWith(
            'jog:feed',
            { Y: -20 },
            5000,
            'mm',
        );
    },
};

// Held past the long-press threshold: the button fills with its axis colour
// and the machine jogs until release
export const ContinuousJog = {
    play: async ({ canvas }) => {
        const button = jog(canvas, 'Jog X plus');
        await fireEvent.pointerDown(button);
        await waitFor(() =>
            expect(controller.command).toHaveBeenCalledWith(
                'jog:start',
                { X: 1 },
                3000,
                'mm',
            ),
        );
    },
};

export const RotaryAxis = {
    parameters: { machine: { preset: 'idle', axes: ['X', 'Y', 'Z', 'A'] } },
};

// Rotary mode: the A buttons drive the Y motor
export const RotaryMode = {
    parameters: {
        machine: { preset: 'idle', axes: ['X', 'Y', 'Z', 'A'] },
        workspace: { mode: 'ROTARY' },
    },
};

export const Imperial = {
    parameters: { workspace: { units: 'in' } },
};

export const RunningJob = {
    parameters: { machine: { preset: 'running' } },
    play: async ({ canvas }) => {
        await expect(jog(canvas, 'Jog X plus')).toBeDisabled();
    },
};

export const Alarm = {
    parameters: { machine: { preset: 'alarm', status: { alarmCode: 1 } } },
    play: async ({ canvas }) => {
        await expect(jog(canvas, 'Jog X plus')).toBeDisabled();
    },
};

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
    play: async ({ canvas }) => {
        await expect(jog(canvas, 'Jog X plus')).toBeDisabled();
    },
};
