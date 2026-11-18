import { expect, waitFor } from 'storybook/test';
import {
    LEGACY,
    pendantParameters,
    stubPendantConnection,
    withPendant,
} from '../../../../.storybook/pendant';

import PendantTopBar from './PendantTopBar';

const HOMING = { $22: '1' };

// The legacy carve screen's top bar: logo (hold to quit), connection widget,
// incoming-file pill, machine state badge with Home / Unlock, and E-STOP.
// Everything comes from the machine state; the connection widget follows it
// through stubPendantConnection (it reconnects about half a second after mount)
const meta = {
    title: 'Pendant/PendantTopBar',
    component: PendantTopBar,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '120px' } },
        pendant: { width: LEGACY.width, height: 56 },
        machine: { preset: 'idle', port: 'COM4', settings: HOMING },
    },
    beforeEach: stubPendantConnection,
};

export default meta;

const badge = (canvas, text) =>
    waitFor(() => expect(canvas.getByText(text)).toBeVisible());

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
    play: ({ canvas }) => badge(canvas, 'Disconnected'),
};

export const Idle = {
    play: ({ canvas }) => badge(canvas, 'Idle'),
};

export const Jogging = {
    parameters: { machine: { status: { activeState: 'Jog' } } },
};

export const Homing = {
    parameters: { machine: { status: { activeState: 'Home' } } },
};

export const Running = {
    parameters: { machine: { preset: 'running' } },
    play: ({ canvas }) => badge(canvas, 'Running'),
};

export const Hold = {
    parameters: { machine: { preset: 'hold' } },
};

export const DoorOpen = {
    parameters: { machine: { status: { activeState: 'Door' } } },
    play: ({ canvas }) => badge(canvas, 'Door'),
};

export const Alarm = {
    parameters: { machine: { preset: 'alarm', status: { alarmCode: 1 } } },
    play: ({ canvas }) => badge(canvas, 'Alarm 1'),
};

export const HomingAlarm = {
    parameters: { machine: { preset: 'alarm', status: { alarmCode: 11 } } },
};

export const ToolChange = {
    parameters: {
        machine: { preset: 'hold', status: { activeState: 'Tool' } },
    },
    play: ({ canvas }) => badge(canvas, 'Tool Change'),
};

export const Sleep = {
    parameters: { machine: { status: { activeState: 'Sleep' } } },
};
