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

import RunRight from './RunRight';

const FILE = { name: 'sign.nc', total: 4000 };

// sender.status as the server reports it: lines acknowledged, elapsed time in
// ms and the remaining-time estimate in seconds
const sender = (received, extra = {}) => ({
    total: FILE.total,
    sent: received,
    received,
    elapsedTime: 754000,
    remainingTime: 1760,
    ...extra,
});

const meta = {
    title: 'Pendant/Carve/RunRight',
    component: RunRight,
    tags: ['ai-generated'],
    decorators: [withPendant],
    // Right column of the carve screen while a job runs or is paused. Progress
    // comes from the machine state's `file` and `sender`
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '540px' } },
        pendant: { width: CARVE_RIGHT, height: 500 },
        machine: { preset: 'running', file: FILE, sender: sender(1200) },
        console: [
            ['G21 G90', 'gcode'],
            ['ok', 'response'],
            ['G0 Z5', 'gcode'],
            ['ok', 'response'],
            ['G1 X50 Y0 F1200', 'gcode'],
            ['ok', 'response'],
        ],
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

export const Running = {
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Lines sent')).toBeVisible();
        await expect(await canvas.findByText(/^1.200 \/ 4.000$/)).toBeVisible();
        await expect(canvas.getByText('30%')).toBeVisible();
        await expect(canvas.getByText(/^Elapsed /)).toBeVisible();
        await expect(canvas.getByText('~00:29:20')).toBeVisible();
        // Console lines fade in
        await waitFor(() =>
            expect(canvas.getByText('G1 X50 Y0 F1200')).toBeVisible(),
        );
    },
};

export const JustStarted = {
    parameters: {
        machine: {
            preset: 'running',
            file: FILE,
            sender: sender(0, { elapsedTime: 0, remainingTime: 0 }),
        },
    },
    play: async ({ canvas }) => {
        await expect(canvas.getByText(/^0 \/ 4.000$/)).toBeVisible();
        // No estimate yet, and no percent pill on an empty bar
        await expect(canvas.getByText('—')).toBeVisible();
        await expect(canvas.queryByText('0%')).toBeNull();
    },
};

export const NearlyDone = {
    parameters: {
        machine: {
            preset: 'running',
            file: FILE,
            sender: sender(3880, { elapsedTime: 2460000, remainingTime: 45 }),
        },
    },
    play: async ({ canvas }) => {
        await expect(await canvas.findByText('97%')).toBeVisible();
        await expect(canvas.getByText('~00:00:45')).toBeVisible();
    },
};

export const Paused = {
    parameters: {
        machine: { preset: 'hold', file: FILE, sender: sender(1200) },
    },
    play: async ({ canvas }) => {
        // The elapsed time gives way to a local paused timer
        await expect(
            await canvas.findByText(/^Paused 00:00:0\d$/),
        ).toBeVisible();
        await expect(canvas.getByText('30%')).toBeVisible();
        await expect(canvas.getByText('~00:29:20')).toHaveClass(
            'text-state-hold',
        );
    },
};

export const EmptyConsole = {
    parameters: { console: [] },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Lines sent')).toBeVisible();
        await expect(canvas.queryByText('G21 G90')).toBeNull();
    },
};

export const FilterConsole = {
    parameters: {
        console: [
            ['G1 X50 Y0 F1200', 'gcode'],
            ['ok', 'response'],
            ['error:20 Unsupported command', 'error'],
        ],
    },
    play: async ({ canvas, userEvent }) => {
        // Console lines fade in
        await waitFor(() =>
            expect(canvas.getByText('G1 X50 Y0 F1200')).toBeVisible(),
        );
        const faults = canvas.getByRole('button', { name: 'Faults' });
        await userEvent.click(faults);
        await expect(faults).toHaveAttribute('aria-pressed', 'true');
        await waitFor(() =>
            expect(canvas.queryByText('G1 X50 Y0 F1200')).toBeNull(),
        );
        await expect(canvas.getByText(/error:20/)).toBeVisible();
    },
};
