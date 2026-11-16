import { expect, spyOn } from 'storybook/test';
import controller from 'app/lib/controller';
import { store as reduxStore } from 'app/store/redux';
import { stateFromArgs } from '../../../../../../.storybook/machine-args';
import { applyMachineState } from '../../../../../../.storybook/machine-state';
import {
    CARVE_RIGHT,
    pendantParameters,
    withPendant,
} from '../../../../../../.storybook/pendant';

import AlarmHelperCard from './AlarmHelperCard';

// Alarm codes with their own helper text, plus one without (3) and none at all
// (0, the bare fallback). 'Homing' is grbl's homing lock; grblHAL reports 11.
const ALARM_CODES = [0, 1, 2, 3, 4, 10, 11, 'Homing'];

const meta = {
    title: 'Pendant/Carve/AlarmHelperCard',
    component: AlarmHelperCard,
    tags: ['ai-generated'],
    decorators: [withPendant],
    // Shown in the right column in `alarm` mode, with the p-2.5 CarveScreen
    // puts around it. Machine state is applied by .storybook/machine-state.js;
    // `alarmCode` is folded into it below so it can be a control.
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '520px' } },
        pendant: { width: CARVE_RIGHT, height: 500, padding: 10 },
        machine: { preset: 'alarm' },
    },
    args: { alarmCode: 1 },
    argTypes: {
        alarmCode: {
            description:
                'Alarm the controller reports (status.alarmCode); picks the message and whether the way out is Unlock or Home',
            control: { type: 'select' },
            options: ALARM_CODES,
            table: { category: 'Machine state' },
        },
    },
    // The card takes no props
    render: () => <AlarmHelperCard />,
    beforeEach: ({ args, parameters, argsByTarget }) => {
        const { machine } = stateFromArgs(parameters, argsByTarget);
        applyMachineState(reduxStore, {
            ...machine,
            status: { ...machine.status, alarmCode: args.alarmCode },
        });
        spyOn(controller, 'command').mockImplementation(() => {});
    },
};

export default meta;

const button = (canvas, name) => canvas.getByRole('button', { name });

export const HardLimit = {
    play: async ({ canvas, userEvent }) => {
        await expect(canvas.getByText('Hard limit triggered')).toBeVisible();
        // Limit alarms clear with a limit reset rather than a plain unlock
        await userEvent.click(button(canvas, 'Unlock ($X)'));
        await expect(controller.command).toHaveBeenCalledWith('reset:limit');
        await userEvent.click(button(canvas, 'Reset'));
        await expect(controller.command).toHaveBeenCalledWith('reset:soft');
    },
};

export const SoftLimit = {
    args: { alarmCode: 2 },
    play: async ({ canvas, userEvent }) => {
        await expect(canvas.getByText('Soft limit triggered')).toBeVisible();
        await userEvent.click(button(canvas, 'Unlock ($X)'));
        await expect(controller.command).toHaveBeenCalledWith('reset:limit');
    },
};

export const HomingRequired = {
    args: { alarmCode: 11 },
    play: async ({ canvas, userEvent }) => {
        // The way out is homing, not unlocking
        await userEvent.click(button(canvas, 'Home ($H)'));
        await expect(controller.command).toHaveBeenCalledWith('homing');
        await expect(
            canvas.queryByRole('button', { name: 'Unlock ($X)' }),
        ).not.toBeInTheDocument();
    },
};

export const HomingRequiredOnGrbl = {
    args: { alarmCode: 'Homing' },
    parameters: { machine: { preset: 'alarm', type: 'Grbl' } },
    play: async ({ canvas, userEvent }) => {
        await userEvent.click(button(canvas, 'Home ($H)'));
        await expect(controller.command).toHaveBeenCalledWith('homing');
        await userEvent.click(button(canvas, 'Reset'));
        await expect(controller.command).toHaveBeenCalledWith('reset');
    },
};

export const ProbeFail = {
    args: { alarmCode: 4 },
    play: async ({ canvas, userEvent }) => {
        await userEvent.click(button(canvas, 'Unlock ($X)'));
        await expect(controller.command).toHaveBeenCalledWith('unlock');
    },
};

export const EStop = {
    args: { alarmCode: 10 },
    play: async ({ canvas, userEvent }) => {
        await userEvent.click(button(canvas, 'Unlock ($X)'));
        await expect(controller.command).toHaveBeenCalledWith('reset:limit');
    },
};

export const ControllerTextOnly = {
    // No entry in the helper registry: just the controller's own description
    args: { alarmCode: 3 },
    play: async ({ canvas, userEvent }) => {
        await expect(button(canvas, 'Unlock ($X)')).toBeVisible();
        await userEvent.click(button(canvas, 'Unlock ($X)'));
        await expect(controller.command).toHaveBeenCalledWith('unlock');
    },
};

export const NoAlarmCode = {
    // Alarm state before the controller has reported which alarm
    args: { alarmCode: 0 },
    play: async ({ canvas }) => {
        await expect(
            canvas.getByRole('heading', { name: 'Alarm' }),
        ).toBeVisible();
        await expect(
            canvas.getByText(/The controller is in an alarm state/),
        ).toBeVisible();
    },
};
