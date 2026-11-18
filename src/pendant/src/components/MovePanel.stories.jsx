import { useArgs } from 'storybook/preview-api';
import { expect, fn, spyOn } from 'storybook/test';
import controller from 'app/lib/controller';
import {
    DRAWER_EXPANDED,
    DRAWER_MINIMAL,
    LEGACY,
    pendantParameters,
    withPendant,
} from '../../../../.storybook/pendant';

import MovePanel from './MovePanel';

// $22 = homing on, $130-$132 = X/Y/Z max travel
const HOMING = { $22: '1', $130: '810', $131: '855', $132: '120' };
const POSITION = { x: 120.5, y: 45.25, z: -3.175 };

// The Move tab of the legacy carve screen's bottom drawer: Home All, Zero,
// Park and Corners; expanded adds hold-to-rapid corner targets and a Go To
// pad (absolute, incremental or machine coordinates). Gating comes from the
// machine state: homing ($22), whether the machine has homed, alarms
const meta = {
    title: 'Pendant/MovePanel',
    component: MovePanel,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: `${DRAWER_EXPANDED + 40}px` } },
        pendant: { width: LEGACY.width, height: DRAWER_EXPANDED },
        machine: {
            preset: 'idle',
            settings: HOMING,
            hasHomed: true,
            mpos: POSITION,
            wpos: POSITION,
        },
    },
    beforeEach() {
        spyOn(controller, 'command').mockImplementation(() => {});
    },
    args: { mode: 'expanded', setMode: fn() },
    argTypes: {
        mode: {
            description:
                'Bottom drawer height: minimal shows the quick actions, expanded adds corners and Go To',
            control: { type: 'inline-radio' },
            options: ['minimal', 'expanded'],
        },
        setMode: { table: { disable: true } },
    },
    // Corners expands the drawer; follow it here
    render: function Render(args) {
        const [, updateArgs] = useArgs();
        return (
            <MovePanel
                {...args}
                setMode={(mode) => {
                    args.setMode(mode);
                    updateArgs({ mode });
                }}
            />
        );
    },
};

export default meta;

const minimal = { pendant: { width: LEGACY.width, height: DRAWER_MINIMAL } };

export const Idle = {
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Home All')).toBeVisible();
        await expect(canvas.getByText('ABS')).toBeVisible();
    },
};

export const Minimal = {
    args: { mode: 'minimal' },
    parameters: minimal,
};

export const IncrementalGoTo = {
    play: async ({ canvas, userEvent }) => {
        await userEvent.click(canvas.getByText('INC'));
        await expect(canvas.getByText('INC')).toBeVisible();
    },
};

export const MachineCoordinates = {
    play: async ({ canvas, userEvent }) => {
        await userEvent.click(canvas.getByText('MACHINE'));
    },
};

// Corners and machine coordinates need a homed machine
export const NotHomed = {
    parameters: { machine: { hasHomed: false } },
};

export const HomingDisabled = {
    parameters: { machine: { settings: { $22: '0' }, hasHomed: false } },
};

export const ActiveG55 = {
    parameters: { machine: { modal: { wcs: 'G55' } } },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Zero G55')).toBeVisible();
    },
};

export const FourAxis = {
    parameters: { machine: { axes: ['X', 'Y', 'Z', 'A'] } },
};

export const RotaryMode = {
    parameters: {
        machine: { axes: ['X', 'Y', 'Z', 'A'] },
        workspace: { mode: 'ROTARY' },
    },
};

export const RunningJob = {
    parameters: { machine: { preset: 'running' } },
};

// A homing alarm leaves Home All as the way out
export const HomingAlarm = {
    parameters: {
        machine: {
            preset: 'alarm',
            hasHomed: false,
            status: { alarmCode: 11 },
        },
    },
};

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
};
