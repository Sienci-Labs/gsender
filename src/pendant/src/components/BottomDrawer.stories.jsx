import { http, HttpResponse } from 'msw';
import { expect, spyOn } from 'storybook/test';
import controller from 'app/lib/controller';
import {
    LEGACY,
    pendantParameters,
    withPendant,
} from '../../../../.storybook/pendant';

import BottomDrawer from './BottomDrawer';

const HOMING = { $22: '1', $130: '810', $131: '855', $132: '120' };

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

const MACROS = [
    {
        id: 'm1',
        name: 'Probe Z',
        content: 'G38.2 Z-25 F100',
        description: '',
        column: 'column1',
        rowIndex: 0,
    },
    {
        id: 'm2',
        name: 'Park',
        content: 'G53 G0 Z-5',
        description: '',
        column: 'column1',
        rowIndex: 1,
    },
];

// The legacy carve screen's bottom drawer: a tab bar along the bottom that
// slides up (minimal, then expanded to 60vh) to show File, Move, Probe,
// Spindle, Macros, ATC, Coolant or Console. Coolant needs
// workspace.coolantFunctions and ATC an ATC (workspace.atcEnabled or the
// firmware's ATC=1). Which tab is open is internal state, so each tab story
// opens it in its play function.
const meta = {
    title: 'Pendant/BottomDrawer',
    component: BottomDrawer,
    tags: ['ai-generated'],
    decorators: [
        (Story) => (
            <>
                <div className="flex-1" />
                <Story />
            </>
        ),
        withPendant,
    ],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '960px' } },
        pendant: { width: LEGACY.width, height: 920 },
        machine: { preset: 'idle', settings: HOMING, hasHomed: true },
    },
    beforeEach({ msw }) {
        spyOn(controller, 'command').mockImplementation(() => {});
        msw.use(
            http.get('*/api/macros', () =>
                HttpResponse.json({ records: MACROS }),
            ),
        );
    },
};

export default meta;

const openTab =
    (name) =>
    async ({ canvas, userEvent }) => {
        await userEvent.click(canvas.getByRole('button', { name }));
    };

const expand = (context) =>
    context.userEvent.click(
        context.canvasElement
            .querySelector('.lucide-chevron-up')
            .closest('button'),
    );

export const Closed = {
    play: async ({ canvas }) => {
        await expect(
            canvas.getByRole('button', { name: 'File' }),
        ).toBeVisible();
    },
};

export const File = {
    play: openTab('File'),
};

export const FileLoaded = {
    parameters: { machine: { file: FILE } },
    play: async (context) => {
        await openTab('File')(context);
        await expect(context.canvas.getByText('18,250')).toBeVisible();
    },
};

export const Expanded = {
    parameters: { machine: { file: FILE } },
    play: async (context) => {
        await openTab('File')(context);
        await openTab('Move')(context);
        // The chevron steps closed -> minimal -> expanded
        await expand(context);
    },
};

export const Move = { play: openTab('Move') };

export const Probe = { play: openTab('Probe') };

export const Spindle = { play: openTab('Spindle') };

// The macro list shows once the drawer is expanded
export const Macros = {
    play: async (context) => {
        await openTab('Macros')(context);
        await expand(context);
        await expect(await context.canvas.findByText('Probe Z')).toBeVisible();
    },
};

export const ATC = {
    parameters: {
        machine: {
            info: { NEWOPT: { ATC: '1' } },
            atci: { rack_size: 6 },
            toolTable: {
                1: {
                    id: 1,
                    toolOffsets: { x: 0, y: 0, z: -42.15 },
                    toolRadius: 3.175,
                },
            },
            status: { currentTool: 1 },
        },
    },
    play: openTab('ATC'),
};

export const Coolant = {
    parameters: { workspace: { coolantFunctions: true } },
    play: openTab('Coolant'),
};

// Console opens the drawer straight to expanded
export const Console = { play: openTab('Console') };

export const RunningJob = {
    parameters: {
        machine: {
            preset: 'running',
            file: FILE,
            sender: { sent: 5475, received: 5470, total: FILE.total },
        },
    },
    play: openTab('Move'),
};

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
    play: openTab('File'),
};
