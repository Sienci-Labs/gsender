import { useArgs } from 'storybook/preview-api';
import { expect, fn, within } from 'storybook/test';
import {
    DRAWER_EXPANDED,
    LEGACY,
    pendantParameters,
    withPendant,
} from '../../../../../.storybook/pendant';

import ProbeWizardDrawer from './ProbeWizardDrawer';

const axes = (x, y, z) => ({ x, y, z });
// The routines ProbePanel offers a standard touch plate (app/src/features/Probe)
const ROUTINES = {
    'XYZ Touch': {
        id: 'XYZ Touch',
        safe: true,
        tool: true,
        axes: axes(1, 1, 1),
    },
    'XY Touch': { id: 'XY Touch', safe: true, tool: true, axes: axes(1, 1, 0) },
    'X Touch': { id: 'X Touch', safe: true, tool: true, axes: axes(1, 0, 0) },
    'Y Touch': { id: 'Y Touch', safe: true, tool: true, axes: axes(0, 1, 0) },
    'Z Touch': { id: 'Z Touch', safe: false, tool: false, axes: axes(0, 0, 1) },
};

const TOOLS = [
    { metricDiameter: 3.175, imperialDiameter: 0.125, type: 'End Mill' },
    { metricDiameter: 6.35, imperialDiameter: 0.25, type: 'End Mill' },
    { metricDiameter: 12.7, imperialDiameter: 0.5, type: 'End Mill' },
];

// What ProbePanel passes down from the shared probe hook
const probeState = ({ toolDiameter, units, probeType, touchplateType }) => ({
    touchplate: { touchplateType },
    toolDiameter,
    probeType,
    availableTools: TOOLS,
    units,
});

const probeActions = {
    _setProbeType: fn(),
    _setToolDiameter: fn(),
    _setCurrentTool: fn(),
    generateProbeCommands: fn(() => []),
    runProbeCommands: fn(),
};

// The probe wizard ProbePanel shows in the expanded drawer: 1) diameter and
// corner, 2) continuity check, 3) review and Start probe. The step, corner and
// furthest step reached are ProbePanel state, so they are controls here and
// follow the wizard's own navigation.
const meta = {
    title: 'Pendant/ProbeWizard/ProbeWizardDrawer',
    component: ProbeWizardDrawer,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: `${DRAWER_EXPANDED + 40}px` } },
        pendant: {
            width: LEGACY.width,
            height: DRAWER_EXPANDED,
            padding: '8px 12px',
        },
        machine: { preset: 'idle' },
    },
    args: {
        step: 0,
        maxReached: 0,
        direction: 0,
        toolDiameter: 6.35,
        units: 'mm',
        probeType: 'Diameter',
        touchplateType: 'Standard Block',
        routine: 'XYZ Touch',
        skipContinuity: false,
        onStepChange: fn(),
        onMaxReachedChange: fn(),
        onDirectionChange: fn(),
        onCollapse: fn(),
        onRunComplete: fn(),
    },
    argTypes: {
        step: {
            description:
                'Wizard step: 0 diameter and corner, 1 continuity, 2 review',
            control: { type: 'inline-radio' },
            options: [0, 1, 2],
        },
        maxReached: {
            description:
                'Furthest step reached; the progress pips allow jumping back to it',
            control: { type: 'inline-radio' },
            options: [0, 1, 2],
        },
        direction: {
            description: 'Probing corner',
            control: {
                type: 'select',
                labels: {
                    0: 'Bottom left',
                    1: 'Top left',
                    2: 'Top right',
                    3: 'Bottom right',
                },
            },
            options: [0, 1, 2, 3],
        },
        toolDiameter: {
            control: { type: 'select' },
            options: TOOLS.flatMap((tool) => [
                tool.metricDiameter,
                tool.imperialDiameter,
            ]),
        },
        units: { control: { type: 'inline-radio' }, options: ['mm', 'in'] },
        probeType: {
            description:
                'Diameter, or Auto/Tip for AutoZero and BitZero plates',
            control: { type: 'inline-radio' },
            options: ['Diameter', 'Auto', 'Tip'],
            table: { category: 'Probe state' },
        },
        touchplateType: {
            control: { type: 'select' },
            options: ['Standard Block', 'AutoZero', 'BitZero', '3D Probe'],
            table: { category: 'Probe state' },
        },
        routine: {
            description: 'Selected probing routine',
            control: { type: 'select' },
            options: Object.keys(ROUTINES),
            table: { category: 'Probe state' },
        },
        // Built from the Probe state controls
        state: { table: { disable: true } },
        actions: { table: { disable: true } },
        probeCmd: { table: { disable: true } },
    },
    render: function Render({ probeType, touchplateType, routine, ...args }) {
        const [, updateArgs] = useArgs();
        return (
            <ProbeWizardDrawer
                {...args}
                state={probeState({ ...args, probeType, touchplateType })}
                actions={probeActions}
                probeCmd={ROUTINES[routine]}
                onStepChange={(step) => {
                    args.onStepChange(step);
                    updateArgs({ step });
                }}
                onMaxReachedChange={(maxReached) => {
                    args.onMaxReachedChange(maxReached);
                    updateArgs({ maxReached });
                }}
                onDirectionChange={(direction) => {
                    args.onDirectionChange(direction);
                    updateArgs({ direction });
                }}
            />
        );
    },
};

export default meta;

export const ChooseDiameterAndCorner = {
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Step 1 of 3')).toBeVisible();
        await expect(
            canvas.getByRole('button', { name: 'Next' }),
        ).toBeEnabled();
    },
};

export const NonDefaultCorner = {
    args: { direction: 2 },
    play: async ({ canvas }) => {
        await expect(
            canvas.getByText(/Non-default corner selected/),
        ).toBeVisible();
    },
};

export const ZRoutine = {
    args: { routine: 'Z Touch' },
    play: async ({ canvas }) => {
        await expect(canvas.getByText(/Not needed for the/)).toBeVisible();
    },
};

export const AutoZeroPlate = {
    args: { touchplateType: 'AutoZero', probeType: 'Auto' },
};

export const ContinuityCheck = {
    args: { step: 1, maxReached: 1 },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Step 2 of 3')).toBeVisible();
    },
};

export const ReadyToRun = {
    args: { step: 2, maxReached: 2, skipContinuity: true, direction: 1 },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Ready to run')).toBeVisible();
    },
};

// Starting the probe runs the routine, confirms it in a toast and resets the
// wizard for next time
export const StartProbe = {
    args: { step: 2, maxReached: 2, skipContinuity: true, direction: 1 },
    play: async ({ canvas, canvasElement, userEvent }) => {
        await userEvent.click(canvas.getByText('Start probe'));
        await expect(
            await within(canvasElement.ownerDocument.body).findByText(
                /^Probing cycle started: Top left/,
            ),
        ).toBeInTheDocument();
        await expect(await canvas.findByText('Step 1 of 3')).toBeVisible();
    },
};

export const Imperial = {
    args: {
        step: 2,
        maxReached: 2,
        skipContinuity: true,
        units: 'in',
        toolDiameter: 0.25,
    },
};
