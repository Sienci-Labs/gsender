import { expect } from 'storybook/test';
import {
    CARVE_LEFT,
    pendantParameters,
    withPendant,
} from '../../../../../../.storybook/pendant';

import { AlarmResource } from './AlarmHelperCard';
import LockedNotice from './LockedNotice';

const REASONS = {
    alarm: 'A limit switch was triggered, so the machine stopped immediately to protect itself. File, Position, Tools, Prep, Console, Macros and jogging stay hidden until the alarm clears.',
    homing: "Homing is required before any motion. File, Position, Tools, Prep, Console, Macros and jogging stay hidden until it's homed.",
    softLimit:
        'The last jog crossed a soft limit. File, Position, Tools, Prep, Console, Macros and jogging stay hidden until the alarm clears.',
    hold: 'Feed hold is engaged with no job running. File, Position, Tools, Prep, Console, Macros and jogging stay hidden until the hold clears.',
};

const meta = {
    title: 'Pendant/Carve/LockedNotice',
    component: LockedNotice,
    tags: ['ai-generated'],
    decorators: [withPendant],
    // The left column of the carve screen while Alarm or a job-less Hold locks
    // it. The guide footer reads the current alarm from the machine state.
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '380px' } },
        pendant: { width: CARVE_LEFT, height: 360 },
        machine: { preset: 'alarm', status: { alarmCode: 1 } },
    },
    args: { tone: 'alarm', children: 'alarm', footer: 'none' },
    argTypes: {
        tone: {
            description: 'Alarm shows "Locked", hold shows "Held"',
            control: { type: 'inline-radio' },
            options: ['alarm', 'hold'],
        },
        children: {
            description:
                'Why the screen is locked (the texts CarveScreen uses)',
            control: { type: 'select' },
            options: Object.keys(REASONS),
            mapping: REASONS,
        },
        footer: {
            description:
                "Extra content under the reason; CarveScreen passes the alarm's guide",
            control: { type: 'inline-radio' },
            options: ['none', 'alarmGuide'],
            mapping: { none: undefined, alarmGuide: <AlarmResource /> },
        },
    },
};

export default meta;

export const Alarm = {
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Locked')).toBeVisible();
        await expect(
            canvas.getByText(/A limit switch was triggered/),
        ).toBeVisible();
    },
};

export const AlarmWithGuide = {
    args: { footer: 'alarmGuide' },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Locked')).toBeVisible();
        await expect(canvas.getByRole('link')).toHaveAttribute(
            'href',
            'https://sienci.zendesk.com/hc/en-us/articles/41566952133524-Alarm-1-Alarm-2',
        );
    },
};

export const HomingRequired = {
    args: { children: 'homing' },
    parameters: { machine: { preset: 'alarm', status: { alarmCode: 11 } } },
    play: async ({ canvas }) => {
        await expect(canvas.getByText(/Homing is required/)).toBeVisible();
    },
};

export const SoftLimit = {
    args: { children: 'softLimit' },
    parameters: { machine: { preset: 'alarm', status: { alarmCode: 2 } } },
    play: async ({ canvas }) => {
        await expect(canvas.getByText(/crossed a soft limit/)).toBeVisible();
    },
};

export const Hold = {
    args: { tone: 'hold', children: 'hold' },
    parameters: {
        machine: { preset: 'idle', status: { activeState: 'Hold' } },
    },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Held')).toBeVisible();
        await expect(canvas.getByText(/Feed hold is engaged/)).toBeVisible();
    },
};
