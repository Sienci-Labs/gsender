import { expect, spyOn } from 'storybook/test';
import controller from 'app/lib/controller';
import {
    LEGACY_CARD,
    pendantParameters,
    withPendant,
} from '../../../../.storybook/pendant';

import JobControls from './JobControls';

const FILE = { name: 'sign-carving.nc', total: 4000 };

// Sender progress 30% of the way through FILE
const SENDER = {
    sent: 1200,
    received: 1190,
    total: 4000,
    currentLineRunning: 1200,
    elapsedTime: 6 * 60 * 1000,
    remainingTime: 14 * 60,
};

// Mirrors app/src/features/JobControl/JobControl.stories.jsx. Start / Pause /
// Stop under the legacy carve screen's visualizer card, built from the
// desktop's ControlButton; which are enabled comes from the machine state
const meta = {
    title: 'Pendant/JobControls',
    component: JobControls,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '140px' } },
        pendant: { width: LEGACY_CARD, height: 100, padding: '12px 0' },
        machine: { preset: 'idle', file: FILE },
    },
};

export default meta;

const button = (canvas, name) => canvas.getByRole('button', { name });

export const ReadyToStart = {
    play: async ({ canvas, userEvent }) => {
        const command = spyOn(controller, 'command').mockImplementation(
            () => {},
        );
        await expect(button(canvas, 'Pause')).toBeDisabled();
        await expect(button(canvas, 'Stop')).toBeDisabled();
        await userEvent.click(button(canvas, 'Start'));
        await expect(command).toHaveBeenCalledWith('gcode:start');
    },
};

export const NoFileLoaded = {
    parameters: { machine: { preset: 'idle', file: null } },
    play: async ({ canvas }) => {
        await expect(button(canvas, 'Start')).toBeDisabled();
    },
};

export const Running = {
    parameters: {
        machine: { preset: 'running', file: FILE, sender: SENDER },
    },
    play: async ({ canvas }) => {
        await expect(button(canvas, 'Start')).toBeDisabled();
        await expect(button(canvas, 'Pause')).toBeEnabled();
    },
};

export const Paused = {
    parameters: { machine: { preset: 'hold', file: FILE, sender: SENDER } },
    play: async ({ canvas }) => {
        await expect(button(canvas, 'Stop')).toBeEnabled();
    },
};

export const Alarm = {
    parameters: { machine: { preset: 'alarm', file: FILE } },
};

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected', file: FILE } },
    play: async ({ canvas }) => {
        await expect(button(canvas, 'Start')).toBeDisabled();
    },
};
