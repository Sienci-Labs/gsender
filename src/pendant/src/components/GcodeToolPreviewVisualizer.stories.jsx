import { expect, waitFor } from 'storybook/test';
import { pendantParameters, withPendant } from '../../../../.storybook/pendant';

import GcodeToolPreviewVisualizer from './GcodeToolPreviewVisualizer';

// Generated programs, as a tool like Surfacing would hand over
const GCODE = {
    none: undefined,
    rectangle: [
        'G21 G90',
        'G0 Z5',
        'G0 X0 Y0',
        'G1 Z-2 F300',
        'G1 X50 Y0 F1200',
        'G1 X50 Y30',
        'G1 X0 Y30',
        'G1 X0 Y0',
        'G0 Z5',
        'M30',
    ].join('\n'),
    surfacing: [
        'G21 G90',
        'G0 Z5',
        'G0 X0 Y0',
        'G1 Z-0.5 F300',
        ...Array.from({ length: 12 }, (_, i) => [
            `G1 X${i % 2 ? 0 : 120} Y${i * 8} F2500`,
            `G1 Y${(i + 1) * 8}`,
        ]).flat(),
        'G0 Z5',
        'M30',
    ].join('\n'),
};

// The pendant's top-down preview for G-code a tool generated locally
// (Surfacing, Rotary Surfacing). It never touches the loaded job
const meta = {
    title: 'Pendant/GcodeToolPreviewVisualizer',
    component: GcodeToolPreviewVisualizer,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '460px' } },
        pendant: { width: 520, height: 420 },
        machine: { preset: 'idle' },
    },
    args: { gcode: 'none' },
    argTypes: {
        gcode: {
            description: 'Generated G-code; none shows the placeholder',
            control: { type: 'inline-radio' },
            options: Object.keys(GCODE),
            mapping: GCODE,
        },
    },
};

export default meta;

export const NothingGenerated = {
    play: async ({ canvas }) => {
        await expect(canvas.getByText(/No g-code generated yet/)).toBeVisible();
    },
};

export const Rectangle = {
    args: { gcode: 'rectangle' },
    play: async ({ canvasElement }) => {
        await waitFor(() =>
            expect(canvasElement.querySelector('canvas')).not.toBeNull(),
        );
    },
};

export const SurfacingPass = {
    args: { gcode: 'surfacing' },
};
