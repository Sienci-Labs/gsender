import { expect, waitFor, within } from 'storybook/test';
import reduxStore from 'app/store/redux';
import {
    updateControllerState,
    updateSenderStatus,
    updateWorkflowState,
} from 'app/store/redux/slices/controller.slice';
import {
    LEGACY,
    pendantParameters,
    withPendant,
} from '../../../../.storybook/pendant';

import JobCompletionAlert from './JobCompletionAlert';

const FILE = { name: 'sign-pocket.nc', total: 18250 };
const START = Date.UTC(2026, 10, 18, 14, 2, 0);

const runningSender = {
    name: FILE.name,
    total: FILE.total,
    sent: 18000,
    received: 18000,
    startTime: START,
    elapsedTime: 44 * 60 * 1000,
    finishTime: 0,
};

// The job finishes: the sender reports a finish time and the workflow returns
// to idle, as the server does at the end of a job
const finishJob = (elapsedMinutes = 45) => {
    const { type, state } = reduxStore.getState().controller;
    reduxStore.dispatch(
        updateSenderStatus({
            status: {
                ...runningSender,
                sent: FILE.total,
                received: FILE.total,
                elapsedTime: elapsedMinutes * 60 * 1000,
                finishTime: START + elapsedMinutes * 60 * 1000,
            },
        }),
    );
    reduxStore.dispatch(
        updateControllerState({
            type,
            state: {
                ...state,
                status: { ...state.status, activeState: 'Idle' },
            },
        }),
    );
    reduxStore.dispatch(updateWorkflowState({ state: 'idle' }));
};

// Watches for a job that ran on this pendant to finish and shows the desktop's
// job-end summary dialog. Renders nothing until then, so every story starts
// mid-job (machine state) and finishes it in its play function
const meta = {
    title: 'Pendant/JobCompletionAlert',
    component: JobCompletionAlert,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '600px' } },
        pendant: { width: LEGACY.width, height: 560 },
        machine: {
            preset: 'running',
            port: 'COM4',
            file: FILE,
            sender: runningSender,
        },
    },
};

export default meta;

const dialog = (canvasElement) =>
    within(canvasElement.ownerDocument.body).findByRole('alertdialog');

// Nothing shows while the job is still running
export const JobRunning = {
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement.ownerDocument.body).queryByRole('alertdialog'),
        ).toBeNull();
    },
};

export const JobComplete = {
    play: async ({ canvasElement }) => {
        finishJob();
        const alert = await dialog(canvasElement);
        await waitFor(() => expect(alert).toBeVisible());
    },
};

export const LongJobComplete = {
    play: async ({ canvasElement }) => {
        finishJob(3 * 60 + 12);
        const alert = await dialog(canvasElement);
        await waitFor(() => expect(alert).toBeVisible());
    },
};
