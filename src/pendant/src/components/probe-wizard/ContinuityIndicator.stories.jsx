import { expect } from 'storybook/test';
import {
    pendantParameters,
    withPendant,
} from '../../../../../.storybook/pendant';

import { ContinuityIndicator } from './ContinuityIndicator';

// The animated probe-contact dial on the probe wizard's continuity step
const meta = {
    title: 'Pendant/ProbeWizard/ContinuityIndicator',
    component: ContinuityIndicator,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '260px' } },
        pendant: { width: 360, height: 240, padding: 16 },
    },
    args: { phase: 'waiting', size: 140 },
    argTypes: {
        phase: {
            description: 'Where the continuity check is',
            control: { type: 'inline-radio' },
            options: ['checking-idle', 'waiting', 'success', 'stuck-on'],
        },
        size: {
            description: 'Dial diameter in px',
            control: { type: 'range', min: 80, max: 200, step: 10 },
        },
        label: {
            description: 'Replaces the phase readout',
            control: { type: 'text' },
        },
    },
};

export default meta;

const readout = (canvas, text) =>
    expect(canvas.getByRole('status')).toHaveTextContent(text);

export const CheckingIdle = {
    args: { phase: 'checking-idle' },
    play: ({ canvas }) => readout(canvas, 'Checking continuity…'),
};

export const Waiting = {
    play: ({ canvas }) => readout(canvas, 'Waiting for probe contact…'),
};

export const Success = {
    args: { phase: 'success' },
    play: ({ canvas }) => readout(canvas, 'Continuity confirmed'),
};

export const StuckOn = {
    args: { phase: 'stuck-on' },
    play: ({ canvas }) => readout(canvas, 'Sensor triggered immediately'),
};

export const Small = {
    args: { size: 96 },
};
