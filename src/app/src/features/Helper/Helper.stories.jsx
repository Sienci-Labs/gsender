import { expect, spyOn, waitFor, within } from 'storybook/test';
import pubsub from 'pubsub-js';
import controller from 'app/lib/controller';
import manualToolChange from 'app/wizards/manualToolchange';

import { Helper } from './index';

const meta = {
    component: Helper,
    tags: ['ai-generated'],
    // Machine state is applied by .storybook/machine-state.js
    parameters: { machine: { preset: 'idle' } },
    decorators: [
        // Panels position themselves absolutely within the workspace
        (Story) => (
            <div
                className="relative h-[620px] w-[1100px]"
                data-testid="helper-host"
            >
                <Story />
            </div>
        ),
    ],
};

export default meta;

// Loads the real Standard Re-zero tool change, as controllerSagas does on M6
const loadToolChange = () =>
    pubsub.publishSync('wizard:load', {
        title: 'Standard Re-zero Tool Change',
        instructions: manualToolChange,
        context: {},
        comment: '',
    });

// Action chips pair a label with a generic "Run" button
const runAction = (canvas, label) =>
    within(canvas.getByText(label).closest('[data-chip]')).getByRole('button', {
        name: 'Run',
    });

export const Hidden = {
    play: async ({ canvas }) => {
        // Nothing shows until a wizard or info panel is requested
        await expect(
            canvas.getByTestId('helper-host').firstElementChild,
        ).toHaveClass('hidden');
    },
};

export const AlarmInformation = {
    play: async ({ canvasElement }) => {
        // MachineStatus's alarm "?" icon publishes just the code; the helper adds the
        // controller's description and its own guidance from the message registry
        pubsub.publishSync('helper:info', { kind: 'alarm', code: 1 });
        // The panel portals to document.body
        const body = within(canvasElement.ownerDocument.body);
        await waitFor(() =>
            expect(body.getByText('Hard limit triggered')).toBeVisible(),
        );
        await expect(
            body.getByText(/Clear the alarm, then home the machine/),
        ).toBeVisible();
        // Its guide is offered as a link (and QR code) to the limits article; the panel
        // renders landscape and portrait variants, so check the link target, not one label
        const guideLinks = body
            .getAllByRole('link')
            .map((link) => link.getAttribute('href'));
        await expect(guideLinks).toContain(
            'https://sienci.zendesk.com/hc/en-us/articles/41566952133524-Alarm-1-Alarm-2',
        );
    },
};

export const ToolChangeWizard = {
    play: async ({ canvas, userEvent }) => {
        const command = spyOn(controller, 'command');
        loadToolChange();

        await expect(
            await canvas.findByText('Standard Re-zero Tool Change'),
        ).toBeVisible();
        // Step titles show in both the step list and the active step
        await expect(
            (await canvas.findAllByText('Safety First'))[0],
        ).toBeVisible();
        await expect(
            canvas.getByRole('button', { name: 'Back' }),
        ).toBeDisabled();

        await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
        await userEvent.click(canvas.getByRole('button', { name: 'Next' }));

        // "Reset the Z" can't be skipped until one of its actions runs
        await waitFor(() =>
            expect(canvas.getByRole('button', { name: 'Next' })).toBeDisabled(),
        );
        await userEvent.click(runAction(canvas, 'Set Z0 (paper method)'));
        await expect(command).toHaveBeenCalledWith('wizard:step', 1, 0);
        await expect(command).toHaveBeenCalledWith('gcode', [
            '(Setting Z 0)',
            'G10 L20 P0 Z0',
            'G21',
        ]);
    },
};

export const ToolChangeWhileBusy = {
    // Wizard actions wait for the machine to be idle
    parameters: { machine: { preset: 'running' } },
    play: async ({ canvas, userEvent }) => {
        loadToolChange();
        await canvas.findAllByText('Safety First');
        await expect(
            canvas.getByRole('button', { name: 'Next' }),
        ).toBeDisabled();
    },
};
