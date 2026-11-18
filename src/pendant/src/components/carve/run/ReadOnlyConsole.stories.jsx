import { expect, waitFor } from 'storybook/test';
import {
    clearConsole,
    consoleWrite,
    flushConsoleWrites,
} from 'app/features/Console/consoleStore';
import {
    CARVE_RIGHT,
    pendantParameters,
    withPendant,
} from '../../../../../../.storybook/pendant';

import ReadOnlyConsole from './ReadOnlyConsole';

const OUTPUT = [
    ['Connected to COM4 with a baud rate of 115200', 'system'],
    ['G21 G90', 'gcode'],
    ['ok', 'response'],
    ['G0 Z5', 'gcode'],
    ['ok', 'response'],
    ['G1 X50 Y0 F1200', 'gcode'],
    ['ok', 'response'],
];

// Mirrors app/src/features/Console/Console.stories.jsx where it applies. The
// desktop console's toolbar and log with no command input, shown under the
// progress on the carve screen's Run panel. Lines come from the console store
// (parameters.console: [message, type] pairs)
const meta = {
    title: 'Pendant/Carve/ReadOnlyConsole',
    component: ReadOnlyConsole,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '400px' } },
        pendant: { width: CARVE_RIGHT - 32, height: 360, padding: 8 },
        machine: { preset: 'running', port: 'COM4' },
        console: OUTPUT,
    },
    beforeEach: ({ parameters }) => {
        clearConsole();
        for (const [message, type] of parameters.console) {
            consoleWrite(message, type);
        }
        flushConsoleWrites();
        return clearConsole;
    },
};

export default meta;

export const Empty = {
    parameters: { console: [] },
    play: async ({ canvas }) => {
        await expect(canvas.queryByText('G21 G90')).toBeNull();
    },
};

export const ShowsControllerOutput = {
    parameters: {
        console: [
            ...OUTPUT,
            ['error:9 G-code locked out during alarm', 'error'],
        ],
    },
    play: async ({ canvas }) => {
        // Lines fade in
        await waitFor(() =>
            expect(canvas.getByText('G1 X50 Y0 F1200')).toBeVisible(),
        );
    },
};

export const FilterFaults = {
    parameters: {
        console: [
            ['G0 X10', 'gcode'],
            ['ok', 'response'],
            ['ALARM:1 Hard limit triggered', 'alarm'],
        ],
    },
    play: async ({ canvas, userEvent }) => {
        await waitFor(() => expect(canvas.getByText('G0 X10')).toBeVisible());
        const faults = canvas.getByRole('button', { name: 'Faults' });
        await userEvent.click(faults);
        await expect(faults).toHaveAttribute('aria-pressed', 'true');
        await waitFor(() => expect(canvas.queryByText('G0 X10')).toBeNull());
    },
};

// A long job's worth of output scrolls
export const LongLog = {
    parameters: {
        console: Array.from({ length: 60 }, (_, i) =>
            i % 2
                ? ['ok', 'response']
                : [
                      `G1 X${(i * 2.5).toFixed(1)} Y${(i % 7) * 4} F1800`,
                      'gcode',
                  ],
        ),
    },
};
