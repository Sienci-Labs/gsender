import { expect, spyOn } from 'storybook/test';
import controller from 'app/lib/controller';
import {
    DRAWER_MINIMAL,
    LEGACY,
    pendantParameters,
    withPendant,
} from '../../../../.storybook/pendant';

import CoolantPanel from './CoolantPanel';

// Mirrors app/src/features/Coolant/Coolant.stories.jsx. The pendant's coolant
// tab in the legacy carve screen's bottom drawer; which button glows and
// whether they are clickable comes from the machine state (modal.coolant)
const meta = {
    title: 'Pendant/Legacy/CoolantPanel',
    component: CoolantPanel,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '200px' } },
        pendant: { width: LEGACY.width, height: DRAWER_MINIMAL },
        machine: { preset: 'idle' },
    },
};

export default meta;

const buttons = (canvas) =>
    ['Mist', 'Flood', 'Off'].map((name) => canvas.getByText(name));

export const Idle = {
    play: async ({ canvas, userEvent }) => {
        const command = spyOn(controller, 'command').mockImplementation(
            () => {},
        );
        await userEvent.click(canvas.getByText('Mist'));
        await expect(command).toHaveBeenCalledWith('gcode', 'M7');
        await userEvent.click(canvas.getByText('Off'));
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

// Buttons are plain divs; disabled ones fade to 40% and drop their handler
const allFaded = async ({ canvas }) => {
    for (const label of buttons(canvas)) {
        await expect(label.parentElement).toHaveClass('opacity-40');
    }
};

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
    play: allFaded,
};

export const RunningJob = {
    parameters: { machine: { preset: 'running', modal: { coolant: 'M8' } } },
    play: allFaded,
};

export const Alarm = {
    parameters: { machine: { preset: 'alarm' } },
    play: allFaded,
};
