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
      <div className="relative h-[620px] w-[1100px]" data-testid="helper-host">
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
  within(canvas.getByText(label).closest('[data-chip]')).getByRole('button', { name: 'Run' });

export const Hidden = {
  play: async ({ canvas }) => {
    // Nothing shows until a wizard or info panel is requested
    await expect(canvas.getByTestId('helper-host').firstElementChild).toHaveClass('hidden');
  },
};

export const AlarmInformation = {
  play: async ({ canvas }) => {
    // MachineStatus's alarm "?" icon publishes this
    pubsub.publishSync('helper:info', {
      title: 'Alarm Code 1',
      description: 'Hard limit has been triggered. Machine position is likely lost.',
    });
    await expect(await canvas.findByText('Alarm Code 1')).toBeVisible();
    await expect(canvas.getByText(/Hard limit has been triggered/)).toBeVisible();
  },
};

export const ToolChangeWizard = {
  play: async ({ canvas, userEvent }) => {
    const command = spyOn(controller, 'command');
    loadToolChange();

    await expect(await canvas.findByText('Standard Re-zero Tool Change')).toBeVisible();
    // Step titles show in both the step list and the active step
    await expect((await canvas.findAllByText('Safety First'))[0]).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Back' })).toBeDisabled();

    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));

    // "Reset the Z" can't be skipped until one of its actions runs
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Next' })).toBeDisabled());
    await userEvent.click(runAction(canvas, 'Set Z0 (paper method)'));
    await expect(command).toHaveBeenCalledWith('wizard:step', 1, 0);
    await expect(command).toHaveBeenCalledWith('gcode', ['(Setting Z 0)', 'G10 L20 P0 Z0', 'G21']);
  },
};

export const ToolChangeWhileBusy = {
  // Wizard actions wait for the machine to be idle
  parameters: { machine: { preset: 'running' } },
  play: async ({ canvas, userEvent }) => {
    loadToolChange();
    await canvas.findAllByText('Safety First');
    await expect(canvas.getByRole('button', { name: 'Next' })).toBeDisabled();
  },
};
