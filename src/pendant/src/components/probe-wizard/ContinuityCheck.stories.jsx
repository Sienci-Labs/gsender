import { expect, fn, waitFor } from 'storybook/test';
import reduxStore from 'app/store/redux';
import { updateControllerState } from 'app/store/redux/slices/controller.slice';
import {
    pendantParameters,
    withPendant,
} from '../../../../../.storybook/pendant';

import { ContinuityCheck } from './ContinuityCheck';

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

// Step 2 of the probe wizard: watches the probe pin until the plate is touched
// to the bit. The pin comes from the machine state (status.pinState.P)
const meta = {
    title: 'Pendant/ProbeWizard/ContinuityCheck',
    component: ContinuityCheck,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '560px' } },
        pendant: { width: 760, height: 520, padding: '16px 20px' },
        machine: { preset: 'idle' },
    },
    args: { active: true, onComplete: fn(), onPhaseChange: fn() },
    argTypes: {
        active: {
            description:
                'Whether this wizard step is on screen; the pin is only watched while it is',
            control: { type: 'boolean' },
        },
    },
};

export default meta;

const status = (canvas, text) =>
    waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent(text));

export const Waiting = {
    play: ({ canvas }) => status(canvas, 'Waiting for probe contact…'),
};

export const ContactMade = {
    play: async ({ args, canvas }) => {
        await status(canvas, 'Waiting for probe contact…');
        touchProbe();
        await status(canvas, 'Continuity confirmed');
        await waitFor(() => expect(args.onComplete).toHaveBeenCalled(), {
            timeout: 3000,
        });
    },
};

// The pin was already on when the step opened: plate resting on the bit,
// or a shorted probe cable
export const StuckOn = {
    parameters: {
        machine: { preset: 'idle', status: { pinState: { P: true } } },
    },
    play: ({ canvas }) => status(canvas, 'Sensor triggered immediately'),
};

export const Inactive = {
    args: { active: false },
    play: ({ canvas }) => status(canvas, 'Checking continuity…'),
};
