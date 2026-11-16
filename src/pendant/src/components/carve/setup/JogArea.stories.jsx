import { expect, fireEvent, spyOn, waitFor } from 'storybook/test';
import controller from 'app/lib/controller';
import {
    CARVE_RIGHT,
    pendantParameters,
    withPendant,
} from '../../../../../../.storybook/pendant';

import JogArea from './JogArea';

const JOG_BUTTONS = [
    'Jog X minus Y plus',
    'Jog Y plus',
    'Jog X plus Y plus',
    'Jog X minus',
    'Jog X plus',
    'Jog X minus Y minus',
    'Jog Y minus',
    'Jog X plus Y minus',
    'Jog Z plus',
    'Jog Z minus',
    'Jog A plus',
    'Jog A minus',
];

const meta = {
    title: 'Pendant/Carve/JogArea',
    component: JogArea,
    tags: ['ai-generated'],
    decorators: [withPendant],
    // The right column of the carve screen in Setup mode. Whether the pad is
    // enabled comes from the machine state; the step sizes and feed of each
    // preset from app/store (widgets.axes.jog.<preset>), in the workspace units.
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '560px' } },
        pendant: { width: CARVE_RIGHT, height: 520, padding: 10 },
        machine: { preset: 'idle' },
    },
    args: { className: 'flex-1' },
    argTypes: { className: { table: { disable: true } } },
    beforeEach() {
        // Jogs are socket commands
        spyOn(controller, 'command').mockImplementation(() => {});
    },
};

export default meta;

const preset = (canvas, name) => canvas.getByRole('button', { name });
const jog = (canvas, name) => canvas.getByRole('button', { name });

// A press shorter than the long-press threshold (250 ms) is one step
const tap = async (button) => {
    await fireEvent.pointerDown(button);
    await fireEvent.pointerUp(button);
};

const allDisabled = async ({ canvas }) => {
    for (const name of JOG_BUTTONS) {
        await expect(jog(canvas, name)).toBeDisabled();
    }
    // The presets stay selectable
    await expect(preset(canvas, 'Rapid')).toBeEnabled();
};

// Connected and idle: Normal preset, every direction enabled
export const Idle = {
    play: async ({ canvas }) => {
        await expect(preset(canvas, 'Normal')).toHaveClass('bg-robin-500');
        for (const name of JOG_BUTTONS) {
            await expect(jog(canvas, name)).toBeEnabled();
        }
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
        await userEvent.click(preset(canvas, 'Precise'));
        await expect(preset(canvas, 'Precise')).toHaveClass('bg-robin-500');
        await tap(jog(canvas, 'Jog Z minus'));
        await expect(controller.command).toHaveBeenCalledWith(
            'jog:feed',
            { Z: -0.1 },
            1000,
            'mm',
        );
    },
};

export const RapidPreset = {
    play: async ({ canvas, userEvent }) => {
        await userEvent.click(preset(canvas, 'Rapid'));
        await expect(preset(canvas, 'Rapid')).toHaveClass('bg-robin-500');
        await tap(jog(canvas, 'Jog X minus Y plus'));
        await expect(controller.command).toHaveBeenCalledWith(
            'jog:feed',
            { X: -20, Y: 20 },
            5000,
            'mm',
        );
    },
};

// Pressed and held: the button fills with its axis colour and the machine
// jogs continuously until release
export const ContinuousJog = {
    play: async ({ canvas }) => {
        const button = jog(canvas, 'Jog Y plus');
        await fireEvent.pointerDown(button);
        await waitFor(() =>
            expect(controller.command).toHaveBeenCalledWith(
                'jog:start',
                { Y: 1 },
                3000,
                'mm',
            ),
        );
        await expect(button).toHaveClass('bg-axis-y');
        await expect(controller.command).not.toHaveBeenCalledWith('jog:stop');
    },
};

export const ContinuousJogReleased = {
    play: async ({ canvas }) => {
        const button = jog(canvas, 'Jog Z plus');
        await fireEvent.pointerDown(button);
        await waitFor(() =>
            expect(controller.command).toHaveBeenCalledWith(
                'jog:start',
                { Z: 1 },
                3000,
                'mm',
            ),
        );
        await fireEvent.pointerUp(button);
        await expect(controller.command).toHaveBeenCalledWith('jog:stop');
        await expect(button).not.toHaveClass('bg-axis-z');
    },
};

export const AAxisJog = {
    parameters: { machine: { preset: 'idle', axes: ['X', 'Y', 'Z', 'A'] } },
    play: async ({ canvas }) => {
        await tap(jog(canvas, 'Jog A plus'));
        await expect(controller.command).toHaveBeenCalledWith(
            'jog:feed',
            { A: 5 },
            3000,
            'mm',
        );
    },
};

// Rotary mode: the A pad drives the Y motor
export const RotaryMode = {
    parameters: {
        machine: { preset: 'idle', axes: ['X', 'Y', 'Z', 'A'] },
        workspace: { mode: 'ROTARY' },
    },
    play: async ({ canvas }) => {
        await tap(canvas.getByText('A−').closest('button'));
        await expect(controller.command).toHaveBeenCalledWith(
            'jog:feed',
            { Y: -5 },
            3000,
            'mm',
        );
    },
};

// Steps and feed convert to inches (5 mm -> 0.197 in)
export const Imperial = {
    parameters: { workspace: { units: 'in' } },
    play: async ({ canvas }) => {
        await tap(jog(canvas, 'Jog X plus'));
        await waitFor(() =>
            expect(controller.command).toHaveBeenCalledWith(
                'jog:feed',
                { X: expect.closeTo(0.197, 2) },
                expect.closeTo(118.11, 0),
                'in',
            ),
        );
    },
};

// The machine is mid-jog: the pad stays live so the next jog can queue
export const Jogging = {
    parameters: { machine: { preset: 'idle', status: { activeState: 'Jog' } } },
    play: async ({ canvas }) => {
        await expect(jog(canvas, 'Jog X plus')).toBeEnabled();
    },
};

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
    play: allDisabled,
};

export const Running = {
    parameters: { machine: { preset: 'running' } },
    play: allDisabled,
};

export const Hold = {
    parameters: { machine: { preset: 'hold' } },
    play: allDisabled,
};

export const Alarm = {
    parameters: { machine: { preset: 'alarm', status: { alarmCode: 1 } } },
    play: async (context) => {
        await allDisabled(context);
        await tap(jog(context.canvas, 'Jog X plus'));
        await expect(controller.command).not.toHaveBeenCalled();
    },
};
