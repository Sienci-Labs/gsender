import { expect, spyOn, waitFor } from 'storybook/test';
import controller from 'app/lib/controller';

import Console from './index';

// Deliver a controller event to its listeners, as the socket handler does
const emit = (eventName, ...args) => {
  controller.listeners[eventName].forEach((listener) => listener(...args));
};

// Opens COM4; consoleIngest prints a connection banner for it
const openPort = async (canvas) => {
  emit('serialport:open', { port: 'COM4', baudrate: 115200, controllerType: 'grblHAL', inuse: true });
  // New messages fade in
  await waitFor(() => expect(canvas.getByText('Connected to COM4 with a baud rate of 115200')).toBeVisible());
};

const meta = {
  component: Console,
  tags: ['ai-generated'],
  args: { isActive: true },
  // Machine state is applied by .storybook/machine-state.js
  parameters: { machine: { preset: 'idle' } },
  beforeEach: () => {
    // Messages live in a module-level store shared by every console view; closing
    // the port clears it (and its once-per-connection banner) between stories
    emit('serialport:close');
  },
  decorators: [
    (Story) => (
      <div className="relative h-80 w-[560px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;

export const NotConnected = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Not connected to a device')).toBeVisible();
  },
};

export const ShowsControllerOutput = {
  play: async ({ canvas }) => {
    await openPort(canvas);
    await waitFor(() => expect(canvas.getByText('Not connected to a device')).not.toBeVisible());

    emit('serialport:read', 'ok');
    emit('serialport:read', 'error:9');
    await waitFor(() => expect(canvas.getByText('error:9')).toBeVisible());
  },
};

export const FilterFaults = {
  play: async ({ canvas, userEvent }) => {
    await openPort(canvas);
    emit('serialport:write', 'G0 X10', { source: 'client' });
    emit('serialport:read', 'ok');
    emit('serialport:read', 'ALARM:1');
    await canvas.findByText('ALARM:1');

    await userEvent.click(canvas.getByRole('button', { name: 'Faults' }));
    await expect(canvas.getByRole('button', { name: 'Faults' })).toHaveAttribute('aria-pressed', 'true');
    // Only alarms and errors remain
    await waitFor(() => expect(canvas.getByText('ALARM:1')).toBeVisible());
    await expect(canvas.queryByText('G0 X10')).toBeNull();
    await expect(canvas.queryByText('Connected to COM4 with a baud rate of 115200')).toBeNull();
  },
};

export const SendCommand = {
  play: async ({ canvas, userEvent }) => {
    const writeln = spyOn(controller, 'writeln').mockImplementation(() => {});
    await openPort(canvas);

    const input = canvas.getByRole('textbox', { name: 'Console command' });
    await userEvent.type(input, '$${Enter}');
    await expect(writeln).toHaveBeenCalledWith('$$');
    await expect(input).toHaveValue('');
  },
};

export const CommandHistory = {
  parameters: { machine: { preset: 'idle', consoleInputHistory: ['$X', 'G0 X10', '$$'] } },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('textbox', { name: 'Console command' });
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowUp}');
    await expect(input).toHaveValue('$$');
    await userEvent.keyboard('{ArrowUp}');
    await expect(input).toHaveValue('G0 X10');
    await userEvent.keyboard('{ArrowDown}');
    await expect(input).toHaveValue('$$');
  },
};
