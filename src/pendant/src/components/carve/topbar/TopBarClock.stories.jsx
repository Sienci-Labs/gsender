import { expect, waitFor } from 'storybook/test';
import {
    pendantParameters,
    withPendant,
} from '../../../../../../.storybook/pendant';

import TopBarClock from './TopBarClock';

const CARVE_MODES = [
    'disconnected',
    'setup',
    'running',
    'holdJob',
    'holdIdle',
    'alarm',
    'toolchange',
];

// What navigator.getBattery reports; 'none' leaves the API out, as on a
// machine without the Battery Status API
const BATTERIES = {
    none: null,
    charging: { level: 0.82, charging: true },
    'on battery (64%)': { level: 0.64, charging: false },
    'low (15%)': { level: 0.15, charging: false },
};

// The centre slot of the carve top bar: the clock, with short glances at the
// battery when running on battery, and the alarm headline in alarm mode
// (from the machine state's alarm code). Slots rotate every few seconds
const meta = {
    title: 'Pendant/Carve/TopBarClock',
    component: TopBarClock,
    tags: ['ai-generated'],
    decorators: [
        (Story) => (
            <div className="relative h-14 border-b border-outline-subtle bg-surface-base">
                <Story />
            </div>
        ),
        withPendant,
    ],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '100px' } },
        pendant: { width: 480 },
        machine: { preset: 'idle' },
    },
    args: { mode: 'setup', battery: 'none' },
    argTypes: {
        mode: {
            description:
                'Carve screen mode (resolved from connection, workflow and active state in the app)',
            control: { type: 'select' },
            options: CARVE_MODES,
        },
        battery: {
            description: 'Device battery (stubbed Battery Status API)',
            control: { type: 'select' },
            options: Object.keys(BATTERIES),
            table: { category: 'Device' },
        },
    },
    beforeEach: ({ args }) => {
        const battery = BATTERIES[args.battery];
        const had = Object.hasOwn(navigator, 'getBattery');
        const original = navigator.getBattery;
        Object.defineProperty(navigator, 'getBattery', {
            configurable: true,
            value: battery
                ? () =>
                      Promise.resolve(Object.assign(new EventTarget(), battery))
                : undefined,
        });
        return () => {
            if (had) {
                Object.defineProperty(navigator, 'getBattery', {
                    configurable: true,
                    value: original,
                });
            } else {
                delete navigator.getBattery;
            }
        };
    },
    render: ({ battery, ...args }) => <TopBarClock {...args} />,
};

export default meta;

export const Time = {
    play: async ({ canvas }) => {
        await expect(canvas.getByText(/\d{1,2}:\d{2}/)).toBeVisible();
    },
};

export const Alarm = {
    args: { mode: 'alarm' },
    parameters: { machine: { preset: 'alarm', status: { alarmCode: 1 } } },
    play: async ({ canvas }) => {
        await expect(canvas.getByRole('status')).toHaveTextContent(/^Alarm 1/);
    },
};

export const HomingRequired = {
    args: { mode: 'alarm' },
    parameters: { machine: { preset: 'alarm', status: { alarmCode: 11 } } },
};

// After the clock's turn (6 s) the battery gets a glance
export const OnBattery = {
    args: { battery: 'on battery (64%)' },
    play: async ({ canvas }) => {
        const reading = await canvas.findByLabelText('Battery 64%');
        await waitFor(() => expect(reading).toHaveClass('opacity-100'), {
            timeout: 8000,
        });
    },
};

export const LowBattery = {
    args: { battery: 'low (15%)' },
    play: async ({ canvas }) => {
        const reading = await canvas.findByLabelText('Battery 15%');
        await expect(reading).toHaveClass('text-state-alarm');
        await waitFor(() => expect(reading).toHaveClass('opacity-100'), {
            timeout: 8000,
        });
    },
};

// Plugged in: no battery glance
export const Charging = {
    args: { battery: 'charging' },
};
