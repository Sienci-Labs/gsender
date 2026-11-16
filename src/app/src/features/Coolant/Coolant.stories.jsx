import { expect, spyOn } from 'storybook/test';
import controller from 'app/lib/controller';

import Coolant from './index';

const meta = {
    component: Coolant,
    tags: ['ai-generated'],
    // Machine state is applied to the Redux store by .storybook/machine-state.js
    parameters: {
        docs: { story: { inline: false, height: '620px' } },
        machine: { preset: 'idle' },
    },
};

export default meta;

const buttons = (canvas) =>
    ['Mist', 'Flood', 'Off'].map((name) =>
        canvas.getByRole('button', { name }),
    );

export const Idle = {
    play: async ({ canvas, userEvent }) => {
        const command = spyOn(controller, 'command');
        await userEvent.click(canvas.getByRole('button', { name: 'Mist' }));
        await expect(command).toHaveBeenCalledWith('gcode', 'M7');
        await userEvent.click(canvas.getByRole('button', { name: 'Off' }));
        await expect(command).toHaveBeenCalledWith('gcode', 'M9');
    },
};

export const MistOn = {
    parameters: { machine: { preset: 'idle', modal: { coolant: 'M7' } } },
};

export const FloodOn = {
    parameters: { machine: { preset: 'idle', modal: { coolant: 'M8' } } },
};

export const MistAndFloodOn = {
    parameters: {
        machine: { preset: 'idle', modal: { coolant: ['M7', 'M8'] } },
    },
};

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
    play: async ({ canvas }) => {
        for (const button of buttons(canvas))
            await expect(button).toBeDisabled();
    },
};

export const RunningJob = {
    parameters: { machine: { preset: 'running', modal: { coolant: 'M8' } } },
    play: async ({ canvas }) => {
        for (const button of buttons(canvas))
            await expect(button).toBeDisabled();
    },
};

export const Alarm = {
    parameters: { machine: { preset: 'alarm' } },
    play: async ({ canvas }) => {
        for (const button of buttons(canvas))
            await expect(button).toBeDisabled();
    },
};
