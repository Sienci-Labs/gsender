import { expect, spyOn, within } from 'storybook/test';
import controller from 'app/lib/controller';

import MovementTuning from './index';

const meta = {
  component: MovementTuning,
  tags: ['ai-generated'],
  // Machine state is applied by .storybook/machine-state.js; $100-$102 are steps/mm
  parameters: { machine: { preset: 'idle', settings: { $100: '200', $101: '200', $102: '400' } } },
  decorators: [
    (Story) => (
      <div className="w-[1100px] p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;

const button = (canvas, name) => canvas.getByRole('button', { name });

// Mark, move the axis the default 100 mm, then report how far it actually went
const runTuning = async (canvas, userEvent, axis, measured) => {
  await userEvent.click(button(canvas, 'Start Movement Tuning'));
  await userEvent.click(button(canvas, 'Mark First Location'));
  await userEvent.click(button(canvas, `Move ${axis}-axis`));

  // The measured-distance input is the only one enabled at this step
  const measuredInput = canvas.getAllByRole('spinbutton').find((input) => !input.disabled);
  await userEvent.clear(measuredInput);
  await userEvent.type(measuredInput, String(measured));
  // ControlledInput reports its value on blur
  await userEvent.tab();
  await userEvent.click(button(canvas, 'Set Distance Travelled'));
};

export const Introduction = {
  play: async ({ canvas }) => {
    await expect(button(canvas, 'Start Movement Tuning')).toBeEnabled();
    await expect(canvas.getByText('X-Axis')).toBeVisible();
  },
};

export const NotConnected = {
  parameters: { machine: { preset: 'disconnected' } },
  play: async ({ canvas }) => {
    await expect(button(canvas, 'Start Movement Tuning')).toBeDisabled();
  },
};

export const XAxisNeedsCorrection = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    const command = spyOn(controller, 'command');
    await runTuning(canvas, userEvent, 'X', 99);

    // Moves with a jog command, so the machine's modal state is untouched
    await expect(command).toHaveBeenCalledWith('gcode', ['$J=G21 G91 X100 F1000']);
    await expect(canvas.getByText(/movement was\s+off by/)).toHaveTextContent('off by 1 mm.');

    await userEvent.click(button(canvas, 'Update step/mm'));
    const dialog = await within(canvasElement.ownerDocument.body).findByRole('alertdialog', { name: 'Update Firmware' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Update Firmware' }));
    // 200 steps/mm * 100 / 99
    await expect(command).toHaveBeenCalledWith('gcode', ['$100=202.02', '$$']);
  },
};

export const AccurateAxis = {
  play: async ({ canvas, userEvent }) => {
    await runTuning(canvas, userEvent, 'X', 100);
    await expect(canvas.getByText(/X-axis looks accurate/)).toBeVisible();
  },
};

export const TuneZAxis = {
  play: async ({ canvas, userEvent }) => {
    const command = spyOn(controller, 'command');
    // Axis picker is a react-select; its label isn't associated, so its input is an unnamed textbox
    await userEvent.click(canvas.getByRole('textbox'));
    await userEvent.click(await canvas.findByText('Z-Axis'));
    // Z tunes downward: it moves -50 mm and expects the measurement as -50
    await runTuning(canvas, userEvent, 'Z', -50);
    await expect(command).toHaveBeenCalledWith('gcode', ['$J=G21 G91 Z-50 F1000']);
    await expect(canvas.getByText(/Z-axis looks accurate/)).toBeVisible();
  },
};
