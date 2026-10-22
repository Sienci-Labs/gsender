import { expect, spyOn, waitFor } from 'storybook/test';
import controller from 'app/lib/controller';

import Console from './index';

// Deliver a controller event to the widget's listeners, as the socket handler does
const emit = (eventName, ...args) => {
  controller.listeners[eventName].forEach((listener) => listener(...args));
};

const terminalText = (canvasElement) => canvasElement.querySelector('.xterm-rows')?.textContent ?? '';

// Opens COM4 and waits for xterm (loaded asynchronously) to print the banner
const openPort = async (canvasElement) => {
  await waitFor(() => expect(canvasElement.querySelector('.xterm-rows')).not.toBeNull());
  emit('serialport:open', { port: 'COM4', baudrate: 115200, controllerType: 'grblHAL', inuse: true });
  await waitFor(() => expect(terminalText(canvasElement)).toContain('Connected to COM4'));
};

const meta = {
  component: Console,
  tags: ['ai-generated'],
  args: { isActive: true },
  // Machine state is applied by .storybook/machine-state.js
  parameters: { machine: { preset: 'idle' } },
  decorators: [
    (Story) => (
      <div className="relative h-72 w-[520px]">
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
  play: async ({ canvas, canvasElement }) => {
    await openPort(canvasElement);
    await waitFor(() => expect(canvas.getByText('Not connected to a device')).not.toBeVisible());

    emit('serialport:read', '<Idle|MPos:0.000,0.000,0.000|FS:0,0>');
    emit('serialport:read', 'error:9');
    await waitFor(() => expect(terminalText(canvasElement)).toContain('error:9'));
  },
};

export const SendCommand = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    const writeln = spyOn(controller, 'writeln').mockImplementation(() => {});
    await openPort(canvasElement);

    const input = canvas.getByPlaceholderText('Enter G-code here...');
    await userEvent.type(input, '$${Enter}');
    await expect(writeln).toHaveBeenCalledWith('$$');
    await expect(input).toHaveValue('');
  },
};

export const CommandHistory = {
  parameters: { machine: { preset: 'idle', consoleInputHistory: ['$X', 'G0 X10', '$$'] } },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByPlaceholderText('Enter G-code here...');
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowUp}');
    await expect(input).toHaveValue('$$');
    await userEvent.keyboard('{ArrowUp}');
    await expect(input).toHaveValue('G0 X10');
    await userEvent.keyboard('{ArrowDown}');
    await expect(input).toHaveValue('$$');
  },
};
