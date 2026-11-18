import { http, HttpResponse } from 'msw';
import { expect, spyOn } from 'storybook/test';
import controller from 'app/lib/controller';
import {
    LEGACY,
    pendantParameters,
    withPendant,
} from '../../../../.storybook/pendant';

import CarveView from './CarveView';

const HOMING = { $22: '1', $130: '810', $131: '855', $132: '120' };
const POSITION = { x: 120.5, y: 45.25, z: -3.175 };

const FILE = {
    name: 'sign-pocket.nc',
    size: 482304,
    total: 18250,
    estimatedTime: 2720,
    bbox: {
        min: { x: 0, y: 0, z: -6.35 },
        max: { x: 300, y: 180, z: 5 },
        delta: { x: 300, y: 180, z: 11.35 },
    },
};
const SENDER = {
    sent: 5475,
    received: 5470,
    total: FILE.total,
    elapsedTime: 754000,
    remainingTime: 1760,
};

// The legacy carve tab (PendantShell with pendant.legacyCarve): visualizer
// card on the left, DRO and jog cards on the right, bottom drawer below.
// Sized to what is left of the 800x1280 pendant under the top bar (56px),
// info strip (~42px) and bottom nav (~64px)
const meta = {
    title: 'Pendant/Legacy/CarveView',
    component: CarveView,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '1160px' } },
        pendant: { width: LEGACY.width, height: LEGACY.height - 162 },
        machine: {
            preset: 'idle',
            settings: HOMING,
            hasHomed: true,
            mpos: POSITION,
            wpos: POSITION,
            modal: { units: 'G21', distance: 'G90', wcs: 'G54' },
        },
        msw: {
            handlers: [
                http.get('*/api/plugins', () =>
                    HttpResponse.json({ plugins: [] }),
                ),
                http.get('*/api/macros', () =>
                    HttpResponse.json({ records: [] }),
                ),
            ],
        },
    },
    beforeEach() {
        spyOn(controller, 'command').mockImplementation(() => {});
    },
};

export default meta;

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
    play: async ({ canvas }) => {
        await expect(canvas.getAllByText('No file loaded')[0]).toBeVisible();
    },
};

export const Idle = {};

export const FileLoaded = {
    parameters: { machine: { file: FILE } },
};

export const Running = {
    parameters: {
        machine: {
            preset: 'running',
            file: FILE,
            sender: SENDER,
            status: { ov: [110, 100, 100], feedrate: 1320 },
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
