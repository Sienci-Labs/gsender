import { useArgs } from 'storybook/preview-api';
import { expect, fn, waitFor } from 'storybook/test';
import reduxStore from 'app/store/redux';
import { updateControllerState } from 'app/store/redux/slices/controller.slice';
import {
    DRAWER_EXPANDED,
    DRAWER_MINIMAL,
    LEGACY,
    pendantParameters,
    withPendant,
} from '../../../../.storybook/pendant';

import ProbePanel from './ProbePanel';

// The probe touches the plate: the controller reports the probe pin (P) on
const touchProbe = () => {
    const { type, state } = reduxStore.getState().controller;
    reduxStore.dispatch(
        updateControllerState({
            type,
            state: {
                ...state,
                status: { ...state.status, pinState: { P: true } },
            },
        }),
    );
};

// Mirrors app/src/features/Probe/Probe.stories.jsx. The pendant's probe tab
// (legacy bottom drawer and the carve screen's Setup > Position tab). Minimal
// shows the routine list and Set Up Probe; Set Up Probe expands the drawer
// into the touch-first probe wizard (see ProbeWizard/ProbeWizardDrawer)
const meta = {
    title: 'Pendant/ProbePanel',
    component: ProbePanel,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: `${DRAWER_EXPANDED + 40}px` } },
        pendant: { width: LEGACY.width, height: DRAWER_MINIMAL },
        machine: { preset: 'idle' },
    },
    args: { mode: 'minimal', onModeChange: fn() },
    argTypes: {
        mode: {
            description:
                'Bottom drawer height: minimal shows the routines, expanded shows the probe wizard',
            control: { type: 'inline-radio' },
            options: ['minimal', 'expanded'],
        },
    },
    // The panel asks its drawer to expand or collapse; follow it here
    render: function Render(args) {
        const [, updateArgs] = useArgs();
        return (
            <ProbePanel
                {...args}
                onModeChange={(mode) => {
                    args.onModeChange(mode);
                    updateArgs({ mode });
                }}
            />
        );
    },
};

export default meta;

const expanded = { pendant: { width: LEGACY.width, height: DRAWER_EXPANDED } };

export const Idle = {
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Set Up Probe')).toBeEnabled();
    },
};

export const Wizard = {
    args: { mode: 'expanded' },
    parameters: expanded,
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Step 1 of 3')).toBeVisible();
    },
};

export const CircuitCheckThenProbe = {
    args: { mode: 'expanded' },
    parameters: expanded,
    play: async ({ canvas, userEvent }) => {
        await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
        await expect(
            await canvas.findByText('Waiting for continuity…'),
        ).toBeVisible();
        touchProbe();
        // Confirmed continuity advances to the final step after a beat
        await waitFor(
            () => expect(canvas.getByText('Start probe')).toBeVisible(),
            { timeout: 3000 },
        );
    },
};

export const RepeatLast = {
    parameters: {
        appStore: {
            'widgets.probe.lastProbeCorner': 2,
            'widgets.probe.lastProbeDiameter': 6.35,
            'widgets.probe.lastProbeType': 'Diameter',
        },
    },
    play: async ({ canvas }) => {
        await expect(canvas.getByText(/^Repeat last:/)).toBeVisible();
    },
};

export const ZProbeOnly = {
    parameters: {
        appStore: { 'workspace.probeProfile.touchplateType': 'Z Probe' },
    },
};

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Set Up Probe')).toBeDisabled();
    },
};
