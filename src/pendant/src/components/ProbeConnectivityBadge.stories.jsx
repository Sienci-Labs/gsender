import { expect } from 'storybook/test';
import { pendantParameters, withPendant } from '../../../../.storybook/pendant';

import ProbeConnectivityBadge from './ProbeConnectivityBadge';

// Probe-pin pill (Active / No Touch). Not currently rendered by any pendant
// screen; kept here so the design has it
const meta = {
    title: 'Pendant/ProbeConnectivityBadge',
    component: ProbeConnectivityBadge,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '80px' } },
        pendant: { width: 160, padding: 12 },
    },
    args: { isConnected: true, probeActive: false },
    argTypes: {
        isConnected: {
            description: 'Renders nothing while disconnected',
            control: { type: 'boolean' },
        },
        probeActive: {
            description: 'Probe pin asserted',
            control: { type: 'boolean' },
        },
        className: { table: { disable: true } },
    },
};

export default meta;

export const NoTouch = {
    play: async ({ canvas }) => {
        await expect(canvas.getByText('No Touch')).toBeVisible();
    },
};

export const Active = {
    args: { probeActive: true },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Active')).toBeVisible();
    },
};

export const Disconnected = {
    args: { isConnected: false },
};
