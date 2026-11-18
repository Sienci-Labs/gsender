import { expect, spyOn } from 'storybook/test';
import controller from 'app/lib/controller';
import {
    LEGACY_CARD,
    pendantParameters,
    withPendant,
} from '../../../../.storybook/pendant';

import DROCard from './DROCard';

const POSITIONED = {
    mpos: { x: -412.25, y: -301.5, z: -12.75 },
    wpos: { x: 120.5, y: 80.25, z: 3.1 },
};

// Mirrors app/src/features/DRO/DRO.stories.jsx. The legacy carve screen's DRO
// card (right column): work/machine position, per-axis Go To and Zero, and
// Home / Go to XY / Zero All. Positions and gating come from the machine state
const meta = {
    title: 'Pendant/Legacy/DROCard',
    component: DROCard,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '420px' } },
        pendant: { width: LEGACY_CARD, height: 340 },
        machine: { preset: 'idle' },
    },
    beforeEach() {
        spyOn(controller, 'command').mockImplementation(() => {});
    },
};

export default meta;

const zeroAll = (canvas) => canvas.getByRole('button', { name: /Zero All/ });

export const Idle = {
    play: async ({ canvas, userEvent }) => {
        const [zeroX] = canvas.getAllByRole('button', { name: 'ZERO' });
        await userEvent.click(zeroX);
        await expect(controller.command).toHaveBeenCalledWith(
            'gcode',
            'G10 L20 P0 X0',
        );
    },
};

export const Positioned = {
    parameters: { machine: { preset: 'idle', ...POSITIONED } },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('120.500')).toBeVisible();
    },
};

// The Work / Machine toggle switches to machine coordinates
export const MachinePosition = {
    parameters: { machine: { preset: 'idle', ...POSITIONED } },
    play: async ({ canvas, userEvent }) => {
        await userEvent.click(canvas.getByRole('button', { name: 'machine' }));
        await expect(canvas.getByText('-412.250')).toBeVisible();
    },
};

// The controller reports in inches (G20)
export const Inches = {
    parameters: {
        machine: {
            preset: 'idle',
            mpos: { x: 25.4, y: 50.8, z: -12.7 },
            modal: { units: 'G20' },
        },
        workspace: { units: 'in' },
    },
};

export const HomingEnabled = {
    parameters: {
        machine: { preset: 'idle', settings: { $22: '1' }, hasHomed: true },
    },
    play: async ({ canvas }) => {
        await expect(
            canvas.getByRole('button', { name: /Home/ }),
        ).toBeEnabled();
    },
};

export const FourAxis = {
    parameters: {
        machine: {
            preset: 'idle',
            axes: ['X', 'Y', 'Z', 'A'],
            wpos: { x: 10, y: 0, z: 2, a: 90 },
        },
    },
};

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
    play: async ({ canvas }) => {
        await expect(zeroAll(canvas)).toBeDisabled();
    },
};

export const RunningJob = {
    parameters: {
        machine: { preset: 'running', wpos: { x: 54.2, y: 18.9, z: -1.5 } },
    },
    play: async ({ canvas }) => {
        await expect(zeroAll(canvas)).toBeDisabled();
    },
};

export const Alarm = {
    parameters: { machine: { preset: 'alarm', status: { alarmCode: 1 } } },
    play: async ({ canvas }) => {
        await expect(zeroAll(canvas)).toBeDisabled();
    },
};

// A homing alarm leaves Home as the way out
export const HomingAlarm = {
    parameters: {
        machine: {
            preset: 'alarm',
            settings: { $22: '1' },
            status: { alarmCode: 11 },
        },
    },
    play: async ({ canvas }) => {
        await expect(
            canvas.getByRole('button', { name: /Home/ }),
        ).toBeEnabled();
    },
};
