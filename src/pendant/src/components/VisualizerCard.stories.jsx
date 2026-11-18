import pubsub from 'pubsub-js';
import { http, HttpResponse } from 'msw';
import { expect, waitFor } from 'storybook/test';
import reduxStore from 'app/store/redux';
import { updateFileProcessing } from 'app/store/redux/slices/fileInfo.slice';
import {
    LEGACY_CARD,
    pendantParameters,
    withPendant,
} from '../../../../.storybook/pendant';

import VisualizerCard from './VisualizerCard';

const HOMING = { $22: '1', $130: '810', $131: '855', $132: '120' };
const POSITION = { x: 120.5, y: 45.25, z: -3.175 };

const FILE = {
    name: 'sign-pocket.nc',
    size: 482304,
    total: 4000,
    bbox: {
        min: { x: 0, y: 0, z: -6.35 },
        max: { x: 300, y: 180, z: 5 },
        delta: { x: 300, y: 180, z: 11.35 },
    },
};

const SENDER = {
    sent: 1200,
    received: 1200,
    total: FILE.total,
    elapsedTime: 754000,
    remainingTime: 1760,
};

// Mirrors app/src/features/Visualizer/Visualizer.stories.jsx where it applies.
// The legacy carve screen's left column: top-down visualizer with legend and
// workspace selector, job controls, progress and override sliders. What it
// shows comes from the machine state (connection, loaded file, job progress)
const meta = {
    title: 'Pendant/VisualizerCard',
    component: VisualizerCard,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '560px' } },
        pendant: { width: LEGACY_CARD, height: 520 },
        machine: {
            preset: 'idle',
            settings: HOMING,
            hasHomed: true,
            mpos: POSITION,
            wpos: POSITION,
        },
        msw: {
            handlers: [
                http.get('*/api/plugins', () =>
                    HttpResponse.json({ plugins: [] }),
                ),
            ],
        },
    },
};

export default meta;

export const EmptyScene = {
    play: async ({ canvas, canvasElement }) => {
        // gviewer draws into a WebGL canvas
        await waitFor(() =>
            expect(canvasElement.querySelector('canvas')).not.toBeNull(),
        );
        await expect(
            canvas.getByRole('button', { name: 'Open G-code file' }),
        ).toHaveTextContent('Open file');
    },
};

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('No file loaded')).toBeVisible();
    },
};

export const FileLoaded = {
    parameters: { machine: { file: FILE } },
};

export const Processing = {
    parameters: { machine: { file: FILE } },
    play: async ({ canvas }) => {
        reduxStore.dispatch(updateFileProcessing({ fileProcessing: true }));
        await waitFor(() =>
            expect(canvas.getByText('building toolpath...')).toBeVisible(),
        );
        pubsub.publishSync('toolpath:progress', 62);
        await expect(await canvas.findByText('62%')).toBeVisible();
    },
};

export const Running = {
    parameters: {
        machine: {
            preset: 'running',
            file: FILE,
            sender: SENDER,
            status: { ov: [120, 100, 100], feedrate: 1440 },
        },
    },
};

export const Paused = {
    parameters: { machine: { preset: 'hold', file: FILE, sender: SENDER } },
};

export const Alarm = {
    parameters: {
        machine: { preset: 'alarm', file: FILE, status: { alarmCode: 1 } },
    },
};
