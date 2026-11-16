import { expect, fn } from 'storybook/test';
import {
    CARVE_LEFT,
    pendantParameters,
    withPendant,
} from '../../../../../../.storybook/pendant';

import Segmented from './Segmented';

// The option lists the carve screen passes: Position tab (Manual / Probe) and
// the Prep tab's power card (spindle direction, laser on/off)
const OPTION_SETS = {
    method: [
        { value: 'manual', label: 'Manual' },
        { value: 'probe', label: 'Probe' },
    ],
    spindle: [
        { value: 'cw', label: 'CW' },
        { value: 'ccw', label: 'CCW' },
        { value: 'off', label: 'Off' },
    ],
    laser: [
        { value: 'on', label: 'On' },
        { value: 'off', label: 'Off' },
    ],
};

const meta = {
    title: 'Pendant/Carve/Segmented',
    component: Segmented,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '90px' } },
        pendant: { width: CARVE_LEFT, padding: 10 },
    },
    args: {
        options: 'method',
        value: 'manual',
        tone: 'robin',
        disabled: false,
        onChange: fn(),
    },
    argTypes: {
        options: {
            description: 'Which of the carve screen’s option lists to show',
            control: { type: 'inline-radio' },
            options: Object.keys(OPTION_SETS),
            mapping: OPTION_SETS,
        },
        value: {
            description:
                'The selected segment; "none" is what a disconnected machine shows',
            control: { type: 'select' },
            options: ['manual', 'probe', 'cw', 'ccw', 'on', 'off', 'none'],
            mapping: { none: null },
        },
        tone: {
            description: 'Accent of the selected segment and the border',
            control: { type: 'inline-radio' },
            options: ['robin', 'laser'],
        },
        disabled: { control: { type: 'boolean' } },
    },
};

export default meta;

export const Manual = {
    play: async ({ args, canvas, userEvent }) => {
        await userEvent.click(canvas.getByRole('button', { name: 'Probe' }));
        await expect(args.onChange).toHaveBeenCalledWith('probe');
    },
};

export const Probe = {
    args: { value: 'probe' },
    play: async ({ canvas }) => {
        await expect(canvas.getByRole('button', { name: 'Probe' })).toHaveClass(
            'text-robin-400',
        );
    },
};

export const SpindleClockwise = {
    args: { options: 'spindle', value: 'cw' },
    play: async ({ args, canvas, userEvent }) => {
        await userEvent.click(canvas.getByRole('button', { name: 'CCW' }));
        await expect(args.onChange).toHaveBeenCalledWith('ccw');
    },
};

export const SpindleCounterClockwise = {
    args: { options: 'spindle', value: 'ccw' },
    play: async ({ canvas }) => {
        await expect(canvas.getByRole('button', { name: 'CCW' })).toHaveClass(
            'text-robin-400',
        );
    },
};

export const SpindleOff = {
    args: { options: 'spindle', value: 'off' },
    play: async ({ canvas }) => {
        await expect(canvas.getByRole('button', { name: 'Off' })).toHaveClass(
            'text-robin-400',
        );
    },
};

export const LaserOn = {
    args: { options: 'laser', value: 'on', tone: 'laser' },
    play: async ({ args, canvas, userEvent }) => {
        await expect(canvas.getByRole('button', { name: 'On' })).toHaveClass(
            'text-purple-200',
        );
        await userEvent.click(canvas.getByRole('button', { name: 'Off' }));
        await expect(args.onChange).toHaveBeenCalledWith('off');
    },
};

export const LaserOff = {
    args: { options: 'laser', value: 'off', tone: 'laser' },
    play: async ({ canvas }) => {
        await expect(canvas.getByRole('button', { name: 'Off' })).toHaveClass(
            'text-purple-200',
        );
    },
};

// Disconnected: the power card passes no value, so no segment is selected
export const NothingSelected = {
    args: { options: 'spindle', value: 'none' },
    play: async ({ canvas }) => {
        for (const button of canvas.getAllByRole('button')) {
            await expect(button).toHaveClass('text-content-disabled');
        }
    },
};

export const Disabled = {
    args: { options: 'spindle', value: 'cw', disabled: true },
    play: async ({ canvas }) => {
        for (const button of canvas.getAllByRole('button')) {
            await expect(button).toBeDisabled();
        }
    },
};

export const DisabledLaser = {
    args: { options: 'laser', value: 'off', tone: 'laser', disabled: true },
    play: async ({ canvas }) => {
        await expect(canvas.getByRole('button', { name: 'On' })).toBeDisabled();
    },
};
