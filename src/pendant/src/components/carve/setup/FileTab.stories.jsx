import { expect, fn } from 'storybook/test';
import {
    CARVE_LEFT,
    pendantParameters,
    withPendant,
} from '../../../../../../.storybook/pendant';
import { RECENT_KEY, useFileActions } from '../../../hooks/useFileActions';

import FileTab from './FileTab';

const HOUR = 60 * 60 * 1000;

const RECENTS = [
    {
        fileName: 'sign-pocket.nc',
        fileSize: 482304,
        timeLoaded: Date.now() - 2 * HOUR,
        source: 'local',
        cacheKey: 'sign-pocket.nc:482304',
    },
    {
        fileName: 'cabinet-door-left.gcode',
        fileSize: 2306867,
        timeLoaded: Date.now() - 26 * HOUR,
        source: 'remote',
        savedName: '1750000000000-cabinet-door-left.gcode',
    },
    {
        fileName: 'surfacing.nc',
        fileSize: 8120,
        timeLoaded: Date.now() - 100 * HOUR,
        source: 'local',
    },
];

const FILE = {
    name: 'sign-pocket.nc',
    size: 482304,
    total: 18250,
    estimatedTime: 2720,
    toolSet: ['T1', 'T2'],
    spindleSet: ['S18000'],
    movementSet: ['F1200', 'F2400'],
    usedAxes: ['X', 'Y', 'Z'],
    bbox: {
        min: { x: 0, y: 0, z: -6.35 },
        max: { x: 300, y: 180, z: 5 },
        delta: { x: 300, y: 180, z: 11.35 },
    },
};

// The tab takes the carve screen's shared useFileActions() result; the real hook
// runs here, reading recent files from localStorage (parameters.recentFiles)
function FileTabWithActions({ onOpenEditor }) {
    const actions = useFileActions();
    return <FileTab actions={actions} onOpenEditor={onOpenEditor} />;
}

const meta = {
    title: 'Pendant/Carve/FileTab',
    component: FileTab,
    tags: ['ai-generated'],
    decorators: [withPendant],
    // Setup mode's File tab: an empty state with recent files, or the loaded
    // file's details and job tools. The loaded file comes from the machine state.
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '560px' } },
        pendant: { width: CARVE_LEFT, height: 520 },
        machine: { preset: 'idle' },
        recentFiles: RECENTS,
    },
    beforeEach: ({ parameters }) => {
        window.localStorage.setItem(
            RECENT_KEY,
            JSON.stringify(parameters.recentFiles),
        );
        return () => window.localStorage.removeItem(RECENT_KEY);
    },
    args: { onOpenEditor: fn() },
    argTypes: { actions: { table: { disable: true } } },
    render: (args) => <FileTabWithActions {...args} />,
};

export default meta;

export const NoFile = {
    play: async ({ canvas }) => {
        await expect(canvas.getByText('No file loaded')).toBeVisible();
        await expect(
            canvas.getByRole('button', { name: /Open file/ }),
        ).toBeEnabled();
        await expect(await canvas.findByText('sign-pocket.nc')).toBeVisible();
        await expect(canvas.getByText('cabinet-door-left.gcode')).toBeVisible();
    },
};

export const NoFileNoRecents = {
    parameters: { recentFiles: [] },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('No recent files.')).toBeVisible();
    },
};

export const NoFileDisconnected = {
    parameters: { machine: { preset: 'disconnected' } },
    play: async ({ canvas }) => {
        // Files can be opened before connecting
        await expect(
            canvas.getByRole('button', { name: /Open file/ }),
        ).toBeEnabled();
    },
};

export const FileLoaded = {
    parameters: { machine: { preset: 'idle', file: FILE } },
    play: async ({ args, canvas, userEvent }) => {
        await expect(canvas.getByText('sign-pocket.nc')).toBeVisible();
        await expect(canvas.getByText('18,250')).toBeVisible();
        await expect(canvas.getByText('Bounding box')).toBeVisible();
        await expect(canvas.getByRole('button', { name: 'Run' })).toBeEnabled();
        await userEvent.click(canvas.getByRole('button', { name: 'Open' }));
        await expect(args.onOpenEditor).toHaveBeenCalled();
    },
};

export const FileLoadedImperial = {
    parameters: {
        machine: { preset: 'idle', file: FILE },
        workspace: { units: 'in' },
    },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Bounding box')).toBeVisible();
    },
};

export const FileLoadedDisconnected = {
    parameters: { machine: { preset: 'disconnected', file: FILE } },
    play: async ({ canvas }) => {
        // Outline and Start From need an idle, connected machine
        await expect(
            canvas.getByRole('button', { name: 'Run' }),
        ).toBeDisabled();
        await expect(
            canvas.getByRole('button', { name: 'Set' }),
        ).toBeDisabled();
        await expect(
            canvas.getByRole('button', { name: 'Open' }),
        ).toBeEnabled();
    },
};

export const FileLoadedLaserMode = {
    parameters: {
        machine: { preset: 'idle', file: FILE, settings: { $32: '1' } },
    },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('sign-pocket.nc')).toBeVisible();
    },
};
