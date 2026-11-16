import pubsub from 'pubsub-js';
import { expect, waitFor } from 'storybook/test';
import manualToolChange from 'app/wizards/manualToolchange';
import {
    CARVE_RIGHT,
    pendantParameters,
    withPendant,
} from '../../../../../../.storybook/pendant';

import TcRight from './TcRight';
import WizardBridge from './WizardBridge';

// Loads the real Standard Re-zero tool change, as the pendant sagas do on M6
const loadToolChange = () =>
    pubsub.publishSync('wizard:load', {
        title: 'Standard Re-zero Tool Change',
        instructions: manualToolChange,
        context: {},
        comment: '',
    });

const meta = {
    title: 'Pendant/Carve/TcRight',
    component: TcRight,
    tags: ['ai-generated'],
    decorators: [
        // WizardBridge is what PendantShell mounts to turn wizard:load into wizard state
        (Story) => (
            <>
                <WizardBridge />
                <Story />
            </>
        ),
        withPendant,
    ],
    // Right column of the carve screen during a tool change: the current step's
    // instructions, or the jog pad via the Guide / Jog toggle
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '520px' } },
        pendant: { width: CARVE_RIGHT, height: 480 },
        machine: { preset: 'idle' },
    },
};

export default meta;

const button = (canvas, name) => canvas.getByRole('button', { name });

export const NoGuideLoaded = {
    parameters: {
        machine: { preset: 'hold', status: { activeState: 'Tool' } },
    },
    play: async ({ canvas }) => {
        await expect(
            canvas.getByText(/No tool-change guide was loaded on the pendant/),
        ).toBeVisible();
    },
};

export const Guide = {
    play: async ({ canvas }) => {
        loadToolChange();
        // The header switches from the generic title to the wizard's current step
        await waitFor(() =>
            expect(canvas.queryByText('Tool change')).toBeNull(),
        );
        await expect(button(canvas, 'guide')).toBeVisible();
    },
};

export const Jog = {
    play: async ({ canvas, userEvent }) => {
        loadToolChange();
        await userEvent.click(button(canvas, 'jog'));
        await expect(
            await canvas.findByRole('button', { name: 'Jog X plus' }),
        ).toBeVisible();
    },
};
