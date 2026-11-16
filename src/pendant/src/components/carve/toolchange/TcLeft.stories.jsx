import pubsub from 'pubsub-js';
import { expect, waitFor } from 'storybook/test';
import manualToolChange from 'app/wizards/manualToolchange';
import {
    CARVE_LEFT,
    pendantParameters,
    withPendant,
} from '../../../../../../.storybook/pendant';

import TcLeft from './TcLeft';
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
    title: 'Pendant/Carve/TcLeft',
    component: TcLeft,
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
    // Left column of the carve screen during a tool change: the wizard's step list
    // with Back / Next. Steps come from the wizard context, not props.
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '520px' } },
        pendant: { width: CARVE_LEFT, height: 480 },
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
            canvas.getByText(/The controller is waiting on a tool change/),
        ).toBeVisible();
    },
};

export const FirstStep = {
    play: async ({ canvas }) => {
        loadToolChange();
        await expect(
            await canvas.findByText('Standard Re-zero Tool Change'),
        ).toBeVisible();
        await expect(button(canvas, 'Back')).toBeDisabled();
    },
};

export const SecondStep = {
    play: async ({ canvas, userEvent }) => {
        loadToolChange();
        await canvas.findByText('Standard Re-zero Tool Change');
        const next = button(canvas, 'Next');
        await waitFor(() => expect(next).toBeEnabled());
        await userEvent.click(next);
        await waitFor(() => expect(button(canvas, 'Back')).toBeEnabled());
    },
};

export const MachineBusy = {
    parameters: { machine: { preset: 'running' } },
    play: async ({ canvas }) => {
        loadToolChange();
        await canvas.findByText('Standard Re-zero Tool Change');
        // Steps can't advance while the machine is moving
        await expect(button(canvas, 'Next')).toBeDisabled();
    },
};
