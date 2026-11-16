import pubsub from 'pubsub-js';
import { http, HttpResponse } from 'msw';
import { expect, fn, waitFor } from 'storybook/test';
import { CarveVisibleContext } from 'app/hooks/useCarveVisible';
import manualToolChange from 'app/wizards/manualToolchange';
import {
    pendantParameters,
    stubPendantConnection,
    TABLET,
    withPendant,
} from '../../../../../.storybook/pendant';
import BottomNav from '../BottomNav';

import CarveScreen from './CarveScreen';
import WizardBridge from './toolchange/WizardBridge';
import CarveTopBar from './topbar/CarveTopBar';
import { useCarveMode } from './useCarveMode';

const POSITION = { x: 120.5, y: 45.25, z: -3.175 };
// $22 = homing cycle on, $130-$132 = X/Y/Z max travel
const SETTINGS = { $22: '1', $130: '810', $131: '855', $132: '120' };

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

// The whole carve tab as PendantShell's RedesignedCarve lays it out: top bar,
// carve screen, bottom nav. The mode is resolved from the machine state exactly
// as in the app, so the machine controls switch the whole screen.
function CarveTab({ onOpenTool, onNavigate }) {
    const mode = useCarveMode();
    return (
        <>
            <WizardBridge />
            <div className="shrink-0">
                <CarveTopBar mode={mode} />
            </div>
            <div className="flex flex-1 flex-col min-h-0">
                <CarveVisibleContext.Provider value={true}>
                    <CarveScreen mode={mode} onOpenTool={onOpenTool} />
                </CarveVisibleContext.Provider>
            </div>
            <div className="shrink-0">
                <BottomNav active="carve" onChange={onNavigate} />
            </div>
        </>
    );
}

const meta = {
    title: 'Pendant/Carve/CarveScreen',
    component: CarveScreen,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: `${TABLET.height + 20}px` } },
        pendant: { width: TABLET.width, height: TABLET.height },
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
                // Pinned-tools star: plugins can contribute tools; none installed
                http.get('*/api/plugins', () =>
                    HttpResponse.json({ plugins: [] }),
                ),
            ],
        },
    },
    beforeEach: stubPendantConnection,
    args: { onOpenTool: fn(), onNavigate: fn() },
    argTypes: {
        // Resolved from the machine state here; see the Machine state controls
        mode: { table: { disable: true } },
    },
    render: (args) => <CarveTab {...args} />,
};

export default meta;

const badge = (canvas, name) => canvas.findByRole('button', { name });

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
    play: async ({ canvas }) => {
        await waitFor(() =>
            expect(canvas.getByText('Connect to CNC')).toBeVisible(),
        );
        await expect(canvas.getByRole('tablist')).toBeVisible();
        await expect(canvas.getByText('No file loaded')).toBeVisible();
    },
};

export const Setup = {
    play: async ({ canvas }) => {
        await expect(await badge(canvas, /on COM4, Idle/)).toBeVisible();
        await expect(canvas.getByText('No file loaded')).toBeVisible();
        await expect(
            canvas.getByRole('button', { name: 'Jog X plus' }),
        ).toBeEnabled();
    },
};

export const SetupWithFile = {
    parameters: { machine: { file: FILE } },
    play: async ({ canvas }) => {
        await expect(await badge(canvas, /Idle/)).toBeVisible();
        // Opens on Position once a file is loaded; Start appears over the visualizer
        await expect(
            canvas.getByRole('tab', { name: 'Position' }),
        ).toHaveAttribute('aria-selected', 'true');
        await expect(
            canvas.getByRole('button', { name: /Start/ }),
        ).toBeEnabled();
    },
};

export const Running = {
    parameters: {
        machine: {
            preset: 'running',
            file: FILE,
            sender: SENDER,
            modal: { units: 'G21', distance: 'G90', motion: 'G1' },
            status: { ov: [100, 100, 100], feedrate: 1200, spindle: 18000 },
        },
    },
    play: async ({ canvas }) => {
        await expect(await badge(canvas, /Run\./)).toBeVisible();
        await expect(canvas.getByText('Lines sent')).toBeVisible();
        await expect(
            canvas.getByRole('button', { name: /Pause/ }),
        ).toBeEnabled();
        await expect(canvas.queryByRole('tablist')).toBeNull();
    },
};

export const HoldDuringJob = {
    parameters: {
        machine: {
            preset: 'hold',
            file: FILE,
            sender: SENDER,
            status: { ov: [100, 100, 100] },
        },
    },
    play: async ({ canvas }) => {
        await expect(await badge(canvas, /on COM4, Hold/)).toBeVisible();
        await expect(
            canvas.getByRole('button', { name: /Resume/ }),
        ).toBeEnabled();
    },
};

export const HoldWhileIdle = {
    parameters: { machine: { status: { activeState: 'Hold' } } },
    play: async ({ canvas }) => {
        await expect(await badge(canvas, /on COM4, Hold/)).toBeVisible();
        await expect(
            canvas.getByText(/Feed hold is engaged with no job running/),
        ).toBeVisible();
    },
};

export const Alarm = {
    parameters: {
        machine: { preset: 'alarm', status: { alarmCode: 1 } },
    },
    play: async ({ canvas }) => {
        await expect(await badge(canvas, /on COM4/)).toBeVisible();
        await expect(
            canvas.getByText(/stay hidden until the alarm clears/),
        ).toBeVisible();
    },
};

export const AlarmHomingRequired = {
    parameters: {
        machine: {
            preset: 'alarm',
            hasHomed: false,
            status: { alarmCode: 11 },
        },
    },
    play: async ({ canvas }) => {
        await expect(await badge(canvas, /on COM4/)).toBeVisible();
        await expect(
            canvas.getByText(/Homing is required before any motion/),
        ).toBeVisible();
        await expect(
            canvas.getByRole('button', { name: 'Home' }),
        ).toBeEnabled();
    },
};

export const ToolChange = {
    parameters: {
        machine: { file: FILE, sender: SENDER },
    },
    play: async ({ canvas }) => {
        await expect(await badge(canvas, /Idle/)).toBeVisible();
        // The Standard Re-zero tool change, loaded as the pendant sagas do on M6
        pubsub.publishSync('wizard:load', {
            title: 'Standard Re-zero Tool Change',
            instructions: manualToolChange,
            context: {},
            comment: '',
        });
        await expect(
            await canvas.findByText('Standard Re-zero Tool Change'),
        ).toBeVisible();
        await expect(await badge(canvas, /Tool change/)).toBeVisible();
    },
};

export const ToolChangeWithoutGuide = {
    parameters: {
        machine: {
            preset: 'hold',
            file: FILE,
            sender: SENDER,
            status: { activeState: 'Tool' },
        },
    },
    play: async ({ canvas }) => {
        await expect(await badge(canvas, /Tool change/)).toBeVisible();
        await expect(
            canvas.getByText(/The controller is waiting on a tool change/),
        ).toBeVisible();
    },
};
