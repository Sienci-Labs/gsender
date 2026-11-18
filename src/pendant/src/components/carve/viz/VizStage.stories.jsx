import pubsub from 'pubsub-js';
import { http, HttpResponse } from 'msw';
import { expect, fn, spyOn, waitFor } from 'storybook/test';
import controller from 'app/lib/controller';
import reduxStore from 'app/store/redux';
import { updateFileProcessing } from 'app/store/redux/slices/fileInfo.slice';
import {
    pendantParameters,
    TABLET,
    withPendant,
} from '../../../../../../.storybook/pendant';

import VizStage from './VizStage';

const CARVE_MODES = [
    'disconnected',
    'setup',
    'running',
    'holdJob',
    'holdIdle',
    'alarm',
    'toolchange',
];

// $22 = homing on, $130-$132 = X/Y/Z max travel
const SETTINGS = { $22: '1', $130: '810', $131: '855', $132: '120' };
const POSITION = { x: 120.5, y: 45.25, z: -3.175 };

const FILE = {
    name: 'sign-pocket.nc',
    size: 482304,
    total: 18250,
    estimatedTime: 2720,
    toolSet: ['T1'],
    spindleSet: ['S18000'],
    movementSet: ['F1200', 'F2400'],
    usedAxes: ['X', 'Y', 'Z'],
    bbox: {
        min: { x: 0, y: 0, z: -6.35 },
        max: { x: 300, y: 180, z: 5 },
        delta: { x: 300, y: 180, z: 11.35 },
    },
};
const SENDER = {
    sent: 5475,
    received: 5470,
    total: 18250,
    elapsedTime: 754000,
    remainingTime: 1760,
};

// The carve screen's visualizer stage (42vh of the tablet): top-down
// toolpath, workspace selector, view tray, info glass, depth gauge, job
// controls and the state glow. `mode` drives the glow and the job controls;
// everything else comes from the machine state, so stories set both
const meta = {
    title: 'Pendant/Carve/VizStage',
    component: VizStage,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '500px' } },
        pendant: {
            width: TABLET.width,
            height: Math.round(TABLET.height * 0.42),
        },
        machine: {
            preset: 'idle',
            port: 'COM4',
            settings: SETTINGS,
            hasHomed: true,
            wpos: POSITION,
            mpos: POSITION,
            modal: { units: 'G21', distance: 'G90', motion: 'G0' },
        },
        msw: {
            handlers: [
                http.get('*/api/plugins', () =>
                    HttpResponse.json({ plugins: [] }),
                ),
            ],
        },
    },
    beforeEach() {
        spyOn(controller, 'command').mockImplementation(() => {});
    },
    args: { mode: 'setup', onOpenTool: fn() },
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

export const Disconnected = {
    args: { mode: 'disconnected' },
    parameters: { machine: { preset: 'disconnected' } },
};

export const Setup = {
    play: async ({ canvasElement }) => {
        await waitFor(() =>
            expect(canvasElement.querySelector('canvas')).not.toBeNull(),
        );
    },
};

export const SetupWithFile = {
    parameters: { machine: { file: FILE } },
};

// Tap-to-move armed from the view tray: the stage glows and shows the hint
export const MoveArmed = {
    play: async ({ canvas, userEvent }) => {
        await userEvent.click(
            canvas.getByRole('button', { name: 'Tap the canvas to jog there' }),
        );
        await expect(await canvas.findByText(/Move armed/)).toBeVisible();
    },
};

export const Processing = {
    parameters: { machine: { file: FILE } },
    play: async ({ canvas }) => {
        reduxStore.dispatch(updateFileProcessing({ fileProcessing: true }));
        await waitFor(() =>
            expect(canvas.getByText('building toolpath...')).toBeVisible(),
        );
        pubsub.publishSync('toolpath:progress', 62);
    },
};

export const Running = {
    args: { mode: 'running' },
    parameters: {
        machine: { preset: 'running', file: FILE, sender: SENDER },
    },
};

export const HoldDuringJob = {
    args: { mode: 'holdJob' },
    parameters: { machine: { preset: 'hold', file: FILE, sender: SENDER } },
};

export const HoldWhileIdle = {
    args: { mode: 'holdIdle' },
    parameters: { machine: { status: { activeState: 'Hold' } } },
};

export const Alarm = {
    args: { mode: 'alarm' },
    parameters: {
        machine: { preset: 'alarm', file: FILE, status: { alarmCode: 1 } },
    },
};

export const ToolChange = {
    args: { mode: 'toolchange' },
    parameters: {
        machine: {
            preset: 'hold',
            file: FILE,
            sender: SENDER,
            status: { activeState: 'Tool' },
        },
    },
};
