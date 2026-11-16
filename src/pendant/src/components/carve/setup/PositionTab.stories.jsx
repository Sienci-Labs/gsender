import { expect, spyOn, waitFor } from 'storybook/test';
import controller from 'app/lib/controller';
import {
    CARVE_LEFT,
    pendantParameters,
    withPendant,
} from '../../../../../../.storybook/pendant';

import PositionTab from './PositionTab';

const POSITION = { x: 120.5, y: 45.25, z: -3.175 };

const meta = {
    title: 'Pendant/Carve/PositionTab',
    component: PositionTab,
    tags: ['ai-generated'],
    decorators: [withPendant],
    // Setup mode's Position tab: per-axis work position with hold-to-zero and
    // hold-to-go-to buttons (Manual), or the probe panel (Probe). No props; the
    // readouts and enabled states come from the machine state.
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '560px' } },
        pendant: { width: CARVE_LEFT, height: 520 },
        machine: { preset: 'idle', wpos: POSITION, mpos: POSITION },
    },
};

export default meta;

const button = (canvas, name) => canvas.getByRole('button', { name });

export const Idle = {
    play: async ({ canvas }) => {
        await expect(button(canvas, 'Hold to zero X')).toBeEnabled();
        await expect(button(canvas, 'Hold to go to XY 0')).toBeEnabled();
        await expect(button(canvas, 'Hold to zero all axes')).toBeEnabled();
    },
};

export const HoldToZero = {
    play: async ({ canvas }) => {
        const command = spyOn(controller, 'command').mockImplementation(
            () => {},
        );
        const zero = button(canvas, 'Hold to zero X');
        zero.dispatchEvent(
            new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 }),
        );
        // Fires only once the hold completes
        await expect(command).not.toHaveBeenCalled();
        await waitFor(() => expect(command).toHaveBeenCalled());
    },
};

export const Imperial = {
    parameters: { workspace: { units: 'in' } },
    play: async ({ canvas }) => {
        await expect(button(canvas, 'Hold to zero X')).toBeEnabled();
    },
};

export const WithRotaryAxis = {
    parameters: {
        machine: {
            preset: 'idle',
            axes: ['X', 'Y', 'Z', 'A'],
            wpos: { ...POSITION, a: 90 },
        },
    },
    play: async ({ canvas }) => {
        await expect(button(canvas, 'Hold to zero A')).toBeEnabled();
    },
};

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
    play: async ({ canvas }) => {
        await expect(button(canvas, 'Hold to zero X')).toBeDisabled();
        await expect(button(canvas, 'Hold to go to XY 0')).toBeDisabled();
        await expect(button(canvas, 'Hold to zero all axes')).toBeDisabled();
    },
};

export const Alarm = {
    parameters: { machine: { preset: 'alarm', status: { alarmCode: 1 } } },
    play: async ({ canvas }) => {
        await expect(button(canvas, 'Hold to zero all axes')).toBeDisabled();
    },
};

export const Probe = {
    play: async ({ canvas, userEvent }) => {
        await userEvent.click(button(canvas, 'Probe'));
        // The manual zeroing rows give way to the probe panel
        await expect(
            canvas.queryByRole('button', { name: 'Hold to zero X' }),
        ).toBeNull();
    },
};
