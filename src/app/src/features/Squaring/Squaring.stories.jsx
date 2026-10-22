import { expect, spyOn, within } from 'storybook/test';
import controller from 'app/lib/controller';

import Squaring from './index';

const meta = {
  component: Squaring,
  tags: ['ai-generated'],
  // Machine state is applied by .storybook/machine-state.js; $100/$101 are steps/mm
  parameters: { machine: { preset: 'idle', settings: { $100: '200', $101: '200' } } },
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

// Marks the triangle: point 1, move X 300 mm, point 2, move Y 300 mm, point 3
const markPoints = async (canvas, userEvent) => {
  await userEvent.click(button(canvas, 'Start XY Squaring'));
  for (const step of ['Mark Point 1', 'Move X-axis', 'Mark Point 2', 'Move Y-axis', 'Mark Point 3']) {
    await userEvent.click(button(canvas, step));
  }
  await userEvent.click(button(canvas, 'Next Step'));
};

// Enters the three tape-to-tape measurements in order 1-2, 2-3, 1-3
const measure = async (canvas, userEvent, distances) => {
  const inputs = canvas.getAllByPlaceholderText('Enter measurement');
  for (const [index, distance] of distances.entries()) {
    await userEvent.type(inputs[index], String(distance));
    // ControlledInput reports its value on blur
    await userEvent.tab();
    await userEvent.click(canvas.getAllByRole('button', { name: 'Confirm' })[0]);
  }
  await userEvent.click(button(canvas, 'Next Step'));
};

export const Introduction = {
  play: async ({ canvas }) => {
    await expect(button(canvas, 'Start XY Squaring')).toBeEnabled();
  },
};

export const NotConnected = {
  parameters: { machine: { preset: 'disconnected' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Please connect to a device/)).toBeVisible();
    await expect(button(canvas, 'Start XY Squaring')).toBeDisabled();
  },
};

export const MarkReferencePoints = {
  play: async ({ canvas, userEvent }) => {
    const command = spyOn(controller, 'command');
    await userEvent.click(button(canvas, 'Start XY Squaring'));

    // Steps unlock in order
    await expect(button(canvas, 'Move X-axis')).toBeDisabled();
    await userEvent.click(button(canvas, 'Mark Point 1'));
    await userEvent.click(button(canvas, 'Move X-axis'));
    await expect(command).toHaveBeenCalledWith('gcode', 'G91 G21 G0 X300');

    await userEvent.click(button(canvas, 'Mark Point 2'));
    await userEvent.click(button(canvas, 'Move Y-axis'));
    await expect(command).toHaveBeenCalledWith('gcode', 'G91 G21 G0 Y300');

    await expect(button(canvas, 'Next Step')).toBeDisabled();
    await userEvent.click(button(canvas, 'Mark Point 3'));
    await expect(button(canvas, 'Next Step')).toBeEnabled();
  },
};

export const SquareMachine = {
  play: async ({ canvas, userEvent }) => {
    await markPoints(canvas, userEvent);
    // 300 x 300 with a matching diagonal: square, travel accurate
    await measure(canvas, userEvent, [300, 300, 424.26]);
    await expect(await canvas.findByText('Your machine is properly squared!')).toBeVisible();
  },
};

export const CorrectStepsPerMm = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    const command = spyOn(controller, 'command');
    await markPoints(canvas, userEvent);
    // X travelled 298 mm when asked for 300: $100 should become 200 * 300 / 298
    await measure(canvas, userEvent, [298, 300, 422.85]);

    await userEvent.click(await canvas.findByRole('button', { name: 'Update step/mm' }));
    const dialog = await within(canvasElement.ownerDocument.body).findByRole('alertdialog', { name: 'Update Firmware' });
    await expect(dialog).toHaveTextContent('X-axis: 201.342');
    await expect(dialog).toHaveTextContent('Y-axis: 200.000');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Update Firmware' }));

    await expect(command).toHaveBeenCalledWith('gcode', ['$100=201.342', '$101=200.000', '$$']);
  },
};
