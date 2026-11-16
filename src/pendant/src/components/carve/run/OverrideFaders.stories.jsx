import { expect, spyOn, waitFor } from 'storybook/test';
import controller from 'app/lib/controller';
import {
    CARVE_LEFT,
    pendantParameters,
    withPendant,
} from '../../../../../../.storybook/pendant';

import OverrideFaders from './OverrideFaders';

const meta = {
    title: 'Pendant/Carve/OverrideFaders',
    component: OverrideFaders,
    tags: ['ai-generated'],
    decorators: [withPendant],
    // The percentages come from the status report's `ov: [feed, rapid, spindle]`,
    // the sub-lines from its feedrate and spindle speed (.storybook/machine-state.js)
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '460px' } },
        pendant: { width: CARVE_LEFT, height: 420, padding: 10 },
        machine: {
            preset: 'running',
            status: { ov: [100, 100, 100], feedrate: 1200, spindle: 18000 },
        },
    },
    beforeEach: () => {
        spyOn(controller, 'command').mockImplementation(() => {});
    },
    args: { fill: true },
    argTypes: {
        fill: {
            description:
                'Grow the cards into the spare height of the column; off keeps the fixed-height track',
            control: { type: 'boolean' },
        },
    },
};

export default meta;

const slider = (canvas, name) => canvas.getByRole('slider', { name });

export const Default = {
    play: async ({ canvas }) => {
        await expect(slider(canvas, 'Feed override')).toHaveAttribute(
            'aria-valuenow',
            '100',
        );
        await expect(slider(canvas, 'Spindle override')).toHaveAttribute(
            'aria-valuenow',
            '100',
        );
        await expect(canvas.getByText('F1200 mm/min')).toBeVisible();
        await expect(canvas.getByText('18000 RPM')).toBeVisible();
    },
};

export const FeedSlowedSpindleBoosted = {
    parameters: {
        machine: {
            preset: 'running',
            status: { ov: [50, 100, 130], feedrate: 600, spindle: 23400 },
        },
    },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('50%')).toBeVisible();
        await expect(canvas.getByText('130%')).toBeVisible();
    },
};

export const AtLimits = {
    parameters: {
        machine: {
            preset: 'running',
            status: { ov: [200, 100, 20], feedrate: 2400, spindle: 3600 },
        },
    },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('200%')).toBeVisible();
        await expect(canvas.getByText('20%')).toBeVisible();
    },
};

export const Laser = {
    parameters: { appStore: { 'widgets.spindle.mode': 'laser' } },
    play: async ({ canvas }) => {
        await expect(slider(canvas, 'Power override')).toBeVisible();
        await expect(canvas.getByText('Laser power')).toBeVisible();
    },
};

export const ImperialUnits = {
    parameters: { workspace: { units: 'in' } },
    play: async ({ canvas }) => {
        await expect(canvas.getByText(/in\/min/)).toBeVisible();
    },
};

export const FeedHold = {
    parameters: {
        machine: {
            preset: 'hold',
            status: { ov: [80, 100, 100], feedrate: 0, spindle: 18000 },
        },
    },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('80%')).toBeVisible();
        await expect(canvas.getByText('F0 mm/min')).toBeVisible();
    },
};

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
    play: async ({ canvas }) => {
        await expect(slider(canvas, 'Feed override')).toHaveAttribute(
            'aria-disabled',
            'true',
        );
        await expect(
            canvas.getByRole('button', {
                name: 'Hold to reset spindle override',
            }),
        ).toBeDisabled();
    },
};

export const FixedHeight = {
    args: { fill: false },
    play: async ({ canvas }) => {
        await expect(slider(canvas, 'Feed override')).toBeVisible();
    },
};

export const NudgeFeedWithKeyboard = {
    play: async ({ canvas, userEvent }) => {
        slider(canvas, 'Feed override').focus();
        await userEvent.keyboard('{ArrowUp}');
        // The readout follows at once; the command is debounced
        await expect(canvas.getByText('110%')).toBeVisible();
        await waitFor(() =>
            expect(controller.command).toHaveBeenCalledWith(
                'feedOverride',
                110,
            ),
        );
    },
};

export const NudgeSpindleWithKeyboard = {
    play: async ({ canvas, userEvent }) => {
        slider(canvas, 'Spindle override').focus();
        await userEvent.keyboard('{ArrowDown}');
        await expect(canvas.getByText('90%')).toBeVisible();
        await waitFor(() =>
            expect(controller.command).toHaveBeenCalledWith(
                'spindleOverride',
                90,
            ),
        );
    },
};
