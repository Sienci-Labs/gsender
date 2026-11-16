import { expect, spyOn, waitFor } from 'storybook/test';
import controller from 'app/lib/controller';
import {
    pendantParameters,
    stubPendantConnection,
    withPendant,
} from '../../../../../../.storybook/pendant';

import CarveTopBar from './CarveTopBar';

const CARVE_MODES = [
    'disconnected',
    'setup',
    'running',
    'holdJob',
    'holdIdle',
    'alarm',
    'toolchange',
];

const HOMING_ENABLED = { $22: '1' };

const meta = {
    title: 'Pendant/Carve/CarveTopBar',
    component: CarveTopBar,
    tags: ['ai-generated'],
    decorators: [withPendant],
    // `mode` sets the badge tone and alarm headline; connection, the badge label
    // and whether Home / E-STOP are enabled come from the machine state
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '120px' } },
        machine: { preset: 'idle', port: 'COM4', settings: HOMING_ENABLED },
    },
    beforeEach: stubPendantConnection,
    args: { mode: 'setup' },
    argTypes: {
        mode: {
            description:
                'Carve screen mode (resolved from connection, workflow and active state in the app)',
            control: { type: 'select' },
            options: CARVE_MODES,
        },
    },
};

export default meta;

const button = (canvas, name) => canvas.getByRole('button', { name });
const badge = (canvas, name) => canvas.findByRole('button', { name });

export const Disconnected = {
    args: { mode: 'disconnected' },
    parameters: { machine: { preset: 'disconnected' } },
    play: async ({ canvas }) => {
        // The connect pill pops in
        await waitFor(() =>
            expect(canvas.getByText('Connect to CNC')).toBeVisible(),
        );
        await expect(button(canvas, 'Home')).toBeDisabled();
        await expect(button(canvas, 'E-STOP')).toBeDisabled();
    },
};

export const Idle = {
    play: async ({ canvas, userEvent }) => {
        await expect(await badge(canvas, /on COM4, Idle/)).toBeVisible();
        const command = spyOn(controller, 'command').mockImplementation(
            () => {},
        );
        await userEvent.click(button(canvas, 'Home'));
        await expect(command).toHaveBeenCalledWith('homing');
    },
};

export const HomingDisabledInFirmware = {
    // $22 = 0: homing cycle off (story parameters merge over the file's)
    parameters: { machine: { settings: { $22: '0' } } },
    play: async ({ canvas }) => {
        await expect(await badge(canvas, /Idle/)).toBeVisible();
        await expect(button(canvas, 'Home')).toBeDisabled();
        await expect(button(canvas, 'E-STOP')).toBeEnabled();
    },
};

export const Running = {
    args: { mode: 'running' },
    parameters: {
        machine: { preset: 'running', port: 'COM4', settings: HOMING_ENABLED },
    },
    play: async ({ canvas }) => {
        await expect(await badge(canvas, /Run\./)).toBeVisible();
        await expect(button(canvas, 'Home')).toBeDisabled();
        await expect(button(canvas, 'E-STOP')).toBeEnabled();
    },
};

export const HoldDuringJob = {
    args: { mode: 'holdJob' },
    parameters: {
        machine: { preset: 'hold', port: 'COM4', settings: HOMING_ENABLED },
    },
    play: async ({ canvas }) => {
        await expect(await badge(canvas, /Hold/)).toBeVisible();
    },
};

export const Alarm = {
    args: { mode: 'alarm' },
    parameters: {
        machine: {
            preset: 'alarm',
            port: 'COM4',
            settings: HOMING_ENABLED,
            status: { alarmCode: 1 },
        },
    },
    play: async ({ canvas }) => {
        await expect(await badge(canvas, /Alarm/)).toBeVisible();
        // The alarm's description takes the clock's place
        await expect(canvas.getByRole('status')).toBeVisible();
        await expect(button(canvas, 'Home')).toBeDisabled();
    },
};

export const AlarmHomingRequired = {
    args: { mode: 'alarm' },
    parameters: {
        machine: {
            preset: 'alarm',
            port: 'COM4',
            settings: HOMING_ENABLED,
            status: { alarmCode: 11 },
        },
    },
    play: async ({ canvas }) => {
        await expect(await badge(canvas, /on COM4/)).toBeVisible();
        // Homing is the way out of this alarm, so Home stays available
        await expect(button(canvas, 'Home')).toBeEnabled();
    },
};

export const ToolChange = {
    args: { mode: 'toolchange' },
    parameters: {
        machine: {
            preset: 'hold',
            port: 'COM4',
            settings: HOMING_ENABLED,
            status: { activeState: 'Tool' },
        },
    },
    play: async ({ canvas }) => {
        await expect(await badge(canvas, /Tool change/)).toBeVisible();
    },
};

export const ReceivingFile = {
    play: async ({ canvas }) => {
        await expect(await badge(canvas, /Idle/)).toBeVisible();
        const emit = (eventName, ...args) =>
            controller.listeners[eventName].forEach((listener) =>
                listener(...args),
            );
        emit('remote:file-incoming:start', { name: 'sign.nc', size: 20480 });
        emit('remote:file-incoming:progress', 40);
        // The incoming-file pill pops in beside Home
        await waitFor(() => expect(canvas.getByText('40%')).toBeVisible());
    },
};
