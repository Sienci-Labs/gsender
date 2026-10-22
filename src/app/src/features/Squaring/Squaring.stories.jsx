import { expect, spyOn, waitFor, within } from 'storybook/test';
import controller from 'app/lib/controller';

import Squaring from './index';

const meta = {
  component: Squaring,
  tags: ['ai-generated'],
  // Machine state is applied by .storybook/machine-state.js; $100/$101 are steps/mm
  parameters: { machine: { preset: 'idle', settings: { $100: '200', $101: '200' } } },
  decorators: [
    (Story) => (
      <div className="h-[760px] w-[1200px] p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;

const button = (canvas, name) => canvas.getByRole('button', { name });

// The wizard opens on a landing page; its single sub-wizard is a card to start
const start = async (canvas, userEvent) => {
  await userEvent.click(await canvas.findByRole('button', { name: /XY Squaring/ }));
};

// The wizard advances with Next once the current step is complete
const next = async (canvas, userEvent) => {
  await waitFor(() => expect(button(canvas, /Next/)).toBeEnabled());
  await userEvent.click(button(canvas, /Next/));
};

// Marks the triangle: point 1, move X 300 mm, point 2, move Y 300 mm, point 3
const markPoints = async (canvas, userEvent) => {
  await start(canvas, userEvent);
  await next(canvas, userEvent);
  for (const step of ['Mark Point 1', 'Move X-axis', 'Mark Point 2', 'Move Y-axis', 'Mark Point 3']) {
    await userEvent.click(await canvas.findByRole('button', { name: step }));
  }
  await next(canvas, userEvent);
};

// Enters the three tape-to-tape measurements in order 1-2, 2-3, 1-3
const measure = async (canvas, userEvent, distances) => {
  const inputs = await canvas.findAllByPlaceholderText('Enter measurement');
  for (const [index, distance] of distances.entries()) {
    await userEvent.type(inputs[index], String(distance));
    // ControlledInput reports its value on blur
    await userEvent.tab();
    await userEvent.click(canvas.getAllByRole('button', { name: 'Confirm' })[0]);
  }
  // The results follow the last step
  await next(canvas, userEvent);
};

export const Landing = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('button', { name: /XY Squaring/ })).toBeEnabled();
  },
};

export const NotConnected = {
  parameters: { machine: { preset: 'disconnected' } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(/not connected/i)).toBeVisible();
  },
};

export const MarkReferencePoints = {
  play: async ({ canvas, userEvent }) => {
    const command = spyOn(controller, 'command');
    await start(canvas, userEvent);
    await next(canvas, userEvent);

    // Steps unlock in order
    await expect(await canvas.findByRole('button', { name: 'Move X-axis' })).toBeDisabled();
    await userEvent.click(button(canvas, 'Mark Point 1'));
    await userEvent.click(button(canvas, 'Move X-axis'));
    await expect(command).toHaveBeenCalledWith('gcode', 'G91 G21 G0 X300');

    await userEvent.click(button(canvas, 'Mark Point 2'));
    await userEvent.click(button(canvas, 'Move Y-axis'));
    await expect(command).toHaveBeenCalledWith('gcode', 'G91 G21 G0 Y300');

    await userEvent.click(button(canvas, 'Mark Point 3'));
    await waitFor(() => expect(button(canvas, /Next/)).toBeEnabled());
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
