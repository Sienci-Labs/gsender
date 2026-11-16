import { expect, spyOn } from 'storybook/test';
import controller from 'app/lib/controller';
import {
    CARVE_LEFT,
    pendantParameters,
    withPendant,
} from '../../../../../../.storybook/pendant';

import RunLeft from './RunLeft';

const meta = {
    title: 'Pendant/Carve/RunLeft',
    component: RunLeft,
    tags: ['ai-generated'],
    decorators: [withPendant],
    // Left column of the carve screen while a job runs or is paused: both
    // override faders over the rapid presets, all read from the status report
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '540px' } },
        pendant: { width: CARVE_LEFT, height: 500 },
        machine: {
            preset: 'running',
            status: { ov: [100, 100, 100], feedrate: 1200, spindle: 18000 },
        },
    },
    beforeEach: () => {
        spyOn(controller, 'command').mockImplementation(() => {});
    },
};

export default meta;

const slider = (canvas, name) => canvas.getByRole('slider', { name });

export const Running = {
    play: async ({ canvas, userEvent }) => {
        await expect(slider(canvas, 'Feed override')).toBeVisible();
        await expect(slider(canvas, 'Spindle override')).toBeVisible();

        await userEvent.click(canvas.getByRole('button', { name: '25%' }));
        await expect(controller.command).toHaveBeenCalledWith(
            'rapidOverride',
            25,
        );
    },
};

export const OverridesApplied = {
    parameters: {
        machine: {
            preset: 'running',
            status: { ov: [140, 50, 80], feedrate: 1680, spindle: 14400 },
        },
    },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('140%')).toBeVisible();
        await expect(canvas.getByText('80%')).toBeVisible();
        await expect(canvas.getByRole('button', { name: '50%' })).toHaveClass(
            'bg-blue-600',
        );
    },
};

export const FeedHold = {
    parameters: {
        machine: {
            preset: 'hold',
            status: { ov: [100, 100, 100], feedrate: 0, spindle: 18000 },
        },
    },
    play: async ({ canvas }) => {
        // Overrides stay live while the job is paused
        await expect(slider(canvas, 'Feed override')).toHaveAttribute(
            'aria-disabled',
            'false',
        );
        await expect(canvas.getByText('F0 mm/min')).toBeVisible();
    },
};

export const Laser = {
    parameters: { appStore: { 'widgets.spindle.mode': 'laser' } },
    play: async ({ canvas }) => {
        await expect(slider(canvas, 'Power override')).toBeVisible();
    },
};
