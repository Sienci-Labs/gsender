import pubsub from 'pubsub-js';
import { expect, waitFor, within } from 'storybook/test';
import {
    DRAWER_EXPANDED,
    DRAWER_MINIMAL,
    LEGACY,
    pendantParameters,
    withPendant,
} from '../../../../.storybook/pendant';

import ATCPanel from './ATCPanel';

const tool = (id, z) => ({
    id,
    toolOffsets: { x: 0, y: 0, z },
    toolRadius: 3.175,
});
const TOOL_TABLE = {
    1: tool(1, -42.15),
    2: tool(2, 0),
    3: tool(3, -38.6),
    7: tool(7, -51.2),
};

// grblHAL reporting an ATC: compiled in (NEWOPT ATC=1), a 6-slot rack, tool
// table and tool 1 in the spindle
const ATC_READY = {
    preset: 'idle',
    hasHomed: true,
    info: { NEWOPT: { ATC: '1' } },
    atci: { rack_size: 6 },
    toolTable: TOOL_TABLE,
    status: { currentTool: 1 },
};

const FILE = { name: 'two-tool-sign.nc', total: 4000 };

// Mirrors app/src/features/ATC/ATC.stories.jsx. The pendant's ATC tab (legacy
// bottom drawer and the carve screen's Setup > Tools tab): current tool,
// Load / Unload, the tool table, and when expanded the job's tool timeline
const meta = {
    title: 'Pendant/ATCPanel',
    component: ATCPanel,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: `${DRAWER_EXPANDED + 40}px` } },
        pendant: { width: LEGACY.width, height: DRAWER_EXPANDED },
        machine: ATC_READY,
    },
    args: { mode: 'expanded' },
    argTypes: {
        mode: {
            description:
                'Bottom drawer height: minimal shows the tool and Load/Unload, expanded adds the job timeline',
            control: { type: 'inline-radio' },
            options: ['minimal', 'expanded'],
        },
    },
};

export default meta;

const body = (canvasElement) => within(canvasElement.ownerDocument.body);

export const NotConnected = {
    parameters: { machine: { preset: 'disconnected' } },
};

export const FirmwareWithoutATC = {
    parameters: { machine: { ...ATC_READY, info: null } },
};

export const ToolInSpindle = {
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Load')).toBeVisible();
        await expect(canvas.getByText('Unload')).toBeVisible();
    },
};

export const Minimal = {
    args: { mode: 'minimal' },
    parameters: { pendant: { width: LEGACY.width, height: DRAWER_MINIMAL } },
};

export const EmptySpindle = {
    parameters: { machine: { ...ATC_READY, status: { currentTool: 0 } } },
};

// The job's tool changes, as the file parser publishes them
export const JobToolTimeline = {
    parameters: { machine: { ...ATC_READY, file: FILE } },
    play: async () => {
        pubsub.publishSync('file:toolchanges', {
            toolEvents: {
                12: { M: 6, T: 1 },
                1600: { M: 6, T: 3 },
                3100: { M: 6, T: 7 },
            },
            total: FILE.total,
        });
    },
};

export const ToolTable = {
    play: async ({ canvas, canvasElement, userEvent }) => {
        await userEvent.click(canvas.getByText('Tools'));
        const dialog = await body(canvasElement).findByRole('dialog');
        // The dialog zooms in
        await waitFor(() => expect(dialog).toBeVisible());
    },
};

export const RunningJob = {
    parameters: {
        machine: {
            ...ATC_READY,
            preset: 'running',
            file: FILE,
            sender: { sent: 1200, received: 1200, total: FILE.total },
        },
    },
};
