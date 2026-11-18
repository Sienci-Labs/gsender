import { useRef } from 'react';
import { expect, spyOn, waitFor } from 'storybook/test';
import { buildMachineBedOptions } from 'app/features/Visualizer/viewerOptions';
import controller from 'app/lib/controller';
import {
    pendantParameters,
    TABLET,
    withPendant,
} from '../../../../../../.storybook/pendant';

import VizCornerTargets from './VizCornerTargets';

// $22 = homing on, $130-$132 = X/Y/Z max travel
const SETTINGS = { $22: '1', $130: '810', $131: '855', $132: '120' };
const INSET = 48;

// Stands in for the visualizer: draws the machine bed and projects work
// coordinates onto it the way the top-down viewer would, so the targets land
// on the bed's corners
function BedStage({ hidden }) {
    const stageRef = useRef(null);
    const bed = buildMachineBedOptions({ ignoreUserToggle: true });
    const visualizerRef = useRef({
        worldToScreen: (x, y) => {
            const stage = stageRef.current;
            const { min, max } = buildMachineBedOptions({
                ignoreUserToggle: true,
            });
            if (!stage || !min || !max) return null;
            const rect = stage.getBoundingClientRect();
            const w = rect.width - INSET * 2;
            const h = rect.height - INSET * 2;
            return {
                x: rect.left + INSET + ((x - min.x) / (max.x - min.x)) * w,
                y: rect.top + INSET + ((max.y - y) / (max.y - min.y)) * h,
            };
        },
    });
    return (
        <div ref={stageRef} className="relative h-full bg-surface-sunken">
            {bed.visible && (
                <div
                    className="absolute border border-dashed border-outline-strong"
                    style={{ inset: INSET }}
                />
            )}
            <VizCornerTargets visualizerRef={visualizerRef} hidden={hidden} />
        </div>
    );
}

// Hold-to-rapid targets on the machine bed's four corners in the carve
// screen's visualizer. Shown once homing is enabled and the machine has homed
// (the bed is only drawn then), and only in Setup
const meta = {
    title: 'Pendant/Carve/VizCornerTargets',
    component: VizCornerTargets,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '500px' } },
        pendant: {
            width: TABLET.width,
            height: Math.round(TABLET.height * 0.42),
        },
        machine: { preset: 'idle', settings: SETTINGS, hasHomed: true },
    },
    beforeEach() {
        spyOn(controller, 'command').mockImplementation(() => {});
    },
    args: { hidden: false },
    argTypes: {
        hidden: {
            description:
                'Hidden outside Setup, while tap-to-move is armed or a file is processing',
            control: { type: 'boolean' },
        },
        visualizerRef: { table: { disable: true } },
    },
    render: (args) => <BedStage {...args} />,
};

export default meta;

const targets = (canvasElement) =>
    canvasElement.querySelectorAll('[style*="left"] button');

export const Homed = {
    play: async ({ canvasElement }) => {
        await waitFor(() => expect(targets(canvasElement).length).toBe(4));
    },
};

// Targets show but are disabled until the machine can move
export const RunningJob = {
    parameters: { machine: { preset: 'running' } },
};

export const NotHomed = {
    parameters: { machine: { hasHomed: false } },
    play: async ({ canvasElement }) => {
        await expect(targets(canvasElement).length).toBe(0);
    },
};

export const Hidden = {
    args: { hidden: true },
};
